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

-- Initial system settings
INSERT INTO system_settings (key, value, description) VALUES 
('system_name', 'Batch Records System', 'Application name'),
('version', '1.0.0', 'System version'),
('session_timeout', '28800', 'Session timeout in seconds (8 hours)'),
('max_login_attempts', '5', 'Maximum failed login attempts before lockout'),
('lockout_duration', '900', 'Account lockout duration in seconds (15 minutes)'),
('signature_key_size', '2048', 'RSA key size for digital signatures'),
('audit_retention_days', '365', 'Number of days to retain audit trail records');

-- Create default admin user (password: admin123 - should be changed immediately)
INSERT INTO users (username, email, password_hash, role, full_name) VALUES 
('admin', 'admin@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewlvjFZfq/x5Rn3e', 'admin', 'System Administrator');