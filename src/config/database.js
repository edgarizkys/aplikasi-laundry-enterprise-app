const { createClient } = require('@libsql/client');

const tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL || 'libsql://edgartech-db-edgarizkys.turso.io',
    authToken: process.env.TURSO_AUTH_TOKEN || ''
});

async function initializeDatabase() {
    try {
        await tursoClient.execute(`CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT DEFAULT 'default', judul TEXT NOT NULL, kategori TEXT NOT NULL, nilai REAL NOT NULL, status TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        console.log('[DB] Table data (Multi-Tenant) ready');
        await tursoClient.execute(`CREATE TABLE IF NOT EXISTS transaksi (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT DEFAULT 'default', invoice TEXT NOT NULL, deskripsi TEXT NOT NULL, total REAL NOT NULL, metode TEXT NOT NULL, status TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        console.log('[DB] Table transaksi (Multi-Tenant) ready');
    } catch(e) { console.log('DB Notice:', e.message); }
}

module.exports = { tursoClient, initializeDatabase };