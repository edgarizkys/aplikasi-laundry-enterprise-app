// config/database.js
const { createClient } = require('@libsql/client');

const tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL || 'libsql://your-db.turso.io',
    authToken: process.env.TURSO_AUTH_TOKEN || ''
});

async function initializeDatabase() {
    try {
        // Orders table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                order_id TEXT UNIQUE NOT NULL,
                customer_name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                items TEXT,
                weight_kg REAL,
                service_type TEXT,
                unit_price REAL,
                total_price REAL,
                status TEXT DEFAULT 'pending',
                pickup_date TEXT,
                delivery_date TEXT,
                branch_id TEXT,
                assigned_staff TEXT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Customers table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                customer_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                phone TEXT UNIQUE,
                email TEXT,
                address TEXT,
                city TEXT,
                member_type TEXT DEFAULT 'regular',
                points INTEGER DEFAULT 0,
                total_orders INTEGER DEFAULT 0,
                total_spent REAL DEFAULT 0,
                join_date TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Branches table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS branches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                branch_id TEXT UNIQUE NOT NULL,
                branch_name TEXT NOT NULL,
                address TEXT,
                phone TEXT,
                manager_name TEXT,
                capacity REAL,
                opening_hours TEXT,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Staff table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS staff (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                staff_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                phone TEXT,
                role TEXT,
                branch_id TEXT,
                salary REAL,
                join_date TEXT,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
            )
        `);

        // Services table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                service_id TEXT UNIQUE NOT NULL,
                service_name TEXT NOT NULL,
                description TEXT,
                price_per_kg REAL,
                turnaround_time INTEGER,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Payments table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                payment_id TEXT UNIQUE NOT NULL,
                order_id TEXT NOT NULL,
                amount REAL,
                payment_method TEXT,
                status TEXT DEFAULT 'pending',
                payment_date TEXT,
                reference_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(order_id)
            )
        `);

        // Create indexes for better query performance
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_branches_tenant_id ON branches(tenant_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_staff_tenant_id ON staff(tenant_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_staff_branch_id ON staff(branch_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id)`);

        console.log('[DB] Database initialized successfully');
    } catch(e) {
        console.log('DB Notice:', e.message);
    }
}

async function query(sql, params = []) {
    try {
        const result = await tursoClient.execute({
            sql,
            args: params
        });
        return result;
    } catch(error) {
        console.error('Database query error:', error.message);
        throw error;
    }
}

async function queryOne(sql, params = []) {
    try {
        const result = await tursoClient.execute({
            sql,
            args: params
        });
        return result.rows && result.rows.length > 0 ? result.rows[0] : null;
    } catch(error) {
        console.error('Database query error:', error.message);
        throw error;
    }
}

async function queryAll(sql, params = []) {
    try {
        const result = await tursoClient.execute({
            sql,
            args: params
        });
        return result.rows || [];
    } catch(error) {
        console.error('Database query error:', error.message);
        throw error;
    }
}

async function insert(table, data, tenantId = 'default') {
    try {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(',');
        
        const sql = `INSERT INTO ${table} (tenant_id, ${keys.join(',')}) VALUES ('${tenantId}', ${placeholders})`;
        
        const result = await tursoClient.execute({
            sql,
            args: values
        });
        
        return result;
    } catch(error) {
        console.error('Insert error:', error.message);
        throw error;
    }
}

async function update(table, data, whereClause, params = [], tenantId = 'default') {
    try {
        const sets = Object.keys(data).map(key => `${key} = ?`).join(',');
        const values = Object.values(data);
        
        const sql = `UPDATE ${table} SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = '${tenantId}' AND ${whereClause}`;
        
        const result = await tursoClient.execute({
            sql,
            args: [...values, ...params]
        });
        
        return result;
    } catch(error) {
        console.error('Update error:', error.message);
        throw error;
    }
}

async function deleteRecord(table, whereClause, params = [], tenantId = 'default') {
    try {
        const sql = `DELETE FROM ${table} WHERE tenant_id = '${tenantId}' AND ${whereClause}`;
        
        const result = await tursoClient.execute({
            sql,
            args: params
        });
        
        return result;
    } catch(error) {
        console.error('Delete error:', error.message);
        throw error;
    }
}

async function getPaginated(table, page = 1, limit = 10, whereClause = '', params = [], tenantId = 'default') {
    try {
        const offset = (page - 1) * limit;
        const where = whereClause ? `WHERE tenant_id = '${tenantId}' AND ${whereClause}` : `WHERE tenant_id = '${tenantId}'`;
        
        const countResult = await tursoClient.execute({
            sql: `SELECT COUNT(*) as total FROM ${table} ${where}`,
            args: params
        });
        
        const total = countResult.rows[0].total;
        
        const dataResult = await tursoClient.execute({
            sql: `SELECT * FROM ${table} ${where} LIMIT ? OFFSET ?`,
            args: [...params, limit, offset]
        });
        
        return {
            data: dataResult.rows || [],
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        };
    } catch(error) {
        console.error('Pagination error:', error.message);
        throw error;
    }
}

module.exports = {
    tursoClient,
    initializeDatabase,
    query,
    queryOne,
    queryAll,
    insert,
    update,
    deleteRecord,
    getPaginated
};