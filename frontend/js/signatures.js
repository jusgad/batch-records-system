// Digital Signature Management Module
class SignatureManager {
    constructor() {
        this.signatures = {
            operator: null,
            verificador: null,
            director: null
        };
        this.init();
    }

    init() {
        this.loadSignaturesFromStorage();
    }

    /**
     * Handle signature file upload
     * @param {string} role - Role of the signature (operator, verificador, director)
     * @param {File} file - Image file of the signature
     */
    async handleSignatureUpload(role, file) {
        return new Promise((resolve, reject) => {
            // Validate file type
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
            if (!validTypes.includes(file.type)) {
                reject(new Error('Formato de archivo no válido. Use PNG, JPG o SVG'));
                return;
            }

            // Validate file size (max 2MB)
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (file.size > maxSize) {
                reject(new Error('El archivo es demasiado grande. Máximo 2MB'));
                return;
            }

            // Read file as data URL
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                this.setSignature(role, dataUrl);
                resolve(dataUrl);
            };
            reader.onerror = () => {
                reject(new Error('Error al leer el archivo'));
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Set signature for a specific role
     * @param {string} role - Role identifier
     * @param {string} dataUrl - Base64 data URL of signature image
     */
    setSignature(role, dataUrl) {
        this.signatures[role] = {
            data: dataUrl,
            timestamp: new Date().toISOString(),
            user: authManager.currentUser?.username || 'unknown'
        };
        this.saveSignaturesToStorage();
        this.renderSignature(role);
    }

    /**
     * Get signature for a specific role
     * @param {string} role - Role identifier
     * @returns {Object|null} Signature object or null
     */
    getSignature(role) {
        return this.signatures[role];
    }

    /**
     * Clear signature for a specific role
     * @param {string} role - Role identifier
     */
    clearSignature(role) {
        this.signatures[role] = null;
        this.saveSignaturesToStorage();
        this.renderSignature(role);
    }

    /**
     * Render signature in the UI
     * @param {string} role - Role identifier
     */
    renderSignature(role) {
        const signatureBox = document.getElementById(`signature-box-${role}`);
        if (!signatureBox) return;

        const signature = this.signatures[role];

        if (signature) {
            signatureBox.innerHTML = `<img src="${signature.data}" alt="Firma ${role}">`;
            signatureBox.classList.add('has-signature');

            // Show clear button
            const clearBtn = document.getElementById(`signature-clear-${role}`);
            if (clearBtn) clearBtn.style.display = 'inline-flex';

            // Update info
            const info = document.getElementById(`signature-info-${role}`);
            if (info) {
                const date = new Date(signature.timestamp);
                info.textContent = `Firmado por ${signature.user} el ${date.toLocaleString()}`;
                info.style.display = 'block';
            }
        } else {
            signatureBox.innerHTML = '<span style="color: #999;">Sin firma</span>';
            signatureBox.classList.remove('has-signature');

            // Hide clear button
            const clearBtn = document.getElementById(`signature-clear-${role}`);
            if (clearBtn) clearBtn.style.display = 'none';

            // Hide info
            const info = document.getElementById(`signature-info-${role}`);
            if (info) info.style.display = 'none';
        }
    }

    /**
     * Save signatures to localStorage
     */
    saveSignaturesToStorage() {
        try {
            localStorage.setItem('batch_signatures', JSON.stringify(this.signatures));
        } catch (error) {
            console.error('Error saving signatures to storage:', error);
        }
    }

    /**
     * Load signatures from localStorage
     */
    loadSignaturesFromStorage() {
        try {
            const stored = localStorage.getItem('batch_signatures');
            if (stored) {
                this.signatures = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading signatures from storage:', error);
        }
    }

    /**
     * Setup signature upload buttons
     */
    setupSignatureUploads() {
        const roles = ['operator', 'verificador', 'director'];

        roles.forEach(role => {
            // Upload button
            const uploadBtn = document.getElementById(`signature-upload-btn-${role}`);
            const fileInput = document.getElementById(`signature-file-${role}`);

            if (uploadBtn && fileInput) {
                uploadBtn.addEventListener('click', () => {
                    fileInput.click();
                });

                fileInput.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    try {
                        showLoading('Cargando firma...');
                        await this.handleSignatureUpload(role, file);
                        showSuccessMessage('Firma cargada exitosamente');
                        hideLoading();
                    } catch (error) {
                        hideLoading();
                        showErrorMessage(error.message);
                    }

                    // Clear file input
                    fileInput.value = '';
                });
            }

            // Clear button
            const clearBtn = document.getElementById(`signature-clear-${role}`);
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    if (confirm('¿Está seguro de que desea eliminar esta firma?')) {
                        this.clearSignature(role);
                        showSuccessMessage('Firma eliminada');
                    }
                });
            }

            // Initial render
            this.renderSignature(role);
        });
    }

    /**
     * Check if all required signatures are present
     * @param {Array<string>} requiredRoles - Array of required role identifiers
     * @returns {boolean} True if all required signatures are present
     */
    hasRequiredSignatures(requiredRoles) {
        return requiredRoles.every(role => this.signatures[role] !== null);
    }

    /**
     * Get all signatures as object for API submission
     * @returns {Object} Signatures object
     */
    getSignaturesForSubmission() {
        const result = {};
        Object.keys(this.signatures).forEach(role => {
            if (this.signatures[role]) {
                result[role] = {
                    data: this.signatures[role].data,
                    timestamp: this.signatures[role].timestamp,
                    user: this.signatures[role].user
                };
            }
        });
        return result;
    }
}

// Global instance
let signatureManager;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    signatureManager = new SignatureManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SignatureManager, signatureManager };
}
