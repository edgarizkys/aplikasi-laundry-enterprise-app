I'll generate a production-ready Express.js backend for the Laundry Enterprise application. This will be comprehensive with proper error handling, database setup, and multi-tenant support.

Let me start with the main app.js file (chunked due to size):
<function_calls>
<invoke name="write_to_file">
<parameter name="path">app.js</parameter>
<parameter name="contents">require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { createClient } = require('@libsql/client');

// Initialize Express App
const app = express();

// Database Client
let db = null;

// Initialize Database
const initializeDatabase = async () => {
  try {
    db = createClient({
      url: process.env.TURSO_CONNECTION_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Test connection
    await db.execute('SELECT 1');
    console.log('✓ Database connected');

    // Create tables
    await createTables();
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Create Database Tables
const createTables = async () => {
  const tables = [
    `CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      city TEXT,
      plan TEXT DEFAULT 'basic',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      branch_id TEXT UNIQUE NOT NULL,
      branch_name TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      manager_name TEXT,
      capacity REAL DEFAULT 500,
      opening_hours TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
    )`,

    `CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      service_id TEXT UNIQUE NOT NULL,
      service_name TEXT NOT NULL,
      description TEXT,
      price_per_kg REAL NOT NULL,
      turnaround_time INTEGER DEFAULT 3,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
    )`,

    `CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      customer_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      city TEXT,
      member_type TEXT DEFAULT 'regular',
      points INTEGER DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      join_date DATE NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
    )`,

    `CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      staff_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      salary REAL NOT NULL,
      join_date DATE NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id),
      FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
    )`,

    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      order_id TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      items TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      service_type TEXT NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      pickup_date DATE NOT NULL,
      delivery_date DATE,
      branch_id TEXT NOT NULL,
      assigned_staff TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id),
      FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
    )`,

    `CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      payment_id TEXT UNIQUE NOT NULL,
      order_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_date DATE,
      reference_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id),
      FOREIGN KEY (order_id) REFERENCES orders(order_id)
    )`,

    `CREATE TABLE IF NOT EXISTS loyalty_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      order_id TEXT,
      points_amount INTEGER NOT NULL,
      transaction_type TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id),
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    )`,

    `CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      unit TEXT,
      reorder_level INTEGER DEFAULT 10,
      last_restocked DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id),
      FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
    )`
  ];

  for (const table of tables) {
    try {
      await db.execute(table);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error('Table creation error:', error.message);
      }
    }
  }
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Tenant Context Middleware
app.use((req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] || req.query.tenant_id;
  
  if (!tenantId) {
    return res.status(400).json({
      success: false,
      message: 'Tenant ID is required',
      error: 'MISSING_TENANT_ID'
    });
  }

  req.tenantId = tenantId;
  next();
});

// Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: err.code || 'INTERNAL_ERROR'
  });
});

// Helper: Generate ID
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper: Paginate
const paginate = (page = 1, limit = 10) => {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (p - 1) * l;
  return { offset, limit: l, page: p };
};

// ========== BRANCHES ENDPOINTS ==========

// Get all branches
app.get('/api/branches', async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { offset, limit: l, page: p } = paginate(page, limit);

    const countResult = await db.execute(
      'SELECT COUNT(*) as total FROM branches WHERE tenant_id = ?',
      [req.tenantId]
    );
    const total = countResult.rows[0].total;

    const result = await db.execute(
      'SELECT * FROM branches WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.tenantId, l, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: p,
        limit: l,
        total,
        pages: Math.ceil(total / l)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'FETCH_BRANCHES_ERROR'
    });
  }
});

// Get single branch
app.get('/api/branches/:branchId', async (req, res) => {
  try {
    const result = await db.execute(
      'SELECT * FROM branches WHERE tenant_id = ? AND branch_id = ?',
      [req.tenantId, req.params.branchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found',
        error: 'BRANCH_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'FETCH_BRANCH_ERROR'
    });
  }
});

// Create branch
app.post('/api/branches', async (req, res) => {
  try {
    const {
      branch_name,
      address,
      phone,
      manager_name,
      capacity,
      opening_hours,
      status
    } = req.body;

    if (!branch_name || !address || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing',
        error: 'VALIDATION_ERROR'
      });
    }

    const branchId = generateId('BR');

    await db.execute(
      `INSERT INTO branches (
        tenant_id, branch_id, branch_name, address, phone, manager_name, 
        capacity, opening_hours, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        branchId,
        branch_name,
        address,
        phone,
        manager_name || null,
        capacity || 500,
        opening_hours || null,
        status || 'active'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: { branch_id: branchId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'CREATE_BRANCH_ERROR'
    });
  }
});

// Update branch
app.put('/api/branches/:branchId', async (req, res) => {
  try {
    const { branch_name, address, phone, manager_name, capacity, opening_hours, status } = req.body;

    const result = await db.execute(
      'SELECT * FROM branches WHERE tenant_id = ? AND branch_id = ?',
      [req.tenantId, req.params.branchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found',
        error: 'BRANCH_NOT_FOUND'
      });
    }

    await db.execute(
      `UPDATE branches SET 
        branch_name = COALESCE(?, branch_name),
        address = COALESCE(?, address),
        phone = COALESCE(?, phone),
        manager_name = COALESCE(?, manager_name),
        capacity = COALESCE(?, capacity),
        opening_hours = COALESCE(?, opening_hours),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = ? AND branch_id = ?`,
      [
        branch_name || null,
        address || null,
        phone || null,
        manager_name || null,
        capacity || null,
        opening_hours || null,
        status || null,
        req.tenantId,
        req.params.branchId
      ]
    );

    res.json({
      success: true,
      message: 'Branch updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'UPDATE_BRANCH_ERROR'
    });
  }
});

// Delete branch
app.delete('/api/branches/:branchId', async (req, res) => {
  try {
    const result = await db.execute(
      'SELECT * FROM branches WHERE tenant_id = ? AND branch_id = ?',
      [req.tenantId, req.params.branchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found',
        error: 'BRANCH_NOT_FOUND'
      });
    }

    await db.execute(
      'DELETE FROM branches WHERE tenant_id = ? AND branch_id = ?',
      [req.tenantId, req.params.branchId]
    );

    res.json({
      success: true,
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'DELETE_BRANCH_ERROR'
    });
  }
});

// ========== SERVICES ENDPOINTS ==========

// Get all services
app.get('/api/services', async (req, res) => {
  try {
    const { page, limit, is_active } = req.query;
    const { offset, limit: l, page: p } = paginate(page, limit);

    let query = 'SELECT COUNT(*) as total FROM services WHERE tenant_id = ?';
    let params = [req.tenantId];

    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }

    const countResult = await db.execute(query, params);
    const total = countResult.rows[0].total;

    query = 'SELECT * FROM services WHERE tenant_id = ?';
    params = [req.tenantId];

    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(l, offset);

    const result = await db.execute(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: p,
        limit: l,
        total,
        pages: Math.ceil(total / l)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'FETCH_SERVICES_ERROR'
    });
  }
});

// Get single service
app.get('/api/services/:serviceId', async (req, res) => {
  try {
    const result = await db.execute(
      'SELECT * FROM services WHERE tenant_id = ? AND service_id = ?',
      [req.tenantId, req.params.serviceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
        error: 'SERVICE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'FETCH_SERVICE_ERROR'
    });
  }
});

// Create service
app.post('/api/services', async (req, res) => {
  try {
    const { service_name, description, price_per_kg, turnaround_time, is_active } = req.body;

    if (!service_name || price_per_kg === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing',
        error: 'VALIDATION_ERROR'
      });
    }

    const serviceId = generateId('SVC');

    await db.execute(
      `INSERT INTO services (
        tenant_id, service_id, service_name, description, price_per_kg, 
        turnaround_time, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        serviceId,
        service_name,
        description || null,
        price_per_kg,
        turnaround_time || 3,
        is_active !== false ? 1 : 0
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: { service_id: serviceId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'CREATE_SERVICE_ERROR'
    });
  }
});

// Update service
app.put('/api/services/:serviceId', async (req, res) => {
  try {
    const { service_name, description, price_per_kg, turnaround_time, is_active } = req.body;

    const result = await db.execute(
      'SELECT * FROM services WHERE tenant_id = ? AND service_id = ?',
      [req.tenantId, req.params.serviceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
        error: 'SERVICE_NOT_FOUND'
      });
    }

    await db.execute(
      `UPDATE services SET 
        service_name = COALESCE(?, service_name),
        description = COALESCE(?, description),
        price_per_kg = COALESCE(?, price_per_kg),
        turnaround_time = COALESCE(?, turnaround_time),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = ? AND service_id = ?`,
      [
        service_name || null,
        description || null,
        price_per_kg !== undefined ? price_per_kg : null,
        turnaround_time || null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        req.tenantId,
        req.params.serviceId
      ]
    );

    res.json({
      success: true,
      message: 'Service updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'UPDATE_SERVICE_ERROR'
    });
  }
});

// Delete service
app.delete('/api/services/:serviceId', async (req, res) => {
  try {
    const result = await db.execute(
      'SELECT * FROM services WHERE tenant_id = ? AND service_id = ?',
      [req.tenantId, req.params.serviceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
        error: 'SERVICE_NOT_FOUND'
      });
    }

    await db.execute(
      'DELETE FROM services WHERE tenant_id = ? AND service_id = ?',
      [req.tenantId, req.params.serviceId]
    );

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'DELETE_SERVICE_ERROR'
    });
  }
});

// ========== CUSTOMERS ENDPOINTS ==========

// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const { page, limit, member_type, status } = req.query;
    const { offset, limit: l, page: p } = paginate(page, limit);

    let query = 'SELECT COUNT(*) as total FROM customers WHERE tenant_id = ?';
    let params = [req.tenantId];

    if (member_type) {
      query += ' AND member_type = ?';
      params.push(member_type);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    const countResult = await db.execute(query, params);
    const total = countResult.rows[0].total;

    query = 'SELECT * FROM customers WHERE tenant_id = ?';
    params = [req.tenantId];

    if (member_type) {
      query += ' AND member_type = ?';
      params.push(member_type);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(l, offset);

    const result = await db.execute(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: p,
        limit: l,
        total,
        pages: Math.ceil(total / l)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'FETCH_CUSTOMERS_ERROR'
    });
  }
});

// Get single customer
app.get('/api/customers/:customerId', async (req, res) => {
  try {
    const result = await db.execute(
      'SELECT * FROM customers WHERE tenant_id = ? AND customer_id = ?',
      [req.tenantId, req.params.customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        error: 'CUSTOMER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'FETCH_CUSTOMER_ERROR'
    });
  }
});

// Create customer
app.post('/api/customers', async (req, res) => {
  try {
    const { name, phone, email, address, city, member_type } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing',
        error: 'VALIDATION_ERROR'
      });
    }

    const customerId = generateId('CUST');
    const joinDate = new Date().toISOString().split('T')[0];

    await db.execute(
      `INSERT INTO customers (
        tenant_id, customer_id, name, phone, email, address, city, 
        member_type, join_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        customerId,
        name,
        phone,
        email || null,
        address || null,
        city || null,
        member_type || 'regular',
        joinDate
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: { customer_id: customerId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'CREATE_CUSTOMER_ERROR'
    });
  }
});

// Update customer
app.put('/api/customers/:customerId', async (req, res) => {
  try {
    const { name, phone, email, address, city, member_type, status } = req.body;

    const result = await db.execute(
      'SELECT * FROM customers WHERE tenant_id = ? AND customer_id = ?',
      [req.tenantId, req.params.customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        error: 'CUSTOMER_NOT_FOUND'
      });
    }

    await db.execute(
      `UPDATE customers SET 
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        member_type = COALESCE(?, member_type),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = ? AND customer_id = ?`,
      [
        name || null,
        phone || null,
        email || null,
        address || null,
        city || null,
        member_type || null,
        status || null,
        req.tenantId,
        req.params.customerId
      ]
    );

    res.json({
      success: true,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'UPDATE_CUSTOMER_ERROR'
    });
  }
});

// Delete customer
app.delete('/api/customers/:customerId', async (req, res) => {
  try {
    const result = await db.execute(
      'SELECT * FROM customers WHERE tenant_id = ? AND customer_id = ?',
      [req.tenantId, req.params.customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        error: 'CUSTOMER_NOT_FOUND'
      });
    }

    await db.execute(
      'DELETE FROM customers WHERE tenant_id = ? AND customer_id = ?',
      [req.tenantId, req.params.customerId]
    );

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'DELETE_CUSTOMER_ERROR'
    });
  }
});

// ========== STAFF ENDPOINTS ==========

// Get all staff
app.get('/api/staff', async (req, res) => {
  try {
    const { page, limit, role, branch_id, status } = req.query;
    const { offset, limit: l, page: p } = paginate(page, limit);

    let query = 'SELECT COUNT(*) as total FROM staff WHERE tenant_id = ?';
    let params = [req.tenantId];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (branch_id) {
      query += ' AND branch_id = ?';
      params.push(branch_id);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    const countResult = await db.execute(query, params);
    const total = countResult.rows[0].total;

    query = 'SELECT * FROM staff WHERE tenant_id = ?';
    params = [req.tenantId];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (branch_id) {
      query += ' AND branch_id = ?';
      params.push(branch_id);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(l, offset);

    const result = await db.execute(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: p,
        limit: l,
        total,
        pages: Math.ceil(total / l)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'FETCH_STAFF_ERROR'
    });
  }
});

// Get single staff member
app.get('/api/staff/:staffId', async (req, res) => {
  try {
    const result = await db.execute(
      'SELECT * FROM staff WHERE tenant_id = ? AND staff_id = ?',
      [req.tenantId, req.params.staffId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
        error: 'STAFF_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'FETCH_STAFF_ERROR'
    });
  }
});

// Create staff member
app.post('/api/staff', async (req