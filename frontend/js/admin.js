// Admin management module
class AdminManager {
    constructor() {
        this.users = [];
        this.auditRecords = [];
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Create user modal events will be bound when modal is created
    }

    async loadUsers() {
        try {
            showLoading('Cargando usuarios...');
            const users = await api.getUsers();
            this.users = users;
            this.renderUsersTable();
        } catch (error) {
            showErrorMessage('Error al cargar los usuarios');
            console.error('Load users error:', error);
        } finally {
            hideLoading();
        }
    }

    renderUsersTable() {
        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;

        if (this.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div style="padding: 2rem;">
                            <i class="fas fa-users fa-2x" style="color: #6c757d; margin-bottom: 1rem;"></i>
                            <p>No hay usuarios registrados</p>
                            <button class="btn btn-primary" onclick="adminManager.showCreateUser()">
                                <i class="fas fa-user-plus"></i> Crear primer usuario
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.users.map(user => this.renderUserRow(user)).join('');
    }

    renderUserRow(user) {
        const isCurrentUser = authManager.currentUser && authManager.currentUser.id === user.id;
        
        return `
            <tr data-user-id="${user.id}">
                <td>
                    <strong>${user.username}</strong>
                    ${isCurrentUser ? '<span class="badge badge-info ml-2">Tú</span>' : ''}
                </td>
                <td>${user.full_name}</td>
                <td>${user.email}</td>
                <td>
                    <span class="role-badge role-${user.role}">
                        ${this.getRoleText(user.role)}
                    </span>
                </td>
                <td>
                    <span class="status-badge status-${user.is_active ? 'active' : 'inactive'}">
                        ${user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>${formatDate(user.last_login, 'dd/mm/yyyy hh:mm') || 'Nunca'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary" onclick="adminManager.editUser(${user.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="adminManager.resetPassword(${user.id})" title="Restablecer contraseña">
                            <i class="fas fa-key"></i>
                        </button>
                        ${!isCurrentUser ? `
                            <button class="btn btn-sm ${user.is_active ? 'btn-warning' : 'btn-success'}" 
                                    onclick="adminManager.toggleUserStatus(${user.id})" 
                                    title="${user.is_active ? 'Desactivar' : 'Activar'}">
                                <i class="fas fa-${user.is_active ? 'user-slash' : 'user-check'}"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="adminManager.deleteUser(${user.id})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    getRoleText(role) {
        const roleMap = {
            admin: 'Administrador',
            operator: 'Operador',
            verificador: 'Verificador'
        };
        return roleMap[role] || role;
    }

    showCreateUser() {
        this.showUserModal();
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            showErrorMessage('Usuario no encontrado');
            return;
        }
        this.showUserModal(user);
    }

    showUserModal(user = null) {
        const isEdit = !!user;
        const modalTitle = isEdit ? 'Editar Usuario' : 'Crear Usuario';
        
        const modalHtml = `
            <div class="modal show" id="user-modal">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${modalTitle}</h5>
                            <button type="button" class="close" onclick="document.getElementById('user-modal').remove()">
                                <span>&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="user-form">
                                <div class="form-group">
                                    <label for="user-username">Usuario *</label>
                                    <input type="text" class="form-control" id="user-username" name="username" 
                                           value="${user ? user.username : ''}" required ${isEdit ? 'disabled' : ''}>
                                </div>
                                
                                <div class="form-group">
                                    <label for="user-fullname">Nombre Completo *</label>
                                    <input type="text" class="form-control" id="user-fullname" name="fullName" 
                                           value="${user ? user.full_name : ''}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="user-email">Email *</label>
                                    <input type="email" class="form-control" id="user-email" name="email" 
                                           value="${user ? user.email : ''}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="user-role">Rol *</label>
                                    <select class="form-control" id="user-role" name="role" required>
                                        <option value="">Seleccione un rol</option>
                                        <option value="admin" ${user && user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                                        <option value="operator" ${user && user.role === 'operator' ? 'selected' : ''}>Operador</option>
                                        <option value="verificador" ${user && user.role === 'verificador' ? 'selected' : ''}>Verificador</option>
                                    </select>
                                </div>
                                
                                ${!isEdit ? `
                                    <div class="form-group">
                                        <label for="user-password">Contraseña *</label>
                                        <input type="password" class="form-control" id="user-password" name="password" required>
                                        <small class="form-text text-muted">
                                            Mínimo 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos.
                                        </small>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="user-password-confirm">Confirmar Contraseña *</label>
                                        <input type="password" class="form-control" id="user-password-confirm" name="passwordConfirm" required>
                                    </div>
                                ` : ''}
                                
                                ${isEdit ? `
                                    <div class="form-group">
                                        <div class="form-check">
                                            <input type="checkbox" class="form-check-input" id="user-active" name="isActive" 
                                                   ${user.is_active ? 'checked' : ''}>
                                            <label class="form-check-label" for="user-active">
                                                Usuario activo
                                            </label>
                                        </div>
                                    </div>
                                ` : ''}
                            </form>
                            
                            <div id="user-form-errors" class="error-message" style="display: none;"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="document.getElementById('user-modal').remove()">
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-primary" onclick="adminManager.saveUser(${user ? user.id : 'null'})">
                                <i class="fas fa-save"></i> ${isEdit ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    async saveUser(userId = null) {
        const form = document.getElementById('user-form');
        const formData = getFormData(form);
        const isEdit = !!userId;
        
        // Validation
        const validation = validateForm(form);
        if (!validation.isValid) {
            this.showUserFormErrors(validation.errors);
            return;
        }

        // Password validation for new users
        if (!isEdit) {
            if (formData.password !== formData.passwordConfirm) {
                this.showUserFormErrors(['Las contraseñas no coinciden']);
                return;
            }

            const passwordValidation = AuthManager.validatePassword(formData.password);
            if (!passwordValidation.isValid) {
                this.showUserFormErrors(['La contraseña no cumple con los requisitos de seguridad']);
                return;
            }
        }

        try {
            showLoading(isEdit ? 'Actualizando usuario...' : 'Creando usuario...');

            const userData = {
                username: formData.username,
                fullName: formData.fullName,
                email: formData.email,
                role: formData.role
            };

            if (!isEdit) {
                userData.password = formData.password;
            } else {
                userData.isActive = formData.isActive === 'on';
            }

            let result;
            if (isEdit) {
                result = await api.updateUser(userId, userData);
            } else {
                result = await api.createUser(userData);
            }

            showSuccessMessage(`Usuario ${isEdit ? 'actualizado' : 'creado'} exitosamente`);
            document.getElementById('user-modal').remove();
            await this.loadUsers();

        } catch (error) {
            this.showUserFormErrors([error.message]);
            console.error('Save user error:', error);
        } finally {
            hideLoading();
        }
    }

    showUserFormErrors(errors) {
        const errorDiv = document.getElementById('user-form-errors');
        if (errorDiv) {
            errorDiv.innerHTML = errors.map(error => `<div>${error}</div>`).join('');
            errorDiv.style.display = 'block';
        }
    }

    async resetPassword(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            showErrorMessage('Usuario no encontrado');
            return;
        }

        const newPassword = prompt(`Ingrese la nueva contraseña para ${user.username}:`);
        if (!newPassword) return;

        const passwordValidation = AuthManager.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            showErrorMessage('La contraseña no cumple con los requisitos de seguridad');
            return;
        }

        const confirmed = confirm(`¿Está seguro de que desea restablecer la contraseña de ${user.username}?`);
        if (!confirmed) return;

        try {
            showLoading('Restableciendo contraseña...');
            await api.updateUser(userId, { password: newPassword });
            showSuccessMessage('Contraseña restablecida exitosamente');
        } catch (error) {
            showErrorMessage('Error al restablecer la contraseña');
            console.error('Reset password error:', error);
        } finally {
            hideLoading();
        }
    }

    async toggleUserStatus(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            showErrorMessage('Usuario no encontrado');
            return;
        }

        const action = user.is_active ? 'desactivar' : 'activar';
        const confirmed = confirm(`¿Está seguro de que desea ${action} a ${user.username}?`);
        if (!confirmed) return;

        try {
            showLoading(`${action === 'desactivar' ? 'Desactivando' : 'Activando'} usuario...`);
            await api.updateUser(userId, { isActive: !user.is_active });
            showSuccessMessage(`Usuario ${action === 'desactivar' ? 'desactivado' : 'activado'} exitosamente`);
            await this.loadUsers();
        } catch (error) {
            showErrorMessage(`Error al ${action} el usuario`);
            console.error('Toggle user status error:', error);
        } finally {
            hideLoading();
        }
    }

    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            showErrorMessage('Usuario no encontrado');
            return;
        }

        const confirmed = confirm(
            `¿Está seguro de que desea ELIMINAR el usuario ${user.username}?\n\n` +
            'Esta acción no se puede deshacer y eliminará todos los datos relacionados.'
        );
        if (!confirmed) return;

        const doubleConfirm = prompt(
            `Para confirmar la eliminación, escriba "${user.username}" (sin comillas):`
        );
        if (doubleConfirm !== user.username) {
            showWarningMessage('Eliminación cancelada - el nombre de usuario no coincide');
            return;
        }

        try {
            showLoading('Eliminando usuario...');
            await api.deleteUser(userId);
            showSuccessMessage('Usuario eliminado exitosamente');
            await this.loadUsers();
        } catch (error) {
            showErrorMessage('Error al eliminar el usuario');
            console.error('Delete user error:', error);
        } finally {
            hideLoading();
        }
    }

    async loadAuditTrail(filters = {}) {
        try {
            showLoading('Cargando auditoría...');
            const auditRecords = await api.getAuditTrail(filters);
            this.auditRecords = auditRecords;
            this.renderAuditTable();
        } catch (error) {
            showErrorMessage('Error al cargar la auditoría');
            console.error('Load audit error:', error);
        } finally {
            hideLoading();
        }
    }

    renderAuditTable() {
        // TODO: Implement audit table rendering
        console.log('Audit records:', this.auditRecords);
    }

    async exportUsers(format = 'csv') {
        try {
            const userIds = this.users.map(u => u.id);
            await api.exportData(userIds, format, 'users');
            showSuccessMessage(`Usuarios exportados en formato ${format.toUpperCase()}`);
        } catch (error) {
            showErrorMessage('Error al exportar usuarios');
            console.error('Export users error:', error);
        }
    }

    async getSystemStats() {
        try {
            const stats = await api.getStatistics();
            return stats;
        } catch (error) {
            console.error('Get system stats error:', error);
            return null;
        }
    }

    // Bulk operations
    async bulkUserOperation(operation, userIds) {
        try {
            showLoading(`Ejecutando operación: ${operation}...`);
            await api.batchOperation(operation, userIds, { type: 'users' });
            showSuccessMessage(`Operación ${operation} ejecutada exitosamente`);
            await this.loadUsers();
        } catch (error) {
            showErrorMessage(`Error al ejecutar operación: ${operation}`);
            console.error('Bulk operation error:', error);
        } finally {
            hideLoading();
        }
    }

    // User role analytics
    getUserRoleStats() {
        const stats = this.users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});

        return {
            total: this.users.length,
            active: this.users.filter(u => u.is_active).length,
            inactive: this.users.filter(u => !u.is_active).length,
            byRole: stats
        };
    }
}

// Global functions for UI interactions
function showCreateUser() {
    if (adminManager) {
        adminManager.showCreateUser();
    }
}

// Create global admin manager instance
const adminManager = new AdminManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminManager, adminManager };
}