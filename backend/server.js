const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');

// Database connection
const db = new sqlite3.Database('./database/batch_records.db');

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    }
}));

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    store: new SQLiteStore({
        db: 'sessions.db',
        dir: './database'
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
    }
}));

// Rate limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Role authorization middleware
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

// Audit logging function
const logAudit = (userId, recordId, action, details, req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    db.run(
        'INSERT INTO audit_trail (user_id, record_id, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, recordId, action, JSON.stringify(details), ip, userAgent],
        (err) => {
            if (err) console.error('Audit log error:', err);
        }
    );
};

// Digital signature utilities
class DigitalSignature {
    static generateKeyPair() {
        return crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
    }

    static signData(data, privateKey) {
        const sign = crypto.createSign('SHA256');
        sign.update(data);
        return sign.sign(privateKey, 'base64');
    }

    static verifySignature(data, signature, publicKey) {
        try {
            const verify = crypto.createVerify('SHA256');
            verify.update(data);
            return verify.verify(publicKey, signature, 'base64');
        } catch (error) {
            return false;
        }
    }

    static hashData(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

// Initialize database
const initDatabase = () => {
    const fs = require('fs');
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema, (err) => {
            if (err) {
                console.error('Database initialization error:', err);
            } else {
                console.log('Database initialized successfully');
            }
        });
    }
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication routes
app.post('/api/auth/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    db.get(
        'SELECT * FROM users WHERE username = ? AND is_active = 1',
        [username],
        async (err, user) => {
            if (err) {
                logAudit(null, null, 'login_error', { username, error: err.message }, req);
                return res.status(500).json({ error: 'Server error' });
            }

            if (!user) {
                logAudit(null, null, 'login_failed', { username, reason: 'user_not_found' }, req);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check if account is locked
            if (user.locked_until && new Date(user.locked_until) > new Date()) {
                logAudit(user.id, null, 'login_blocked', { reason: 'account_locked' }, req);
                return res.status(401).json({ error: 'Account is temporarily locked' });
            }

            const isValidPassword = await bcrypt.compare(password, user.password_hash);

            if (!isValidPassword) {
                // Increment failed attempts
                const newFailedAttempts = user.failed_login_attempts + 1;
                let lockUntil = null;

                if (newFailedAttempts >= 5) {
                    lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
                }

                db.run(
                    'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
                    [newFailedAttempts, lockUntil, user.id]
                );

                logAudit(user.id, null, 'login_failed', { reason: 'invalid_password', attempts: newFailedAttempts }, req);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Reset failed attempts on successful login
            db.run(
                'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [user.id]
            );

            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username, 
                    role: user.role,
                    fullName: user.full_name 
                },
                JWT_SECRET,
                { expiresIn: '8h' }
            );

            // Create session record
            const sessionId = crypto.randomBytes(32).toString('hex');
            db.run(
                'INSERT INTO user_sessions (id, user_id, expires_at, ip_address, user_agent) VALUES (?, ?, datetime("now", "+8 hours"), ?, ?)',
                [sessionId, user.id, req.ip, req.get('User-Agent')]
            );

            logAudit(user.id, null, 'login_success', { sessionId }, req);

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    fullName: user.full_name,
                    email: user.email
                }
            });
        }
    );
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
    const token = req.headers['authorization'].split(' ')[1];
    
    // In a production system, you'd want to maintain a token blacklist
    // For now, we'll just log the logout
    logAudit(req.user.id, null, 'logout', { token_prefix: token.substring(0, 10) }, req);
    
    res.json({ message: 'Logout successful' });
});

// User management routes (Admin only)
app.get('/api/users', authenticateToken, authorizeRole(['admin']), (req, res) => {
    db.all(
        'SELECT id, username, email, role, full_name, created_at, is_active, last_login FROM users ORDER BY created_at DESC',
        (err, users) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }
            res.json(users);
        }
    );
});

app.post('/api/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { username, email, password, role, fullName } = req.body;

    if (!username || !email || !password || !role || !fullName) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['admin', 'operator', 'verificador'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 12);

        db.run(
            'INSERT INTO users (username, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, role, fullName],
            function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                        return res.status(409).json({ error: 'Username or email already exists' });
                    }
                    return res.status(500).json({ error: 'Server error' });
                }

                // Generate digital signature keys for the new user
                const { publicKey, privateKey } = DigitalSignature.generateKeyPair();
                const encryptedPrivateKey = crypto.createCipher('aes-256-cbc', password).update(privateKey, 'utf8', 'hex');

                db.run(
                    'INSERT INTO digital_signatures (user_id, public_key, private_key_encrypted) VALUES (?, ?, ?)',
                    [this.lastID, publicKey, encryptedPrivateKey]
                );

                logAudit(req.user.id, null, 'user_created', { newUserId: this.lastID, username, role }, req);

                res.status(201).json({
                    id: this.lastID,
                    username,
                    email,
                    role,
                    fullName
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Record routes
app.get('/api/records', authenticateToken, (req, res) => {
    let query, params;

    if (req.user.role === 'admin' || req.user.role === 'verificador') {
        // Admin and Verificador can see all records
        query = `
            SELECT r.*, u1.full_name as operator_name, u2.full_name as verificador_name
            FROM records r
            LEFT JOIN users u1 ON r.operator_id = u1.id
            LEFT JOIN users u2 ON r.verificador_id = u2.id
            ORDER BY r.created_at DESC
        `;
        params = [];
    } else {
        // Operators can only see their own records
        query = `
            SELECT r.*, u1.full_name as operator_name, u2.full_name as verificador_name
            FROM records r
            LEFT JOIN users u1 ON r.operator_id = u1.id
            LEFT JOIN users u2 ON r.verificador_id = u2.id
            WHERE r.operator_id = ?
            ORDER BY r.created_at DESC
        `;
        params = [req.user.id];
    }

    db.all(query, params, (err, records) => {
        if (err) {
            return res.status(500).json({ error: 'Server error' });
        }

        // Parse form_data JSON for each record
        const parsedRecords = records.map(record => ({
            ...record,
            form_data: JSON.parse(record.form_data)
        }));

        res.json(parsedRecords);
    });
});

app.post('/api/records', authenticateToken, authorizeRole(['operator']), (req, res) => {
    const { batchNumber, productName, quantity, productionDate, formData } = req.body;

    if (!batchNumber || !productName || !formData) {
        return res.status(400).json({ error: 'Batch number, product name, and form data are required' });
    }

    const formDataJson = JSON.stringify(formData);
    const dataHash = DigitalSignature.hashData(formDataJson);

    db.run(
        'INSERT INTO records (operator_id, batch_number, product_name, quantity, production_date, form_data, data_hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, batchNumber, productName, quantity, productionDate, formDataJson, dataHash],
        function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    return res.status(409).json({ error: 'Batch number already exists' });
                }
                return res.status(500).json({ error: 'Server error' });
            }

            logAudit(req.user.id, this.lastID, 'record_created', { batchNumber, productName }, req);

            res.status(201).json({
                id: this.lastID,
                batchNumber,
                productName,
                quantity,
                productionDate,
                status: 'draft'
            });
        }
    );
});

// Sign a record (Operator only)
app.post('/api/records/:id/sign', authenticateToken, authorizeRole(['operator']), (req, res) => {
    const recordId = req.params.id;

    // First, verify the record belongs to the operator and is in draft status
    db.get(
        'SELECT * FROM records WHERE id = ? AND operator_id = ? AND status = "draft"',
        [recordId, req.user.id],
        (err, record) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }

            if (!record) {
                return res.status(404).json({ error: 'Record not found or cannot be signed' });
            }

            // Get user's private key for signing
            db.get(
                'SELECT private_key_encrypted FROM digital_signatures WHERE user_id = ? AND is_active = 1',
                [req.user.id],
                (err, signature) => {
                    if (err || !signature) {
                        return res.status(500).json({ error: 'Signature key not found' });
                    }

                    try {
                        // In a real implementation, you'd decrypt the private key with the user's password
                        // For this demo, we'll simulate the signing process
                        const signatureData = DigitalSignature.signData(record.form_data, signature.private_key_encrypted);

                        // Store the signature
                        db.run(
                            'INSERT INTO record_signatures (record_id, user_id, signature_data, signature_type) VALUES (?, ?, ?, "operator_sign")',
                            [recordId, req.user.id, signatureData]
                        );

                        // Update record status
                        db.run(
                            'UPDATE records SET status = "signed", signed_at = CURRENT_TIMESTAMP WHERE id = ?',
                            [recordId]
                        );

                        logAudit(req.user.id, recordId, 'record_signed', { signatureType: 'operator_sign' }, req);

                        res.json({ message: 'Record signed successfully' });
                    } catch (error) {
                        res.status(500).json({ error: 'Signing failed' });
                    }
                }
            );
        }
    );
});

// Verify a record (Verificador only)
app.post('/api/records/:id/verify', authenticateToken, authorizeRole(['verificador']), (req, res) => {
    const recordId = req.params.id;
    const { approved } = req.body;

    db.get(
        'SELECT * FROM records WHERE id = ? AND status = "signed"',
        [recordId],
        (err, record) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }

            if (!record) {
                return res.status(404).json({ error: 'Record not found or not ready for verification' });
            }

            const newStatus = approved ? 'approved' : 'rejected';

            db.run(
                'UPDATE records SET status = ?, verificador_id = ?, verified_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newStatus, req.user.id, recordId],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Server error' });
                    }

                    logAudit(req.user.id, recordId, 'record_verified', { approved, newStatus }, req);

                    res.json({ message: `Record ${approved ? 'approved' : 'rejected'} successfully` });
                }
            );
        }
    );
});

// Products routes
app.get('/api/products', authenticateToken, (req, res) => {
    db.all(
        `SELECT p.*, u.full_name as created_by_name
         FROM products p
         LEFT JOIN users u ON p.created_by = u.id
         WHERE p.is_active = 1
         ORDER BY p.name`,
        (err, products) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }
            res.json(products);
        }
    );
});

app.get('/api/products/:id', authenticateToken, (req, res) => {
    db.get(
        'SELECT * FROM products WHERE id = ? AND is_active = 1',
        [req.params.id],
        (err, product) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            res.json(product);
        }
    );
});

app.get('/api/products/:id/formulation', authenticateToken, (req, res) => {
    db.all(
        `SELECT pf.*, rm.code as rm_code, rm.name as rm_name, rm.unit as rm_unit, rm.stock as rm_stock
         FROM product_formulation pf
         JOIN raw_materials rm ON pf.raw_material_id = rm.id
         WHERE pf.product_id = ?
         ORDER BY pf.item_number`,
        [req.params.id],
        (err, formulation) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }
            res.json(formulation);
        }
    );
});

app.post('/api/products', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const { code, name, presentation, description, unit } = req.body;

    if (!code || !name || !unit) {
        return res.status(400).json({ error: 'Code, name, and unit are required' });
    }

    db.run(
        'INSERT INTO products (code, name, presentation, description, unit, created_by) VALUES (?, ?, ?, ?, ?, ?)',
        [code, name, presentation, description, unit, req.user.id],
        function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({ error: 'Product code already exists' });
                }
                return res.status(500).json({ error: 'Server error' });
            }

            logAudit(req.user.id, null, 'product_created', { productId: this.lastID, code, name }, req);
            res.status(201).json({ id: this.lastID, code, name, presentation, unit });
        }
    );
});

// Raw materials routes
app.get('/api/raw-materials', authenticateToken, (req, res) => {
    db.all(
        'SELECT * FROM raw_materials WHERE is_active = 1 ORDER BY name',
        (err, materials) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }
            res.json(materials);
        }
    );
});

app.post('/api/raw-materials', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const { code, name, unit, stock, min_stock, max_stock, unit_price, supplier } = req.body;

    if (!code || !name || !unit) {
        return res.status(400).json({ error: 'Code, name, and unit are required' });
    }

    db.run(
        'INSERT INTO raw_materials (code, name, unit, stock, min_stock, max_stock, unit_price, supplier, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [code, name, unit, stock || 0, min_stock || 0, max_stock || 0, unit_price || 0, supplier, req.user.id],
        function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({ error: 'Raw material code already exists' });
                }
                return res.status(500).json({ error: 'Server error' });
            }

            logAudit(req.user.id, null, 'raw_material_created', { materialId: this.lastID, code, name }, req);
            res.status(201).json({ id: this.lastID, code, name, unit });
        }
    );
});

// Packaging materials routes
app.get('/api/packaging-materials', authenticateToken, (req, res) => {
    db.all(
        'SELECT * FROM packaging_materials WHERE is_active = 1 ORDER BY type, name',
        (err, materials) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }
            res.json(materials);
        }
    );
});

// Calculate batch materials
app.post('/api/batch/calculate', authenticateToken, authorizeRole(['operator', 'admin']), (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
        return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    // Get product formulation
    db.all(
        `SELECT pf.*, rm.name as rm_name, rm.unit as rm_unit, rm.stock as rm_stock
         FROM product_formulation pf
         JOIN raw_materials rm ON pf.raw_material_id = rm.id
         WHERE pf.product_id = ?
         ORDER BY pf.item_number`,
        [productId],
        (err, formulation) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }

            if (!formulation || formulation.length === 0) {
                return res.status(404).json({ error: 'Product formulation not found' });
            }

            // Calculate theoretical quantities
            const calculations = formulation.map(item => {
                const theoreticalQuantity = (quantity * item.percentage) / 100;
                const stockSufficient = item.rm_stock >= theoreticalQuantity;

                return {
                    item_number: item.item_number,
                    raw_material_id: item.raw_material_id,
                    raw_material_name: item.rm_name,
                    percentage: item.percentage,
                    unit: item.rm_unit,
                    theoretical_quantity: parseFloat(theoreticalQuantity.toFixed(3)),
                    current_stock: item.rm_stock,
                    stock_sufficient: stockSufficient
                };
            });

            // Calculate totals
            const totalPercentage = formulation.reduce((sum, item) => sum + parseFloat(item.percentage), 0);
            const totalTheoretical = calculations.reduce((sum, item) => sum + item.theoretical_quantity, 0);

            res.json({
                product_id: productId,
                quantity_to_produce: quantity,
                formulation: calculations,
                totals: {
                    percentage: parseFloat(totalPercentage.toFixed(2)),
                    theoretical_quantity: parseFloat(totalTheoretical.toFixed(3)),
                    percentage_valid: totalPercentage === 100
                }
            });
        }
    );
});

// Calculate packaging materials
app.post('/api/batch/calculate-packaging', authenticateToken, authorizeRole(['operator', 'admin']), (req, res) => {
    const { units } = req.body;

    if (!units) {
        return res.status(400).json({ error: 'Number of units is required' });
    }

    // Get box factor from settings
    db.get(
        'SELECT value FROM system_settings WHERE key = "packaging_box_factor"',
        (err, setting) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }

            const boxFactor = setting ? parseFloat(setting.value) : 0.02;
            const boxQuantity = units * boxFactor;

            const packaging = {
                units: parseInt(units),
                materials: {
                    bottle: { quantity: units, unit: 'UNIDADES' },
                    cap: { quantity: units, unit: 'UNIDADES' },
                    label_front: { quantity: units, unit: 'UNIDADES' },
                    label_back: { quantity: units, unit: 'UNIDADES' },
                    bag: { quantity: units, unit: 'UNIDADES' },
                    box: { quantity: parseFloat(boxQuantity.toFixed(2)), unit: 'CAJAS' }
                },
                total_items: units * 5 + boxQuantity
            };

            res.json(packaging);
        }
    );
});

// Calculate production time
app.post('/api/batch/calculate-time', authenticateToken, (req, res) => {
    const { startTime, endTime } = req.body;

    if (!startTime || !endTime) {
        return res.status(400).json({ error: 'Start and end times are required' });
    }

    try {
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);

        if (end <= start) {
            return res.status(400).json({ error: 'End time must be after start time' });
        }

        const diffMs = end - start;
        const diffHours = diffMs / (1000 * 60 * 60);

        res.json({
            start_time: startTime,
            end_time: endTime,
            hours_worked: parseFloat(diffHours.toFixed(2)),
            minutes_worked: Math.round((diffHours * 60))
        });
    } catch (error) {
        res.status(400).json({ error: 'Invalid time format' });
    }
});

// Enhanced batch record creation with formulation
app.post('/api/records/complete', authenticateToken, authorizeRole(['operator']), (req, res) => {
    const {
        batchNumber,
        productId,
        productName,
        quantity,
        productionDate,
        formulation,
        packaging,
        qualityControl,
        productionTime
    } = req.body;

    if (!batchNumber || !productId || !productName || !formulation) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const formData = {
        productId,
        productName,
        quantity,
        productionDate,
        formulation,
        packaging,
        qualityControl,
        productionTime
    };

    const formDataJson = JSON.stringify(formData);
    const dataHash = DigitalSignature.hashData(formDataJson);

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Insert main record
        db.run(
            'INSERT INTO records (operator_id, batch_number, product_name, quantity, production_date, form_data, data_hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, batchNumber, productName, quantity, productionDate, formDataJson, dataHash],
            function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                        return res.status(409).json({ error: 'Batch number already exists' });
                    }
                    return res.status(500).json({ error: 'Server error' });
                }

                const recordId = this.lastID;

                // Insert formulation data
                if (formulation && formulation.length > 0) {
                    const stmt = db.prepare(
                        'INSERT INTO batch_formulation (record_id, raw_material_id, item_number, percentage, theoretical_quantity, actual_quantity, lot_number, dispensed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
                    );

                    formulation.forEach(item => {
                        stmt.run([
                            recordId,
                            item.raw_material_id,
                            item.item_number,
                            item.percentage,
                            item.theoretical_quantity,
                            item.actual_quantity || null,
                            item.lot_number || null,
                            item.dispensed_by || null
                        ]);

                        // Update stock if actual quantity is provided
                        if (item.actual_quantity) {
                            db.run(
                                'UPDATE raw_materials SET stock = stock - ? WHERE id = ?',
                                [item.actual_quantity, item.raw_material_id]
                            );

                            // Log stock movement
                            db.run(
                                'INSERT INTO stock_movements (material_type, material_id, movement_type, quantity, reference_type, reference_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
                                ['RAW_MATERIAL', item.raw_material_id, 'OUT', item.actual_quantity, 'BATCH_RECORD', recordId, req.user.id]
                            );
                        }
                    });

                    stmt.finalize();
                }

                db.run('COMMIT', (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to commit transaction' });
                    }

                    logAudit(req.user.id, recordId, 'batch_record_created', { batchNumber, productName }, req);

                    res.status(201).json({
                        id: recordId,
                        batchNumber,
                        productName,
                        status: 'draft'
                    });
                });
            }
        );
    });
});

// Get batch with complete data
app.get('/api/records/:id/complete', authenticateToken, (req, res) => {
    const recordId = req.params.id;

    db.get(
        `SELECT r.*, u1.full_name as operator_name, u2.full_name as verificador_name
         FROM records r
         LEFT JOIN users u1 ON r.operator_id = u1.id
         LEFT JOIN users u2 ON r.verificador_id = u2.id
         WHERE r.id = ?`,
        [recordId],
        (err, record) => {
            if (err || !record) {
                return res.status(404).json({ error: 'Record not found' });
            }

            // Get formulation data
            db.all(
                `SELECT bf.*, rm.name as raw_material_name, rm.unit
                 FROM batch_formulation bf
                 JOIN raw_materials rm ON bf.raw_material_id = rm.id
                 WHERE bf.record_id = ?
                 ORDER BY bf.item_number`,
                [recordId],
                (err, formulation) => {
                    if (err) {
                        return res.status(500).json({ error: 'Server error' });
                    }

                    res.json({
                        ...record,
                        form_data: JSON.parse(record.form_data),
                        formulation: formulation || []
                    });
                }
            );
        }
    );
});

// Notifications routes
app.get('/api/notifications', authenticateToken, (req, res) => {
    db.all(
        'SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 50',
        [req.user.id],
        (err, notifications) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }
            res.json(notifications);
        }
    );
});

app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
    db.run(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }
            res.json({ message: 'Notification marked as read' });
        }
    );
});

// Dashboard statistics
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
    const stats = {};

    db.serialize(() => {
        // Total records
        db.get(
            'SELECT COUNT(*) as total FROM records WHERE operator_id = ?',
            [req.user.id],
            (err, result) => {
                stats.totalRecords = result ? result.total : 0;
            }
        );

        // Pending verification
        db.get(
            'SELECT COUNT(*) as total FROM records WHERE status = "signed"',
            (err, result) => {
                stats.pendingVerification = result ? result.total : 0;
            }
        );

        // Approved records
        db.get(
            'SELECT COUNT(*) as total FROM records WHERE status = "approved"',
            (err, result) => {
                stats.approvedRecords = result ? result.total : 0;
                res.json(stats);
            }
        );
    });
});

// Low stock alerts
app.get('/api/alerts/low-stock', authenticateToken, authorizeRole(['admin', 'operator']), (req, res) => {
    db.all(
        'SELECT * FROM raw_materials WHERE stock <= min_stock AND is_active = 1',
        (err, materials) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }
            res.json(materials);
        }
    );
});

// Serve the frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database and start server
initDatabase();

app.listen(PORT, () => {
    console.log(`Batch Records System server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;