/**
 * Database Connector Module
 * Permite conectarse a diferentes tipos de bases de datos (MySQL, PostgreSQL, SQLite, SQL Server)
 * y sincronizar productos e ingredientes con el sistema local
 */

const mysql = require('mysql2/promise');
const { Client } = require('pg');
const sqlite3 = require('sqlite3').verbose();

class DatabaseConnector {
    constructor(config) {
        this.config = config;
        this.connection = null;
        this.dbType = config.type; // 'mysql', 'postgres', 'sqlite', 'mssql'
    }

    /**
     * Conecta a la base de datos externa
     */
    async connect() {
        try {
            switch (this.dbType) {
                case 'mysql':
                    this.connection = await mysql.createConnection({
                        host: this.config.host,
                        port: this.config.port || 3306,
                        user: this.config.user,
                        password: this.config.password,
                        database: this.config.database,
                        connectTimeout: this.config.timeout || 10000
                    });
                    break;

                case 'postgres':
                    this.connection = new Client({
                        host: this.config.host,
                        port: this.config.port || 5432,
                        user: this.config.user,
                        password: this.config.password,
                        database: this.config.database,
                        connectionTimeoutMillis: this.config.timeout || 10000
                    });
                    await this.connection.connect();
                    break;

                case 'sqlite':
                    this.connection = await new Promise((resolve, reject) => {
                        const db = new sqlite3.Database(this.config.path, (err) => {
                            if (err) reject(err);
                            else resolve(db);
                        });
                    });
                    break;

                case 'mssql':
                    const sql = require('mssql');
                    this.connection = await sql.connect({
                        server: this.config.host,
                        port: this.config.port || 1433,
                        user: this.config.user,
                        password: this.config.password,
                        database: this.config.database,
                        options: {
                            encrypt: this.config.encrypt || false,
                            trustServerCertificate: this.config.trustServerCertificate || false
                        },
                        connectionTimeout: this.config.timeout || 10000
                    });
                    break;

                default:
                    throw new Error(`Unsupported database type: ${this.dbType}`);
            }
            return true;
        } catch (error) {
            throw new Error(`Database connection failed: ${error.message}`);
        }
    }

    /**
     * Prueba la conexión
     */
    async testConnection() {
        try {
            await this.connect();
            await this.disconnect();
            return { success: true, message: 'Connection successful' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Ejecuta una consulta en la base de datos externa
     */
    async query(sql, params = []) {
        if (!this.connection) {
            await this.connect();
        }

        try {
            switch (this.dbType) {
                case 'mysql':
                    const [rows] = await this.connection.execute(sql, params);
                    return rows;

                case 'postgres':
                    const result = await this.connection.query(sql, params);
                    return result.rows;

                case 'sqlite':
                    return new Promise((resolve, reject) => {
                        this.connection.all(sql, params, (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows);
                        });
                    });

                case 'mssql':
                    const request = this.connection.request();
                    params.forEach((param, index) => {
                        request.input(`param${index}`, param);
                    });
                    const mssqlResult = await request.query(sql);
                    return mssqlResult.recordset;

                default:
                    throw new Error(`Query not supported for ${this.dbType}`);
            }
        } catch (error) {
            throw new Error(`Query execution failed: ${error.message}`);
        }
    }

    /**
     * Obtiene productos de la base de datos externa
     * Se espera que la tabla tenga al menos: id, codigo/code, nombre/name
     */
    async getProducts(tableName, fieldMapping = {}) {
        const defaultMapping = {
            id: 'id',
            code: 'code',
            name: 'name',
            description: 'description',
            unit: 'unit'
        };

        const mapping = { ...defaultMapping, ...fieldMapping };

        const query = `SELECT
            ${mapping.id} as id,
            ${mapping.code} as code,
            ${mapping.name} as name,
            ${mapping.description || 'NULL'} as description,
            ${mapping.unit || "'UNIDADES'"} as unit
            FROM ${tableName}
            WHERE ${mapping.active || '1=1'}`;

        return await this.query(query);
    }

    /**
     * Obtiene ingredientes/materias primas de la base de datos externa
     * Se espera que la tabla relacione productos con ingredientes
     */
    async getProductIngredients(tableName, productId, fieldMapping = {}) {
        const defaultMapping = {
            product_id: 'product_id',
            ingredient_id: 'ingredient_id',
            ingredient_name: 'ingredient_name',
            quantity: 'quantity',
            unit: 'unit',
            percentage: 'percentage'
        };

        const mapping = { ...defaultMapping, ...fieldMapping };

        const query = `SELECT
            ${mapping.product_id} as product_id,
            ${mapping.ingredient_id} as ingredient_id,
            ${mapping.ingredient_name} as ingredient_name,
            ${mapping.quantity || 'NULL'} as quantity,
            ${mapping.unit || "'KG'"} as unit,
            ${mapping.percentage || 'NULL'} as percentage
            FROM ${tableName}
            WHERE ${mapping.product_id} = ?`;

        return await this.query(query, [productId]);
    }

    /**
     * Obtiene todos los ingredientes de todos los productos
     */
    async getAllIngredients(ingredientsTable, fieldMapping = {}) {
        const defaultMapping = {
            id: 'id',
            code: 'code',
            name: 'name',
            unit: 'unit',
            stock: 'stock',
            price: 'price'
        };

        const mapping = { ...defaultMapping, ...fieldMapping };

        const query = `SELECT
            ${mapping.id} as id,
            ${mapping.code} as code,
            ${mapping.name} as name,
            ${mapping.unit || "'KG'"} as unit,
            ${mapping.stock || '0'} as stock,
            ${mapping.price || '0'} as price
            FROM ${ingredientsTable}
            WHERE ${mapping.active || '1=1'}`;

        return await this.query(query);
    }

    /**
     * Cierra la conexión
     */
    async disconnect() {
        if (this.connection) {
            try {
                switch (this.dbType) {
                    case 'mysql':
                        await this.connection.end();
                        break;
                    case 'postgres':
                        await this.connection.end();
                        break;
                    case 'sqlite':
                        await new Promise((resolve) => {
                            this.connection.close(resolve);
                        });
                        break;
                    case 'mssql':
                        await this.connection.close();
                        break;
                }
                this.connection = null;
            } catch (error) {
                console.error('Error closing connection:', error);
            }
        }
    }
}

module.exports = DatabaseConnector;
