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