// Authentication module
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.loginForm = null;
        this.init();
    }

    init() {
        this.loginForm = document.getElementById('login-form');
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        
        // Check if user is already logged in
        this.checkAuthStatus();
    }

    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                api.setToken(token);
                this.showDashboard();
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                this.logout();
            }
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(this.loginForm);
        const credentials = {
            username: formData.get('username').trim(),
            password: formData.get('password')
        };

        // Basic validation
        if (!credentials.username || !credentials.password) {
            this.showError('Por favor ingresa usuario y contraseña');
            return;
        }

        try {
            this.setLoginLoading(true);
            this.hideError();

            const response = await api.login(credentials);
            
            if (response.token && response.user) {
                this.currentUser = response.user;
                api.setToken(response.token);
                localStorage.setItem('userData', JSON.stringify(response.user));
                
                // Log successful login
                console.log('Login successful:', response.user.username);
                
                this.showDashboard();
                this.showSuccess('Inicio de sesión exitoso');
                
                // Reset form
                this.loginForm.reset();
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message || 'Error de autenticación. Verifica tus credenciales.');
        } finally {
            this.setLoginLoading(false);
        }
    }

    async logout() {
        try {
            await api.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.currentUser = null;
            api.setToken(null);
            localStorage.removeItem('userData');
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('login-page').classList.add('active');
        document.getElementById('dashboard-page').classList.remove('active');
        document.getElementById('navbar').style.display = 'none';
        
        // Focus on username field
        const usernameField = document.getElementById('username');
        if (usernameField) {
            setTimeout(() => usernameField.focus(), 100);
        }
    }

    showDashboard() {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('dashboard-page').classList.add('active');
        document.getElementById('navbar').style.display = 'block';
        
        this.setupUserInterface();
        this.initializeDashboard();
    }

    setupUserInterface() {
        if (!this.currentUser) return;

        // Set username in navbar
        const usernameElement = document.getElementById('username-text');
        if (usernameElement) {
            usernameElement.textContent = this.currentUser.fullName || this.currentUser.username;
        }

        // Setup role-based UI
        this.setupRoleBasedUI();
    }

    setupRoleBasedUI() {
        const role = this.currentUser.role;
        
        // Hide all role-specific elements initially
        document.querySelectorAll('[data-role]').forEach(element => {
            element.style.display = 'none';
        });

        // Show elements for current role
        document.querySelectorAll(`[data-role="${role}"]`).forEach(element => {
            element.style.display = '';
        });

        // Setup role-specific menus
        this.setupRoleMenus(role);
        
        // Apply role-specific styling
        document.body.className = `role-${role}`;
    }

    setupRoleMenus(role) {
        const adminMenu = document.getElementById('admin-menu');
        const newRecordMenu = document.getElementById('new-record-menu');
        const verifyMenu = document.getElementById('verify-menu');
        const newRecordBtn = document.getElementById('new-record-btn');

        // Reset menu visibility
        if (adminMenu) adminMenu.style.display = 'none';
        if (newRecordMenu) newRecordMenu.style.display = 'none';
        if (verifyMenu) verifyMenu.style.display = 'none';
        if (newRecordBtn) newRecordBtn.style.display = 'none';

        switch (role) {
            case 'admin':
                if (adminMenu) adminMenu.style.display = 'block';
                if (newRecordBtn) newRecordBtn.style.display = 'inline-flex';
                break;
            
            case 'operator':
                if (newRecordMenu) newRecordMenu.style.display = 'block';
                if (newRecordBtn) newRecordBtn.style.display = 'inline-flex';
                break;
            
            case 'verificador':
                if (verifyMenu) verifyMenu.style.display = 'block';
                break;
        }
    }

    initializeDashboard() {
        // Load initial data based on role
        if (typeof dashboardManager !== 'undefined') {
            dashboardManager.loadDashboard();
        }
    }

    setLoginLoading(loading) {
        const submitBtn = this.loginForm?.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = loading;
            const icon = submitBtn.querySelector('i');
            if (loading) {
                submitBtn.classList.add('loading');
                if (icon) {
                    icon.className = 'fas fa-spinner fa-spin';
                }
            } else {
                submitBtn.classList.remove('loading');
                if (icon) {
                    icon.className = 'fas fa-sign-in-alt';
                }
            }
        }
    }

    showError(message) {
        const errorElement = document.getElementById('login-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    hideError() {
        const errorElement = document.getElementById('login-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    showSuccess(message) {
        showSuccessMessage(message);
    }

    // Authorization helpers
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    hasAnyRole(roles) {
        return this.currentUser && roles.includes(this.currentUser.role);
    }

    canPerformAction(action) {
        if (!this.currentUser) return false;

        const permissions = {
            'create_record': ['admin', 'operator'],
            'edit_record': ['admin', 'operator'],
            'delete_record': ['admin'],
            'sign_record': ['operator'],
            'verify_record': ['verificador', 'admin'],
            'manage_users': ['admin'],
            'view_audit': ['admin'],
            'export_data': ['admin', 'verificador']
        };

        return permissions[action]?.includes(this.currentUser.role) || false;
    }

    // User profile methods
    showProfile() {
        if (typeof profileManager !== 'undefined') {
            profileManager.show();
        }
    }

    // Session management
    startSessionMonitor() {
        // Check session every 5 minutes
        setInterval(() => {
            this.validateSession();
        }, 5 * 60 * 1000);
    }

    async validateSession() {
        try {
            await api.healthCheck();
        } catch (error) {
            if (error.message.includes('Session expired')) {
                this.logout();
            }
        }
    }

    // Password strength validation
    static validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        const score = {
            length: password.length >= minLength,
            upperCase: hasUpperCase,
            lowerCase: hasLowerCase,
            numbers: hasNumbers,
            specialChar: hasSpecialChar
        };

        const totalScore = Object.values(score).filter(Boolean).length;
        
        return {
            score: totalScore,
            isValid: totalScore >= 4,
            requirements: score,
            strength: totalScore < 3 ? 'weak' : totalScore < 5 ? 'medium' : 'strong'
        };
    }
}

// Password toggle functionality
function togglePassword() {
    const passwordField = document.getElementById('password');
    const toggleButton = document.querySelector('.password-toggle i');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleButton.classList.remove('fa-eye');
        toggleButton.classList.add('fa-eye-slash');
    } else {
        passwordField.type = 'password';
        toggleButton.classList.remove('fa-eye-slash');
        toggleButton.classList.add('fa-eye');
    }
}

// Logout function (called from UI)
function logout() {
    if (authManager) {
        authManager.logout();
    }
}

// Show profile function (called from UI)
function showProfile() {
    if (authManager) {
        authManager.showProfile();
    }
}

// Create global auth manager instance
const authManager = new AuthManager();

// Start session monitoring
authManager.startSessionMonitor();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, authManager };
}