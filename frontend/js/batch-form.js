// Batch Form Handler - Dynamic Formulation Calculator
class BatchFormHandler {
    constructor() {
        this.currentProduct = null;
        this.formulation = [];
        this.calculations = {};
        this.hasUnsavedChanges = false;
    }

    async initialize() {
        await this.loadProducts();
        this.setupEventListeners();
    }

    async loadProducts() {
        try {
            const products = await apiClient.get('/api/products');
            this.renderProductSelect(products);
        } catch (error) {
            showErrorMessage('Error al cargar productos');
        }
    }

    renderProductSelect(products) {
        const select = document.getElementById('product-select');
        if (!select) return;

        select.innerHTML = '<option value="">Seleccione un producto...</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - ${product.presentation || ''}`;
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        // Product selection
        const productSelect = document.getElementById('product-select');
        if (productSelect) {
            productSelect.addEventListener('change', (e) => this.onProductChange(e.target.value));
        }

        // Quantity input
        const quantityInput = document.getElementById('quantity-to-produce');
        if (quantityInput) {
            quantityInput.addEventListener('input', (e) => this.onQuantityChange(e.target.value));
        }

        // Calculate button
        const calculateBtn = document.getElementById('calculate-materials-btn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateMaterials());
        }

        // Form submission
        const batchForm = document.getElementById('batch-record-form');
        if (batchForm) {
            batchForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    async onProductChange(productId) {
        if (!productId) {
            this.currentProduct = null;
            this.formulation = [];
            this.renderFormulation([]);
            return;
        }

        try {
            showLoading();
            const [product, formulation] = await Promise.all([
                apiClient.get(`/api/products/${productId}`),
                apiClient.get(`/api/products/${productId}/formulation`)
            ]);

            this.currentProduct = product;
            this.formulation = formulation;

            // Update product info
            document.getElementById('product-name-display').textContent = product.name;
            document.getElementById('product-presentation').textContent = product.presentation || '';

            // Render formulation table
            this.renderFormulation(formulation);

            hideLoading();
        } catch (error) {
            hideLoading();
            showErrorMessage('Error al cargar la formulación del producto');
        }
    }

    renderFormulation(formulation) {
        const tbody = document.getElementById('formulation-tbody');
        const tfoot = document.getElementById('formulation-tfoot');

        if (!tbody || !tfoot) return;

        tbody.innerHTML = '';

        if (formulation.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Seleccione un producto para ver su formulación</td></tr>';
            tfoot.innerHTML = '';
            return;
        }

        formulation.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="text-center">${item.item_number}</td>
                <td>${item.rm_name}</td>
                <td class="text-center">${item.percentage}%</td>
                <td class="text-center cell-calculated" data-theoretical="${item.item_number}">0.00 ${item.rm_unit}</td>
                <td><input type="number" step="0.001" class="form-control" data-actual="${item.item_number}" placeholder="0.00"></td>
                <td><input type="text" class="form-control" data-lot="${item.item_number}" placeholder="Lote"></td>
                <td><input type="text" class="form-control" data-dispensed="${item.item_number}" placeholder="Nombre"></td>
            `;
            tbody.appendChild(row);
        });

        // Render footer with totals
        tfoot.innerHTML = `
            <tr class="table-totals">
                <td colspan="2" class="text-right"><strong>TOTALES:</strong></td>
                <td class="text-center"><strong id="total-percentage">0.00%</strong></td>
                <td class="text-center"><strong id="total-theoretical">0.00 KG</strong></td>
                <td class="text-center"><strong id="total-actual">0.00 KG</strong></td>
                <td colspan="2"></td>
            </tr>
        `;

        // Setup real-time calculation on actual quantity changes
        tbody.querySelectorAll('input[data-actual]').forEach(input => {
            input.addEventListener('input', () => this.calculateActualTotals());
        });
    }

    onQuantityChange(quantity) {
        this.calculations.quantity = parseFloat(quantity) || 0;
        this.hasUnsavedChanges = true;
    }

    async calculateMaterials() {
        if (!this.currentProduct) {
            showWarningMessage('Seleccione un producto primero');
            return;
        }

        const quantity = parseFloat(document.getElementById('quantity-to-produce').value);
        if (!quantity || quantity <= 0) {
            showWarningMessage('Ingrese una cantidad válida a producir');
            return;
        }

        try {
            showLoading();
            const response = await apiClient.post('/api/batch/calculate', {
                productId: this.currentProduct.id,
                quantity: quantity
            });

            this.calculations = response;
            this.updateFormulationCalculations(response);
            hideLoading();

            // Check for low stock warnings
            const lowStockItems = response.formulation.filter(item => !item.stock_sufficient);
            if (lowStockItems.length > 0) {
                showWarningMessage(`Advertencia: ${lowStockItems.length} materias primas tienen stock insuficiente`);
            }

        } catch (error) {
            hideLoading();
            showErrorMessage('Error al calcular materiales');
        }
    }

    updateFormulationCalculations(calculations) {
        // Update percentage total
        const totalPercentageEl = document.getElementById('total-percentage');
        if (totalPercentageEl) {
            totalPercentageEl.textContent = `${calculations.totals.percentage}%`;
            totalPercentageEl.className = calculations.totals.percentage_valid ? 'text-success' : 'text-danger';
        }

        // Update theoretical quantities
        calculations.formulation.forEach(item => {
            const cell = document.querySelector(`[data-theoretical="${item.item_number}"]`);
            if (cell) {
                cell.textContent = `${item.theoretical_quantity} ${item.unit}`;

                // Add warning class if stock insufficient
                if (!item.stock_sufficient) {
                    cell.classList.add('bg-warning', 'text-dark');
                    cell.title = `Stock actual: ${item.current_stock} ${item.unit}`;
                } else {
                    cell.classList.remove('bg-warning', 'text-dark');
                    cell.title = '';
                }
            }
        });

        // Update theoretical total
        const totalTheoreticalEl = document.getElementById('total-theoretical');
        if (totalTheoreticalEl) {
            totalTheoreticalEl.textContent = `${calculations.totals.theoretical_quantity} KG`;
        }
    }

    calculateActualTotals() {
        let totalActual = 0;
        let totalPercentageActual = 0;

        const quantity = this.calculations.quantity || 0;

        document.querySelectorAll('input[data-actual]').forEach(input => {
            const actualQty = parseFloat(input.value) || 0;
            totalActual += actualQty;

            if (quantity > 0 && actualQty > 0) {
                const percentage = (actualQty / quantity) * 100;
                totalPercentageActual += percentage;
            }
        });

        const totalActualEl = document.getElementById('total-actual');
        if (totalActualEl) {
            totalActualEl.textContent = `${totalActual.toFixed(3)} KG`;
        }

        this.hasUnsavedChanges = true;
    }

    async handleSubmit(event) {
        event.preventDefault();

        if (!this.currentProduct) {
            showErrorMessage('Seleccione un producto');
            return;
        }

        if (!this.calculations.formulation) {
            showErrorMessage('Calcule los materiales primero');
            return;
        }

        // Collect form data
        const formData = {
            batchNumber: document.getElementById('batch-number').value,
            productId: this.currentProduct.id,
            productName: this.currentProduct.name,
            quantity: parseFloat(document.getElementById('quantity-to-produce').value),
            productionDate: document.getElementById('production-date').value,
            formulation: []
        };

        // Collect formulation data
        this.calculations.formulation.forEach(calcItem => {
            const actualInput = document.querySelector(`input[data-actual="${calcItem.item_number}"]`);
            const lotInput = document.querySelector(`input[data-lot="${calcItem.item_number}"]`);
            const dispensedInput = document.querySelector(`input[data-dispensed="${calcItem.item_number}"]`);

            formData.formulation.push({
                item_number: calcItem.item_number,
                raw_material_id: calcItem.raw_material_id,
                percentage: calcItem.percentage,
                theoretical_quantity: calcItem.theoretical_quantity,
                actual_quantity: parseFloat(actualInput?.value) || null,
                lot_number: lotInput?.value || null,
                dispensed_by: dispensedInput?.value || null
            });
        });

        try {
            showLoading();
            const response = await apiClient.post('/api/records/complete', formData);
            hideLoading();

            showSuccessMessage('Batch record creado exitosamente');
            this.hasUnsavedChanges = false;

            // Redirect to records list
            setTimeout(() => {
                showRecordsList();
            }, 1500);

        } catch (error) {
            hideLoading();
            showErrorMessage(error.message || 'Error al crear el batch record');
        }
    }

    hasUnsavedChanges() {
        return this.hasUnsavedChanges;
    }

    reset() {
        this.currentProduct = null;
        this.formulation = [];
        this.calculations = {};
        this.hasUnsavedChanges = false;

        // Clear form
        const form = document.getElementById('batch-record-form');
        if (form) {
            form.reset();
        }

        this.renderFormulation([]);
    }
}

// Global instance
let batchFormHandler;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    batchFormHandler = new BatchFormHandler();
    batchFormHandler.initialize();

    // Initialize signature upload functionality after a short delay
    // to ensure signatureManager is loaded
    setTimeout(() => {
        if (signatureManager) {
            signatureManager.setupSignatureUploads();
        }
    }, 500);
});
