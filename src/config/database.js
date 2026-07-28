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
                customer_name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                items_list TEXT,
                total_weight_kg REAL,
                service_type TEXT,
                total_price REAL NOT NULL,
                status TEXT DEFAULT 'pending',
                pickup_date TEXT,
                delivery_date TEXT,
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
                customer_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                address TEXT,
                city TEXT,
                loyalty_points INTEGER DEFAULT 0,
                total_spent REAL DEFAULT 0,
                registration_date TEXT,
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
                role TEXT,
                phone TEXT,
                email TEXT,
                shift TEXT,
                salary REAL,
                join_date TEXT,
                status TEXT DEFAULT 'aktif',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Machines table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS machines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                machine_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                type TEXT,
                capacity_kg REAL,
                location TEXT,
                status TEXT DEFAULT 'aktif',
                last_maintenance TEXT,
                next_maintenance TEXT,
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
                order_number TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                amount REAL NOT NULL,
                payment_method TEXT,
                status TEXT DEFAULT 'pending',
                payment_date TEXT,
                reference_number TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Branches table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS branches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                branch_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                address TEXT,
                phone TEXT,
                email TEXT,
                manager_name TEXT,
                operating_hours TEXT,
                total_machines INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('[DB] Aplikasi Laundry Enterprise - Semua tabel siap');
    } catch (e) {
        console.log('[DB] Pemberitahuan:', e.message);
    }
}

async function seedDatabase() {
    try {
        // Check if data already exists
        const existingOrders = await tursoClient.execute('SELECT COUNT(*) as count FROM orders');
        if (existingOrders.rows[0].count > 0) {
            console.log('[DB] Data sudah ada, skipping seed');
            return;
        }

        // Seed Orders
        await tursoClient.execute(`
            INSERT INTO orders (tenant_id, order_number, customer_name, phone, email, items_list, total_weight_kg, service_type, total_price, status, pickup_date, delivery_date, assigned_staff, notes)
            VALUES 
            ('default', 'ORD-2026-001', 'Budi Santoso', '081234567890', 'budi@email.com', '5 Baju, 3 Celana, 2 Jaket', 4.5, 'Express', 67500, 'processing', '2026-07-28', '2026-07-29', 'Siti Nurhaliza', 'Express service diminta'),
            ('default', 'ORD-2026-002', 'Sinta Wijaya', '082345678901', 'sinta@email.com', '10 Baju, 5 Celana, 3 Kemeja', 8.2, 'Regular', 105000, 'completed', '2026-07-26', '2026-07-28', 'Roni Hermawan', 'Sudah diambil pelanggan')
        `);

        // Seed Customers
        await tursoClient.execute(`
            INSERT INTO customers (tenant_id, customer_id, name, phone, email, address, city, loyalty_points, total_spent, registration_date)
            VALUES 
            ('default', 'CUST-001', 'Budi Santoso', '081234567890', 'budi@email.com', 'Jl. Merdeka No. 10', 'Jakarta Pusat', 250, 675000, '2025-12-01'),
            ('default', 'CUST-002', 'Sinta Wijaya', '082345678901', 'sinta@email.com', 'Jl. Sudirman No. 25', 'Jakarta Selatan', 500, 1250000, '2025-11-15')
        `);

        // Seed Staff
        await tursoClient.execute(`
            INSERT INTO staff (tenant_id, staff_id, name, role, phone, email, shift, salary, join_date, status)
            VALUES 
            ('default', 'STAFF-001', 'Siti Nurhaliza', 'Operator', '085123456789', 'siti@laundry.com', 'Pagi (08:00-16:00)', 3500000, '2024-06-01', 'aktif'),
            ('default', 'STAFF-002', 'Roni Hermawan', 'Supervisor', '085234567890', 'roni@laundry.com', 'Siang (16:00-00:00)', 5500000, '2023-03-15', 'aktif')
        `);

        // Seed Machines
        await tursoClient.execute(`
            INSERT INTO machines (tenant_id, machine_id, name, type, capacity_kg, location, status, last_maintenance, next_maintenance)
            VALUES 
            ('default', 'MACH-001', 'Mesin Cuci Industrial 1', 'Washing Machine', 25, 'Area Utama', 'aktif', '2026-07-15', '2026-08-15'),
            ('default', 'MACH-002', 'Mesin Pengering 1', 'Dryer', 20, 'Area Utama', 'aktif', '2026-07-10', '2026-08-10')
        `);

        // Seed Payments
        await tursoClient.execute(`
            INSERT INTO payments (tenant_id, payment_id, order_number, customer_name, amount, payment_method, status, payment_date, reference_number)
            VALUES 
            ('default', 'PAY-001', 'ORD-2026-001', 'Budi Santoso', 67500, 'QRIS', 'paid', '2026-07-28', 'REF-QRIS-2026-001'),
            ('default', 'PAY-002', 'ORD-2026-002', 'Sinta Wijaya', 105000, 'Bank Transfer', 'paid', '2026-07-27', 'REF-BT-2026-002')
        `);

        // Seed Branches
        await tursoClient.execute(`
            INSERT INTO branches (tenant_id, branch_id, name, address, phone, email, manager_name, operating_hours, total_machines)
            VALUES 
            ('default', 'BRANCH-001', 'Pusat Jakarta', 'Jl. Merdeka No. 1, Jakarta Pusat', '021-1234567', 'pusat@laundry.com', 'Bambang Sudrajat', '08:00-22:00', 8),
            ('default', 'BRANCH-002', 'Cabang Bandung', 'Jl. Diponegoro No. 50, Bandung', '022-9876543', 'bandung@laundry.com', 'Eka Supriyanto', '08:00-21:00', 6)
        `);

        console.log('[DB] Data seed berhasil ditambahkan');
    } catch (e) {
        console.log('[DB] Pemberitahuan seed:', e.message);
    }
}

async function executeQuery(query, params = []) {
    try {
        const result = await tursoClient.execute({
            sql: query,
            args: params
        });
        return { success: true, data: result.rows, error: null };
    } catch (e) {
        console.error('[DB Error]', e.message);
        return { success: false, data: null, error: e.message };
    }
}

async function executeInsert(query, params = []) {
    try {
        const result = await tursoClient.execute({
            sql: query,
            args: params
        });
        return { success: true, lastId: result.lastInsertRowid, error: null };
    } catch (e) {
        console.error('[DB Error]', e.message);
        return { success: false, lastId: null, error: e.message };
    }
}

async function executeUpdate(query, params = []) {
    try {
        const result = await tursoClient.execute({
            sql: query,
            args: params
        });
        return { success: true, changes: result.rowsAffected, error: null };
    } catch (e) {
        console.error('[DB Error]', e.message);
        return { success: false, changes: 0, error: e.message };
    }
}

async function executeDelete(query, params = []) {
    try {
        const result = await tursoClient.execute({
            sql: query,
            args: params
        });
        return { success: true, changes: result.rowsAffected, error: null };
    } catch (e) {
        console.error('[DB Error]', e.message);
        return { success: false, changes: 0, error: e.message };
    }
}

async function getPaginated(tableName, page = 1, limit = 10, tenantId = 'default') {
    const offset = (page - 1) * limit;
    const countResult = await executeQuery(`SELECT COUNT(*) as count FROM ${tableName} WHERE tenant_id = ?`, [tenantId]);
    const total = countResult.data[0].count;
    const dataResult = await executeQuery(
        `SELECT * FROM ${tableName} WHERE tenant_id = ? ORDER BY id DESC LIMIT ? OFFSET ?`,
        [tenantId, limit, offset]
    );
    
    return {
        success: dataResult.success,
        data: dataResult.data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        },
        error: dataResult.error
    };
}

module.exports = {
    tursoClient,
    initializeDatabase,
    seedDatabase,
    executeQuery,
    executeInsert,
    executeUpdate,
    executeDelete,
    getPaginated
};