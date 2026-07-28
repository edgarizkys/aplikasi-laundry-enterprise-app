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
const PORT = process.env.PORT || 3000;

// Turso SQLite Client
const db = createClient({
  url: process.env.DATABASE_URL || 'file:laundry.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware untuk mencatat request
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Inisialisasi Database
async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    // Tabel Orders
    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabel Customers
    await db.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        city TEXT,
        loyalty_points INTEGER DEFAULT 0,
        total_orders INTEGER DEFAULT 0,
        registration_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabel Employees
    await db.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        position TEXT,
        phone TEXT,
        email TEXT,
        hire_date TEXT,
        salary REAL,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabel Branches
    await db.execute(`
      CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        branch_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        address TEXT,
        city TEXT,
        phone TEXT,
        manager_name TEXT,
        operating_hours TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabel Services
    await db.execute(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price_per_kg REAL,
        turnaround_days INTEGER,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabel Payments
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_id TEXT UNIQUE NOT NULL,
        order_id TEXT NOT NULL,
        customer_name TEXT,
        amount REAL,
        payment_method TEXT,
        payment_date TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(order_number)
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

// Seed Sample Data
async function seedData() {
  try {
    const existingOrders = await db.execute('SELECT COUNT(*) as count FROM orders');
    if (existingOrders.rows[0].count > 0) {
      console.log('Database already has data, skipping seed');
      return;
    }

    console.log('Seeding sample data...');

    // Seed Customers
    const customers = [
      {
        customer_id: 'CUST-001',
        name: 'Budi Santoso',
        phone: '081234567890',
        email: 'budi@email.com',
        address: 'Jl. Merdeka No. 10',
        city: 'Jakarta',
        loyalty_points: 250,
        total_orders: 15,
        registration_date: '2025-12-01',
      },
      {
        customer_id: 'CUST-002',
        name: 'Siti Nurhaliza',
        phone: '082345678901',
        email: 'siti@email.com',
        address: 'Jl. Sudirman No. 25',
        city: 'Jakarta',
        loyalty_points: 180,
        total_orders: 10,
        registration_date: '2026-02-15',
      },
    ];

    for (const customer of customers) {
      await db.execute(
        `INSERT INTO customers (customer_id, name, phone, email, address, city, loyalty_points, total_orders, registration_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customer.customer_id,
          customer.name,
          customer.phone,
          customer.email,
          customer.address,
          customer.city,
          customer.loyalty_points,
          customer.total_orders,
          customer.registration_date,
        ]
      );
    }

    // Seed Employees
    const employees = [
      {
        employee_id: 'EMP-001',
        name: 'Ahmad Wijaya',
        position: 'Manager',
        phone: '083456789012',
        email: 'ahmad@laundry.com',
        hire_date: '2023-01-10',
        salary: 5000000,
        status: 'active',
      },
      {
        employee_id: 'EMP-002',
        name: 'Dewi Lestari',
        position: 'Operator',
        phone: '084567890123',
        email: 'dewi@laundry.com',
        hire_date: '2024-06-15',
        salary: 2500000,
        status: 'active',
      },
    ];

    for (const employee of employees) {
      await db.execute(
        `INSERT INTO employees (employee_id, name, position, phone, email, hire_date, salary, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employee.employee_id,
          employee.name,
          employee.position,
          employee.phone,
          employee.email,
          employee.hire_date,
          employee.salary,
          employee.status,
        ]
      );
    }

    // Seed Branches
    const branches = [
      {
        branch_id: 'BR-001',
        name: 'Pusat Jakarta',
        address: 'Jl. Gatot Subroto No. 1',
        city: 'Jakarta',
        phone: '0213456789',
        manager_name: 'Ahmad Wijaya',
        operating_hours: '07:00 - 21:00',
      },
      {
        branch_id: 'BR-002',
        name: 'Cabang Depok',
        address: 'Jl. Margonda No. 50',
        city: 'Depok',
        phone: '0217654321',
        manager_name: 'Rina Pratama',
        operating_hours: '08:00 - 20:00',
      },
    ];

    for (const branch of branches) {
      await db.execute(
        `INSERT INTO branches (branch_id, name, address, city, phone, manager_name, operating_hours)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          branch.branch_id,
          branch.name,
          branch.address,
          branch.city,
          branch.phone,
          branch.manager_name,
          branch.operating_hours,
        ]
      );
    }

    // Seed Services
    const services = [
      {
        service_id: 'SRV-001',
        name: 'Regular',
        description: 'Layanan pencucian standar 2-3 hari',
        price_per_kg: 15000,
        turnaround_days: 3,
        status: 'active',
      },
      {
        service_id: 'SRV-002',
        name: 'Express',
        description: 'Layanan kilat 1 hari',
        price_per_kg: 25000,
        turnaround_days: 1,
        status: 'active',
      },
    ];

    for (const service of services) {
      await db.execute(
        `INSERT INTO services (service_id, name, description, price_per_kg, turnaround_days, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          service.service_id,
          service.name,
          service.description,
          service.price_per_kg,
          service.turnaround_days,
          service.status,
        ]
      );
    }

    // Seed Orders
    const orders = [
      {
        order_number: 'ORD-2026-0001',
        customer_id: 'CUST-001',
        customer_name: 'Budi Santoso',
        phone: '081234567890',
        items_description: 'Baju, Celana, Jas',
        total_items: 5,
        weight_kg: 4.2,
        service_type: 'Regular',
        total_price: 63000,
        status: 'processing',
        pickup_date: '2026-07-28',
        delivery_date: '2026-07-30',
        payment_status: 'paid',
        notes: 'Hati-hati dengan kain sutra',
      },
      {
        order_number: 'ORD-2026-0002',
        customer_id: 'CUST-002',
        customer_name: 'Siti Nurhaliza',
        phone: '082345678901',
        items_description: 'Kemeja, Rok, Daster',
        total_items: 8,
        weight_kg: 3.8,
        service_type: 'Express',
        total_price: 85000,
        status: 'ready',
        pickup_date: '2026-07-27',
        delivery_date: '2026-07-28',
        payment_status: 'paid',
        notes: 'Pengiriman ke rumah',
      },
    ];

    for (const order of orders) {
      await db.execute(
        `INSERT INTO orders (order_number, customer_id, customer_name, phone, items_description, total_items, weight_kg, service_type, total_price, status, pickup_date, delivery_date, payment_status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.order_number,
          order.customer_id,
          order.customer_name,
          order.phone,
          order.items_description,
          order.total_items,
          order.weight_kg,
          order.service_type,
          order.total_price,
          order.status,
          order.pickup_date,
          order.delivery_date,
          order.payment_status,
          order.notes,
        ]
      );
    }

    // Seed Payments
    const payments = [
      {
        payment_id: 'PAY-001',
        order_id: 'ORD-2026-0001',
        customer_name: 'Budi Santoso',
        amount: 63000,
        payment_method: 'QRIS',
        payment_date: '2026-07-28',
        status: 'completed',
      },
      {
        payment_id: 'PAY-002',
        order_id: 'ORD-2026-0002',
        customer_name: 'Siti Nurhaliza',
        amount: 85000,
        payment_method: 'Transfer Bank',
        payment_date: '2026-07-27',
        status: 'completed',
      },
    ];

    for (const payment of payments) {
      await db.execute(
        `INSERT INTO payments (payment_id, order_id, customer_name, amount, payment_method, payment_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          payment.payment_id,
          payment.order_id,
          payment.customer_name,
          payment.amount,
          payment.payment_method,
          payment.payment_date,
          payment.status,
        ]
      );
    }

    console.log('Sample data seeded successfully');
  } catch (error) {
    console.error('Seed data error:', error);
  }
}

// Utility Functions
function getPaginationParams(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, parseInt(query.limit) || 10);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// ============================================
// ORDERS ROUTES
// ============================================

// GET All Orders dengan Pagination
app.get('/api/orders', async (req, res) => {
  try {
    const { limit, offset } = getPaginationParams(req.query);
    const search = req.query.search || '';
    const status = req.query.status || '';

    let whereClause = '1=1';
    const params = [];

    if (search) {
      whereClause += ` AND (order_number LIKE ? OR customer_name LIKE ? OR phone LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ` AND status = ?`;
      params.push(status);
    }

    const countResult = await db.execute(`SELECT COUNT(*) as total FROM orders WHERE ${whereClause}`, params);
    const total = countResult.rows[0].total;

    const result = await db.execute(
      `SELECT * FROM orders WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET Single Order
app.get('/api/orders/:id', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST Create Order
app.post('/api/orders', async (req, res) => {
  try {
    const {
      order_number,
      customer_id,
      customer_name,
      phone,
      items_description,
      total_items,
      weight_kg,
      service_type,
      total_price,
      status,
      pickup_date,
      delivery_date,
      payment_status,
      notes,
    } = req.body;

    if (!order_number || !customer_id || !customer_name) {
      return res.status(400).json({ success: false, error: 'Data tidak lengkap' });
    }

    await db.execute(
      `INSERT INTO orders (order_number, customer_id, customer_name, phone, items_description, total_items, weight_kg, service_type, total_price, status, pickup_date, delivery_date, payment_status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_number,
        customer_id,
        customer_name,
        phone,
        items_description,
        total_items,
        weight_kg,
        service_type,
        total_price,
        status || 'pending',
        pickup_date,
        delivery_date,
        payment_status || 'unpaid',
        notes,
      ]
    );

    const result = await db.execute('SELECT * FROM orders WHERE order_number = ?', [order_number]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT Update Order
app.put('/api/orders/:id', async (req, res) => {
  try {
    const {
      order_number,
      customer_id,
      customer_name,
      phone,
      items_description,
      total_items,
      weight_kg,
      service_type,
      total_price,
      status,
      pickup_date,
      delivery_date,
      payment_status,
      notes,
    } = req.body;

    await db.execute(
      `UPDATE orders SET order_number = ?, customer_id = ?, customer_name = ?, phone = ?, items_description = ?, total_items = ?, weight_kg = ?, service_type = ?, total_price = ?, status = ?, pickup_date = ?, delivery_date = ?, payment_status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [
        order_number,
        customer_id,
        customer_name,
        phone,
        items_description,
        total_items,
        weight_kg,
        service_type,
        total_price,
        status,
        pickup_date,
        delivery_date,
        payment_status,
        notes,
        req.params.id,
      ]
    );

    const result = await db.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE Order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Pesanan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CUSTOMERS ROUTES
// ============================================

// GET All Customers
app.get('/api/customers', async (req, res) => {
  try {
    const { limit, offset } = getPaginationParams(req.query);
    const search = req.query.search || '';

    let whereClause = '1=1';
    const params = [];

    if (search) {
      whereClause += ` AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const countResult = await db.execute(`SELECT COUNT(*) as total FROM customers WHERE ${whereClause}`, params);
    const total = countResult.rows[0].total;

    const result = await db.execute(
      `SELECT * FROM customers WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET Single Customer
app.get('/api/customers/:id', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pelanggan tidak ditemukan' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST Create Customer
app.post('/api/customers', async (req, res) => {
  try {
    const { customer_id, name, phone, email, address, city, loyalty_points, total_orders, registration_date } = req.body;

    if (!customer_id || !name) {
      return res.status(400).json({ success: false, error: 'Data tidak lengkap' });
    }

    await db.execute(
      `INSERT INTO customers (customer_id, name, phone, email, address, city, loyalty_points, total_orders, registration_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_id,
        name,
        phone,
        email,
        address,
        city,
        loyalty_points || 0,
        total_orders || 0,
        registration_date || new Date().toISOString().split('T')[0],
      ]
    );

    const result = await db.execute('SELECT * FROM customers WHERE customer_id = ?', [customer_id]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT Update Customer
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { customer_id, name, phone, email, address, city, loyalty_points, total_orders, registration_date } = req.body;

    await db.execute(
      `UPDATE customers SET customer_id = ?, name = ?, phone = ?, email = ?, address = ?, city = ?, loyalty_points = ?, total_orders = ?, registration_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [customer_id, name, phone, email, address, city, loyalty_points, total_orders, registration_date, req.params.id]
    );

    const result = await db.execute('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE Customer
app.delete('/api/customers/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Pelanggan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});