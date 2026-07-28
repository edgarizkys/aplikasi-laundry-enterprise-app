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
                order_number TEXT UNIQUE NOT NULL,
                customer_id TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                phone TEXT,
                items_description TEXT,
                total_items INTEGER,
                weight_kg REAL,
                service_type TEXT,
                total_price REAL,
                status TEXT DEFAULT 'pending',
                pickup_date TEXT,
                delivery_date TEXT,
                payment_status TEXT DEFAULT 'unpaid',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id),
                FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
            )
        `);

        // Customers table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                customer_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT,
                address TEXT,
                city TEXT,
                loyalty_points INTEGER DEFAULT 0,
                total_orders INTEGER DEFAULT 0,
                registration_date TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id)
            )
        `);

        // Employees table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                employee_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                position TEXT,
                phone TEXT,
                email TEXT,
                hire_date TEXT,
                salary REAL,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id)
            )
        `);

        // Branches table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS branches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                branch_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                address TEXT NOT NULL,
                city TEXT,
                phone TEXT,
                manager_name TEXT,
                operating_hours TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id)
            )
        `);

        // Services table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                service_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                price_per_kg REAL,
                turnaround_days INTEGER,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id)
            )
        `);

        // Payments table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                payment_id TEXT UNIQUE NOT NULL,
                order_id TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                amount REAL,
                payment_method TEXT,
                payment_date TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id),
                FOREIGN KEY (order_id) REFERENCES orders(order_number)
            )
        `);

        // Loyalty Points table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS loyalty_points (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                customer_id TEXT NOT NULL,
                points INTEGER,
                transaction_type TEXT,
                order_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id),
                FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
                FOREIGN KEY (order_id) REFERENCES orders(order_number)
            )
        `);

        // Delivery tracking table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS delivery_tracking (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                order_id TEXT NOT NULL,
                status TEXT,
                location TEXT,
                latitude REAL,
                longitude REAL,
                timestamp TEXT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id),
                FOREIGN KEY (order_id) REFERENCES orders(order_number)
            )
        `);

        // Notifications table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                customer_id TEXT,
                order_id TEXT,
                notification_type TEXT,
                message TEXT,
                phone TEXT,
                email TEXT,
                status TEXT DEFAULT 'pending',
                sent_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id),
                FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
                FOREIGN KEY (order_id) REFERENCES orders(order_number)
            )
        `);

        // Invoices table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                invoice_number TEXT UNIQUE NOT NULL,
                order_id TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                subtotal REAL,
                tax REAL,
                discount REAL,
                total REAL,
                issued_date TEXT,
                due_date TEXT,
                status TEXT DEFAULT 'draft',
                pdf_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id),
                FOREIGN KEY (order_id) REFERENCES orders(order_number)
            )
        `);

        // Tenants table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS tenants (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                company_name TEXT,
                email TEXT,
                phone TEXT,
                address TEXT,
                city TEXT,
                plan TEXT DEFAULT 'basic',
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes for better query performance
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON employees(tenant_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_branches_tenant_id ON branches(tenant_id)`);
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id)`);

        console.log('[DB] All tables initialized successfully');
    } catch (e) {
        console.log('[DB] Initialization notice:', e.message);
    }
}

async function executeQuery(sql, params = []) {
    try {
        const result = await tursoClient.execute({
            sql,
            args: params
        });
        return result;
    } catch (error) {
        console.error('[DB] Query error:', error.message);
        throw error;
    }
}

async function executeTransaction(queries) {
    try {
        await tursoClient.execute('BEGIN TRANSACTION');
        for (const { sql, params } of queries) {
            await executeQuery(sql, params);
        }
        await tursoClient.execute('COMMIT');
    } catch (error) {
        await tursoClient.execute('ROLLBACK');
        console.error('[DB] Transaction error:', error.message);
        throw error;
    }
}

function getHealthStatus() {
    return {
        status: 'connected',
        database: 'turso_sqlite',
        timestamp: new Date().toISOString()
    };
}

module.exports = {
    tursoClient,
    initializeDatabase,
    executeQuery,
    executeTransaction,
    getHealthStatus
};