// Products and Raw Materials Management
class ProductsManager {
    constructor() {
        this.products = [];
        this.rawMaterials = [];
        this.packagingMaterials = [];
    }

    async loadProducts() {
        try {
            this.products = await apiClient.get('/api/products');
            this.renderProductsTable();
        } catch (error) {
            showErrorMessage('Error al cargar productos');
        }
    }

    async loadRawMaterials() {
        try {
            this.rawMaterials = await apiClient.get('/api/raw-materials');
            this.renderRawMaterialsTable();
        } catch (error) {
            showErrorMessage('Error al cargar materias primas');
        }
    }

    async loadPackagingMaterials() {
        try {
            this.packagingMaterials = await apiClient.get('/api/packaging-materials');
            this.renderPackagingMaterialsTable();
        } catch (error) {
            showErrorMessage('Error al cargar materiales de empaque');
        }
    }

    renderProductsTable() {
        const tbody = document.getElementById('products-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay productos registrados</td></tr>';
            return;
        }

        this.products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.code}</td>
                <td>${product.name}</td>
                <td>${product.presentation || '-'}</td>
                <td>${product.unit}</td>
                <td><span class="badge badge-${product.is_active ? 'success' : 'secondary'}">${product.is_active ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="productsManager.viewProductFormulation(${product.id})">
                        <i class="fas fa-flask"></i> Formulación
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="productsManager.editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderRawMaterialsTable() {
        const tbody = document.getElementById('raw-materials-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.rawMaterials.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay materias primas registradas</td></tr>';
            return;
        }

        this.rawMaterials.forEach(material => {
            const stockClass = material.stock <= material.min_stock ? 'text-danger font-weight-bold' : '';
            const stockIcon = material.stock <= material.min_stock ? '<i class="fas fa-exclamation-triangle text-danger"></i>' : '';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${material.code}</td>
                <td>${material.name}</td>
                <td class="${stockClass}">${stockIcon} ${material.stock} ${material.unit}</td>
                <td>${material.min_stock} ${material.unit}</td>
                <td>$${material.unit_price.toFixed(2)}</td>
                <td>${material.supplier || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="productsManager.editRawMaterial(${material.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="productsManager.adjustStock(${material.id}, 'RAW_MATERIAL')">
                        <i class="fas fa-boxes"></i> Stock
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderPackagingMaterialsTable() {
        const tbody = document.getElementById('packaging-materials-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.packagingMaterials.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay materiales de empaque registrados</td></tr>';
            return;
        }

        this.packagingMaterials.forEach(material => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${material.code}</td>
                <td>${material.name}</td>
                <td><span class="badge badge-info">${material.type}</span></td>
                <td>${material.stock}</td>
                <td>$${material.unit_price.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="productsManager.editPackagingMaterial(${material.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="productsManager.adjustStock(${material.id}, 'PACKAGING')">
                        <i class="fas fa-boxes"></i> Stock
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async viewProductFormulation(productId) {
        try {
            const formulation = await apiClient.get(`/api/products/${productId}/formulation`);
            this.showFormulationModal(productId, formulation);
        } catch (error) {
            showErrorMessage('Error al cargar formulación');
        }
    }

    showFormulationModal(productId, formulation) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        let totalPercentage = 0;

        const formulationHTML = formulation.map(item => {
            totalPercentage += parseFloat(item.percentage);
            return `
                <tr>
                    <td>${item.item_number}</td>
                    <td>${item.rm_name}</td>
                    <td>${item.percentage}%</td>
                    <td>${item.rm_unit}</td>
                    <td>${item.rm_stock}</td>
                </tr>
            `;
        }).join('');

        const validClass = totalPercentage === 100 ? 'text-success' : 'text-danger';

        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Formulación: ${product.name}</h5>
                        <button type="button" class="close" onclick="this.closest('.modal').remove()">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <table class="table table-bordered">
                            <thead>
                                <tr>
                                    <th>ITEM</th>
                                    <th>MATERIA PRIMA</th>
                                    <th>%</th>
                                    <th>UNIDAD</th>
                                    <th>STOCK</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${formulationHTML}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="2" class="text-right"><strong>TOTAL:</strong></td>
                                    <td class="${validClass}"><strong>${totalPercentage.toFixed(2)}%</strong></td>
                                    <td colspan="2"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async adjustStock(materialId, type) {
        const material = type === 'RAW_MATERIAL'
            ? this.rawMaterials.find(m => m.id === materialId)
            : this.packagingMaterials.find(m => m.id === materialId);

        if (!material) return;

        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Ajustar Stock: ${material.name}</h5>
                        <button type="button" class="close" onclick="this.closest('.modal').remove()">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Stock actual:</strong> ${material.stock} ${type === 'RAW_MATERIAL' ? material.unit : 'unidades'}</p>
                        <div class="form-group">
                            <label>Tipo de movimiento:</label>
                            <select class="form-control" id="movement-type">
                                <option value="IN">Entrada (Compra/Ajuste positivo)</option>
                                <option value="OUT">Salida (Consumo/Ajuste negativo)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Cantidad:</label>
                            <input type="number" class="form-control" id="movement-quantity" step="0.01" min="0.01" required>
                        </div>
                        <div class="form-group">
                            <label>Notas:</label>
                            <textarea class="form-control" id="movement-notes" rows="2"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="productsManager.saveStockMovement(${materialId}, '${type}', this.closest('.modal'))">
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async saveStockMovement(materialId, type, modal) {
        const movementType = document.getElementById('movement-type').value;
        const quantity = parseFloat(document.getElementById('movement-quantity').value);
        const notes = document.getElementById('movement-notes').value;

        if (!quantity || quantity <= 0) {
            showErrorMessage('Ingrese una cantidad válida');
            return;
        }

        try {
            await apiClient.post('/api/stock-movements', {
                material_type: type,
                material_id: materialId,
                movement_type: movementType,
                quantity: quantity,
                notes: notes
            });

            modal.remove();
            showSuccessMessage('Stock actualizado correctamente');

            // Reload materials
            if (type === 'RAW_MATERIAL') {
                await this.loadRawMaterials();
            } else {
                await this.loadPackagingMaterials();
            }

        } catch (error) {
            showErrorMessage('Error al actualizar stock');
        }
    }

    editProduct(productId) {
        showInfoMessage('Funcionalidad de edición en desarrollo');
    }

    editRawMaterial(materialId) {
        showInfoMessage('Funcionalidad de edición en desarrollo');
    }

    editPackagingMaterial(materialId) {
        showInfoMessage('Funcionalidad de edición en desarrollo');
    }
}

// Global instance
let productsManager;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    productsManager = new ProductsManager();
});

// Global functions for menu navigation
function showProductsManagement() {
    app.navigateTo('products-management');
    if (productsManager) {
        productsManager.loadProducts();
    }
}

function showRawMaterialsManagement() {
    app.navigateTo('raw-materials-management');
    if (productsManager) {
        productsManager.loadRawMaterials();
    }
}

function showPackagingMaterialsManagement() {
    app.navigateTo('packaging-materials-management');
    if (productsManager) {
        productsManager.loadPackagingMaterials();
    }
}
