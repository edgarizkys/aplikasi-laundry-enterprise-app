I'll generate a production-ready Express.js backend for the Laundry Enterprise application. This will be chunked according to the protocol.

**CHUNK 1: app.js (Initial Setup - Lines 1-300)**
<function_calls>
<invoke name="write_to_file">
<parameter name="path">app.js</parameter>
<parameter name="content">const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@libsql/client');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Turso SQLite Client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

// Global DB reference
app.locals.db = db;

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

async function initializeDatabase() {
  try {
    // Orders Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        items_list TEXT NOT NULL,
        total_weight_kg REAL NOT NULL,
        service_type TEXT NOT NULL,
        total_price REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        pickup_date DATE NOT NULL,
        delivery_date DATE NOT NULL,
        assigned_staff TEXT,
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
        address TEXT,
        city TEXT,
        loyalty_points INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        registration_date DATE DEFAULT CURRENT_DATE,
        branch_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Staff Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        shift TEXT,
        salary REAL,
        join_date DATE NOT NULL,
        status TEXT DEFAULT 'aktif',
        branch_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Machines Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS machines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        capacity_kg REAL NOT NULL,
        location TEXT,
        status TEXT DEFAULT 'aktif',
        last_maintenance DATE,
        next_maintenance DATE,
        branch_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_id TEXT UNIQUE NOT NULL,
        order_number TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_date DATE,
        reference_number TEXT,
        branch_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_number) REFERENCES orders(order_number)
      )
    `);

    // Branches Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        branch_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        manager_name TEXT,
        operating_hours TEXT,
        total_machines INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await db.execute('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_name)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_customers_branch ON customers(branch_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_staff_branch ON staff(branch_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_machines_branch ON machines(branch_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_payments_branch ON payments(branch_id)');

    console.log('✓ Database initialized successfully');
  } catch (error) {
    console.error('✗ Database initialization error:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(prefix) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

function formatResponse(data, message = 'Success', statusCode = 200) {
  return {
    statusCode,
    success: statusCode < 400,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

function errorResponse(message, statusCode = 400, details = null) {
  return {
    statusCode,
    success: false,
    message,
    details,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Branch validation middleware
app.use((req, res, next) => {
  const branchId = req.query.branch_id || req.body.branch_id || 'BRANCH-001';
  req.branchId = branchId;
  next();
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json(
    errorResponse(
      err.message || 'Internal Server Error',
      err.status || 500,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    )
  );
});

// ============================================================================
// ORDERS ROUTES
// ============================================================================

// Get all orders with pagination
app.get('/api/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM orders WHERE branch_id = ? ';
    const params = [req.branchId];

    if (status) {
      query += 'AND status = ? ';
      params.push(status);
    }

    query += 'ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await db.execute({
      sql: query,
      args: params
    });

    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM orders WHERE branch_id = ?' + (status ? ' AND status = ?' : ''),
      args: status ? [req.branchId, status] : [req.branchId]
    });

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json(formatResponse({
      orders: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }, 'Orders retrieved successfully'));
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json(errorResponse('Failed to fetch orders', 500, error.message));
  }
});

// Get single order
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM orders WHERE id = ? AND branch_id = ?',
      args: [parseInt(req.params.orderId), req.branchId]
    });

    if (!result.rows.length) {
      return res.status(404).json(errorResponse('Order not found', 404));
    }

    res.json(formatResponse(result.rows[0], 'Order retrieved successfully'));
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json(errorResponse('Failed to fetch order', 500, error.message));
  }
});

// Create new order
app.post('/api/orders', async (req, res) => {
  try {
    const {
      customer_name,
      phone,
      email,
      items_list,
      total_weight_kg,
      service_type,
      total_price,
      pickup_date,
      delivery_date,
      assigned_staff,
      notes
    } = req.body;

    // Validation
    if (!customer_name || !phone || !items_list || !total_weight_kg || !service_type || !total_price || !pickup_date || !delivery_date) {
      return res.status(400).json(errorResponse('Missing required fields', 400));
    }

    const order_number = generateId('ORD');

    const result = await db.execute({
      sql: `INSERT INTO orders 
        (order_number, customer_name, phone, email, items_list, total_weight_kg, 
         service_type, total_price, status, pickup_date, delivery_date, 
         assigned_staff, notes, branch_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [
        order_number, customer_name, phone, email || null, items_list, total_weight_kg,
        service_type, total_price, 'pending', pickup_date, delivery_date,
        assigned_staff || null, notes || null, req.branchId
      ]
    });

    res.status(201).json(formatResponse({
      id: result.lastInsertRowid,
      order_number,
      ...req.body
    }, 'Order created successfully', 201));
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json(errorResponse('Failed to create order', 500, error.message));
  }
});

// Update order
app.put('/api/orders/:orderId', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const updates = req.body;

    // Build update query
    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'order_number' && key !== 'branch_id') {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json(errorResponse('No fields to update', 400));
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(orderId, req.branchId);

    const result = await db.execute({
      sql: `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ? AND branch_id = ?`,
      args: values
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json(errorResponse('Order not found', 404));
    }

    res.json(formatResponse(updates, 'Order updated successfully'));
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json(errorResponse('Failed to update order', 500, error.message));
  }
});

// Delete order
app.delete('/api/orders/:orderId', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);

    const result = await db.execute({
      sql: 'DELETE FROM orders WHERE id = ? AND branch_id = ?',
      args: [orderId, req.branchId]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json(errorResponse('Order not found', 404));
    }

    res.json(formatResponse(null, 'Order deleted successfully'));
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json(errorResponse('Failed to delete order', 500, error.message));
  }
});

// ============================================================================
// CUSTOMERS ROUTES
// ============================================================================

// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await db.execute({
      sql: `SELECT * FROM customers WHERE branch_id = ? 
            ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      args: [req.branchId, limit, offset]
    });

    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM customers WHERE branch_id = ?',
      args: [req.branchId]
    });

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json(formatResponse({
      customers: result.rows,
      pagination: { page, limit, total, totalPages }
    }, 'Customers retrieved successfully'));
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json(errorResponse('Failed to fetch customers', 500, error.message));
  }
});

// Get single customer
app.get('/api/customers/:customerId', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM customers WHERE id = ? AND branch_id = ?',
      args: [parseInt(req.params.customerId), req.branchId]
    });

    if (!result.rows.length) {
      return res.status(404).json(errorResponse('Customer not found', 404));
    }

    res.json(formatResponse(result.rows[0], 'Customer retrieved successfully'));
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json(errorResponse('Failed to fetch customer', 500, error.message));
  }
});

// Create customer
app.post('/api/customers', async (req, res) => {
  try {
    const { name, phone, email, address, city } = req.body;

    if (!name || !phone) {
      return res.status(400).json(errorResponse('Missing required fields', 400));
    }

    const customer_id = generateId('CUST');

    const result = await db.execute({
      sql: `INSERT INTO customers 
        (customer_id, name, phone, email, address, city, branch_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [customer_id, name, phone, email || null, address || null, city || null, req.branchId]
    });

    res.status(201).json(formatResponse({
      id: result.lastInsertRowid,
      customer_id,
      ...req.body
    }, 'Customer created successfully', 201));
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json(errorResponse('Failed to create customer', 500, error.message));
  }
});

// Update customer
app.put('/api/customers/:customerId', async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const updates = req.body;

    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'customer_id' && key !== 'branch_id') {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json(errorResponse('No fields to update', 400));
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(customerId, req.branchId);

    const result = await db.execute({
      sql: `UPDATE customers SET ${updateFields.join(', ')} WHERE id = ? AND branch_id = ?`,
      args: values
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json(errorResponse('Customer not found', 404));
    }

    res.json(formatResponse(updates, 'Customer updated successfully'));
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json(errorResponse('Failed to update customer', 500, error.message));
  }
});

// Delete customer
app.delete('/api/customers/:customerId', async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);

    const result = await db.execute({
      sql: 'DELETE FROM customers WHERE id = ? AND branch_id = ?',
      args: [customerId, req.branchId]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json(errorResponse('Customer not found', 404));
    }

    res.json(formatResponse(null, 'Customer deleted successfully'));
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json(errorResponse('Failed to delete customer', 500, error.message));
  }
});

// Add loyalty points
app.post('/api/customers/:customerId/loyalty', async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const { points } = req.body;

    if (!points || typeof points !== 'number') {
      return res.status(400).json(errorResponse('Invalid points value', 400));
    }

    const result = await db.execute({
      sql: `UPDATE customers SET loyalty_points = loyalty_points + ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND branch_id = ?`,
      args: [points, customerId, req.branchId]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json(errorResponse('Customer not found', 404));
    }

    res.json(formatResponse({ points_added: points }, 'Loyalty points added successfully'));
  } catch (error) {
    console.error('Error adding loyalty points:', error);
    res.status(500).json(errorResponse('Failed to add loyalty points', 500, error.message));
  }
});

// Get customer orders
app.get('/api/customers/:customerId/orders', async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);

    const customerResult = await db.execute({
      sql: 'SELECT name FROM customers WHERE id = ? AND branch_id = ?',
      args: [customerId, req.branchId]
    });

    if (!customerResult.rows.length) {
      return res.status(404).json(errorResponse('Customer not found', 404));
    }

    const customerName = customerResult.rows[0].name;

    const ordersResult = await db.execute({
      sql: `SELECT * FROM orders WHERE customer_name = ? AND branch_id = ? 
            ORDER BY created_at DESC`,
      args: [customerName, req.branchId]
    });

    res.json(formatResponse({
      customer_name: customerName,
      orders: ordersResult.rows
    }, 'Customer orders retrieved successfully'));
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json(errorResponse('Failed to fetch customer orders', 500, error.message));
  }
});

// ============================================================================
// STAFF ROUTES
// ============================================================================

// Get all staff
app.get('/api/staff', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await db.execute({
      sql: `SELECT * FROM staff WHERE branch_id = ? 
            ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      args: [req.branchId, limit, offset]
    });

    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM staff WHERE branch_id = ?',
      args: [req.branchId]
    });

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json(formatResponse({
      staff: result.rows,
      pagination: { page, limit, total, totalPages }
    }, 'Staff retrieved successfully'));
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json(errorResponse('Failed to fetch staff', 500, error.message));
  }
});

// Get single staff member
app.get('/api/staff/:staffId', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM staff WHERE id = ? AND branch_id = ?',
      args: [parseInt(req.params.staffId), req.branchId]
    });

    if (!result.rows.length) {
      return res.status(404).json(errorResponse('Staff member not found', 404));
    }

    res.json(formatResponse(result.rows[0], 'Staff member retrieved successfully'));
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json(errorResponse('Failed to fetch staff member', 500, error.message));
  }
});

// Create staff
app.post('/api/staff', async (req, res) => {
  try {
    const { name, role, phone, email, shift, salary, join_date, status } = req.body;

    if (!name || !role || !phone || !join_date) {
      return res.status(400).json(errorResponse('Missing required fields', 400));
    }

    const staff_id = generateId('STAFF');

    const result = await db.execute({
      sql: `INSERT INTO staff 
        (staff_id, name, role, phone, email, shift, salary, join_date, status, branch_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [staff_id, name, role, phone, email || null, shift || null, salary || null, join_date, status || 'aktif', req.branchId]
    });

    res.status(201).json(formatResponse({
      id: result.lastInsertRowid,
      staff_id,
      ...req.body
    }, 'Staff created successfully', 201));
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json(errorResponse('Failed to create staff', 500, error.message));
  }
});

// Update staff
app.put('/api/staff/:staffId', async (req, res) => {
  try {
    const staffId = parseInt(req.params.staffId);
    const updates = req.body;

    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'staff_id' && key !== 'branch_id') {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json(errorResponse('No fields to update', 400));
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(staffId, req.branchId);

    const result = await db.execute({
      sql: `UPDATE staff SET ${updateFields.join(', ')} WHERE id = ? AND branch_id = ?`,
      args: values
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json(errorResponse('Staff member not found', 404));
    }

    res.json(formatResponse(updates, 'Staff updated successfully'));
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json(errorResponse('Failed to update staff', 500, error.message));
  }
});

// Delete staff
app.delete('/api/staff/:staffId', async (req, res) => {
  try {
    const staffId = parseInt(req.params.staffId);

    const result = await db.execute({
      sql: 'DELETE FROM staff WHERE id = ? AND branch_id = ?',
      args: [staffId, req.branchId]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json(errorResponse('Staff member not found', 404));
    }

    res.json(formatResponse(null, 'Staff deleted successfully'));
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json(errorResponse('Failed to delete staff', 500, error.message));
  }
});

// ============================================================================
// MACHINES ROUTES
// ============================================================================

// Get all machines
app.get('/api/machines', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await db.execute({
      sql: `SELECT * FROM machines WHERE branch_id = ? 
            ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      args: [req.branchId, limit, offset]
    });

    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM machines WHERE branch_id = ?',
      args: [req.branchId]
    });

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json(formatResponse({
      machines: result.rows,
      pagination: { page, limit, total, totalPages }
    }, 'Machines retrieved successfully'));
  } catch (error) {
    console.error('Error fetching machines:', error);
    res.status(500).json(errorResponse('Failed to fetch machines', 500, error.message));
  }
});

// Get single machine
app.get('/api/machines/:machineId', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM machines WHERE id = ? AND branch_id = ?',
      args: [parseInt(req.params.machineId), req.branchId]
    });

    if (!result.rows.length) {
      return res.status(404).json(errorResponse('Machine not found', 404));
    }

    res.json(formatResponse(result.rows[0], 'Machine retrieved successfully'));
  } catch (error) {
    console.error('Error fetching machine:', error);
    res.status(500).json(errorResponse('Failed to fetch machine', 500, error.message));
  }
});

// Create machine
app.post('/api/machines', async (req, res) => {
  try {
    const { name, type, capacity_kg, location, status, last_maintenance, next_maintenance } = req.body;

    if (!name || !type || !capacity_kg) {
      return res.status(400).json(errorResponse('Missing required fields', 400));
    }

    const machine_id = generateId('MACH');

    const result = await db.execute({
      sql: `INSERT INTO machines 
        (machine_id, name, type, capacity_kg, location, status, last_maintenance, next_maintenance, branch_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [machine_id, name, type, capacity_kg, location || null, status || 'aktif', last_maintenance || null, next_maintenance || null, req.branchId]
    });

    res.status(201).json(formatResponse({
      id: result.lastInsertRowid,
      machine_id,
      ...req.body
    }, 'Machine created successfully', 201));
  } catch (error) {
    console.error('Error creating machine:', error);
    res.status(500).json(errorResponse('Failed to create machine', 500, error.message));
  }
});

// Update machine
app.put('/api/machines/:machineId', async (req, res) => {
  try {
    const machineId = parseInt(req.params.machineId);
    const updates = req.body;

    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'machine_id' && key !== 'branch_id') {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json(errorResponse('No fields to update', 400));
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(machineId, req.branchId);

    const result = await db.execute({