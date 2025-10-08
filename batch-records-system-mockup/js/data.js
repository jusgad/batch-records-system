// Mock data for the Batch Records System

const mockData = {
    // Products with formulations
    products: [
        {
            id: 1,
            code: 'PROD-001',
            name: 'Crema Hidratante Baba de Caracol',
            presentation: '850 ML',
            unit: 'KG',
            formulation: [
                { id: 1, raw_material: 'Extracto de baba de caracol', code: 'MP-001', percentage: 10, unit: 'KG' },
                { id: 2, raw_material: 'Glicerina USP', code: 'MP-002', percentage: 15, unit: 'KG' },
                { id: 3, raw_material: 'Agua desionizada', code: 'MP-003', percentage: 60, unit: 'L' },
                { id: 4, raw_material: 'Conservador Germall', code: 'MP-004', percentage: 1, unit: 'KG' },
                { id: 5, raw_material: 'Fragancia natural', code: 'MP-005', percentage: 2, unit: 'L' },
                { id: 6, raw_material: 'Colorante natural', code: 'MP-006', percentage: 0.5, unit: 'KG' },
                { id: 7, raw_material: 'Espesante Carbopol', code: 'MP-007', percentage: 3, unit: 'KG' },
                { id: 8, raw_material: 'Emulsificante Polawax', code: 'MP-008', percentage: 8.5, unit: 'KG' }
            ]
        },
        {
            id: 2,
            code: 'PROD-002',
            name: 'Shampoo Anticaída',
            presentation: '500 ML',
            unit: 'KG',
            formulation: [
                { id: 1, raw_material: 'Agua desionizada', code: 'MP-003', percentage: 70, unit: 'L' },
                { id: 2, raw_material: 'Lauril Sulfato de Sodio', code: 'MP-009', percentage: 12, unit: 'KG' },
                { id: 3, raw_material: 'Glicerina USP', code: 'MP-002', percentage: 5, unit: 'KG' },
                { id: 4, raw_material: 'Conservador Germall', code: 'MP-004', percentage: 1, unit: 'KG' },
                { id: 5, raw_material: 'Fragancia natural', code: 'MP-005', percentage: 2, unit: 'L' },
                { id: 6, raw_material: 'Extracto de baba de caracol', code: 'MP-001', percentage: 5, unit: 'KG' },
                { id: 7, raw_material: 'Espesante Carbopol', code: 'MP-007', percentage: 2, unit: 'KG' },
                { id: 8, raw_material: 'Emulsificante Polawax', code: 'MP-008', percentage: 2, unit: 'KG' },
                { id: 9, raw_material: 'Colorante natural', code: 'MP-006', percentage: 0.5, unit: 'KG' }
            ]
        },
        {
            id: 3,
            code: 'PROD-003',
            name: 'Gel Antibacterial',
            presentation: '250 ML',
            unit: 'L',
            formulation: [
                { id: 1, raw_material: 'Alcohol Etílico 70%', code: 'MP-010', percentage: 70, unit: 'L' },
                { id: 2, raw_material: 'Glicerina USP', code: 'MP-002', percentage: 2, unit: 'KG' },
                { id: 3, raw_material: 'Agua desionizada', code: 'MP-003', percentage: 25, unit: 'L' },
                { id: 4, raw_material: 'Espesante Carbopol', code: 'MP-007', percentage: 1.5, unit: 'KG' },
                { id: 5, raw_material: 'Fragancia natural', code: 'MP-005', percentage: 1, unit: 'L' },
                { id: 6, raw_material: 'Colorante natural', code: 'MP-006', percentage: 0.3, unit: 'KG' }
            ]
        }
    ],

    // Raw materials inventory
    rawMaterials: [
        { id: 1, code: 'MP-001', name: 'Extracto de baba de caracol', stock: 50, unit: 'KG', min_stock: 20, price: 45.00, supplier: 'Proveedor A' },
        { id: 2, code: 'MP-002', name: 'Glicerina USP', stock: 100, unit: 'KG', min_stock: 30, price: 12.50, supplier: 'Proveedor B' },
        { id: 3, code: 'MP-003', name: 'Agua desionizada', stock: 500, unit: 'L', min_stock: 100, price: 2.00, supplier: 'Proveedor C' },
        { id: 4, code: 'MP-004', name: 'Conservador Germall', stock: 25, unit: 'KG', min_stock: 10, price: 35.00, supplier: 'Proveedor D' },
        { id: 5, code: 'MP-005', name: 'Fragancia natural', stock: 15, unit: 'L', min_stock: 8, price: 85.00, supplier: 'Proveedor E' },
        { id: 6, code: 'MP-006', name: 'Colorante natural', stock: 10, unit: 'KG', min_stock: 5, price: 25.00, supplier: 'Proveedor F' },
        { id: 7, code: 'MP-007', name: 'Espesante Carbopol', stock: 30, unit: 'KG', min_stock: 15, price: 40.00, supplier: 'Proveedor G' },
        { id: 8, code: 'MP-008', name: 'Emulsificante Polawax', stock: 45, unit: 'KG', min_stock: 20, price: 28.00, supplier: 'Proveedor H' },
        { id: 9, code: 'MP-009', name: 'Lauril Sulfato de Sodio', stock: 80, unit: 'KG', min_stock: 30, price: 15.00, supplier: 'Proveedor I' },
        { id: 10, code: 'MP-010', name: 'Alcohol Etílico 70%', stock: 200, unit: 'L', min_stock: 50, price: 8.00, supplier: 'Proveedor J' }
    ],

    // Packaging materials
    packagingMaterials: [
        { id: 1, code: 'PKG-001', name: 'Frasco 850ML PET', stock: 5000, unit: 'unid', min_stock: 1000 },
        { id: 2, code: 'PKG-002', name: 'Tapa rosca blanca', stock: 5000, unit: 'unid', min_stock: 1000 },
        { id: 3, code: 'PKG-003', name: 'Etiqueta delantera', stock: 10000, unit: 'unid', min_stock: 2000 },
        { id: 4, code: 'PKG-004', name: 'Etiqueta trasera', stock: 10000, unit: 'unid', min_stock: 2000 },
        { id: 5, code: 'PKG-005', name: 'Bolsa termoencogible', stock: 8000, unit: 'unid', min_stock: 1500 },
        { id: 6, code: 'PKG-006', name: 'Caja cartón x 24 unid', stock: 300, unit: 'cajas', min_stock: 50 }
    ],

    // Batch records
    batchRecords: [
        {
            id: 1,
            batch_number: 'LOTE-2025-001',
            product_id: 1,
            product_name: 'Crema Hidratante Baba de Caracol',
            quantity: 1000,
            unit: 'KG',
            status: 'approved',
            date: '2025-10-05',
            operator: 'Juan Pérez',
            verificator: 'María González'
        },
        {
            id: 2,
            batch_number: 'LOTE-2025-002',
            product_id: 2,
            product_name: 'Shampoo Anticaída',
            quantity: 500,
            unit: 'KG',
            status: 'approved',
            date: '2025-10-04',
            operator: 'Carlos Ruiz',
            verificator: 'María González'
        },
        {
            id: 3,
            batch_number: 'LOTE-2025-003',
            product_id: 3,
            product_name: 'Gel Antibacterial',
            quantity: 800,
            unit: 'L',
            status: 'pending',
            date: '2025-10-06',
            operator: 'Ana Martínez',
            verificator: null
        },
        {
            id: 4,
            batch_number: 'LOTE-2025-004',
            product_id: 1,
            product_name: 'Crema Hidratante Baba de Caracol',
            quantity: 1500,
            unit: 'KG',
            status: 'pending',
            date: '2025-10-07',
            operator: 'Juan Pérez',
            verificator: null
        },
        {
            id: 5,
            batch_number: 'LOTE-2025-005',
            product_id: 2,
            product_name: 'Shampoo Anticaída',
            quantity: 750,
            unit: 'KG',
            status: 'in_progress',
            date: '2025-10-08',
            operator: 'Carlos Ruiz',
            verificator: null
        }
    ],

    // Users
    users: [
        { username: 'admin', password: 'admin123', role: 'admin', fullName: 'Administrador Sistema', email: 'admin@example.com' },
        { username: 'operator1', password: 'operator123', role: 'operator', fullName: 'Juan Pérez', email: 'juan@example.com' },
        { username: 'operator2', password: 'operator123', role: 'operator', fullName: 'Carlos Ruiz', email: 'carlos@example.com' },
        { username: 'verificator1', password: 'verif123', role: 'verificator', fullName: 'María González', email: 'maria@example.com' }
    ],

    // Current user (set after login)
    currentUser: null
};

// Helper functions
const dataHelpers = {
    // Get product by id
    getProductById(id) {
        return mockData.products.find(p => p.id === parseInt(id));
    },

    // Get raw material by code
    getRawMaterialByCode(code) {
        return mockData.rawMaterials.find(rm => rm.code === code);
    },

    // Calculate formulation
    calculateFormulation(productId, quantity) {
        const product = this.getProductById(productId);
        if (!product) return null;

        const formulation = product.formulation.map(item => {
            const theoreticalQuantity = (quantity * item.percentage) / 100;
            return {
                ...item,
                theoretical_quantity: theoreticalQuantity,
                real_quantity: 0,
                lot_number: '',
                dispensed_by: ''
            };
        });

        return {
            product,
            formulation,
            total_percentage: product.formulation.reduce((sum, item) => sum + item.percentage, 0),
            total_theoretical: quantity
        };
    },

    // Calculate packaging materials
    calculatePackaging(units) {
        return [
            { material: 'Frasco 850ML PET', code: 'PKG-001', required: units, used: 0, lot: '' },
            { material: 'Tapa rosca blanca', code: 'PKG-002', required: units, used: 0, lot: '' },
            { material: 'Etiqueta delantera', code: 'PKG-003', required: units, used: 0, lot: '' },
            { material: 'Etiqueta trasera', code: 'PKG-004', required: units, used: 0, lot: '' },
            { material: 'Bolsa termoencogible', code: 'PKG-005', required: units, used: 0, lot: '' },
            { material: 'Caja cartón x 24 unid', code: 'PKG-006', required: Math.ceil(units / 24), used: 0, lot: '' }
        ];
    },

    // Calculate hours worked
    calculateHours(startTime, endTime) {
        if (!startTime || !endTime) return '';

        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        const diffMs = end - start;
        const hours = diffMs / (1000 * 60 * 60);

        return hours > 0 ? hours.toFixed(2) : '';
    },

    // Get batch records with filtering
    getBatchRecords(filter = {}) {
        let records = [...mockData.batchRecords];

        if (filter.status) {
            records = records.filter(r => r.status === filter.status);
        }

        if (filter.product_id) {
            records = records.filter(r => r.product_id === parseInt(filter.product_id));
        }

        return records.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    // Get low stock alerts
    getLowStockAlerts() {
        return mockData.rawMaterials
            .filter(rm => rm.stock <= rm.min_stock)
            .map(rm => ({
                ...rm,
                severity: rm.stock < rm.min_stock * 0.5 ? 'danger' : 'warning'
            }));
    },

    // Get dashboard stats
    getDashboardStats() {
        const total = mockData.batchRecords.length;
        const approved = mockData.batchRecords.filter(r => r.status === 'approved').length;
        const pending = mockData.batchRecords.filter(r => r.status === 'pending').length;
        const alerts = this.getLowStockAlerts().length;

        return { total, approved, pending, alerts };
    },

    // Add new batch record
    addBatchRecord(record) {
        const newRecord = {
            id: mockData.batchRecords.length + 1,
            ...record,
            status: 'in_progress'
        };
        mockData.batchRecords.unshift(newRecord);
        return newRecord;
    },

    // Update stock
    updateStock(code, quantity, type = 'subtract') {
        const material = mockData.rawMaterials.find(rm => rm.code === code);
        if (material) {
            if (type === 'subtract') {
                material.stock -= quantity;
            } else {
                material.stock += quantity;
            }
        }
    },

    // Format date
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Format currency
    formatCurrency(amount) {
        return `$${amount.toFixed(2)}`;
    }
};

// Export for use in app.js
if (typeof window !== 'undefined') {
    window.mockData = mockData;
    window.dataHelpers = dataHelpers;
}
