// Main application controller
class BatchRecordsApp {
    constructor() {
        this.currentView = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeApp();
    }

    setupEventListeners() {
        // Handle page navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-navigate]')) {
                e.preventDefault();
                const view = e.target.getAttribute('data-navigate');
                this.navigateTo(view);
            }
        });

        // Handle dropdown toggles
        document.addEventListener('click', (e) => {
            const dropdown = e.target.closest('.dropdown');
            if (dropdown) {
                e.stopPropagation();
                this.toggleDropdown(dropdown);
            } else {
                this.closeAllDropdowns();
            }
        });

        // Handle mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
        }

        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));

        // Handle keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

        // Handle beforeunload for unsaved changes
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }

    async initializeApp() {
        try {
            // Check authentication status
            if (authManager && authManager.currentUser) {
                this.showDashboard();
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('App initialization error:', error);
            this.showLogin();
        }
    }

    navigateTo(view) {
        // Hide all views
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target view
        const targetSection = document.getElementById(view);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentView = view;
            
            // Update active menu item
            this.updateActiveMenuItem(view);
            
            // Load view-specific data
            this.loadViewData(view);
        }
    }

    updateActiveMenuItem(view) {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        const menuItem = document.querySelector(`[onclick*="${view}"]`);
        if (menuItem) {
            menuItem.classList.add('active');
        }
    }

    async loadViewData(view) {
        switch (view) {
            case 'records-list':
                if (recordsManager) {
                    await recordsManager.loadRecords();
                }
                break;
            case 'admin-users':
                if (adminManager) {
                    await adminManager.loadUsers();
                }
                break;
            case 'verification-queue':
                if (recordsManager) {
                    await recordsManager.loadRecords();
                    this.filterPendingVerification();
                }
                break;
        }
    }

    filterPendingVerification() {
        const pendingRecords = recordsManager.records.filter(r => r.status === 'signed');
        const container = document.getElementById('pending-records-container');
        
        if (container) {
            if (pendingRecords.length === 0) {
                container.innerHTML = `
                    <div class="text-center" style="padding: 3rem;">
                        <i class="fas fa-check-circle fa-3x" style="color: #28a745; margin-bottom: 1rem;"></i>
                        <h4>No hay registros pendientes de verificación</h4>
                        <p>Todos los registros firmados han sido verificados.</p>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="pending-records-list">
                        ${pendingRecords.map(record => this.renderPendingRecord(record)).join('')}
                    </div>
                `;
            }
        }
    }

    renderPendingRecord(record) {
        return `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="card-title">Lote: ${record.batch_number}</h5>
                            <p class="card-text">
                                <strong>Producto:</strong> ${record.product_name}<br>
                                <strong>Cantidad:</strong> ${record.quantity || '-'}<br>
                                <strong>Operador:</strong> ${record.operator_name}<br>
                                <strong>Fecha:</strong> ${formatDate(record.created_at)}
                            </p>
                        </div>
                        <div class="text-right">
                            <div class="mb-2">
                                <span class="status-badge status-${record.status}">${recordsManager.getStatusText(record.status)}</span>
                            </div>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-primary" onclick="recordsManager.viewRecord(${record.id})">
                                    <i class="fas fa-eye"></i> Ver
                                </button>
                                <button class="btn btn-sm btn-success" onclick="recordsManager.approveRecord(${record.id})">
                                    <i class="fas fa-check"></i> Aprobar
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="recordsManager.rejectRecord(${record.id})">
                                    <i class="fas fa-times"></i> Rechazar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showLogin() {
        document.getElementById('login-page').classList.add('active');
        document.getElementById('dashboard-page').classList.remove('active');
        document.getElementById('navbar').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('dashboard-page').classList.add('active');
        document.getElementById('navbar').style.display = 'block';
        
        // Show welcome section by default
        this.navigateTo('dashboard-welcome');
    }

    toggleDropdown(dropdown) {
        const isActive = dropdown.classList.contains('active');
        
        // Close all dropdowns first
        this.closeAllDropdowns();
        
        if (!isActive) {
            dropdown.classList.add('active');
        }
    }

    closeAllDropdowns() {
        document.querySelectorAll('.dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }

    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    }

    handleResize() {
        // Close mobile menu on desktop resize
        if (window.innerWidth > 768) {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.remove('active');
            }
        }
    }

    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not typing in input fields
        if (e.target.matches('input, textarea, select')) return;

        // Ctrl+Alt shortcuts
        if (e.ctrlKey && e.altKey) {
            switch (e.key) {
                case 'h': // Home/Dashboard
                    e.preventDefault();
                    this.navigateTo('dashboard-welcome');
                    break;
                case 'r': // Records
                    e.preventDefault();
                    this.navigateTo('records-list');
                    break;
                case 'n': // New record (if operator)
                    if (authManager.hasRole('operator')) {
                        e.preventDefault();
                        showNewRecord();
                    }
                    break;
                case 'v': // Verification queue (if verificador)
                    if (authManager.hasRole('verificador')) {
                        e.preventDefault();
                        this.navigateTo('verification-queue');
                    }
                    break;
                case 'u': // Users (if admin)
                    if (authManager.hasRole('admin')) {
                        e.preventDefault();
                        this.navigateTo('admin-users');
                    }
                    break;
                case 'l': // Logout
                    e.preventDefault();
                    logout();
                    break;
            }
        }

        // Escape key to close modals/dropdowns
        if (e.key === 'Escape') {
            this.closeAllDropdowns();
            this.closeModals();
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal.classList.contains('show')) {
                modal.remove();
            }
        });
    }

    handleBeforeUnload(e) {
        // Check for unsaved changes
        if (formHandler && formHandler.hasUnsavedChanges()) {
            e.preventDefault();
            e.returnValue = '¿Está seguro de que desea salir? Hay cambios sin guardar.';
            return e.returnValue;
        }
    }

    // Error handling
    handleGlobalError(error) {
        console.error('Global error:', error);
        
        if (error.name === 'NetworkError') {
            showErrorMessage('Error de conexión. Verifique su conexión a internet.');
        } else if (error.message.includes('token')) {
            showErrorMessage('Sesión expirada. Por favor, inicie sesión nuevamente.');
            setTimeout(() => {
                authManager.logout();
            }, 2000);
        } else {
            showErrorMessage('Ha ocurrido un error inesperado. Por favor, intente nuevamente.');
        }
    }

    // Theme management
    setTheme(theme = 'light') {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    getTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    toggleTheme() {
        const currentTheme = this.getTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    // Initialize theme
    initializeTheme() {
        const savedTheme = this.getTheme();
        this.setTheme(savedTheme);
    }

    // Performance monitoring
    measurePerformance(label, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        if (result instanceof Promise) {
            return result.then(res => {
                console.log(`${label}: ${end - start}ms`);
                return res;
            });
        } else {
            console.log(`${label}: ${end - start}ms`);
            return result;
        }
    }

    // Data persistence
    saveAppState() {
        const state = {
            currentView: this.currentView,
            theme: this.getTheme(),
            timestamp: Date.now()
        };
        
        saveToLocalStorage('appState', state);
    }

    restoreAppState() {
        const state = getFromLocalStorage('appState');
        if (state && state.currentView) {
            this.navigateTo(state.currentView);
        }
    }
}

// Global functions for UI interactions
function showNewRecord() {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('new-record').classList.add('active');
    
    // Load the form
    if (formHandler) {
        formHandler.initializeNewRecord();
    }
}

function showAdminUsers() {
    app.navigateTo('admin-users');
}

function showVerificationQueue() {
    app.navigateTo('verification-queue');
}

function showAuditTrail() {
    // TODO: Implement audit trail view
    showInfoMessage('Funcionalidad de auditoría en desarrollo');
}

function showSystemSettings() {
    // TODO: Implement system settings view
    showInfoMessage('Funcionalidad de configuración en desarrollo');
}

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Unhandled error:', e.error);
    if (app) {
        app.handleGlobalError(e.error);
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    if (app) {
        app.handleGlobalError(e.reason);
    }
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.app = new BatchRecordsApp();
    
    // Initialize theme
    app.initializeTheme();
    
    // Restore app state if available
    app.restoreAppState();
    
    // Save app state periodically
    setInterval(() => {
        app.saveAppState();
    }, 30000); // Every 30 seconds
});

// Save state before page unload
window.addEventListener('beforeunload', () => {
    if (app) {
        app.saveAppState();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BatchRecordsApp };
}