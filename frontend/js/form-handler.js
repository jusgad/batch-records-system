// Form handler module for batch records
class FormHandler {
    constructor() {
        this.currentFormData = {};
        this.hasUnsavedChanges = false;
        this.formContainer = null;
        this.init();
    }

    init() {
        this.formContainer = document.getElementById('batch-form-container');
        this.createForm();
        this.bindEvents();
    }

    bindEvents() {
        // Form change detection
        document.addEventListener('input', (e) => {
            if (e.target.closest('#batch-form-container')) {
                this.hasUnsavedChanges = true;
                this.updateSaveButtonState();
            }
        });

        // Auto-save every 30 seconds
        setInterval(() => {
            if (this.hasUnsavedChanges) {
                this.autoSave();
            }
        }, 30000);
    }

    createForm() {
        if (!this.formContainer) return;

        const formHtml = `
            <div class="batch-form">
                <!-- Form Header -->
                <div class="form-header">
                    <div class="form-controls">
                        <button type="button" class="btn btn-secondary" onclick="formHandler.loadData()">
                            <i class="fas fa-folder-open"></i> Cargar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="formHandler.saveData()" id="save-btn">
                            <i class="fas fa-save"></i> Guardar
                        </button>
                        <button type="button" class="btn btn-success" onclick="formHandler.submitRecord()" id="submit-btn" disabled>
                            <i class="fas fa-check"></i> Enviar
                        </button>
                        <button type="button" class="btn btn-info" onclick="formHandler.printForm()">
                            <i class="fas fa-print"></i> Imprimir
                        </button>
                        <button type="button" class="btn btn-warning" onclick="formHandler.clearAll()">
                            <i class="fas fa-eraser"></i> Limpiar
                        </button>
                    </div>
                </div>

                <!-- Tabs Navigation -->
                <div class="form-tabs">
                    <div class="nav-tabs">
                        <div class="nav-tab active" onclick="formHandler.showTab(0)">Control de Producción</div>
                        <div class="nav-tab" onclick="formHandler.showTab(1)">Fabricación</div>
                        <div class="nav-tab" onclick="formHandler.showTab(2)">Envasado</div>
                        <div class="nav-tab" onclick="formHandler.showTab(3)">Control Calidad</div>
                        <div class="nav-tab" onclick="formHandler.showTab(4)">Rótulos</div>
                    </div>
                </div>

                <!-- Form Content -->
                <form id="batch-record-form" class="batch-record-form">
                    <!-- Basic Information (Always visible) -->
                    <div class="form-section basic-info">
                        <h3>Información Básica del Lote</h3>
                        <div class="form-row">
                            <div class="form-group col-md-3">
                                <label for="batch-number">Número de Lote *</label>
                                <input type="text" class="form-control" id="batch-number" name="batchNumber" required>
                            </div>
                            <div class="form-group col-md-6">
                                <label for="product-name">Producto *</label>
                                <input type="text" class="form-control" id="product-name" name="productName" required>
                            </div>
                            <div class="form-group col-md-3">
                                <label for="quantity">Cantidad</label>
                                <input type="text" class="form-control" id="quantity" name="quantity" placeholder="ej: 1100 KG">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group col-md-4">
                                <label for="production-date">Fecha de Producción</label>
                                <input type="date" class="form-control" id="production-date" name="productionDate">
                            </div>
                            <div class="form-group col-md-4">
                                <label for="order-number">Número de O.P.</label>
                                <input type="text" class="form-control" id="order-number" name="orderNumber">
                            </div>
                            <div class="form-group col-md-4">
                                <label for="lot-number">Número de Lote Interno</label>
                                <input type="text" class="form-control" id="lot-number" name="lotNumber">
                            </div>
                        </div>
                    </div>

                    <!-- Tab Content -->
                    <div class="tab-content">
                        ${this.generateTabContent()}
                    </div>
                </form>
            </div>
        `;

        this.formContainer.innerHTML = formHtml;
        this.initializeFormDefaults();
    }

    generateTabContent() {
        return `
            <!-- Tab 1: Control de Producción -->
            <div class="tab-pane active" id="tab-production-control">
                ${this.generateProductionControlTab()}
            </div>

            <!-- Tab 2: Fabricación -->
            <div class="tab-pane" id="tab-manufacturing">
                ${this.generateManufacturingTab()}
            </div>

            <!-- Tab 3: Envasado -->
            <div class="tab-pane" id="tab-packaging">
                ${this.generatePackagingTab()}
            </div>

            <!-- Tab 4: Control de Calidad -->
            <div class="tab-pane" id="tab-quality-control">
                ${this.generateQualityControlTab()}
            </div>

            <!-- Tab 5: Rótulos -->
            <div class="tab-pane" id="tab-labels">
                ${this.generateLabelsTab()}
            </div>
        `;
    }

    generateProductionControlTab() {
        return `
            <div class="form-section">
                <h4>Control de Preparación</h4>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th rowspan="2">DESPEJE DE LÍNEA</th>
                                <th colspan="2">DISPENSACIÓN</th>
                                <th colspan="2">PRODUCCIÓN</th>
                                <th colspan="2">ENVASADO</th>
                                <th colspan="2">ACONDICIONAMIENTO</th>
                            </tr>
                            <tr>
                                <th>Si/No</th><th>Verificó</th>
                                <th>Si/No</th><th>Verificó</th>
                                <th>Si/No</th><th>Verificó</th>
                                <th>Si/No</th><th>Verificó</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.generateChecklistRows([
                                'Uso completo de implementos de seguridad e higiene',
                                'Área correctamente identificada',
                                'Utensilios limpios e identificados',
                                'Equipos completamente limpios'
                            ])}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="form-section">
                <h4>Control de Calidad del Agua Desionizada</h4>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>FECHA</th><th>INSPECTOR</th><th>ASPECTO</th><th>COLOR</th><th>OLOR</th>
                                <th>PARTÍCULAS</th><th>CONDUCTIVIDAD</th><th>Ph</th><th>TDS</th><th>T °C</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><input type="date" class="form-control form-control-sm" name="waterControlDate"></td>
                                <td><input type="text" class="form-control form-control-sm" name="waterInspector"></td>
                                <td><input type="text" class="form-control form-control-sm" name="waterAspect"></td>
                                <td><input type="text" class="form-control form-control-sm" name="waterColor"></td>
                                <td><input type="text" class="form-control form-control-sm" name="waterOdor"></td>
                                <td><input type="text" class="form-control form-control-sm" name="waterParticles"></td>
                                <td><input type="text" class="form-control form-control-sm" name="waterConductivity"></td>
                                <td><input type="text" class="form-control form-control-sm" name="waterPh"></td>
                                <td><input type="text" class="form-control form-control-sm" name="waterTds"></td>
                                <td><input type="text" class="form-control form-control-sm" name="waterTemp"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="form-group">
                    <label>Verificado por:</label>
                    <input type="text" class="form-control" name="waterVerifiedBy" style="max-width: 300px;">
                </div>
            </div>
        `;
    }

    generateManufacturingTab() {
        return `
            <div class="form-section">
                <h4>Ingredientes y Materias Primas</h4>
                <div class="form-row">
                    <div class="form-group col-md-4">
                        <label>Kg a Fabricar:</label>
                        <input type="text" class="form-control" name="kgToManufacture" value="550">
                    </div>
                    <div class="form-group col-md-8">
                        <label>Sub-lotes:</label>
                        <div class="sublot-checkboxes">
                            ${['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(letter => 
                                `<label class="checkbox-inline"><input type="checkbox" name="sublot${letter}" value="${letter}"> ${letter}</label>`
                            ).join('')}
                        </div>
                    </div>
                </div>

                <div class="ingredients-table">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>CÓDIGO</th><th>MATERIA PRIMA</th><th>%</th><th>CANTIDAD</th><th>SUBLOTE</th>
                                <th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>H</th><th>I</th><th>J</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.generateIngredientsRows()}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="form-section">
                <h4>Protocolo de Fabricación</h4>
                <div class="protocol-steps">
                    ${this.generateProtocolSteps()}
                </div>
            </div>
        `;
    }

    generatePackagingTab() {
        return `
            <div class="form-section">
                <h4>Materiales de Envasado</h4>
                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label>Cantidad Ordenada:</label>
                        <input type="text" class="form-control" name="orderedQuantity" value="8800 Unid">
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>FECHA</th><th>CÓDIGO</th><th>MATERIALES</th><th>UNIDADES</th>
                                <th>Nro Lote</th><th>RESPONSABLE DE DISPENSACIÓN</th><th>OBSERVACIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.generatePackagingMaterialsRows()}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="form-section">
                <h4>Protocolo de Envasado</h4>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>ETAPA</th><th>DESCRIPCIÓN DEL PROCESO</th><th>RESPONSABLE</th><th>OBSERVACIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.generatePackagingProtocolRows()}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="form-section">
                <h4>Reporte de Operación de Envasado</h4>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>FECHA</th><th>HORA INICIO</th><th>HORA FIN</th><th>TIEMPO</th>
                                <th>OPERADOR</th><th>AUXILIAR</th><th>UNID PRODUCIDAS</th><th>OBSERVACIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><input type="date" class="form-control form-control-sm" name="packagingDate"></td>
                                <td><input type="time" class="form-control form-control-sm" name="packagingStartTime"></td>
                                <td><input type="time" class="form-control form-control-sm" name="packagingEndTime"></td>
                                <td><input type="text" class="form-control form-control-sm" name="packagingDuration"></td>
                                <td><input type="text" class="form-control form-control-sm" name="packagingOperator"></td>
                                <td><input type="text" class="form-control form-control-sm" name="packagingAssistant"></td>
                                <td><input type="text" class="form-control form-control-sm" name="unitsProduced"></td>
                                <td><input type="text" class="form-control form-control-sm" name="packagingObservations"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    generateQualityControlTab() {
        return `
            <div class="form-section">
                <h4>Control de Calidad en el Proceso</h4>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>PARÁMETRO/# MUESTRA</th>
                                <th>#1</th><th>#2</th><th>#3</th><th>#4</th><th>#5</th><th>#6</th><th>#7</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.generateQualityControlRows()}
                        </tbody>
                    </table>
                </div>
                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label>Inspector:</label>
                        <input type="text" class="form-control" name="qualityInspector">
                    </div>
                    <div class="form-group col-md-6">
                        <label>Observaciones:</label>
                        <input type="text" class="form-control" name="qualityObservations">
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h4>Control de Codificado (Loteado)</h4>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>PARÁMETRO/# MUESTRA</th><th>#1</th><th>#2</th><th>MUESTRAS DE RETENCIÓN</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Nro Lote bien impreso y concuerda:</td>
                                <td><input type="text" class="form-control form-control-sm" name="lotPrint1"></td>
                                <td><input type="text" class="form-control form-control-sm" name="lotPrint2"></td>
                                <td rowspan="3" class="retention-samples">
                                    <div class="form-group">
                                        <label>Producto:</label>
                                        <input type="text" class="form-control form-control-sm" name="retentionProduct">
                                    </div>
                                    <div class="form-group">
                                        <label>Cantidad:</label>
                                        <input type="text" class="form-control form-control-sm" name="retentionQuantity">
                                    </div>
                                    <div class="form-group">
                                        <label>Realizado por:</label>
                                        <input type="text" class="form-control form-control-sm" name="retentionBy">
                                    </div>
                                    <div class="form-group">
                                        <label>Fecha:</label>
                                        <input type="date" class="form-control form-control-sm" name="retentionDate">
                                    </div>
                                    <div class="form-group">
                                        <label>Aprobado:</label>
                                        <input type="text" class="form-control form-control-sm" name="retentionApproved">
                                    </div>
                                    <div class="form-group">
                                        <label>Fecha Aprobación:</label>
                                        <input type="date" class="form-control form-control-sm" name="retentionApprovalDate">
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>Verificado:</td>
                                <td><input type="text" class="form-control form-control-sm" name="lotVerified1"></td>
                                <td><input type="text" class="form-control form-control-sm" name="lotVerified2"></td>
                            </tr>
                            <tr>
                                <td colspan="3">
                                    Observaciones: <input type="text" class="form-control form-control-sm" name="codingObservations" style="width: 70%; display: inline-block;">
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="form-section">
                <h4>Liberación de Producto Terminado</h4>
                <div class="liberation-section">
                    <p><strong>C=CUMPLE NC=NO CUMPLE NA=NO APLICA</strong></p>
                    
                    <div class="form-row">
                        <div class="form-group col-md-4">
                            <label>Pruebas Fisicoquímicas:</label>
                            <input type="text" class="form-control" name="physicochemicalTests">
                        </div>
                        <div class="form-group col-md-8">
                            <label>Observaciones:</label>
                            <input type="text" class="form-control" name="physicochemicalObservations">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group col-md-4">
                            <label>Pruebas Microbiológicas:</label>
                            <input type="text" class="form-control" name="microbiologicalTests">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label>Aprobado:</label>
                            <input type="text" class="form-control" name="approvedBy">
                        </div>
                        <div class="form-group col-md-6">
                            <label>V°B° Direct Técn:</label>
                            <input type="text" class="form-control" name="technicalDirectorApproval">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group col-md-4">
                            <label>Fecha de Liberación:</label>
                            <input type="date" class="form-control" name="releaseDate">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateLabelsTab() {
        return `
            <div class="form-section">
                <h4>Rótulos Usados en el Lote</h4>
                <p>Pegue aquí los rótulos usados en la fabricación del lote. Si es necesario continúe al respaldo.</p>
                
                <div class="labels-area">
                    <textarea class="form-control" name="labelsUsed" rows="15" 
                              placeholder="Espacio para pegar rótulos o escribir información adicional..."></textarea>
                </div>
                
                <div class="form-row mt-3">
                    <div class="form-group col-md-6">
                        <label>V°B° Direct Técn:</label>
                        <input type="text" class="form-control" name="finalTechnicalApproval">
                    </div>
                </div>
            </div>
        `;
    }

    // Helper methods for generating table rows
    generateChecklistRows(items) {
        return items.map((item, index) => `
            <tr>
                <td style="text-align: left;">${item}</td>
                ${['dispensing', 'production', 'packaging', 'conditioning'].map(stage => `
                    <td><input type="text" class="form-control form-control-sm" name="${stage}Check${index}"></td>
                    <td><input type="text" class="form-control form-control-sm" name="${stage}Verifier${index}"></td>
                `).join('')}
            </tr>
        `).join('');
    }

    generateIngredientsRows() {
        const ingredients = [
            { code: 'N.E', name: 'AGUA DESMINERALIZADA', percentage: '93.535%', quantity: '514.4425', sublot: '187.07' },
            { code: 'N.E', name: 'CARBOMERO', percentage: '0.500%', quantity: '2.7500', sublot: '1.00' },
            { code: 'N.E', name: 'EDTA TETRASODICO', percentage: '0.040%', quantity: '0.2200', sublot: '0.08' },
            // Add more ingredients as needed
        ];

        return ingredients.map((ingredient, index) => `
            <tr>
                <td>${ingredient.code}</td>
                <td>${ingredient.name}</td>
                <td>${ingredient.percentage}</td>
                <td>${ingredient.quantity}</td>
                <td>${ingredient.sublot}</td>
                ${['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(letter => 
                    `<td><input type="text" class="form-control form-control-sm" name="ingredient${index}${letter}"></td>`
                ).join('')}
            </tr>
        `).join('');
    }

    generateProtocolSteps() {
        const steps = [
            'En tanque de preparación colocar AGUA + PRESERVANTE + CARBOMERO. Agitar fuertemente hasta completa disolución.',
            'Adicionar PROPILENGLICOL + SORBITOL + EDTA previamente diluido en agua. MEZCLA A.',
            'En otro recipiente disolver en suficiente agua el PVP K30. MEZCLA B.',
            // Add more steps as needed
        ];

        return steps.map((step, index) => `
            <div class="protocol-step">
                <div class="step-number">${index + 1}</div>
                <div class="step-description">${step}</div>
                <div class="step-controls">
                    <input type="text" class="form-control form-control-sm" name="step${index}Responsible" placeholder="Responsable">
                    <input type="text" class="form-control form-control-sm" name="step${index}Time" placeholder="Tiempo">
                    <input type="text" class="form-control form-control-sm" name="step${index}Observations" placeholder="Observaciones">
                </div>
            </div>
        `).join('');
    }

    generatePackagingMaterialsRows() {
        const materials = [
            { code: 'N.E', name: 'FRASCO / ENVASE', units: '8.800,0' },
            { code: 'N.E', name: 'TAPA', units: '8.800,0' },
            { code: 'N.E', name: 'ETIQUETA DELANTERA', units: '8.800,0' },
            { code: 'N.E', name: 'ETIQUETA TRASERA', units: '8.800,0' },
            { code: 'N.E', name: 'BOLSA TERMOENCOCIDO', units: '8.800,0' },
            { code: 'N.E', name: 'CAJA EMBALAJE', units: '176,0' }
        ];

        return materials.map((material, index) => `
            <tr>
                ${index === 0 ? `<td rowspan="${materials.length}">${new Date().toLocaleDateString()}</td>` : ''}
                <td>${material.code}</td>
                <td>${material.name}</td>
                <td>${material.units}</td>
                <td><input type="text" class="form-control form-control-sm" name="material${index}Lot"></td>
                <td><input type="text" class="form-control form-control-sm" name="material${index}Responsible"></td>
                <td><input type="text" class="form-control form-control-sm" name="material${index}Observations"></td>
            </tr>
        `).join('');
    }

    generatePackagingProtocolRows() {
        const protocolSteps = [
            'Verificar protocolo de DESPEJE DE LÍNEAS',
            'Conectar aire comprimido a envasadora',
            'Disponer operario de envasado y otro para tapado',
            'Verificar peso de producto envasado'
        ];

        return protocolSteps.map((step, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${step}</td>
                <td><input type="text" class="form-control form-control-sm" name="packProtocol${index}Responsible"></td>
                <td><input type="text" class="form-control form-control-sm" name="packProtocol${index}Observations"></td>
            </tr>
        `).join('');
    }

    generateQualityControlRows() {
        const parameters = [
            'Control de Peso o Volumen',
            'Envase limpio',
            'Bien cerrado',
            'Etiqueta Alineada, sin arrugas',
            'Etiqueta con información clara',
            'Empaque en buen estado',
            'Caja de embalaje identificada'
        ];

        return parameters.map((param, index) => `
            <tr>
                <td>${param}</td>
                ${[1, 2, 3, 4, 5, 6, 7].map(sampleNum => 
                    `<td><input type="text" class="form-control form-control-sm" name="quality${index}Sample${sampleNum}"></td>`
                ).join('')}
            </tr>
        `).join('');
    }

    // Tab navigation
    showTab(tabIndex) {
        // Update tab navigation
        document.querySelectorAll('.nav-tab').forEach((tab, index) => {
            tab.classList.toggle('active', index === tabIndex);
        });

        // Update tab content
        document.querySelectorAll('.tab-pane').forEach((pane, index) => {
            pane.classList.toggle('active', index === tabIndex);
        });
    }

    // Form data management
    collectFormData() {
        const form = document.getElementById('batch-record-form');
        const formData = getFormData(form);
        
        // Add basic information
        this.currentFormData = {
            batchNumber: formData.batchNumber,
            productName: formData.productName,
            quantity: formData.quantity,
            productionDate: formData.productionDate,
            formData: formData
        };

        return this.currentFormData;
    }

    populateForm(data) {
        const form = document.getElementById('batch-record-form');
        if (data.formData) {
            setFormData(form, data.formData);
        }
    }

    validateForm() {
        const form = document.getElementById('batch-record-form');
        return validateForm(form);
    }

    // Form actions
    async saveData() {
        try {
            const formData = this.collectFormData();
            
            // Validate required fields
            if (!formData.batchNumber || !formData.productName) {
                showErrorMessage('Los campos Número de Lote y Producto son requeridos');
                return;
            }

            showLoading('Guardando formulario...');

            // Save to localStorage as draft
            const draftKey = `batch_draft_${formData.batchNumber || 'new'}`;
            saveToLocalStorage(draftKey, formData);

            this.hasUnsavedChanges = false;
            this.updateSaveButtonState();
            showSuccessMessage('Formulario guardado como borrador');

        } catch (error) {
            showErrorMessage('Error al guardar el formulario');
            console.error('Save form error:', error);
        } finally {
            hideLoading();
        }
    }

    async loadData() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';

        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const content = await readFileAsText(file);
                const data = JSON.parse(content);
                
                this.populateForm(data);
                this.hasUnsavedChanges = true;
                this.updateSaveButtonState();
                showSuccessMessage('Datos cargados exitosamente');
                
            } catch (error) {
                showErrorMessage('Error al cargar el archivo');
                console.error('Load file error:', error);
            }
        };

        fileInput.click();
    }

    async submitRecord() {
        try {
            const validation = this.validateForm();
            if (!validation.isValid) {
                showErrorMessage('Complete todos los campos requeridos: ' + validation.errors.join(', '));
                return;
            }

            const formData = this.collectFormData();
            
            const confirmed = confirm(`¿Está seguro de que desea enviar el registro del lote ${formData.batchNumber}?`);
            if (!confirmed) return;

            showLoading('Enviando registro...');

            await api.createRecord(formData);
            
            this.hasUnsavedChanges = false;
            this.updateSaveButtonState();
            showSuccessMessage('Registro creado exitosamente');
            
            // Clear form and go back to records list
            setTimeout(() => {
                this.clearAll();
                showRecordsList();
            }, 2000);

        } catch (error) {
            showErrorMessage('Error al crear el registro');
            console.error('Submit record error:', error);
        } finally {
            hideLoading();
        }
    }

    printForm() {
        printElement('batch-form-container');
    }

    clearAll() {
        const confirmed = confirm('¿Está seguro de que desea limpiar todos los campos?');
        if (!confirmed) return;

        const form = document.getElementById('batch-record-form');
        resetForm(form);
        
        this.currentFormData = {};
        this.hasUnsavedChanges = false;
        this.updateSaveButtonState();
        this.initializeFormDefaults();
        
        showInfoMessage('Formulario limpiado');
    }

    autoSave() {
        if (!this.hasUnsavedChanges) return;

        try {
            const formData = this.collectFormData();
            if (formData.batchNumber) {
                const autoSaveKey = `batch_autosave_${formData.batchNumber}`;
                saveToLocalStorage(autoSaveKey, {
                    ...formData,
                    autoSaveTime: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }

    initializeFormDefaults() {
        // Set current date
        const today = new Date().toISOString().split('T')[0];
        const dateFields = document.querySelectorAll('input[type="date"]');
        dateFields.forEach(field => {
            if (!field.value) {
                field.value = today;
            }
        });
    }

    initializeNewRecord() {
        this.clearAll();
        this.showTab(0); // Show first tab
    }

    updateSaveButtonState() {
        const saveBtn = document.getElementById('save-btn');
        const submitBtn = document.getElementById('submit-btn');
        
        if (saveBtn) {
            saveBtn.classList.toggle('btn-warning', this.hasUnsavedChanges);
            saveBtn.classList.toggle('btn-primary', !this.hasUnsavedChanges);
        }
        
        if (submitBtn) {
            submitBtn.disabled = !this.hasUnsavedChanges;
        }
    }

    hasUnsavedChanges() {
        return this.hasUnsavedChanges;
    }
}

// Create global form handler instance
const formHandler = new FormHandler();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormHandler, formHandler };
}