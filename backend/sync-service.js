/**
 * Sync Service
 * Servicio para sincronizar productos e ingredientes desde bases de datos externas
 */

const DatabaseConnector = require('./db-connector');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SyncService {
    constructor(localDbPath) {
        this.localDb = new sqlite3.Database(localDbPath);
    }

    /**
     * Sincroniza productos desde una base de datos externa
     */
    async syncProducts(config, userId) {
        const connector = new DatabaseConnector(config.connection);
        const results = {
            success: false,
            productsImported: 0,
            ingredientsImported: 0,
            errors: [],
            details: []
        };

        try {
            // Conectar a la base de datos externa
            await connector.connect();

            // Obtener productos de la BD externa
            const externalProducts = await connector.getProducts(
                config.tables.products,
                config.fieldMappings.products
            );

            console.log(`Found ${externalProducts.length} products in external database`);

            // Procesar cada producto
            for (const extProduct of externalProducts) {
                try {
                    // Verificar si el producto ya existe
                    const existingProduct = await this.getLocalProduct(extProduct.code);

                    let productId;

                    if (existingProduct) {
                        // Actualizar producto existente
                        await this.updateLocalProduct(existingProduct.id, extProduct, userId);
                        productId = existingProduct.id;
                        results.details.push({
                            action: 'updated',
                            product: extProduct.name,
                            code: extProduct.code
                        });
                    } else {
                        // Insertar nuevo producto
                        productId = await this.insertLocalProduct(extProduct, userId);
                        results.productsImported++;
                        results.details.push({
                            action: 'created',
                            product: extProduct.name,
                            code: extProduct.code
                        });
                    }

                    // Sincronizar ingredientes/formulación del producto
                    if (config.tables.ingredients && config.tables.productFormulation) {
                        const ingredientsCount = await this.syncProductFormulation(
                            connector,
                            config,
                            extProduct.id,
                            productId,
                            userId
                        );
                        results.ingredientsImported += ingredientsCount;
                    }

                } catch (error) {
                    results.errors.push({
                        product: extProduct.name,
                        error: error.message
                    });
                    console.error(`Error processing product ${extProduct.name}:`, error);
                }
            }

            results.success = results.errors.length === 0;

        } catch (error) {
            results.success = false;
            results.errors.push({ general: error.message });
            console.error('Sync error:', error);
        } finally {
            await connector.disconnect();
        }

        return results;
    }

    /**
     * Sincroniza la formulación de un producto específico
     */
    async syncProductFormulation(connector, config, externalProductId, localProductId, userId) {
        let count = 0;

        try {
            // Obtener ingredientes del producto desde la BD externa
            const formulation = await connector.getProductIngredients(
                config.tables.productFormulation,
                externalProductId,
                config.fieldMappings.formulation
            );

            if (!formulation || formulation.length === 0) {
                return 0;
            }

            // Limpiar formulación anterior del producto local
            await this.clearProductFormulation(localProductId);

            // Insertar cada ingrediente
            for (let i = 0; i < formulation.length; i++) {
                const ingredient = formulation[i];

                // Verificar/crear materia prima
                let rawMaterialId = await this.getOrCreateRawMaterial(
                    ingredient.ingredient_name,
                    ingredient.ingredient_id,
                    ingredient.unit,
                    userId
                );

                // Insertar en formulación del producto
                await this.insertProductFormulation(
                    localProductId,
                    rawMaterialId,
                    i + 1, // item_number
                    ingredient.percentage || 0
                );

                count++;
            }

        } catch (error) {
            console.error('Error syncing formulation:', error);
            throw error;
        }

        return count;
    }

    /**
     * Sincroniza solo ingredientes/materias primas
     */
    async syncIngredients(config, userId) {
        const connector = new DatabaseConnector(config.connection);
        const results = {
            success: false,
            imported: 0,
            updated: 0,
            errors: []
        };

        try {
            await connector.connect();

            const externalIngredients = await connector.getAllIngredients(
                config.tables.ingredients,
                config.fieldMappings.ingredients
            );

            for (const ingredient of externalIngredients) {
                try {
                    const existing = await this.getRawMaterialByCode(ingredient.code);

                    if (existing) {
                        await this.updateRawMaterial(existing.id, ingredient);
                        results.updated++;
                    } else {
                        await this.insertRawMaterial(ingredient, userId);
                        results.imported++;
                    }
                } catch (error) {
                    results.errors.push({
                        ingredient: ingredient.name,
                        error: error.message
                    });
                }
            }

            results.success = results.errors.length === 0;

        } catch (error) {
            results.success = false;
            results.errors.push({ general: error.message });
        } finally {
            await connector.disconnect();
        }

        return results;
    }

    // ============ Métodos de Base de Datos Local ============

    getLocalProduct(code) {
        return new Promise((resolve, reject) => {
            this.localDb.get(
                'SELECT * FROM products WHERE code = ?',
                [code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    insertLocalProduct(product, userId) {
        return new Promise((resolve, reject) => {
            this.localDb.run(
                `INSERT INTO products (code, name, presentation, description, unit, created_by)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    product.code,
                    product.name,
                    product.presentation || null,
                    product.description || null,
                    product.unit || 'UNIDADES',
                    userId
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    updateLocalProduct(productId, product, userId) {
        return new Promise((resolve, reject) => {
            this.localDb.run(
                `UPDATE products
                 SET name = ?, presentation = ?, description = ?, unit = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [
                    product.name,
                    product.presentation || null,
                    product.description || null,
                    product.unit || 'UNIDADES',
                    productId
                ],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    clearProductFormulation(productId) {
        return new Promise((resolve, reject) => {
            this.localDb.run(
                'DELETE FROM product_formulation WHERE product_id = ?',
                [productId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    getRawMaterialByCode(code) {
        return new Promise((resolve, reject) => {
            this.localDb.get(
                'SELECT * FROM raw_materials WHERE code = ?',
                [code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    getRawMaterialByName(name) {
        return new Promise((resolve, reject) => {
            this.localDb.get(
                'SELECT * FROM raw_materials WHERE name = ?',
                [name],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async getOrCreateRawMaterial(name, externalId, unit, userId) {
        // Intentar buscar por nombre
        let material = await this.getRawMaterialByName(name);

        if (material) {
            return material.id;
        }

        // Intentar buscar por código externo
        const code = `EXT-${externalId}`;
        material = await this.getRawMaterialByCode(code);

        if (material) {
            return material.id;
        }

        // Crear nuevo
        return await this.insertRawMaterial({
            code: code,
            name: name,
            unit: unit || 'KG',
            stock: 0,
            min_stock: 0,
            price: 0
        }, userId);
    }

    insertRawMaterial(material, userId) {
        return new Promise((resolve, reject) => {
            this.localDb.run(
                `INSERT INTO raw_materials (code, name, unit, stock, min_stock, max_stock, unit_price, supplier, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    material.code,
                    material.name,
                    material.unit || 'KG',
                    material.stock || 0,
                    material.min_stock || 0,
                    material.max_stock || 0,
                    material.price || 0,
                    material.supplier || null,
                    userId
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    updateRawMaterial(id, material) {
        return new Promise((resolve, reject) => {
            this.localDb.run(
                `UPDATE raw_materials
                 SET name = ?, unit = ?, stock = ?, unit_price = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [
                    material.name,
                    material.unit || 'KG',
                    material.stock || 0,
                    material.price || 0,
                    id
                ],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    insertProductFormulation(productId, rawMaterialId, itemNumber, percentage) {
        return new Promise((resolve, reject) => {
            this.localDb.run(
                `INSERT INTO product_formulation (product_id, raw_material_id, item_number, percentage)
                 VALUES (?, ?, ?, ?)`,
                [productId, rawMaterialId, itemNumber, percentage],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    close() {
        return new Promise((resolve) => {
            this.localDb.close(() => resolve());
        });
    }
}

module.exports = SyncService;
