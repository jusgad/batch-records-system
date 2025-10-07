-- Batch Records System Database Schema
-- Supporting user management, roles, digital signatures, and audit trails

-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operator', 'verificador')),
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP NULL
);

-- Digital signatures table
CREATE TABLE digital_signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    public_key TEXT NOT NULL,
    private_key_encrypted TEXT NOT NULL,
    key_algorithm VARCHAR(50) DEFAULT 'RSA-2048',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Batch records table
CREATE TABLE records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operator_id INTEGER NOT NULL,
    verificador_id INTEGER NULL,
    batch_number VARCHAR(50) NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    quantity VARCHAR(50),
    production_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'signed', 'verified', 'approved', 'rejected')),
    form_data TEXT NOT NULL, -- JSON data containing all form fields
    data_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of form_data for integrity
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    signed_at TIMESTAMP NULL,
    verified_at TIMESTAMP NULL,
    FOREIGN KEY (operator_id) REFERENCES users(id),
    FOREIGN KEY (verificador_id) REFERENCES users(id),
    UNIQUE(batch_number)
);

-- Digital record signatures table
CREATE TABLE record_signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    signature_data TEXT NOT NULL, -- Base64 encoded signature
    signature_type VARCHAR(20) NOT NULL CHECK (signature_type IN ('operator_sign', 'verificador_sign')),
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_valid BOOLEAN DEFAULT 1,
    FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Audit trail table
CREATE TABLE audit_trail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    record_id INTEGER,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'sign', 'verify', 'approve', 'reject', 'login', 'logout'
    details TEXT, -- JSON with additional details
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (record_id) REFERENCES records(id)
);

-- Sessions table for session management
CREATE TABLE user_sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- System settings table
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_records_operator ON records(operator_id);
CREATE INDEX idx_records_verificador ON records(verificador_id);
CREATE INDEX idx_records_status ON records(status);
CREATE INDEX idx_records_batch_number ON records(batch_number);
CREATE INDEX idx_audit_user ON audit_trail(user_id);
CREATE INDEX idx_audit_record ON audit_trail(record_id);
CREATE INDEX idx_audit_created ON audit_trail(created_at);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Products table
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    presentation VARCHAR(50),
    description TEXT,
    unit VARCHAR(20) NOT NULL, -- KG, L, UNIDADES
    is_active BOOLEAN DEFAULT 1,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Raw materials table
CREATE TABLE raw_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- KG, L, G, ML, UNIDAD
    stock DECIMAL(10,2) DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 0,
    max_stock DECIMAL(10,2) DEFAULT 0,
    unit_price DECIMAL(10,2) DEFAULT 0,
    supplier VARCHAR(100),
    is_active BOOLEAN DEFAULT 1,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Product formulation table (recipe)
CREATE TABLE product_formulation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    raw_material_id INTEGER NOT NULL,
    item_number INTEGER NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id),
    UNIQUE(product_id, raw_material_id)
);

-- Packaging materials table
CREATE TABLE packaging_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50), -- FRASCO, TAPA, ETIQUETA, BOLSA, CAJA
    stock INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batch record formulation (actual production data)
CREATE TABLE batch_formulation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL,
    raw_material_id INTEGER NOT NULL,
    item_number INTEGER NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    theoretical_quantity DECIMAL(10,3) NOT NULL,
    actual_quantity DECIMAL(10,3),
    lot_number VARCHAR(50),
    dispensed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id)
);

-- Batch packaging data
CREATE TABLE batch_packaging (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL,
    packaging_material_id INTEGER NOT NULL,
    theoretical_quantity DECIMAL(10,2) NOT NULL,
    actual_quantity DECIMAL(10,2),
    lot_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
    FOREIGN KEY (packaging_material_id) REFERENCES packaging_materials(id)
);

-- Quality control data
CREATE TABLE batch_quality_control (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL,
    control_type VARCHAR(50) NOT NULL, -- PESO, PH, VISCOSIDAD, DENSIDAD
    sample_number INTEGER,
    value DECIMAL(10,3),
    unit VARCHAR(20),
    status VARCHAR(20), -- CONFORME, NO_CONFORME, NA
    notes TEXT,
    tested_by INTEGER,
    tested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
    FOREIGN KEY (tested_by) REFERENCES users(id)
);

-- Production time tracking
CREATE TABLE batch_production_time (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL,
    operation VARCHAR(100) NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    units_produced INTEGER,
    hours_worked DECIMAL(5,2),
    operator_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id)
);

-- Stock movements
CREATE TABLE stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_type VARCHAR(20) NOT NULL, -- RAW_MATERIAL, PACKAGING, PRODUCT
    material_id INTEGER NOT NULL,
    movement_type VARCHAR(20) NOT NULL, -- IN, OUT, ADJUSTMENT
    quantity DECIMAL(10,2) NOT NULL,
    reference_type VARCHAR(50), -- BATCH_RECORD, PURCHASE, ADJUSTMENT
    reference_id INTEGER,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Notifications table
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type VARCHAR(50) NOT NULL, -- LOW_STOCK, APPROVAL_NEEDED, SYSTEM
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Additional indexes for performance
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_raw_materials_code ON raw_materials(code);
CREATE INDEX idx_formulation_product ON product_formulation(product_id);
CREATE INDEX idx_batch_formulation_record ON batch_formulation(record_id);
CREATE INDEX idx_quality_control_record ON batch_quality_control(record_id);
CREATE INDEX idx_production_time_record ON batch_production_time(record_id);
CREATE INDEX idx_stock_movements_material ON stock_movements(material_type, material_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- Initial system settings
INSERT INTO system_settings (key, value, description) VALUES
('system_name', 'Batch Records System', 'Application name'),
('version', '2.0.0', 'System version'),
('session_timeout', '28800', 'Session timeout in seconds (8 hours)'),
('max_login_attempts', '5', 'Maximum failed login attempts before lockout'),
('lockout_duration', '900', 'Account lockout duration in seconds (15 minutes)'),
('signature_key_size', '2048', 'RSA key size for digital signatures'),
('audit_retention_days', '365', 'Number of days to retain audit trail records'),
('low_stock_threshold', '20', 'Percentage threshold for low stock alerts'),
('packaging_box_factor', '0.02', 'Box calculation factor (1 box per 50 units)');

-- Create default admin user (password: admin123 - should be changed immediately)
INSERT INTO users (username, email, password_hash, role, full_name) VALUES
('admin', 'admin@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewlvjFZfq/x5Rn3e', 'admin', 'System Administrator');

-- Insert sample raw materials
INSERT INTO raw_materials (code, name, unit, stock, min_stock, unit_price, supplier) VALUES
('MP-001', 'EXTRACTO DE BABA DE CARACOL', 'KG', 50, 10, 45.00, 'BioActivos S.A.'),
('MP-002', 'GLICERINA USP', 'KG', 100, 20, 12.50, 'QuimiPharma'),
('MP-003', 'AGUA DESIONIZADA', 'L', 500, 100, 2.00, 'Aqua Industrial'),
('MP-004', 'CONSERVADOR GERMALL', 'KG', 25, 5, 35.00, 'Preservantes SA'),
('MP-005', 'FRAGANCIA NATURAL', 'L', 15, 3, 85.00, 'Aromas del Valle'),
('MP-006', 'COLORANTE NATURAL', 'KG', 10, 2, 25.00, 'ColorNat'),
('MP-007', 'ESPESANTE CARBOPOL', 'KG', 30, 8, 40.00, 'Texturantes Pro'),
('MP-008', 'EMULSIFICANTE POLAWAX', 'KG', 45, 10, 28.00, 'EmulsiTech'),
('MP-009', 'LAURIL SULFATO DE SODIO', 'KG', 80, 15, 15.00, 'Surfactantes Ltda'),
('MP-010', 'ALCOHOL ETILICO 70%', 'L', 200, 50, 8.00, 'Alcoholes Industriales');

-- Insert sample products
INSERT INTO products (code, name, presentation, unit) VALUES
('PROD-001', 'CREMA HIDRATANTE BABA DE CARACOL', '850 ML', 'KG'),
('PROD-002', 'SHAMPOO ANTICAIDA', '500 ML', 'KG'),
('PROD-003', 'GEL ANTIBACTERIAL', '250 ML', 'L');

-- Insert formulations for Crema Hidratante
INSERT INTO product_formulation (product_id, raw_material_id, item_number, percentage) VALUES
(1, 1, 1, 10.0),  -- Extracto de caracol 10%
(1, 2, 2, 15.0),  -- Glicerina 15%
(1, 3, 3, 60.0),  -- Agua 60%
(1, 4, 4, 1.0),   -- Conservador 1%
(1, 5, 5, 0.5),   -- Fragancia 0.5%
(1, 6, 6, 0.1),   -- Colorante 0.1%
(1, 7, 7, 3.4),   -- Espesante 3.4%
(1, 8, 8, 10.0);  -- Emulsificante 10%

-- Insert formulations for Shampoo
INSERT INTO product_formulation (product_id, raw_material_id, item_number, percentage) VALUES
(2, 9, 1, 15.0),  -- Lauril Sulfato 15%
(2, 3, 2, 70.0),  -- Agua 70%
(2, 2, 3, 5.0),   -- Glicerina 5%
(2, 4, 4, 1.0),   -- Conservador 1%
(2, 5, 5, 1.0),   -- Fragancia 1%
(2, 6, 6, 0.1),   -- Colorante 0.1%
(2, 7, 7, 2.9),   -- Espesante 2.9%
(2, 8, 8, 5.0);   -- Emulsificante 5%

-- Insert formulations for Gel Antibacterial
INSERT INTO product_formulation (product_id, raw_material_id, item_number, percentage) VALUES
(3, 10, 1, 70.0), -- Alcohol 70%
(3, 3, 2, 25.0),  -- Agua 25%
(3, 7, 3, 2.0),   -- Espesante 2%
(3, 2, 4, 2.0),   -- Glicerina 2%
(3, 5, 5, 0.5),   -- Fragancia 0.5%
(3, 6, 6, 0.1),   -- Colorante 0.1%
(3, 4, 7, 0.4);   -- Conservador 0.4%

-- Insert packaging materials
INSERT INTO packaging_materials (code, name, type, stock, unit_price) VALUES
('PKG-001', 'FRASCO 850ML PET', 'FRASCO', 5000, 0.85),
('PKG-002', 'TAPA ROSCA BLANCA', 'TAPA', 5000, 0.15),
('PKG-003', 'ETIQUETA DELANTERA', 'ETIQUETA', 10000, 0.10),
('PKG-004', 'ETIQUETA TRASERA', 'ETIQUETA', 10000, 0.10),
('PKG-005', 'BOLSA TERMOENCOGIBLE', 'BOLSA', 8000, 0.05),
('PKG-006', 'CAJA CARTON X 24 UNID', 'CAJA', 300, 1.50);