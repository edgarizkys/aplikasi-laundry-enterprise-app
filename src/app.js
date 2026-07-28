I'll generate a production-ready Express.js backend for the Laundry Enterprise application. This is a substantial file, so I'll follow the chunked write protocol.

Let me start with the first chunk (imports, middleware, and database setup):
```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Database connection using Turso SQLite
const db = createClient({
  url: process.env.TURSO_CONNECTION_URL || 'file:./laundry.db',
  authToken: process.env.TURSO_AUTH_TOKEN
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token tidak valid' });
  }
};

// Database initialization
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
        items_count INTEGER NOT NULL,
        weight_kg REAL NOT NULL,
        service_type TEXT NOT NULL,
        total_price REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        pickup_date TEXT NOT NULL,
        delivery_date TEXT NOT NULL,
        assigned_staff TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT,
        loyalty_points INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        member_tier TEXT DEFAULT 'Regular',
        joined_date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Users/Auth table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'staff',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// ============ AUTHENTICATION ROUTES ============

// Register
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, dan password diperlukan' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.execute({
      sql: 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      args: [username, email, hashedPassword, role || 'staff']
    });

    res.status(201).json({
      message: 'Pengguna berhasil didaftar',
      user_id: result.lastInsertRowid
    });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username atau email sudah terdaftar' });
    }
    throw error;
  }
}));

// Login
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password diperlukan' });
  }

  const user = await db.execute({
    sql: 'SELECT * FROM users WHERE username = ?',
    args: [username]
  });

  if (user.rows.length === 0) {
    return res.status(401).json({ error: 'Username atau password salah' });
  }

  const dbUser = user.rows[0];
  const passwordMatch = await bcrypt.compare(password, dbUser.password);

  if (!passwordMatch) {
    return res.status(401).json({ error: 'Username atau password salah' });
  }

  const token = jwt.sign(
    { id: dbUser.id, username: dbUser.username, role: dbUser.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      role: dbUser.role
    }
  });
}));

// ============ ORDERS ROUTES ============

// Get all orders with pagination
app.get('/api/orders', authMiddleware, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM orders WHERE 1=1';
  const args = [];

  if (status) {
    query += ' AND status = ?';
    args.push(status);
  }

  if (search) {
    query += ' AND (customer_name LIKE ? OR order_number LIKE ? OR phone LIKE ?)';
    args.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(limit, offset);

  const result = await db.execute({ sql: query, args });
  
  const countResult = await db.execute({
    sql: 'SELECT COUNT(*) as total FROM orders',
    args: []
  });

  const total = countResult.rows[0].total;

  res.json({
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get single order
app.get('/api/orders/:id', authMiddleware, asyncHandler(async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM orders WHERE id = ?',
    args: [req.params.id]
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
  }

  res.json(result.rows[0]);
}));

// Create order
app.post('/api/orders', authMiddleware, asyncHandler(async (req, res) => {
  const {
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
    notes
  } = req.body;

  if (!customer_name || !phone || !weight_kg || !service_type || !total_price) {
    return res.status(400).json({ error: 'Field wajib diisi' });
  }

  const order_number = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const result = await db.execute({
    sql: `INSERT INTO orders 
          (order_number, customer_id, customer_name, phone, items_count, weight_kg, service_type, total_price, status, pickup_date, delivery_date, assigned_staff, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      order_number,
      customer_id || `CUST-${uuidv4().substr(0, 8).toUpperCase()}`,
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
      notes || ''
    ]
  });

  res.status(201).json({
    message: 'Pesanan berhasil dibuat',
    order_id: result.lastInsertRowid,
    order_number
  });
}));

// Update order
app.put('/api/orders/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { status, assigned_staff, notes, delivery_date } = req.body;

  const result = await db.execute({
    sql: 'SELECT * FROM orders WHERE id = ?',
    args: [req.params.id]
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
  }

  const order = result.rows[0];
  const updatedStatus = status || order.status;
  const updatedStaff = assigned_staff || order.assigned_staff;
  const updatedNotes = notes !== undefined ? notes : order.notes;
  const updatedDeliveryDate = delivery_date || order.delivery_date;

  await db.execute({
    sql: `UPDATE orders 
          SET status = ?, assigned_staff = ?, notes = ?, delivery_date = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    args: [updatedStatus, updatedStaff, updatedNotes, updatedDeliveryDate, req.params.id]
  });

  res.json({ message: 'Pesanan berhasil diperbarui' });
}));

// Delete order
app.delete('/api/orders/:id', authMiddleware, asyncHandler(async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM orders WHERE id = ?',
    args: [req.params.id]
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
  }

  await db.execute({
    sql: 'DELETE FROM orders WHERE id = ?',
    args: [req.params.id]
  });

  res.json({ message: 'Pesanan berhasil dihapus' });
}));
```

Now let me append the customers routes (chunk 2):
```javascript
// ============ CUSTOMERS ROUTES ============

// Get all customers with pagination
app.get('/api/customers', authMiddleware, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, tier } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM customers WHERE 1=1';
  const args = [];

  if (search) {
    query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
    args.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (tier) {
    query += ' AND member_tier = ?';
    args.push(tier);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(limit, offset);

  const result = await db.execute({ sql: query, args });
  
  const countResult = await db.execute({
    sql: 'SELECT COUNT(*) as total FROM customers'
  });

  const total = countResult.rows[0].total;

  res.json({
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get single customer
app.get('/api/customers/:id', authMiddleware, asyncHandler(async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM customers WHERE id = ?',
    args: [req.params.id]
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Pelanggan tidak ditemukan' });
  }

  res.json(result.rows[0]);
}));

// Create customer
app.post('/api/customers', authMiddleware, asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    email,
    address,
    member_tier
  } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Nama dan telepon diperlukan' });
  }

  const customer_id = `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const joined_date = new Date().toISOString().split('T')[0];

  const result = await db.execute({
    sql: `INSERT INTO customers 
          (customer_id, name, phone, email, address, member_tier, joined_date)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      customer_id,
      name,
      phone,
      email || '',
      address || '',
      member_tier || 'Regular',
      joined_date
    ]
  });

  res.status(201).json({
    message: 'Pelanggan berhasil ditambahkan',
    customer_id: result.lastInsertRowid,
    cust_id: customer_id
  });
}));

// Update customer
app.put('/api/customers/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { name, phone, email, address, member_tier, loyalty_points, total_spent } = req.body;

  const result = await db.execute({
    sql: 'SELECT * FROM customers WHERE id = ?',
    args: [req.params.id]
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Pelanggan tidak ditemukan' });
  }

  const customer = result.rows[0];

  await db.execute({
    sql: `UPDATE customers 
          SET name = ?, phone = ?, email = ?, address = ?, member_tier = ?, loyalty_points = ?, total_spent = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    args: [
      name || customer.name,
      phone || customer.phone,
      email !== undefined ? email : customer.email,
      address !== undefined ? address : customer.address,
      member_tier || customer.member_tier,
      loyalty_points !== undefined ? loyalty_points : customer.loyalty_points,
      total_spent !== undefined ? total_spent : customer.total_spent,
      req.params.id
    ]
  });

  res.json({ message: 'Pelanggan berhasil diperbarui' });
}));

// Add loyalty points
app.post('/api/customers/:id/loyalty', authMiddleware, asyncHandler(async (req, res) => {
  const { points } = req.body;

  if (points === undefined) {
    return res.status(400).json({ error: 'Poin diperlukan' });
  }

  const result = await db.execute({
    sql: 'SELECT * FROM customers WHERE id = ?',
    args: [req.params.id]
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Pelanggan tidak ditemukan' });
  }

  const customer = result.rows[0];
  const newPoints = (customer.loyalty_points || 0) + points;

  await db.execute({
    sql: 'UPDATE customers SET loyalty_points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [newPoints, req.params.id]
  });

  res.json({ message: 'Poin loyalitas berhasil ditambahkan', new_points: newPoints });
}));

// Delete customer
app.delete('/api/customers/:id', authMiddleware, asyncHandler(async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM customers WHERE id = ?',
    args: [req.params.id]
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Pelanggan tidak ditemukan' });
  }

  await db.execute({
    sql: 'DELETE FROM customers WHERE id = ?',
    args: [req.params.id]
  });

  res.json({ message: 'Pelanggan berhasil dihapus' });
}));

// ============ STAFF ROUTES ============

// Get all staff with pagination
app.get('/api/staff', authMiddleware, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, position, status } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM staff WHERE 1=1';
  const args = [];

  if (position) {
    query += ' AND position = ?';
    args.push(position);
  }

  if (status) {
    query += ' AND status = ?';
    args.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(limit, offset);

  const result = await db.execute({ sql: query, args });
  
  const countResult = await db.execute({
    sql: 'SELECT COUNT(*) as total FROM staff'
  });

  const total = countResult.rows[0].total;

  res.json({
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get single staff
app.get('/api/staff/:id', authMiddleware, asyncHandler(async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM staff WHERE id = ?',
    args: [req.params.id]
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Staff tidak ditemukan' });
  }

  res.json(result.rows[0]);
}));

// Create staff
app.post('/api/staff', authMiddleware, asyncHandler(async (req, res) => {
  const {
    name,
    position,
    phone,
    email,
    salary,
    hire_date,
    status
  } = req.body;

  if (!name || !position || !phone || !salary) {
    return res.status(400).json({ error: 'Field wajib diisi' });
  }

  const staff_id = `STF-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  const result = await db.execute({
    sql: `INSERT INTO staff 
          (staff_id, name, position, phone, email, salary, hire_date, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      staff_id,
      name,
      position,
      phone,
      email || '',
      salary,
      hire_date,
      status || 'active'
    ]
  });

  res.status(201).json({
    message: 'Staff berhasil ditambahkan',
    staff_id: result.lastInsertRowid,
    stf_id: staff_id
  });
}));

// Update staff
app.put('/api/staff/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { name, position, phone, email, salary, hire_date, status } = req.body;

  const result = await db.execute({
    sql: 'SELECT * FROM staff WHERE id = ?',
    args: [req.params.id]
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Staff tidak ditemukan' });
  }

  const staff = result.rows[0];

  await db.execute({
    sql: `UPDATE staff 
          SET name = ?, position = ?, phone = ?, email = ?, salary = ?, hire_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    args: [
      name || staff.name,
      position || staff.position,
      phone || staff.phone,
      email !== undefined ? email : staff.email,
      salary !== undefined ? salary : staff.salary,
      hire_date || staff.hire_date,
      status || staff.status,
      req.params.id
    ]
  });

  res.json({ message: 'Staff berhasil diperbarui' });
}));

// Delete staff
app.delete('/api/staff/:id', authMiddleware, asyncHandler(async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM staff WHERE id = ?',
    args: [req.params.id]
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Staff tidak ditemukan' });
  }

  await db.execute({
    sql: 'DELETE FROM staff WHERE id = ?',
    args: [req.params.id]
  });

  res.json({ message: 'Staff berhasil dihapus' });
}));
```

Append chunk 3 - Services routes:
```javascript
// ============ SERVICES ROUTES ============

// Get all services
app.get('/api/services', authMiddleware, asyncHandler(async (req, res) => {
  const { active } = req.query;

  let query = 'SELECT * FROM services WHERE 1=1';
  const args = [];

  if (active !== undefined) {
    query += ' AND active = ?';
    args.push(active === 'true' ? 1 : 0);
  }

  query += ' ORDER BY created_at DESC';

  const result = await db.execute({ sql: query, args });
  res.json(result.rows);
}));

// Get single service
app.get('/api/services/:id', authMiddleware, asyncHandler(async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM services WHERE id = ?',
    args: [req.params.id]
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Layanan tidak ditemukan' });
  }

  res.json(result.rows[0]);
}));

// Create service
app.post('/api/services', authMiddleware, asyncHandler(async (req, res) => {
  const {
    name,
    price_per_kg,
    turnaround_days,
    description,
    active
  } = req.body;

  if (!name || !price_per_kg || !turnaround_days) {
    return res.status(400).json({ error: 'Field wajib diisi' });
  }

  const service_id = `SVC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  const result = await db.execute({
    sql: `INSERT INTO services 
          (service_id, name, price_per_kg, turnaround_days, description, active)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      service_id,
      name,
      price_per_kg,
      turnaround_days,
      description || '',
      active !== false ? 1 : 0
    ]
  });

  res.status(201).json({
    message: 'Layanan berhasil dibuat',
    service_id: result.lastInsertRowid,
    svc_id: service_id
  });
}));

// Update service
app.put('/api/services/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { name, price_per_kg, turnaround_days, description, active } = req.body;

  const result = await db.execute({
    sql: 'SELECT * FROM services WHERE id = ?',
    args: [req.params.id]
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Layanan tidak ditemukan' });
  }

  const service = result.rows[0];

  await db.execute({
    sql: `UPDATE services 
          SET name = ?, price_per_kg = ?, turnaround_days = ?, description = ?, active = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    args: [
      name || service.name,
      price_per_kg !== undefined ? price_per_kg : service.price_per_kg,
      turnaround_days !== undefined ? turnaround_days : service.turnaround_days,
      description !== undefined ? description : service.description,
      active !== undefined ? (active ? 1 : 0) : service.active,
      req.params.id
    ]
  });

  res.json({ message: 'Layanan berhasil diperbarui' });
}));

// Delete service
app.delete('/api/services/:id', authMiddleware, asyncHandler(async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM services WHERE id = ?',
    args: [req.params.id]
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Layanan tidak ditemukan' });
  }

  await db.execute({
    sql: 'DELETE FROM services WHERE id = ?',
    args: [req.params.id]
  });

  res.json({ message: 'Layanan berhasil dihapus' });
}));

// ============ PAYMENTS ROUTES ============

// Get all payments with pagination
app.get('/api/payments', authMiddleware, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, order_id } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM payments WHERE 1=1';
  const args = [];

  if (status) {
    query += ' AND status = ?';
    args.push(status);
  }

  if (order_id) {
    query += ' AND order_id = ?';
    args.push(order_id);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(limit, offset);

  const result = await db.execute({ sql: query, args });
  
  const countResult = await db.execute({
    sql: 'SELECT COUNT(*) as total FROM payments'
  });

  const total = countResult.rows[0].total;

  res.json({
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get single payment
app.get('/api/payments/:id', authMiddleware, asyncHandler(async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM payments WHERE id = ?',
    args: [req.params.id]
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
  }

  res.json(