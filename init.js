#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

console.log('🚀 Initializing Batch Records System...\n');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('✅ Created database directory');
}

// Create database and initialize schema
const dbPath = path.join(dbDir, 'batch_records.db');
const schemaPath = path.join(dbDir, 'schema.sql');

if (fs.existsSync(schemaPath)) {
    const db = new sqlite3.Database(dbPath);
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    db.exec(schema, (err) => {
        if (err) {
            console.error('❌ Error initializing database:', err.message);
        } else {
            console.log('✅ Database initialized successfully');
            console.log(`📍 Database location: ${dbPath}`);
        }
        
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            } else {
                console.log('\n🎉 System initialization complete!');
                console.log('\n📋 Next steps:');
                console.log('1. cd backend');
                console.log('2. npm install');
                console.log('3. npm start');
                console.log('\n🌐 Then open: http://localhost:3000');
                console.log('\n🔑 Default credentials:');
                console.log('   Username: admin');
                console.log('   Password: admin123');
                console.log('\n⚠️  Please change the default password immediately!\n');
            }
        });
    });
} else {
    console.error('❌ Schema file not found:', schemaPath);
    process.exit(1);
}