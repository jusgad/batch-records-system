// Dashboard Manager
class DashboardManager {
    constructor() {
        this.stats = {
            totalRecords: 0,
            pendingVerification: 0,
            approvedRecords: 0
        };
    }

    async loadDashboardStats() {
        try {
            const stats = await apiClient.get('/api/dashboard/stats');
            this.stats = stats;
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    updateStatsDisplay() {
        const totalEl = document.getElementById('total-records');
        const pendingEl = document.getElementById('pending-records');
        const approvedEl = document.getElementById('approved-records');

        if (totalEl) totalEl.textContent = this.stats.totalRecords || 0;
        if (pendingEl) pendingEl.textContent = this.stats.pendingVerification || 0;
        if (approvedEl) approvedEl.textContent = this.stats.approvedRecords || 0;
    }

    async loadRecentActivity() {
        try {
            const records = await apiClient.get('/api/records');
            this.renderRecentRecords(records.slice(0, 5));
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

    renderRecentRecords(records) {
        const container = document.getElementById('recent-records');
        if (!container) return;

        if (records.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay actividad reciente</p>';
            return;
        }

        container.innerHTML = records.map(record => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-clipboard-list"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-title">
                        <strong>${record.batch_number}</strong> - ${record.product_name}
                    </p>
                    <p class="activity-meta">
                        <span class="status-badge status-${record.status}">${this.getStatusText(record.status)}</span>
                        <span class="activity-time">${formatDate(record.created_at)}</span>
                    </p>
                </div>
            </div>
        `).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'draft': 'Borrador',
            'signed': 'Firmado',
            'verified': 'Verificado',
            'approved': 'Aprobado',
            'rejected': 'Rechazado'
        };
        return statusMap[status] || status;
    }

    async checkLowStockAlerts() {
        try {
            const lowStock = await apiClient.get('/api/alerts/low-stock');
            if (lowStock && lowStock.length > 0) {
                this.showLowStockWarning(lowStock);
            }
        } catch (error) {
            console.error('Error checking low stock:', error);
        }
    }

    showLowStockWarning(materials) {
        const count = materials.length;
        if (count > 0) {
            showWarningMessage(`⚠️ ${count} materia(s) prima(s) con stock bajo`);
        }
    }

    async initialize() {
        await this.loadDashboardStats();
        await this.loadRecentActivity();
        await this.checkLowStockAlerts();
    }
}

// Global instance
let dashboardManager;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    dashboardManager = new DashboardManager();
});

// Global function to show records list
function showRecordsList() {
    app.navigateTo('records-list');
}

// Global function to refresh records
async function refreshRecords() {
    if (recordsManager) {
        await recordsManager.loadRecords();
        showSuccessMessage('Registros actualizados');
    }
}

// Global function to show profile
function showProfile() {
    showInfoMessage('Funcionalidad de perfil en desarrollo');
}

// Global function to logout
async function logout() {
    try {
        await apiClient.post('/api/auth/logout');
        authManager.logout();
    } catch (error) {
        authManager.logout();
    }
}

// Global function to toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = event.target.closest('.password-toggle');

    if (passwordInput && toggleBtn) {
        const icon = toggleBtn.querySelector('i');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
}
