// API utility functions
class API {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('authToken');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    // Get authentication headers
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            showLoading();
            const response = await fetch(url, config);
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    this.setToken(null);
                    showLogin();
                    throw new Error('Session expired. Please login again.');
                }
                
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        } finally {
            hideLoading();
        }
    }

    // Authentication methods
    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.setToken(null);
        }
    }

    // User management methods
    async getUsers() {
        return this.request('/users');
    }

    async createUser(userData) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async updateUser(userId, userData) {
        return this.request(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(userId) {
        return this.request(`/users/${userId}`, {
            method: 'DELETE'
        });
    }

    // Record management methods
    async getRecords() {
        return this.request('/records');
    }

    async getRecord(recordId) {
        return this.request(`/records/${recordId}`);
    }

    async createRecord(recordData) {
        return this.request('/records', {
            method: 'POST',
            body: JSON.stringify(recordData)
        });
    }

    async updateRecord(recordId, recordData) {
        return this.request(`/records/${recordId}`, {
            method: 'PUT',
            body: JSON.stringify(recordData)
        });
    }

    async deleteRecord(recordId) {
        return this.request(`/records/${recordId}`, {
            method: 'DELETE'
        });
    }

    async signRecord(recordId) {
        return this.request(`/records/${recordId}/sign`, {
            method: 'POST'
        });
    }

    async verifyRecord(recordId, approved) {
        return this.request(`/records/${recordId}/verify`, {
            method: 'POST',
            body: JSON.stringify({ approved })
        });
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }

    // File upload (for future use)
    async uploadFile(file, endpoint = '/upload') {
        const formData = new FormData();
        formData.append('file', file);

        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            showLoading();
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers,
                body: formData
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.setToken(null);
                    showLogin();
                    throw new Error('Session expired. Please login again.');
                }
                
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        } finally {
            hideLoading();
        }
    }

    // Export data (CSV, PDF, etc.)
    async exportData(recordIds, format = 'csv') {
        try {
            const response = await fetch(`${this.baseURL}/export/${format}`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ recordIds })
            });

            if (!response.ok) {
                throw new Error(`Export failed: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `batch_records_export.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export Error:', error);
            throw error;
        }
    }

    // Batch operations
    async batchOperation(operation, recordIds, data = {}) {
        return this.request('/records/batch', {
            method: 'POST',
            body: JSON.stringify({
                operation,
                recordIds,
                data
            })
        });
    }

    // Statistics
    async getStatistics() {
        return this.request('/statistics');
    }

    // Audit trail
    async getAuditTrail(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/audit${params.toString() ? '?' + params.toString() : ''}`);
    }
}

// Create global API instance
const api = new API();

// API response handlers
class APIResponseHandler {
    static handleError(error, context = '') {
        console.error(`API Error${context ? ` (${context})` : ''}:`, error);
        
        let message = error.message || 'An unexpected error occurred';
        
        // Handle specific error types
        if (error.message.includes('Failed to fetch')) {
            message = 'Network error. Please check your connection.';
        } else if (error.message.includes('Session expired')) {
            message = 'Your session has expired. Please login again.';
            setTimeout(() => showLogin(), 1000);
        }
        
        showErrorMessage(message);
        return false;
    }

    static handleSuccess(message, duration = 3000) {
        showSuccessMessage(message);
        if (duration > 0) {
            setTimeout(() => hideMessage(), duration);
        }
    }

    static async handleResponse(apiCall, successMessage = '', errorContext = '') {
        try {
            const result = await apiCall();
            if (successMessage) {
                this.handleSuccess(successMessage);
            }
            return result;
        } catch (error) {
            this.handleError(error, errorContext);
            throw error;
        }
    }
}

// Connection status monitoring
class ConnectionMonitor {
    constructor() {
        this.isOnline = navigator.onLine;
        this.checkInterval = null;
        this.init();
    }

    init() {
        window.addEventListener('online', () => this.setOnlineStatus(true));
        window.addEventListener('offline', () => this.setOnlineStatus(false));
        
        // Periodic connection check
        this.startPeriodicCheck();
    }

    setOnlineStatus(status) {
        this.isOnline = status;
        const statusElement = document.getElementById('connection-status');
        
        if (statusElement) {
            statusElement.className = `connection-status ${status ? 'online' : 'offline'}`;
            statusElement.textContent = status ? 'Online' : 'Offline';
        }
        
        if (status) {
            hideErrorMessage();
        } else {
            showErrorMessage('You are currently offline. Some features may not be available.');
        }
    }

    async startPeriodicCheck() {
        this.checkInterval = setInterval(async () => {
            try {
                await api.healthCheck();
                if (!this.isOnline) {
                    this.setOnlineStatus(true);
                }
            } catch (error) {
                if (this.isOnline) {
                    this.setOnlineStatus(false);
                }
            }
        }, 30000); // Check every 30 seconds
    }

    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }
}

// Initialize connection monitor
const connectionMonitor = new ConnectionMonitor();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, api, APIResponseHandler, ConnectionMonitor };
}