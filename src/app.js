import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Configuration
const db = createClient({
  url: process.env.TURSO_CONNECTION_URL || 'file:laundry.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize Database
async function initializeDatabase() {
  try {
    // Orders Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        customer_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        items_description TEXT NOT NULL,
        total_items INTEGER NOT NULL,
        weight_kg REAL NOT NULL,
        service_type TEXT NOT NULL,
        total_price REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        pickup_date DATE NOT NULL,
        delivery_date DATE NOT NULL,
        payment_status TEXT NOT NULL DEFAULT 'unpaid',
        notes TEXT,
        branch_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        loyalty_points INTEGER DEFAULT 0,
        total_orders INTEGER DEFAULT 0,
        registration_date DATE NOT NULL,
        tenant_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Employees Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        position TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        hire_date DATE NOT NULL,
        salary REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        branch_id TEXT,
        tenant_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Branches Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        branch_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        phone TEXT NOT NULL,
        manager_name TEXT,
        operating_hours TEXT NOT NULL,
        tenant_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Services Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price_per_kg REAL NOT NULL,
        turnaround_days INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        tenant_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_id TEXT UNIQUE NOT NULL,
        order_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        payment_date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        tenant_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Utility Functions
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function seedDatabase() {
  try {
    const existingOrders = await db.execute('SELECT COUNT(*) as count FROM orders');
    if (existingOrders.rows.length > 0 && existingOrders.rows[0].count > 0) {
      console.log('Database already seeded');
      return;
    }

    // Seed Branches
    await db.execute(`
      INSERT INTO branches (branch_id, name, address, city, phone, manager_name, operating_hours, tenant_id)
      VALUES 
        ('BR-001', 'Pusat Jakarta', 'Jl. Gatot Subroto No. 1', 'Jakarta', '0213456789', 'Ahmad Wijaya', '07:00 - 21:00', 'default'),
        ('BR-002', 'Cabang Depok', 'Jl. Margonda No. 50', 'Depok', '0217654321', 'Rina Pratama', '08:00 - 20:00', 'default')
    `);

    // Seed Services
    await db.execute(`
      INSERT INTO services (service_id, name, description, price_per_kg, turnaround_days, status, tenant_id)
      VALUES 
        ('SRV-001', 'Regular', 'Layanan pencucian standar 2-3 hari', 15000, 3, 'active', 'default'),
        ('SRV-002', 'Express', 'Layanan kilat 1 hari', 25000, 1, 'active', 'default'),
        ('SRV-003', 'Premium', 'Layanan premium dengan setrika profesional', 35000, 2, 'active', 'default')
    `);

    // Seed Customers
    await db.execute(`
      INSERT INTO customers (customer_id, name, phone, email, address, city, loyalty_points, total_orders, registration_date, tenant_id)
      VALUES 
        ('CUST-001', 'Budi Santoso', '081234567890', 'budi@email.com', 'Jl. Merdeka No. 10', 'Jakarta', 250, 15, '2025-12-01', 'default'),
        ('CUST-002', 'Siti Nurhaliza', '082345678901', 'siti@email.com', 'Jl. Sudirman No. 25', 'Jakarta', 180, 10, '2026-02-15', 'default'),
        ('CUST-003', 'Rudi Hermawan', '083456789012', 'rudi@email.com', 'Jl. Diponegoro No. 5', 'Depok', 120, 7, '2026-03-20', 'default')
    `);

    // Seed Employees
    await db.execute(`
      INSERT INTO employees (employee_id, name, position, phone, email, hire_date, salary, status, branch_id, tenant_id)
      VALUES 
        ('EMP-001', 'Ahmad Wijaya', 'Manager', '083456789012', 'ahmad@laundry.com', '2023-01-10', 5000000, 'active', 'BR-001', 'default'),
        ('EMP-002', 'Dewi Lestari', 'Operator', '084567890123', 'dewi@laundry.com', '2024-06-15', 2500000, 'active', 'BR-001', 'default'),
        ('EMP-003', 'Rina Pratama', 'Manager', '085678901234', 'rina@laundry.com', '2023-06-01', 4500000, 'active', 'BR-002', 'default')
    `);

    // Seed Orders
    await db.execute(`
      INSERT INTO orders (order_number, customer_id, customer_name, phone, items_description, total_items, weight_kg, service_type, total_price, status, pickup_date, delivery_date, payment_status, notes, branch_id)
      VALUES 
        ('ORD-2026-0001', 'CUST-001', 'Budi Santoso', '081234567890', 'Baju, Celana, Jas', 5, 4.2, 'Regular', 63000, 'processing', '2026-07-28', '2026-07-30', 'paid', 'Hati-hati dengan kain sutra', 'BR-001'),
        ('ORD-2026-0002', 'CUST-002', 'Siti Nurhaliza', '082345678901', 'Kemeja, Rok, Daster', 8, 3.8, 'Express', 95000, 'ready', '2026-07-27', '2026-07-28', 'paid', 'Pengiriman ke rumah', 'BR-001'),
        ('ORD-2026-0003', 'CUST-003', 'Rudi Hermawan', '083456789012', 'Jaket, Celana panjang', 3, 2.5, 'Premium', 87500, 'completed', '2026-07-26', '2026-07-28', 'paid', '', 'BR-002')
    `);

    // Seed Payments
    await db.execute(`
      INSERT INTO payments (payment_id, order_id, customer_name, amount, payment_method, payment_date, status, tenant_id)
      VALUES 
        ('PAY-001', 'ORD-2026-0001', 'Budi Santoso', 63000, 'QRIS', '2026-07-28', 'completed', 'default'),
        ('PAY-002', 'ORD-2026-0002', 'Siti Nurhaliza', 95000, 'Transfer Bank', '2026-07-27', 'completed', 'default'),
        ('PAY-003', 'ORD-2026-0003', 'Rudi Hermawan', 87500, 'Cash', '2026-07-26', 'completed', 'default')
    `);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Database seeding error:', error);
  }
}

// ORDERS ENDPOINTS
app.get('/api/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const tenantId = req.query.tenant_id || 'default';

    let query = 'SELECT * FROM orders WHERE tenant_id = ? OR tenant_id IS NULL';
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE tenant_id = ? OR tenant_id IS NULL';
    const params = [tenantId];

    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const orders = await db.execute(query, params);
    const countResult = await db.execute(countQuery, params);
    const total = countResult.rows[0].total;

    res.json({
      data: orders.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const {
      customer_id,
      customer_name,
      phone,
      items_description,
      total_items,
      weight_kg,
      service_type,
      total_price,
      pickup_date,
      delivery_date,
      notes,
      branch_id,
    } = req.body;

    const order_number = `ORD-${new Date().getFullYear()}-${Math.random().toString().slice(2, 7).padStart(5, '0')}`;
    const tenantId = req.body.tenant_id || 'default';

    const result = await db.execute(
      `INSERT INTO orders (order_number, customer_id, customer_name, phone, items_description, total_items, weight_kg, service_type, total_price, status, pickup_date, delivery_date, notes, branch_id, tenant_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order_number, customer_id, customer_name, phone, items_description, total_items, weight_kg, service_type, total_price, 'pending', pickup_date, delivery_date, notes || '', branch_id || '', tenantId]
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      order_number,
      message: 'Pesanan berhasil dibuat',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { status, payment_status, notes, total_price } = req.body;

    let updateQuery = 'UPDATE orders SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (status) {
      updateQuery += ', status = ?';
      params.push(status);
    }
    if (payment_status) {
      updateQuery += ', payment_status = ?';
      params.push(payment_status);
    }
    if (notes !== undefined) {
      updateQuery += ', notes = ?';
      params.push(notes);
    }
    if (total_price) {
      updateQuery += ', total_price = ?';
      params.push(total_price);
    }

    updateQuery += ' WHERE id = ?';
    params.push(req.params.id);

    await db.execute(updateQuery, params);
    res.json({ message: 'Pesanan berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ message: 'Pesanan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CUSTOMERS ENDPOINTS
app.get('/api/customers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const tenantId = req.query.tenant_id || 'default';

    const customers = await db.execute(
      `SELECT * FROM customers WHERE tenant_id = ? OR tenant_id IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [tenantId, limit, offset]
    );

    const countResult = await db.execute(
      'SELECT COUNT(*) as total FROM customers WHERE tenant_id = ? OR tenant_id IS NULL',
      [tenantId]
    );
    const total = countResult.rows[0].total;

    res.json({
      data: customers.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pelanggan tidak ditemukan' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, phone, email, address, city, registration_date } = req.body;
    const customer_id = `CUST-${Math.random().toString().slice(2, 6)}`;
    const tenantId = req.body.tenant_id || 'default';

    const result = await db.execute(
      `INSERT INTO customers (customer_id, name, phone, email, address, city, registration_date, tenant_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, name, phone, email || '', address, city, registration_date || new Date().toISOString().split('T')[0], tenantId]
    );

    res.status(201).json({ id: result.lastInsertRowid, customer_id, message: 'Pelanggan berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { name, phone, email, address, city, loyalty_points } = req.body;

    let updateQuery = 'UPDATE customers SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (name) {
      updateQuery += ', name = ?';
      params.push(name);
    }
    if (phone) {
      updateQuery += ', phone = ?';
      params.push(phone);
    }
    if (email) {
      updateQuery += ', email = ?';
      params.push(email);
    }
    if (address) {
      updateQuery += ', address = ?';
      params.push(address);
    }
    if (city) {
      updateQuery += ', city = ?';
      params.push(city);
    }
    if (loyalty_points !== undefined) {
      updateQuery += ', loyalty_points = ?';
      params.push(loyalty_points);
    }

    updateQuery += ' WHERE id = ?';
    params.push(req.params.id);

    await db.execute(updateQuery, params);
    res.json({ message: 'Pelanggan berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Pelanggan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// EMPLOYEES ENDPOINTS
app.get('/api/employees', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const branch_id = req.query.branch_id;
    const tenantId = req.query.tenant_id || 'default';

    let query = 'SELECT * FROM employees WHERE tenant_id = ? OR tenant_id IS NULL';
    let countQuery = 'SELECT COUNT(*) as total FROM employees WHERE tenant_id = ? OR tenant_id IS NULL';
    const params = [tenantId];

    if (branch_id) {
      query += ' AND branch_id = ?';
      countQuery += ' AND branch_id = ?';
      params.push(branch_id);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const employees = await db.execute(query, params);
    const countResult = await db.execute(countQuery, params);
    const total = countResult.rows[0].total;

    res.json({
      data: employees.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/employees/:id', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { name, position, phone, email, hire_date, salary, branch_id } = req.body;
    const employee_id = `EMP-${Math.random().toString().slice(2, 6)}`;
    const tenantId = req.body.tenant_id || 'default';

    const result = await db.execute(
      `INSERT INTO employees (employee_id, name, position, phone, email, hire_date, salary, status, branch_id, tenant_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, name, position, phone, email, hire_date, salary, 'active', branch_id || '', tenantId]
    );

    res.status(201).json({ id: result.lastInsertRowid, employee_id, message: 'Karyawan berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { name, position, phone, email, salary, status } = req.body;

    let updateQuery = 'UPDATE employees SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (name) {
      updateQuery += ', name = ?';
      params.push(name);
    }
    if (position) {
      updateQuery += ', position = ?';
      params.push(position);
    }
    if (phone) {
      updateQuery += ', phone = ?';
      params.push(phone);
    }
    if (email) {
      updateQuery += ', email = ?';
      params.push(email);
    }
    if (salary) {
      updateQuery += ', salary = ?';
      params.push(salary);
    }
    if (status) {
      updateQuery += ', status = ?';
      params.push(status);
    }

    updateQuery += ' WHERE id = ?';
    params.push(req.params.id);

    await db.execute(updateQuery, params);
    res.json({ message: 'Karyawan berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ message: 'Karyawan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BRANCHES ENDPOINTS
app.get('/api/branches', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const tenantId = req.query.tenant_id || 'default';

    const branches = await db.execute(
      `SELECT * FROM branches WHERE tenant_id = ? OR tenant_id IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [tenantId, limit, offset]
    );

    const countResult = await db.execute(
      'SELECT COUNT(*) as total FROM branches WHERE tenant_id = ? OR tenant_id IS NULL',
      [tenantId]
    );
    const total = countResult.rows[0].total;

    res.json({
      data: branches.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/branches/:id', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM branches WHERE id = ?', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cabang tidak ditemukan' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/branches', async (req, res) => {
  try {
    const { name, address, city, phone, manager_name, operating_hours } = req.body;
    const branch_id = `BR-${Math.random().toString().slice(2, 6)}`;
    const tenantId = req.body.tenant_id || 'default';

    const result = await db.execute(
      `INSERT INTO branches (branch_id, name, address, city, phone, manager_name, operating_hours, tenant_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [branch_id, name, address, city, phone, manager_name || '', operating_hours, tenantId]
    );

    res.status(201).json({ id: result.lastInsertRowid, branch_id, message: 'Cabang berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/branches/:id', async (req, res) => {
  try {
    const { name, address, city, phone, manager_name, operating_hours } = req.body;

    let updateQuery = 'UPDATE branches SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (name) {
      updateQuery += ', name = ?';
      params.push(name);
    }
    if (address) {
      updateQuery += ', address = ?';
      params.push(address);
    }
    if (city) {
      updateQuery += ', city = ?';
      params.push(city);
    }
    if (phone) {
      updateQuery += ', phone = ?';
      params.push(phone);
    }
    if (manager_name) {
      updateQuery += ', manager_name = ?';
      params.push(manager_name);
    }
    if (operating_hours) {
      updateQuery += ', operating_hours = ?';
      params.push(operating_hours);
    }

    updateQuery += ' WHERE id = ?';
    params.push(req.params.id);

    await db.execute(updateQuery, params);
    res.json({ message: 'Cabang berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/branches/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM branches WHERE id = ?', [req.params.id]);
    res.json({ message: 'Cabang berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SERVICES ENDPOINTS
app.get('/api/services', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const tenantId = req.query.tenant_id || 'default';

    const services = await db.execute(
      `SELECT * FROM services WHERE (tenant_id = ? OR tenant_id IS NULL) AND status = 'active' ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [tenantId, limit, offset]
    );

    const countResult = await db.execute(
      `SELECT COUNT(*) as total FROM services WHERE (tenant_id = ? OR tenant_id IS NULL) AND status = 'active'`,
      [tenantId]
    );
    const total = countResult.rows[0].total;

    res.json({
      data: services.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/services/:id', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM services WHERE id = ?', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Layanan tidak ditemukan' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const { name, description, price_per_kg, turnaround_days } = req.body;
    const service_id = `SRV-${Math.random().toString().slice(2, 6)}`;
    const tenantId = req.body.tenant_id || 'default';

    const result = await db.execute(
      `INSERT INTO services (service_id, name,