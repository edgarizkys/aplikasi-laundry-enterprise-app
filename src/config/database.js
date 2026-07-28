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
                order_number TEXT NOT NULL UNIQUE,
                customer_id TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                phone TEXT,
                items_count INTEGER,
                weight_kg REAL,
                service_type TEXT,
                total_price REAL,
                status TEXT DEFAULT 'pending',
                pickup_date TEXT,
                delivery_date TEXT,
                assigned_staff TEXT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
                FOREIGN KEY (assigned_staff) REFERENCES staff(staff_id)
            )
        `);

        // Customers table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                customer_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT,
                address TEXT,
                loyalty_points INTEGER DEFAULT 0,
                total_spent REAL DEFAULT 0,
                member_tier TEXT DEFAULT 'Regular',
                joined_date TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Staff table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS staff (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                staff_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                position TEXT,
                phone TEXT,
                email TEXT,
                salary REAL,
                hire_date TEXT,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Services table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                service_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                price_per_kg REAL,
                turnaround_days INTEGER,
                description TEXT,
                active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Payments table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                payment_id TEXT NOT NULL UNIQUE,
                order_id TEXT NOT NULL,
                amount REAL,
                payment_method TEXT,
                status TEXT DEFAULT 'pending',
                paid_date TEXT,
                reference TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(order_number)
            )
        `);

        // Inventory table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                item_id TEXT NOT NULL UNIQUE,
                item_name TEXT NOT NULL,
                category TEXT,
                quantity REAL,
                unit TEXT,
                reorder_level REAL,
                unit_cost REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes for performance
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number)`);
        
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_customers_id ON customers(customer_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`);
        
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_staff_tenant ON staff(tenant_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_staff_id ON staff(staff_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status)`);
        
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_services_tenant ON services(tenant_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_services_active ON services(active)`);
        
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`);
        
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_inventory_tenant ON inventory(tenant_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category)`);

        console.log('[DB] All tables and indexes created successfully');
        return true;
    } catch (e) {
        console.log('[DB] Notice:', e.message);
        return false;
    }
}

async function seedDatabase() {
    try {
        const tenantId = 'default';

        // Seed Services
        await tursoClient.execute({
            sql: `INSERT OR IGNORE INTO services (tenant_id, service_id, name, price_per_kg, turnaround_days, description, active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [tenantId, 'SVC-001', 'Regular Wash', 15000, 2, 'Cuci standar dengan pengeringan', 1]
        });

        await tursoClient.execute({
            sql: `INSERT OR IGNORE INTO services (tenant_id, service_id, name, price_per_kg, turnaround_days, description, active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [tenantId, 'SVC-002', 'Express', 20000, 1, 'Cuci cepat selesai 1 hari', 1]
        });

        // Seed Staff
        await tursoClient.execute({
            sql: `INSERT OR IGNORE INTO staff (tenant_id, staff_id, name, position, phone, email, salary, hire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [tenantId, 'STF-001', 'Ahmad Wijaya', 'Operator', '085123456789', 'ahmad@laundry.com', 3500000, '2024-03-01', 'active']
        });

        await tursoClient.execute({
            sql: `INSERT OR IGNORE INTO staff (tenant_id, staff_id, name, position, phone, email, salary, hire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [tenantId, 'STF-002', 'Dewi Lestari', 'Quality Control', '085987654321', 'dewi@laundry.com', 3750000, '2024-05-15', 'active']
        });

        // Seed Customers
        await tursoClient.execute({
            sql: `INSERT OR IGNORE INTO customers (tenant_id, customer_id, name, phone, email, address, loyalty_points, total_spent, member_tier, joined_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [tenantId, 'CUST-001', 'Budi Santoso', '081234567890', 'budi@email.com', 'Jl. Merdeka No. 10', 450, 2250000, 'Gold', '2025-01-15']
        });

        await tursoClient.execute({
            sql: `INSERT OR IGNORE INTO customers (tenant_id, customer_id, name, phone, email, address, loyalty_points, total_spent, member_tier, joined_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [tenantId, 'CUST-002', 'Siti Nurhaliza', '082345678901', 'siti@email.com', 'Jl. Sudirman No. 25', 220, 1100000, 'Silver', '2025-06-20']
        });

        // Seed Inventory
        await tursoClient.execute({
            sql: `INSERT OR IGNORE INTO inventory (tenant_id, item_id, item_name, category, quantity, unit, reorder_level, unit_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [tenantId, 'INV-001', 'Deterjen Premium', 'Chemicals', 85, 'kg', 20, 45000]
        });

        await tursoClient.execute({
            sql: `INSERT OR IGNORE INTO inventory (tenant_id, item_id, item_name, category, quantity, unit, reorder_level, unit_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [tenantId, 'INV-002', 'Pelembut Kain', 'Chemicals', 120, 'liter', 30, 32000]
        });

        console.log('[DB] Seed data inserted successfully');
        return true;
    } catch (e) {
        console.log('[DB] Seed Notice:', e.message);
        return false;
    }
}

async function getConnection() {
    return tursoClient;
}

async function executeQuery(sql, args = []) {
    try {
        const result = await tursoClient.execute({
            sql,
            args
        });
        return result;
    } catch (e) {
        console.error('[DB] Query Error:', e.message);
        throw e;
    }
}

async function executeQueryBatch(queries) {
    try {
        const results = [];
        for (const query of queries) {
            const result = await tursoClient.execute({
                sql: query.sql,
                args: query.args || []
            });
            results.push(result);
        }
        return results;
    } catch (e) {
        console.error('[DB] Batch Query Error:', e.message);
        throw e;
    }
}

module.exports = {
    tursoClient,
    initializeDatabase,
    seedDatabase,
    getConnection,
    executeQuery,
    executeQueryBatch
};