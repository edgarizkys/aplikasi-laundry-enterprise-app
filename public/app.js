I'll generate the production-ready `app.js` for the Laundry Enterprise application. This will be a comprehensive Express.js backend with multi-tenant support, proper error handling, and all required features.

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import Joi from 'joi';

dotenv.config();

const app = express();

// Turso SQLite Client
const db = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Terlalu banyak permintaan, silakan coba lagi nanti.',
});
app.use('/api/', limiter);

// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// ==================== TYPES & INTERFACES ====================

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} tidak ditemukan`, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Tidak diizinkan') {
    super(message, 401);
  }
}

// ==================== UTILITIES ====================

const hashPassword = async (password) => bcrypt.hash(password, 10);
const comparePassword = async (password, hash) => bcrypt.compare(password, hash);

const generateToken = (userId, tenantId, role) => {
  return jwt.sign(
    { userId, tenantId, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new UnauthorizedError('Token tidak valid atau sudah kadaluarsa');
  }
};

const validateSchema = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(d => d.message).join(', ');
    throw new ValidationError(messages);
  }
  req.validatedData = value;
  next();
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==================== MIDDLEWARE ====================

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token tidak ditemukan');
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  req.user = decoded;
  next();
});

const tenantMiddleware = (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
  if (!tenantId) {
    throw new UnauthorizedError('Tenant ID diperlukan');
  }
  req.tenantId = tenantId;
  next();
};

// ==================== ERROR HANDLING ====================

const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      statusCode: err.statusCode,
    });
  }

  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: err.details,
      statusCode: 400,
    });
  }

  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    statusCode: 500,
  });
};

// ==================== DATABASE INITIALIZATION ====================

const initializeDatabase = async () => {
  try {
    // Users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tenant_id, email)
      )
    `);

    // Orders table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        order_id TEXT NOT NULL UNIQUE,
        customer_id TEXT,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        items TEXT NOT NULL,
        weight_kg REAL NOT NULL,
        service_type TEXT NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        pickup_date DATE,
        delivery_date DATE,
        branch_id TEXT,
        assigned_staff TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        INDEX idx_order_id (order_id),
        INDEX idx_status (status),
        INDEX idx_pickup_date (pickup_date)
      )
    `);

    // Customers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        customer_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT,
        city TEXT,
        member_type TEXT DEFAULT 'regular',
        points INTEGER DEFAULT 0,
        total_orders INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        join_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        INDEX idx_customer_id (customer_id),
        INDEX idx_phone (phone)
      )
    `);

    // Branches table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        branch_id TEXT NOT NULL UNIQUE,
        branch_name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT,
        manager_name TEXT,
        capacity REAL,
        opening_hours TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        INDEX idx_branch_id (branch_id)
      )
    `);

    // Staff table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        staff_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        role TEXT NOT NULL,
        branch_id TEXT,
        salary REAL,
        join_date DATE,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        INDEX idx_staff_id (staff_id),
        INDEX idx_branch_id (branch_id)
      )
    `);

    // Services table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        service_id TEXT NOT NULL UNIQUE,
        service_name TEXT NOT NULL,
        description TEXT,
        price_per_kg REAL NOT NULL,
        turnaround_time INTEGER,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        INDEX idx_service_id (service_id)
      )
    `);

    // Payments table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        payment_id TEXT NOT NULL UNIQUE,
        order_id TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_date DATE,
        reference_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        INDEX idx_payment_id (payment_id),
        INDEX idx_order_id (order_id),
        FOREIGN KEY (order_id) REFERENCES orders(order_id)
      )
    `);

    console.log('✓ Database initialized successfully');
  } catch (error) {
    console.error('✗ Database initialization error:', error);
    throw error;
  }
};

// ==================== AUTHENTICATION ROUTES ====================

const authLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  tenantId: Joi.string().required(),
});

const authRegisterSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  tenantId: Joi.string().required(),
});

app.post('/api/auth/register', validateSchema(authRegisterSchema), asyncHandler(async (req, res) => {
  const { name, email, password, tenantId } = req.validatedData;

  const existingUser = await db.execute(
    'SELECT id FROM users WHERE tenant_id = ? AND email = ?',
    [tenantId, email]
  );

  if (existingUser.rows.length > 0) {
    throw new ValidationError('Email sudah terdaftar');
  }

  const userId = uuidv4();
  const hashedPassword = await hashPassword(password);

  await db.execute(
    `INSERT INTO users (id, tenant_id, name, email, password, role)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, tenantId, name, email, hashedPassword, 'staff']
  );

  const token = generateToken(userId, tenantId, 'staff');

  res.status(201).json({
    success: true,
    message: 'Pendaftaran berhasil',
    data: {
      userId,
      tenantId,
      name,
      email,
      token,
    },
  });
}));

app.post('/api/auth/login', validateSchema(authLoginSchema), asyncHandler(async (req, res) => {
  const { email, password, tenantId } = req.validatedData;

  const result = await db.execute(
    'SELECT id, name, role, password FROM users WHERE tenant_id = ? AND email = ? AND status = ?',
    [tenantId, email, 'active']
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Email atau password salah');
  }

  const user = result.rows[0];
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Email atau password salah');
  }

  const token = generateToken(user.id, tenantId, user.role);

  res.json({
    success: true,
    message: 'Login berhasil',
    data: {
      userId: user.id,
      name: user.name,
      email,
      role: user.role,
      tenantId,
      token,
    },
  });
}));

app.post('/api/auth/verify-token', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Token valid',
    data: req.user,
  });
});

// ==================== ORDERS ROUTES ====================

const createOrderSchema = Joi.object({
  customer_name: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().email(),
  items: Joi.string().required(),
  weight_kg: Joi.number().positive().required(),
  service_type: Joi.string().required(),
  unit_price: Joi.number().positive().required(),
  total_price: Joi.number().positive().required(),
  pickup_date: Joi.date().iso(),
  delivery_date: Joi.date().iso(),
  branch_id: Joi.string(),
  assigned_staff: Joi.string(),
  notes: Joi.string(),
  customer_id: Joi.string(),
});

const updateOrderSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'completed', 'cancelled'),
  pickup_date: Joi.date().iso(),
  delivery_date: Joi.date().iso(),
  assigned_staff: Joi.string(),
  notes: Joi.string(),
  total_price: Joi.number().positive(),
});

app.post('/api/orders', authMiddleware, tenantMiddleware, validateSchema(createOrderSchema), asyncHandler(async (req, res) => {
  const { customer_name, phone, email, items, weight_kg, service_type, unit_price, total_price, pickup_date, delivery_date, branch_id, assigned_staff, notes, customer_id } = req.validatedData;
  const { tenantId } = req;

  const orderId = `ORD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const id = uuidv4();

  await db.execute(
    `INSERT INTO orders (id, tenant_id, order_id, customer_id, customer_name, phone, email, items, weight_kg, service_type, unit_price, total_price, pickup_date, delivery_date, branch_id, assigned_staff, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, orderId, customer_id || null, customer_name, phone, email || null, items, weight_kg, service_type, unit_price, total_price, pickup_date || null, delivery_date || null, branch_id || null, assigned_staff || null, notes || null, 'pending']
  );

  res.status(201).json({
    success: true,
    message: 'Pesanan berhasil dibuat',
    data: {
      id,
      order_id: orderId,
      customer_name,
      phone,
      items,
      weight_kg,
      service_type,
      total_price,
      status: 'pending',
    },
  });
}));

app.get('/api/orders', authMiddleware, tenantMiddleware, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, branch_id } = req.query;
  const { tenantId } = req;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = 'SELECT * FROM orders WHERE tenant_id = ?';
  const params = [tenantId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (branch_id) {
    query += ' AND branch_id = ?';
    params.push(branch_id);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const result = await db.execute(query, params);

  const countResult = await db.execute(
    `SELECT COUNT(*) as total FROM orders WHERE tenant_id = ? ${status ? 'AND status = ?' : ''} ${branch_id ? 'AND branch_id = ?' : ''}`,
    status && branch_id ? [tenantId, status, branch_id] : status ? [tenantId, status] : branch_id ? [tenantId, branch_id] : [tenantId]
  );

  const total = countResult.rows[0].total;

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
}));

app.get('/api/orders/:orderId', authMiddleware, tenantMiddleware, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { tenantId } = req;

  const result = await db.execute(
    'SELECT * FROM orders WHERE tenant_id = ? AND order_id = ?',
    [tenantId, orderId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Pesanan');
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
}));

app.put('/api/orders/:orderId', authMiddleware, tenantMiddleware, validateSchema(updateOrderSchema), asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { tenantId } = req;
  const updates = req.validatedData;

  const existing = await db.execute(
    'SELECT id FROM orders WHERE tenant_id = ? AND order_id = ?',
    [tenantId, orderId]
  );

  if (existing.rows.length === 0) {
    throw new NotFoundError('Pesanan');
  }

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), tenantId, orderId];

  await db.execute(
    `UPDATE orders SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = ? AND order_id = ?`,
    values
  );

  res.json({
    success: true,
    message: 'Pesanan berhasil diperbarui',
    data: updates,
  });
}));

app.delete('/api/orders/:orderId', authMiddleware, tenantMiddleware, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { tenantId } = req;

  const result = await db.execute(
    'DELETE FROM orders WHERE tenant_id = ? AND order_id = ?',
    [tenantId, orderId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Pesanan');
  }

  res.json({
    success: true,
    message: 'Pesanan berhasil dihapus',
  });
}));

// ==================== CUSTOMERS ROUTES ====================

const createCustomerSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().email(),
  address: Joi.string(),
  city: Joi.string(),
  member_type: Joi.string().valid('regular', 'silver', 'gold'),
  join_date: Joi.date().iso(),
});

const updateCustomerSchema = Joi.object({
  name: Joi.string(),
  phone: Joi.string(),
  email: Joi.string().email(),
  address: Joi.string(),
  city: Joi.string(),
  member_type: Joi.string().valid('regular', 'silver', 'gold'),
  points: Joi.number().integer().min(0),
  total_spent: Joi.number().positive(),
});

app.post('/api/customers', authMiddleware, tenantMiddleware, validateSchema(createCustomerSchema), asyncHandler(async (req, res) => {
  const { name, phone, email, address, city, member_type = 'regular', join_date } = req.validatedData;
  const { tenantId } = req;

  const customerId = `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const id = uuidv4();

  await db.execute(
    `INSERT INTO customers (id, tenant_id, customer_id, name, phone, email, address, city, member_type, join_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, customerId, name, phone, email || null, address || null, city || null, member_type, join_date || new Date().toISOString().split('T')[0]]
  );

  res.status(201).json({
    success: true,
    message: 'Pelanggan berhasil ditambahkan',
    data: {
      id,
      customer_id: customerId,
      name,
      phone,
      email,
      member_type,
    },
  });
}));

app.get('/api/customers', authMiddleware, tenantMiddleware, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, member_type } = req.query;
  const { tenantId } = req;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = 'SELECT * FROM customers WHERE tenant_id = ?';
  const params = [tenantId];

  if (member_type) {
    query += ' AND member_type = ?';
    params.push(member_type);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const result = await db.execute(query, params);

  const countResult = await db.execute(
    `SELECT COUNT(*) as total FROM customers WHERE tenant_id = ? ${member_type ? 'AND member_type = ?' : ''}`,
    member_type ? [tenantId, member_type] : [tenantId]
  );

  const total = countResult.rows[0].total;

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
}));

app.get('/api/customers/:customerId', authMiddleware, tenantMiddleware, asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { tenantId } = req;

  const result = await db.execute(
    'SELECT * FROM customers WHERE tenant_id = ? AND customer_id = ?',
    [tenantId, customerId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Pelanggan');
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
}));

app.put('/api/customers/:customerId', authMiddleware, tenantMiddleware, validateSchema(updateCustomerSchema), asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { tenantId } = req;
  const updates = req.validatedData;

  const existing = await db.execute(
    'SELECT id FROM customers WHERE tenant_id = ? AND customer_id = ?',
    [tenantId, customerId]
  );

  if (existing.rows.length === 0) {
    throw new NotFoundError('Pelanggan');
  }

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), tenantId, customerId];

  await db.execute(
    `UPDATE customers SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = ? AND customer_id = ?`,
    values
  );

  res.json({
    success: true,
    message: 'Pelanggan berhasil diperbarui',
    data: updates,
  });
}));

app.delete('/api/customers/:customerId', authMiddleware, tenantMiddleware, asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { tenantId } = req;

  await db.execute(
    'DELETE FROM customers WHERE tenant_id = ? AND customer_id = ?',
    [tenantId, customerId]
  );

  res.json({
    success: true,
    message: 'Pelanggan berhasil dihapus',
  });
}));

// ==================== BRANCHES ROUTES ====================

const createBranchSchema = Joi.object({
  branch_name: Joi.string().required(),
  address: Joi.string().required(),
  phone: Joi.string(),
  manager_name: Joi.string(),
  capacity: Joi.number().positive(),
  opening_hours: Joi.string(),
});

const updateBranchSchema = Joi.object({
  branch_name: Joi.string(),
  address: Joi.string(),
  phone: Joi.string(),
  manager_name: Joi.string(),
  capacity: Joi.number().positive(),
  opening_hours: Joi.string(),
  status: Joi.string().valid('active', 'inactive'),
});

app.post('/api/branches', authMiddleware, tenantMiddleware, validateSchema(createBranchSchema), asyncHandler(async (req, res) => {
  const { branch_name, address, phone, manager_name, capacity, opening_hours } = req.validatedData;
  const { tenantId } = req;

  const branchId = `BR-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const id = uuidv4();

  await db.execute(
    `INSERT INTO branches (id, tenant_id, branch_id, branch_name, address, phone, manager_name, capacity, opening_hours)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, branchId, branch_name, address, phone || null, manager_name || null, capacity || null, opening_hours || null]
  );

  res.status(201).json({
    success: true,
    message: 'Cabang berhasil ditambahkan',
    data: {
      id,
      branch_id: branchId,
      branch_name,
      address,
      status: 'active',
    },
  });
}));

app.get('/api/branches', authMiddleware, tenantMiddleware, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const { tenantId } = req;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = 'SELECT * FROM branches WHERE tenant_id = ?';
  const params = [tenantId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const result = await db.execute(query, params);

  const countResult = await db.execute(
    `SELECT COUNT(*) as total FROM branches WHERE tenant_id = ? ${status ? 'AND status = ?' : ''}`,
    status ? [tenantId, status] : [tenantId]
  );

  const total = countResult.rows[0].total;

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
}));

app.get('/api/branches/:branchId', authMiddleware, tenantMiddleware, asyncHandler(async (req, res) => {
  const { branchId } = req.params;
  const { tenantId } = req;

  const result = await db.execute(
    'SELECT * FROM branches WHERE tenant_id = ? AND branch_id = ?',
    [tenantId, branchId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Cabang');
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
}));

app.put('/api/branches/:branchId', authMiddleware, tenantMiddleware, validateSchema(updateBranchSchema), asyncHandler(async (req, res) => {
  const { branchId } = req.params;
  const { tenantId } = req;
  const updates = req.validatedData;

  const existing = await db.execute(
    'SELECT id FROM branches WHERE tenant_id = ? AND branch_id = ?',
    [tenantId, branchId]
  );

  if (existing.rows.length === 0) {
    throw new NotFoundError('Cabang');
  }

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), tenantId, branchId];

  await db.execute(
    `UPDATE branches SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = ? AND branch_id = ?`,
    values
  );

  res.json({
    success: true,
    message: 'Cabang berhasil diperbarui',
    data: updates,
  });
}));

app.delete('/api/branches/:branchId', authMiddleware, tenantMiddleware, asyncHandler(async (req, res) => {
  const { branchId } = req.params;
  const { tenantId } = req;

  await db.execute(
    'DELETE FROM branches WHERE tenant_id = ? AND branch_id = ?',
    [tenantId, branchId]
  );

  res.json({
    success: true,
    message: 'Cabang berhasil dihapus',