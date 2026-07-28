I'll generate the app.js file for the Laundry Enterprise application using Express.js and Turso SQLite.

```javascript
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
const PORT = process.env.PORT || 3001;

// Database client
const db = createClient({
  url: process.env.DATABASE_URL || 'file:local.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Orders table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        customer_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        items_count INTEGER DEFAULT 0,
        weight_kg REAL NOT NULL,
        service_type TEXT NOT NULL,
        total_price REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        pickup_date TEXT NOT NULL,
        delivery_date TEXT NOT NULL,
        assigned_staff TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        tenant_id TEXT NOT NULL
      );
    `);

    // Customers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT,
        address TEXT,
        loyalty_points INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        member_tier TEXT DEFAULT 'Bronze',
        joined_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        tenant_id TEXT NOT NULL
      );
    `);

    // Staff table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        position TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        salary REAL NOT NULL,
        hire_date TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        tenant_id TEXT NOT NULL
      );
    `);

    // Services table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        price_per_kg REAL NOT NULL,
        turnaround_days INTEGER NOT NULL,
        description TEXT,
        active BOOLEAN DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        tenant_id TEXT NOT NULL
      );
    `);

    // Payments table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_id TEXT UNIQUE NOT NULL,
        order_id TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        paid_date TEXT,
        reference TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        tenant_id TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(order_number)
      );
    `);

    // Inventory table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id TEXT UNIQUE NOT NULL,
        item_name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        reorder_level REAL NOT NULL,
        unit_cost REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        tenant_id TEXT NOT NULL
      );
    `);

    // Create indexes
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);`);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

// Helper function to get tenant_id from headers
function getTenantId(req) {
  return req.headers['x-tenant-id'] || 'default';
}

// ORDERS ROUTES
app.post('/api/orders', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const {
      order_number,
      customer_id,
      customer_name,
      phone,
      items_count,
      weight_kg,
      service_type,
      total_price,
      pickup_date,
      delivery_date,
      assigned_staff,
      notes,
    } = req.body;

    if (!order_number || !customer_id || !weight_kg || !total_price) {
      return res.status(400).json({
        success: false,
        message: 'Nomor pesanan, ID pelanggan, berat, dan harga total harus diisi',
      });
    }

    const result = await db.execute({
      sql: `
        INSERT INTO orders (
          order_number, customer_id, customer_name, phone, items_count,
          weight_kg, service_type, total_price, status, pickup_date,
          delivery_date, assigned_staff, notes, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        order_number,
        customer_id,
        customer_name,
        phone,
        items_count || 0,
        weight_kg,
        service_type,
        total_price,
        'pending',
        pickup_date,
        delivery_date,
        assigned_staff,
        notes,
        tenant_id,
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat',
      data: { id: result.lastInsertRowid, order_number },
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/orders', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM orders WHERE tenant_id = ?';
    const args = [tenant_id];

    if (status) {
      query += ' AND status = ?';
      args.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const result = await db.execute({ sql: query, args });

    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM orders WHERE tenant_id = ?' + (status ? ' AND status = ?' : ''),
      args: status ? [tenant_id, status] : [tenant_id],
    });

    const total = countResult.rows[0]?.total || 0;

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/orders/:id', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const result = await db.execute({
      sql: 'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
      args: [req.params.id, tenant_id],
    });

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/orders/:id', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const { status, assigned_staff, notes, delivery_date } = req.body;

    const fields = [];
    const args = [];

    if (status !== undefined) {
      fields.push('status = ?');
      args.push(status);
    }
    if (assigned_staff !== undefined) {
      fields.push('assigned_staff = ?');
      args.push(assigned_staff);
    }
    if (notes !== undefined) {
      fields.push('notes = ?');
      args.push(notes);
    }
    if (delivery_date !== undefined) {
      fields.push('delivery_date = ?');
      args.push(delivery_date);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    args.push(req.params.id, tenant_id);

    const result = await db.execute({
      sql: `UPDATE orders SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      args,
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    res.json({ success: true, message: 'Pesanan berhasil diperbarui' });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/orders/:id', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const result = await db.execute({
      sql: 'DELETE FROM orders WHERE id = ? AND tenant_id = ?',
      args: [req.params.id, tenant_id],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    res.json({ success: true, message: 'Pesanan berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

// CUSTOMERS ROUTES
app.post('/api/customers', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const { customer_id, name, phone, email, address, joined_date } = req.body;

    if (!customer_id || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'ID pelanggan, nama, dan telepon harus diisi',
      });
    }

    const result = await db.execute({
      sql: `
        INSERT INTO customers (
          customer_id, name, phone, email, address, joined_date, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [customer_id, name, phone, email, address, joined_date, tenant_id],
    });

    res.status(201).json({
      success: true,
      message: 'Pelanggan berhasil dibuat',
      data: { id: result.lastInsertRowid, customer_id },
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/customers', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await db.execute({
      sql: `
        SELECT * FROM customers
        WHERE tenant_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [tenant_id, limit, offset],
    });

    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM customers WHERE tenant_id = ?',
      args: [tenant_id],
    });

    const total = countResult.rows[0]?.total || 0;

    res.json({
      success: true,
      data: result.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/customers/:id', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const result = await db.execute({
      sql: 'SELECT * FROM customers WHERE id = ? AND tenant_id = ?',
      args: [req.params.id, tenant_id],
    });

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Pelanggan tidak ditemukan' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/customers/:id', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const { name, email, address, member_tier, loyalty_points } = req.body;

    const fields = [];
    const args = [];

    if (name) {
      fields.push('name = ?');
      args.push(name);
    }
    if (email) {
      fields.push('email = ?');
      args.push(email);
    }
    if (address) {
      fields.push('address = ?');
      args.push(address);
    }
    if (member_tier) {
      fields.push('member_tier = ?');
      args.push(member_tier);
    }
    if (loyalty_points !== undefined) {
      fields.push('loyalty_points = ?');
      args.push(loyalty_points);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    args.push(req.params.id, tenant_id);

    const result = await db.execute({
      sql: `UPDATE customers SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      args,
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Pelanggan tidak ditemukan' });
    }

    res.json({ success: true, message: 'Pelanggan berhasil diperbarui' });
  } catch (error) {
    next(error);
  }
});

// STAFF ROUTES
app.post('/api/staff', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const { staff_id, name, position, phone, email, salary, hire_date } = req.body;

    if (!staff_id || !name || !position || !salary) {
      return res.status(400).json({
        success: false,
        message: 'ID staff, nama, posisi, dan gaji harus diisi',
      });
    }

    const result = await db.execute({
      sql: `
        INSERT INTO staff (
          staff_id, name, position, phone, email, salary, hire_date, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [staff_id, name, position, phone, email, salary, hire_date, tenant_id],
    });

    res.status(201).json({
      success: true,
      message: 'Staff berhasil dibuat',
      data: { id: result.lastInsertRowid, staff_id },
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/staff', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await db.execute({
      sql: `
        SELECT * FROM staff
        WHERE tenant_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [tenant_id, limit, offset],
    });

    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM staff WHERE tenant_id = ?',
      args: [tenant_id],
    });

    const total = countResult.rows[0]?.total || 0;

    res.json({
      success: true,
      data: result.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/staff/:id', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const { position, salary, status } = req.body;

    const fields = [];
    const args = [];

    if (position) {
      fields.push('position = ?');
      args.push(position);
    }
    if (salary) {
      fields.push('salary = ?');
      args.push(salary);
    }
    if (status) {
      fields.push('status = ?');
      args.push(status);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    args.push(req.params.id, tenant_id);

    const result = await db.execute({
      sql: `UPDATE staff SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      args,
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Staff tidak ditemukan' });
    }

    res.json({ success: true, message: 'Staff berhasil diperbarui' });
  } catch (error) {
    next(error);
  }
});

// SERVICES ROUTES
app.post('/api/services', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const { service_id, name, price_per_kg, turnaround_days, description } = req.body;

    if (!service_id || !name || !price_per_kg || !turnaround_days) {
      return res.status(400).json({
        success: false,
        message: 'ID layanan, nama, harga per kg, dan hari selesai harus diisi',
      });
    }

    const result = await db.execute({
      sql: `
        INSERT INTO services (
          service_id, name, price_per_kg, turnaround_days, description, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [service_id, name, price_per_kg, turnaround_days, description, tenant_id],
    });

    res.status(201).json({
      success: true,
      message: 'Layanan berhasil dibuat',
      data: { id: result.lastInsertRowid, service_id },
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/services', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await db.execute({
      sql: `
        SELECT * FROM services
        WHERE tenant_id = ? AND active = 1
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [tenant_id, limit, offset],
    });

    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM services WHERE tenant_id = ? AND active = 1',
      args: [tenant_id],
    });

    const total = countResult.rows[0]?.total || 0;

    res.json({
      success: true,
      data: result.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/services/:id', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const { name, price_per_kg, turnaround_days, description, active } = req.body;

    const fields = [];
    const args = [];

    if (name) {
      fields.push('name = ?');
      args.push(name);
    }
    if (price_per_kg) {
      fields.push('price_per_kg = ?');
      args.push(price_per_kg);
    }
    if (turnaround_days) {
      fields.push('turnaround_days = ?');
      args.push(turnaround_days);
    }
    if (description) {
      fields.push('description = ?');
      args.push(description);
    }
    if (active !== undefined) {
      fields.push('active = ?');
      args.push(active);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    args.push(req.params.id, tenant_id);

    const result = await db.execute({
      sql: `UPDATE services SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      args,
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Layanan tidak ditemukan' });
    }

    res.json({ success: true, message: 'Layanan berhasil diperbarui' });
  } catch (error) {
    next(error);
  }
});

// PAYMENTS ROUTES
app.post('/api/payments', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const { payment_id, order_id, amount, payment_method, reference } = req.body;

    if (!payment_id || !order_id || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'ID pembayaran, ID pesanan, jumlah, dan metode pembayaran harus diisi',
      });
    }

    const result = await db.execute({
      sql: `
        INSERT INTO payments (
          payment_id, order_id, amount, payment_method, status, paid_date, reference, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        payment_id,
        order_id,
        amount,
        payment_method,
        'completed',
        new Date().toISOString().split('T')[0],
        reference,
        tenant_id,
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Pembayaran berhasil dicatat',
      data: { id: result.lastInsertRowid, payment_id },
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/payments', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await db.execute({
      sql: `
        SELECT * FROM payments
        WHERE tenant_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [tenant_id, limit, offset],
    });

    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM payments WHERE tenant_id = ?',
      args: [tenant_id],
    });

    const total = countResult.rows[0]?.total || 0;

    res.json({
      success: true,
      data: result.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

// INVENTORY ROUTES
app.post('/api/inventory', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const { item_id, item_name, category, quantity, unit, reorder_level, unit_cost } = req.body;

    if (!item_id || !item_name || !quantity || !unit_cost) {
      return res.status(400).json({
        success: false,
        message: 'ID item, nama item, kuantitas, dan biaya unit harus diisi',
      });
    }

    const result = await db.execute({
      sql: `
        INSERT INTO inventory (
          item_id, item_name, category, quantity, unit, reorder_level, unit_cost, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [item_id, item_name, category, quantity, unit, reorder_level, unit_cost, tenant_id],
    });

    res.status(201).json({
      success: true,
      message: 'Item inventori berhasil ditambahkan',
      data: { id: result.lastInsertRowid, item_id },
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/inventory', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await db.execute({
      sql: `
        SELECT * FROM inventory
        WHERE tenant_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [tenant_id, limit, offset],
    });

    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM inventory WHERE tenant_id = ?',
      args: [tenant_id],
    });

    const total = countResult.rows[0]?.total || 0;

    res.json({
      success: true,
      data: result.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/inventory/:id', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);
    const { quantity, reorder_level } = req.body;

    const fields = [];
    const args = [];

    if (quantity !== undefined) {
      fields.push('quantity = ?');
      args.push(quantity);
    }
    if (reorder_level !== undefined) {
      fields.push('reorder_level = ?');
      args.push(reorder_level);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    args.push(req.params.id, tenant_id);

    const result = await db.execute({
      sql: `UPDATE inventory SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      args,
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Item inventori tidak ditemukan' });
    }

    res.json({ success: true, message: 'Item inventori berhasil diperbarui' });
  } catch (error) {
    next(error);
  }
});

// ANALYTICS ROUTES
app.get('/api/analytics/dashboard', async (req, res, next) => {
  try {
    const tenant_id = getTenantId(req);

    const ordersCount = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM orders WHERE tenant_id = ?',
      args: [tenant_id],
    });

    const customersCount = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM customers WHERE tenant_id = ?',
      args: [tenant_id],
    });

    const revenue = await db.execute({
      sql: 'SELECT SUM(amount) as total FROM payments WHERE tenant_id = ? AND status = "completed"',
      args: [tenant_id],
    });

    const processingOrders = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM orders WHERE tenant_id = ? AND status = "processing"',
      args: [tenant_id],
    });

    res.json({
      success: true,
      data: {
        total_orders: ordersCount.rows[0]?.total || 0,
        total_customers: customersCount.rows[0]?.total || 0