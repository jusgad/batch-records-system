// Main application logic for Batch Records System Mockup

class BatchRecordsApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentFormulation = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuth();
    }

    // ===== AUTHENTICATION =====
    checkAuth() {
        const loggedIn = sessionStorage.getItem('isLoggedIn');
        if (loggedIn === 'true') {
            const user = JSON.parse(sessionStorage.getItem('currentUser'));
            mockData.currentUser = user;
            this.showApp();
            this.loadPage('dashboard');
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
    }

    showApp() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'grid';
        document.getElementById('user-name').textContent = mockData.currentUser.fullName;
    }

    login(username, password) {
        const user = mockData.users.find(u => u.username === username && u.password === password);

        if (user) {
            mockData.currentUser = user;
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            this.showApp();
            this.loadPage('dashboard');
            this.showMessage('Bienvenido ' + user.fullName, 'success');
        } else {
            this.showMessage('Usuario o contraseña incorrectos', 'error');
        }
    }

    logout() {
        mockData.currentUser = null;
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('currentUser');
        this.showLogin();
        this.showMessage('Sesión cerrada correctamente', 'success');
    }

    // ===== NAVIGATION =====
    loadPage(pageName) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageName) {
                item.classList.add('active');
            }
        });

        // Update active page
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(`${pageName}-page`).classList.add('active');

        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'new-record': 'Nuevo Batch Record',
            'records': 'Registros de Producción',
            'products': 'Productos',
            'raw-materials': 'Materias Primas',
            'reports': 'Reportes',
            'audit': 'Auditoría',
            'admin': 'Administración'
        };
        document.getElementById('page-title').textContent = titles[pageName];

        // Load page content
        this.currentPage = pageName;
        this.loadPageContent(pageName);

        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('show');
        }
    }

    loadPageContent(pageName) {
        switch (pageName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'new-record':
                this.loadNewRecordForm();
                break;
            case 'records':
                this.loadRecords();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'raw-materials':
                this.loadRawMaterials();
                break;
        }
    }

    // ===== DASHBOARD =====
    loadDashboard() {
        // Load stats
        const stats = dataHelpers.getDashboardStats();
        // Stats are already in HTML, just update if needed

        // Load recent batches
        const recentBatches = dataHelpers.getBatchRecords().slice(0, 5);
        const tbody = document.getElementById('recent-batches');
        tbody.innerHTML = recentBatches.map(record => `
            <tr>
                <td><strong>${record.batch_number}</strong></td>
                <td>${record.product_name}</td>
                <td>${record.quantity} ${record.unit}</td>
                <td>${this.getStatusBadge(record.status)}</td>
                <td>${dataHelpers.formatDate(record.date)}</td>
                <td>${record.operator}</td>
            </tr>
        `).join('');

        // Load stock alerts
        const alerts = dataHelpers.getLowStockAlerts();
        const alertsContainer = document.getElementById('stock-alerts');

        if (alerts.length === 0) {
            alertsContainer.innerHTML = '<p class="text-muted">No hay alertas de stock bajo</p>';
        } else {
            alertsContainer.innerHTML = alerts.map(alert => `
                <div class="alert alert-${alert.severity}">
                    <div class="alert-content">
                        <h4><i class="fas fa-exclamation-triangle"></i> ${alert.name}</h4>
                        <p>Stock actual: ${alert.stock} ${alert.unit} | Mínimo: ${alert.min_stock} ${alert.unit}</p>
                    </div>
                    <button class="btn btn-secondary btn-sm">
                        <i class="fas fa-plus"></i> Agregar Stock
                    </button>
                </div>
            `).join('');
        }
    }

    // ===== NEW RECORD FORM =====
    loadNewRecordForm() {
        // Load products into select
        const productSelect = document.getElementById('product-select');
        productSelect.innerHTML = '<option value="">Seleccionar producto...</option>' +
            mockData.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

        // Set today's date
        document.getElementById('batch-date').valueAsDate = new Date();

        // Generate batch number
        const batchNumber = `LOTE-${new Date().getFullYear()}-${String(mockData.batchRecords.length + 1).padStart(3, '0')}`;
        document.getElementById('batch-number').value = batchNumber;

        // Reset form
        document.getElementById('formulation-section').style.display = 'none';
        this.currentFormulation = null;
    }

    calculateMaterials() {
        const productId = document.getElementById('product-select').value;
        const quantity = parseFloat(document.getElementById('batch-quantity').value);

        if (!productId || !quantity || quantity <= 0) {
            this.showMessage('Por favor selecciona un producto y una cantidad válida', 'error');
            return;
        }

        // Calculate formulation
        this.currentFormulation = dataHelpers.calculateFormulation(productId, quantity);

        if (!this.currentFormulation) {
            this.showMessage('Error al calcular la formulación', 'error');
            return;
        }

        // Update unit display
        document.getElementById('quantity-unit').textContent = this.currentFormulation.product.unit;

        // Show formulation section
        document.getElementById('formulation-section').style.display = 'block';

        // Populate formulation table
        const tbody = document.getElementById('formulation-body');
        tbody.innerHTML = this.currentFormulation.formulation.map((item, index) => `
            <tr>
                <td>
                    <strong>${item.raw_material}</strong>
                    <br><small class="text-muted">${item.code}</small>
                </td>
                <td>${item.percentage}%</td>
                <td>${item.theoretical_quantity.toFixed(2)} ${item.unit}</td>
                <td>
                    <input type="number"
                           class="form-control real-quantity"
                           step="0.01"
                           data-index="${index}"
                           placeholder="0.00">
                </td>
                <td>
                    <input type="text"
                           class="form-control lot-number"
                           data-index="${index}"
                           placeholder="No. Lote">
                </td>
                <td>
                    <input type="text"
                           class="form-control dispensed-by"
                           data-index="${index}"
                           placeholder="Nombre">
                </td>
            </tr>
        `).join('');

        // Update totals
        document.getElementById('total-percentage').textContent =
            this.currentFormulation.total_percentage.toFixed(1) + '%';
        document.getElementById('total-theoretical').textContent =
            this.currentFormulation.total_theoretical.toFixed(2) + ' ' + this.currentFormulation.product.unit;

        // Add event listeners for real quantity inputs
        document.querySelectorAll('.real-quantity').forEach(input => {
            input.addEventListener('input', () => this.updateRealTotal());
        });

        // Calculate packaging
        const units = Math.floor(quantity * 1000 / parseFloat(this.currentFormulation.product.presentation));
        const packaging = dataHelpers.calculatePackaging(units);

        const packagingBody = document.getElementById('packaging-body');
        packagingBody.innerHTML = packaging.map((item, index) => `
            <tr>
                <td>
                    <strong>${item.material}</strong>
                    <br><small class="text-muted">${item.code}</small>
                </td>
                <td>${item.required}</td>
                <td>
                    <input type="number"
                           class="form-control"
                           step="1"
                           placeholder="0">
                </td>
                <td>
                    <input type="text"
                           class="form-control"
                           placeholder="No. Lote">
                </td>
            </tr>
        `).join('');

        // Setup time calculation
        document.getElementById('start-time').addEventListener('change', () => this.calculateWorkHours());
        document.getElementById('end-time').addEventListener('change', () => this.calculateWorkHours());

        this.showMessage('Materiales calculados correctamente', 'success');
    }

    updateRealTotal() {
        let total = 0;
        document.querySelectorAll('.real-quantity').forEach(input => {
            const value = parseFloat(input.value) || 0;
            total += value;
        });
        document.getElementById('total-real').textContent =
            total.toFixed(2) + ' ' + this.currentFormulation.product.unit;
    }

    calculateWorkHours() {
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const hours = dataHelpers.calculateHours(startTime, endTime);
        document.getElementById('hours-worked').value = hours ? hours + ' horas' : '';
    }

    submitBatchRecord(e) {
        e.preventDefault();

        if (!this.currentFormulation) {
            this.showMessage('Primero debes calcular los materiales', 'error');
            return;
        }

        const batchNumber = document.getElementById('batch-number').value;
        const batchDate = document.getElementById('batch-date').value;
        const observations = document.getElementById('batch-observations').value;

        // Collect formulation data
        const formulation = [];
        document.querySelectorAll('.real-quantity').forEach((input, index) => {
            const realQty = parseFloat(input.value) || 0;
            const lotNumber = document.querySelectorAll('.lot-number')[index].value;
            const dispensedBy = document.querySelectorAll('.dispensed-by')[index].value;

            formulation.push({
                ...this.currentFormulation.formulation[index],
                real_quantity: realQty,
                lot_number: lotNumber,
                dispensed_by: dispensedBy
            });
        });

        // Create new batch record
        const newRecord = {
            batch_number: batchNumber,
            product_id: this.currentFormulation.product.id,
            product_name: this.currentFormulation.product.name,
            quantity: this.currentFormulation.total_theoretical,
            unit: this.currentFormulation.product.unit,
            date: batchDate,
            operator: mockData.currentUser.fullName,
            verificator: null,
            formulation: formulation,
            observations: observations
        };

        dataHelpers.addBatchRecord(newRecord);

        this.showMessage('Batch record creado exitosamente', 'success');

        // Reset form and navigate to records
        setTimeout(() => {
            this.loadPage('records');
        }, 1500);
    }

    // ===== RECORDS =====
    loadRecords() {
        const records = dataHelpers.getBatchRecords();
        const tbody = document.getElementById('records-table-body');

        tbody.innerHTML = records.map(record => `
            <tr>
                <td><strong>${record.batch_number}</strong></td>
                <td>${record.product_name}</td>
                <td>${record.quantity} ${record.unit}</td>
                <td>${this.getStatusBadge(record.status)}</td>
                <td>${dataHelpers.formatDate(record.date)}</td>
                <td>${record.operator}</td>
                <td>
                    <button class="btn-icon" onclick="app.viewRecord(${record.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" title="Imprimir">
                        <i class="fas fa-print"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    viewRecord(id) {
        const record = mockData.batchRecords.find(r => r.id === id);
        if (!record) return;

        const modal = document.getElementById('record-modal');
        const modalBody = document.getElementById('modal-body');

        modalBody.innerHTML = `
            <div class="record-details">
                <div class="detail-section">
                    <h3><i class="fas fa-info-circle"></i> Información General</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Número de Lote:</label>
                            <strong>${record.batch_number}</strong>
                        </div>
                        <div class="detail-item">
                            <label>Producto:</label>
                            <strong>${record.product_name}</strong>
                        </div>
                        <div class="detail-item">
                            <label>Cantidad:</label>
                            <strong>${record.quantity} ${record.unit}</strong>
                        </div>
                        <div class="detail-item">
                            <label>Fecha:</label>
                            <strong>${dataHelpers.formatDate(record.date)}</strong>
                        </div>
                        <div class="detail-item">
                            <label>Estado:</label>
                            ${this.getStatusBadge(record.status)}
                        </div>
                        <div class="detail-item">
                            <label>Operador:</label>
                            <strong>${record.operator}</strong>
                        </div>
                    </div>
                </div>
                <div class="detail-section">
                    <h3><i class="fas fa-signature"></i> Acciones</h3>
                    <div style="display: flex; gap: 12px; margin-top: 16px;">
                        <button class="btn btn-primary">
                            <i class="fas fa-pen"></i> Firmar Registro
                        </button>
                        ${record.status === 'pending' ? `
                        <button class="btn btn-secondary">
                            <i class="fas fa-check"></i> Aprobar
                        </button>
                        ` : ''}
                        <button class="btn btn-secondary">
                            <i class="fas fa-print"></i> Imprimir
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('show');
    }

    closeModal() {
        document.getElementById('record-modal').classList.remove('show');
    }

    // ===== PRODUCTS =====
    loadProducts() {
        const grid = document.getElementById('products-grid');

        grid.innerHTML = mockData.products.map(product => `
            <div class="product-card">
                <div class="product-card-header">
                    <div class="product-icon">
                        <i class="fas fa-box"></i>
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>${product.code}</p>
                    </div>
                </div>
                <div class="product-details">
                    <div class="product-detail-row">
                        <span>Presentación:</span>
                        <strong>${product.presentation}</strong>
                    </div>
                    <div class="product-detail-row">
                        <span>Unidad:</span>
                        <strong>${product.unit}</strong>
                    </div>
                    <div class="product-detail-row">
                        <span>Ingredientes:</span>
                        <strong>${product.formulation.length}</strong>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="app.viewFormulation(${product.id})">
                        <i class="fas fa-flask"></i> Formulación
                    </button>
                    <button class="btn btn-secondary">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            </div>
        `).join('');
    }

    viewFormulation(productId) {
        const product = dataHelpers.getProductById(productId);
        if (!product) return;

        const modal = document.getElementById('record-modal');
        const modalBody = document.getElementById('modal-body');

        modalBody.innerHTML = `
            <div class="formulation-view">
                <h3>${product.name}</h3>
                <p class="text-muted mb-3">${product.code} - ${product.presentation}</p>

                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Materia Prima</th>
                            <th>Código</th>
                            <th>Porcentaje</th>
                            <th>Unidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${product.formulation.map(item => `
                            <tr>
                                <td>${item.raw_material}</td>
                                <td>${item.code}</td>
                                <td><strong>${item.percentage}%</strong></td>
                                <td>${item.unit}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2"><strong>TOTAL</strong></td>
                            <td><strong>${product.formulation.reduce((sum, i) => sum + i.percentage, 0)}%</strong></td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        modal.classList.add('show');
    }

    // ===== RAW MATERIALS =====
    loadRawMaterials() {
        const tbody = document.getElementById('raw-materials-table');

        tbody.innerHTML = mockData.rawMaterials.map(material => {
            const isLowStock = material.stock <= material.min_stock;
            const statusBadge = isLowStock ?
                '<span class="badge badge-warning">Stock Bajo</span>' :
                '<span class="badge badge-success">Normal</span>';

            return `
                <tr>
                    <td><strong>${material.code}</strong></td>
                    <td>${material.name}</td>
                    <td><strong>${material.stock}</strong></td>
                    <td>${material.unit}</td>
                    <td>${material.min_stock}</td>
                    <td>${statusBadge}</td>
                    <td>${dataHelpers.formatCurrency(material.price)}</td>
                    <td>
                        <button class="btn-icon" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" title="Ajustar Stock">
                            <i class="fas fa-box"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ===== UTILITIES =====
    getStatusBadge(status) {
        const badges = {
            'approved': '<span class="badge badge-success">Aprobado</span>',
            'pending': '<span class="badge badge-warning">Pendiente</span>',
            'in_progress': '<span class="badge badge-info">En Proceso</span>',
            'rejected': '<span class="badge badge-danger">Rechazado</span>'
        };
        return badges[status] || status;
    }

    showMessage(message, type = 'info') {
        // Simple alert for now - could be enhanced with toast notifications
        const icons = {
            success: '✓',
            error: '✗',
            info: 'ℹ',
            warning: '⚠'
        };
        alert(`${icons[type]} ${message}`);
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            this.login(username, password);
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // User menu dropdown
        document.getElementById('user-menu-btn').addEventListener('click', () => {
            document.getElementById('user-dropdown').classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                document.getElementById('user-dropdown').classList.remove('show');
            }
        });

        // Sidebar toggle
        document.getElementById('toggle-sidebar').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('show');
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.loadPage(page);
            });
        });

        // Batch form
        document.getElementById('calculate-btn').addEventListener('click', () => {
            this.calculateMaterials();
        });

        document.getElementById('batch-form').addEventListener('submit', (e) => {
            this.submitBatchRecord(e);
        });

        // Modal close
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Close modal on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BatchRecordsApp();
});
