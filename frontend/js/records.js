// Records management module
class RecordsManager {
    constructor() {
        this.records = [];
        this.currentRecord = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadRecords();
    }

    bindEvents() {
        // Refresh button
        const refreshBtn = document.querySelector('[onclick="refreshRecords()"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadRecords());
        }
    }

    async loadRecords() {
        try {
            showLoading('Cargando registros...');
            const records = await api.getRecords();
            this.records = records;
            this.renderRecordsTable();
            this.updateDashboardStats();
        } catch (error) {
            showErrorMessage('Error al cargar los registros');
            console.error('Load records error:', error);
        } finally {
            hideLoading();
        }
    }

    renderRecordsTable() {
        const tbody = document.getElementById('records-tbody');
        if (!tbody) return;

        if (this.records.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div style="padding: 2rem;">
                            <i class="fas fa-inbox fa-2x" style="color: #6c757d; margin-bottom: 1rem;"></i>
                            <p>No hay registros disponibles</p>
                            ${authManager.hasRole('operator') ? '<button class="btn btn-primary" onclick="showNewRecord()"><i class="fas fa-plus"></i> Crear primer registro</button>' : ''}
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.records.map(record => this.renderRecordRow(record)).join('');
    }

    renderRecordRow(record) {
        const canEdit = authManager.hasRole('admin') ||
                       (authManager.hasRole('operator') && record.operator_id === authManager.currentUser.id && record.status === 'draft');

        const canSign = authManager.hasRole('operator') &&
                       record.operator_id === authManager.currentUser.id &&
                       record.status === 'draft';

        const canVerify = authManager.hasRole('verificador') && record.status === 'signed';

        const canDelete = authManager.hasRole('admin');

        return `
            <tr data-record-id="${record.id}" class="interactive-row">
                <td>
                    <strong>${record.batch_number}</strong>
                </td>
                <td>${record.product_name}</td>
                <td>${record.quantity || '-'}</td>
                <td>${formatDate(record.production_date)}</td>
                <td>
                    <span class="status-badge status-${record.status}">
                        ${this.getStatusText(record.status)}
                    </span>
                </td>
                <td>${record.operator_name || '-'}</td>
                <td>${record.verificador_name || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary" onclick="recordsManager.viewRecord(${record.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="recordsManager.exportToPDF(${record.id})" title="Exportar PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        ${canEdit ? `
                            <button class="btn btn-sm btn-outline-secondary" onclick="recordsManager.editRecord(${record.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        ${canSign ? `
                            <button class="btn btn-sm btn-success" onclick="recordsManager.signRecord(${record.id})" title="Firmar">
                                <i class="fas fa-signature"></i>
                            </button>
                        ` : ''}
                        ${canVerify ? `
                            <button class="btn btn-sm btn-success" onclick="recordsManager.approveRecord(${record.id})" title="Aprobar">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="recordsManager.rejectRecord(${record.id})" title="Rechazar">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        ${canDelete ? `
                            <button class="btn btn-sm btn-danger" onclick="recordsManager.deleteRecord(${record.id})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    getStatusText(status) {
        const statusMap = {
            draft: 'Borrador',
            signed: 'Firmado',
            verified: 'Verificado',
            approved: 'Aprobado',
            rejected: 'Rechazado'
        };
        return statusMap[status] || status;
    }

    async viewRecord(recordId) {
        const record = this.records.find(r => r.id === recordId);
        if (!record) {
            showErrorMessage('Registro no encontrado');
            return;
        }

        this.currentRecord = record;
        this.showRecordModal(record, 'view');
    }

    async editRecord(recordId) {
        const record = this.records.find(r => r.id === recordId);
        if (!record) {
            showErrorMessage('Registro no encontrado');
            return;
        }

        this.currentRecord = record;
        // Load the form with record data
        showNewRecord();
        
        // Populate form with existing data
        setTimeout(() => {
            this.populateForm(record);
        }, 100);
    }

    populateForm(record) {
        // Set basic fields
        const batchField = document.getElementById('batch-number');
        const productField = document.getElementById('product-name');
        const quantityField = document.getElementById('quantity');
        const dateField = document.getElementById('production-date');

        if (batchField) batchField.value = record.batch_number;
        if (productField) productField.value = record.product_name;
        if (quantityField) quantityField.value = record.quantity || '';
        if (dateField) dateField.value = record.production_date || '';

        // Populate form data if available
        if (record.form_data && typeof record.form_data === 'object') {
            Object.keys(record.form_data).forEach(key => {
                const field = document.querySelector(`[name="${key}"]`);
                if (field) {
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        field.checked = Boolean(record.form_data[key]);
                    } else {
                        field.value = record.form_data[key] || '';
                    }
                }
            });
        }
    }

    async signRecord(recordId) {
        const record = this.records.find(r => r.id === recordId);
        if (!record) {
            showErrorMessage('Registro no encontrado');
            return;
        }

        const confirmed = confirm(`¿Está seguro de que desea firmar el registro de lote ${record.batch_number}?\n\nUna vez firmado, no podrá ser modificado.`);
        if (!confirmed) return;

        try {
            showLoading('Firmando registro...');
            await api.signRecord(recordId);
            showSuccessMessage('Registro firmado exitosamente');
            await this.loadRecords();
        } catch (error) {
            showErrorMessage('Error al firmar el registro');
            console.error('Sign record error:', error);
        } finally {
            hideLoading();
        }
    }

    async approveRecord(recordId) {
        const record = this.records.find(r => r.id === recordId);
        if (!record) {
            showErrorMessage('Registro no encontrado');
            return;
        }

        const confirmed = confirm(`¿Está seguro de que desea APROBAR el registro de lote ${record.batch_number}?`);
        if (!confirmed) return;

        try {
            showLoading('Aprobando registro...');
            await api.verifyRecord(recordId, true);
            showSuccessMessage('Registro aprobado exitosamente');
            await this.loadRecords();
        } catch (error) {
            showErrorMessage('Error al aprobar el registro');
            console.error('Approve record error:', error);
        } finally {
            hideLoading();
        }
    }

    async rejectRecord(recordId) {
        const record = this.records.find(r => r.id === recordId);
        if (!record) {
            showErrorMessage('Registro no encontrado');
            return;
        }

        const reason = prompt(`¿Por qué razón rechaza el registro de lote ${record.batch_number}?`);
        if (!reason) return;

        const confirmed = confirm(`¿Está seguro de que desea RECHAZAR el registro de lote ${record.batch_number}?\n\nRazón: ${reason}`);
        if (!confirmed) return;

        try {
            showLoading('Rechazando registro...');
            await api.verifyRecord(recordId, false);
            showSuccessMessage('Registro rechazado');
            await this.loadRecords();
        } catch (error) {
            showErrorMessage('Error al rechazar el registro');
            console.error('Reject record error:', error);
        } finally {
            hideLoading();
        }
    }

    async deleteRecord(recordId) {
        const record = this.records.find(r => r.id === recordId);
        if (!record) {
            showErrorMessage('Registro no encontrado');
            return;
        }

        const confirmed = confirm(`¿Está seguro de que desea ELIMINAR el registro de lote ${record.batch_number}?\n\nEsta acción no se puede deshacer.`);
        if (!confirmed) return;

        try {
            showLoading('Eliminando registro...');
            await api.deleteRecord(recordId);
            showSuccessMessage('Registro eliminado exitosamente');
            await this.loadRecords();
        } catch (error) {
            showErrorMessage('Error al eliminar el registro');
            console.error('Delete record error:', error);
        } finally {
            hideLoading();
        }
    }

    showRecordModal(record, mode = 'view') {
        // Create modal HTML
        const modalHtml = `
            <div class="modal show" id="record-modal">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                ${mode === 'view' ? 'Ver' : 'Editar'} Registro - Lote ${record.batch_number}
                            </h5>
                            <button type="button" class="close" onclick="document.getElementById('record-modal').remove()">
                                <span>&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="record-details">
                                <div class="row">
                                    <div class="col-md-6">
                                        <p><strong>Producto:</strong> ${record.product_name}</p>
                                        <p><strong>Cantidad:</strong> ${record.quantity || '-'}</p>
                                        <p><strong>Fecha de Producción:</strong> ${formatDate(record.production_date)}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p><strong>Estado:</strong> 
                                            <span class="status-badge status-${record.status}">
                                                ${this.getStatusText(record.status)}
                                            </span>
                                        </p>
                                        <p><strong>Operador:</strong> ${record.operator_name || '-'}</p>
                                        <p><strong>Verificador:</strong> ${record.verificador_name || '-'}</p>
                                    </div>
                                </div>
                                
                                <hr>
                                
                                <div class="form-data">
                                    <h6>Datos del Formulario:</h6>
                                    ${this.renderFormData(record.form_data)}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="document.getElementById('record-modal').remove()">
                                Cerrar
                            </button>
                            <button type="button" class="btn btn-primary" onclick="recordsManager.printRecord(${record.id})">
                                <i class="fas fa-print"></i> Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    renderFormData(formData) {
        if (!formData || typeof formData !== 'object') {
            return '<p>No hay datos de formulario disponibles</p>';
        }

        let html = '<div class="form-data-grid">';
        Object.keys(formData).forEach(key => {
            const value = formData[key];
            if (value) {
                html += `
                    <div class="form-data-item">
                        <strong>${this.formatFieldName(key)}:</strong>
                        <span>${value}</span>
                    </div>
                `;
            }
        });
        html += '</div>';

        return html;
    }

    formatFieldName(fieldName) {
        return fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/_/g, ' ');
    }

    async printRecord(recordId) {
        const record = this.records.find(r => r.id === recordId);
        if (!record) {
            showErrorMessage('Registro no encontrado');
            return;
        }

        // Create print-friendly HTML
        const printHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Batch Record - ${record.batch_number}</title>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; margin: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .section { margin-bottom: 20px; }
                    .section h3 { background: #f0f0f0; padding: 8px; margin: 0 0 10px 0; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                    th { background: #f0f0f0; }
                    .signature-area { border: 1px solid #000; height: 60px; margin-top: 10px; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>BATCH RECORD</h1>
                    <h2>Lote: ${record.batch_number}</h2>
                </div>
                
                <div class="section">
                    <h3>Información Básica</h3>
                    <table>
                        <tr><td><strong>Producto:</strong></td><td>${record.product_name}</td></tr>
                        <tr><td><strong>Cantidad:</strong></td><td>${record.quantity || '-'}</td></tr>
                        <tr><td><strong>Fecha de Producción:</strong></td><td>${formatDate(record.production_date)}</td></tr>
                        <tr><td><strong>Estado:</strong></td><td>${this.getStatusText(record.status)}</td></tr>
                        <tr><td><strong>Operador:</strong></td><td>${record.operator_name || '-'}</td></tr>
                        <tr><td><strong>Verificador:</strong></td><td>${record.verificador_name || '-'}</td></tr>
                    </table>
                </div>
                
                ${record.form_data ? `
                    <div class="section">
                        <h3>Datos del Proceso</h3>
                        ${this.renderFormDataForPrint(record.form_data)}
                    </div>
                ` : ''}
                
                <div class="section">
                    <h3>Firmas</h3>
                    <table>
                        <tr>
                            <td style="width: 50%;">
                                <strong>Operador:</strong><br>
                                <div class="signature-area"></div>
                                Fecha: _____________
                            </td>
                            <td style="width: 50%;">
                                <strong>Verificador:</strong><br>
                                <div class="signature-area"></div>
                                Fecha: _____________
                            </td>
                        </tr>
                    </table>
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()">Imprimir</button>
                    <button onclick="window.close()">Cerrar</button>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.focus();
    }

    renderFormDataForPrint(formData) {
        if (!formData || typeof formData !== 'object') return '';

        let html = '<table>';
        Object.keys(formData).forEach(key => {
            const value = formData[key];
            if (value) {
                html += `<tr><td><strong>${this.formatFieldName(key)}:</strong></td><td>${value}</td></tr>`;
            }
        });
        html += '</table>';
        return html;
    }

    updateDashboardStats() {
        const totalRecords = this.records.length;
        const pendingRecords = this.records.filter(r => r.status === 'signed').length;
        const approvedRecords = this.records.filter(r => r.status === 'approved').length;

        const totalElement = document.getElementById('total-records');
        const pendingElement = document.getElementById('pending-records');
        const approvedElement = document.getElementById('approved-records');

        if (totalElement) totalElement.textContent = totalRecords;
        if (pendingElement) pendingElement.textContent = pendingRecords;
        if (approvedElement) approvedElement.textContent = approvedRecords;

        // Show/hide pending stats based on role
        const pendingStats = document.getElementById('pending-stats');
        if (pendingStats && authManager.hasAnyRole(['verificador', 'admin'])) {
            pendingStats.style.display = 'block';
        }
    }

    getRecordById(id) {
        return this.records.find(r => r.id === id);
    }

    async exportRecords(format = 'csv') {
        try {
            const recordIds = this.records.map(r => r.id);
            await api.exportData(recordIds, format);
            showSuccessMessage(`Registros exportados en formato ${format.toUpperCase()}`);
        } catch (error) {
            showErrorMessage('Error al exportar registros');
            console.error('Export error:', error);
        }
    }

    async exportToPDF(recordId) {
        const record = this.records.find(r => r.id === recordId);
        if (!record) {
            showErrorMessage('Registro no encontrado');
            return;
        }

        try {
            showLoading('Generando PDF...');

            // Get formulation data
            let formulation = [];
            try {
                formulation = await api.getRecordFormulation(recordId);
            } catch (error) {
                console.warn('No formulation data available:', error);
            }

            // Get signatures from signature manager
            const signatures = signatureManager ? signatureManager.getSignaturesForSubmission() : {};

            // Generate PDF
            if (pdfExporter) {
                await pdfExporter.generateBatchRecordPDF(record, formulation, signatures);
                showSuccessMessage('PDF generado exitosamente');
            } else {
                throw new Error('PDF Exporter no está disponible');
            }

            hideLoading();
        } catch (error) {
            hideLoading();
            showErrorMessage('Error al generar PDF: ' + error.message);
            console.error('PDF export error:', error);
        }
    }

    async exportMultipleToPDF(recordIds) {
        try {
            showLoading('Generando PDF de múltiples registros...');

            const recordsToExport = this.records.filter(r => recordIds.includes(r.id));

            if (recordsToExport.length === 0) {
                throw new Error('No se encontraron registros para exportar');
            }

            if (pdfExporter) {
                await pdfExporter.generateMultipleRecordsPDF(recordsToExport);
                showSuccessMessage(`PDF generado con ${recordsToExport.length} registros`);
            } else {
                throw new Error('PDF Exporter no está disponible');
            }

            hideLoading();
        } catch (error) {
            hideLoading();
            showErrorMessage('Error al generar PDF: ' + error.message);
            console.error('Multiple PDF export error:', error);
        }
    }
}

// Global functions for UI interactions
function showRecordsList() {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('records-list').classList.add('active');
    
    // Update menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('[onclick="showRecordsList()"]').classList.add('active');
}

function refreshRecords() {
    if (recordsManager) {
        recordsManager.loadRecords();
    }
}

// Create global records manager instance
const recordsManager = new RecordsManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RecordsManager, recordsManager };
}