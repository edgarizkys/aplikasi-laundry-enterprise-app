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

// Database Connection
const db = createClient({
  url: process.env.DATABASE_URL || 'file:laundry_enterprise.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Initialize Database Schema
async function initializeDatabase() {
  try {
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
        pickup_date TEXT NOT NULL,
        delivery_date TEXT NOT NULL,
        assigned_staff TEXT,
        notes TEXT,
        branch_id TEXT NOT NULL DEFAULT 'BRANCH-001',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        email TEXT UNIQUE,
        address TEXT,
        city TEXT,
        loyalty_points INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        registration_date TEXT NOT NULL,
        branch_id TEXT NOT NULL DEFAULT 'BRANCH-001',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        email TEXT UNIQUE,
        shift TEXT NOT NULL,
        salary REAL NOT NULL,
        join_date TEXT NOT NULL,
        status TEXT DEFAULT 'aktif',
        branch_id TEXT NOT NULL DEFAULT 'BRANCH-001',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS machines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        capacity_kg REAL NOT NULL,
        location TEXT NOT NULL,
        status TEXT DEFAULT 'aktif',
        last_maintenance TEXT,
        next_maintenance TEXT,
        branch_id TEXT NOT NULL DEFAULT 'BRANCH-001',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_id TEXT UNIQUE NOT NULL,
        order_number TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_date TEXT,
        reference_number TEXT,
        branch_id TEXT NOT NULL DEFAULT 'BRANCH-001',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

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

    console.log('✓ Database schema initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Seed Sample Data
async function seedSampleData() {
  try {
    const branchCount = await db.execute('SELECT COUNT(*) as count FROM branches');
    if (branchCount.rows[0].count > 0) {
      console.log('✓ Sample data already exists, skipping seed');
      return;
    }

    // Insert Branches
    await db.execute(`
      INSERT INTO branches (branch_id, name, address, phone, email, manager_name, operating_hours, total_machines)
      VALUES 
      ('BRANCH-001', 'Pusat Jakarta', 'Jl. Merdeka No. 1, Jakarta Pusat', '021-1234567', 'pusat@laundry.com', 'Bambang Sudrajat', '08:00-22:00', 8),
      ('BRANCH-002', 'Cabang Bandung', 'Jl. Diponegoro No. 50, Bandung', '022-9876543', 'bandung@laundry.com', 'Eka Supriyanto', '08:00-21:00', 6)
    `);

    // Insert Customers
    await db.execute(`
      INSERT INTO customers (customer_id, name, phone, email, address, city, loyalty_points, total_spent, registration_date, branch_id)
      VALUES 
      ('CUST-001', 'Budi Santoso', '081234567890', 'budi@email.com', 'Jl. Merdeka No. 10', 'Jakarta Pusat', 250, 675000, '2025-12-01', 'BRANCH-001'),
      ('CUST-002', 'Sinta Wijaya', '082345678901', 'sinta@email.com', 'Jl. Sudirman No. 25', 'Jakarta Selatan', 500, 1250000, '2025-11-15', 'BRANCH-001')
    `);

    // Insert Staff
    await db.execute(`
      INSERT INTO staff (staff_id, name, role, phone, email, shift, salary, join_date, status, branch_id)
      VALUES 
      ('STAFF-001', 'Siti Nurhaliza', 'Operator', '085123456789', 'siti@laundry.com', 'Pagi (08:00-16:00)', 3500000, '2024-06-01', 'aktif', 'BRANCH-001'),
      ('STAFF-002', 'Roni Hermawan', 'Supervisor', '085234567890', 'roni@laundry.com', 'Siang (16:00-00:00)', 5500000, '2023-03-15', 'aktif', 'BRANCH-001')
    `);

    // Insert Machines
    await db.execute(`
      INSERT INTO machines (machine_id, name, type, capacity_kg, location, status, last_maintenance, next_maintenance, branch_id)
      VALUES 
      ('MACH-001', 'Mesin Cuci Industrial 1', 'Washing Machine', 25, 'Area Utama', 'aktif', '2026-07-15', '2026-08-15', 'BRANCH-001'),
      ('MACH-002', 'Mesin Pengering 1', 'Dryer', 20, 'Area Utama', 'aktif', '2026-07-10', '2026-08-10', 'BRANCH-001')
    `);

    // Insert Orders
    await db.execute(`
      INSERT INTO orders (order_number, customer_name, phone, email, items_list, total_weight_kg, service_type, total_price, status, pickup_date, delivery_date, assigned_staff, notes, branch_id)
      VALUES 
      ('ORD-2026-001', 'Budi Santoso', '081234567890', 'budi@email.com', '5 Baju, 3 Celana, 2 Jaket', 4.5, 'Express', 67500, 'processing', '2026-07-28', '2026-07-29', 'Siti Nurhaliza', 'Express service diminta', 'BRANCH-001'),
      ('ORD-2026-002', 'Sinta Wijaya', '082345678901', 'sinta@email.com', '10 Baju, 5 Celana, 3 Kemeja', 8.2, 'Regular', 105000, 'completed', '2026-07-26', '2026-07-28', 'Roni Hermawan', 'Sudah diambil pelanggan', 'BRANCH-001')
    `);

    // Insert Payments
    await db.execute(`
      INSERT INTO payments (payment_id, order_number, customer_name, amount, payment_method, status, payment_date, reference_number, branch_id)
      VALUES 
      ('PAY-001', 'ORD-2026-001', 'Budi Santoso', 67500, 'QRIS', 'paid', '2026-07-28', 'REF-QRIS-2026-001', 'BRANCH-001'),
      ('PAY-002', 'ORD-2026-002', 'Sinta Wijaya', 105000, 'Bank Transfer', 'paid', '2026-07-27', 'REF-BT-2026-002', 'BRANCH-001')
    `);

    console.log('✓ Sample data seeded successfully');
  } catch (error) {
    console.error('Seed data error:', error);
  }
}

// Helper function for pagination
function getPaginationParams(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// Helper function for error response
function sendError(res, statusCode, message) {
  res.status(statusCode).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
  });
}

// Helper function for success response
function sendSuccess(res, data, message = 'Success') {
  res.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

// ============ ORDERS ENDPOINTS ============

// GET all orders with pagination
app.get('/api/orders', async (req, res) => {
  try {
    const { limit, offset } = getPaginationParams(req.query);
    const branchId = req.query.branch_id || 'BRANCH-001';
    const status = req.query.status;

    let query = 'SELECT * FROM orders WHERE branch_id = ?';
    let params = [branchId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await db.execute({
      sql: query,
      args: params,
    });

    const countResult = await db.execute(
      'SELECT COUNT(*) as total FROM orders WHERE branch_id = ?',
      [branchId]
    );

    sendSuccess(res, {
      data: result.rows,
      pagination: {
        total: countResult.rows[0].total,
        page: Math.floor(offset / limit) + 1,
        limit,
        pages: Math.ceil(countResult.rows[0].total / limit),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    sendError(res, 500, 'Failed to fetch orders');
  }
});

// GET order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Order not found');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    console.error('Get order error:', error);
    sendError(res, 500, 'Failed to fetch order');
  }
});

// POST create new order
app.post('/api/orders', async (req, res) => {
  try {
    const {
      order_number,
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
      notes,
      branch_id = 'BRANCH-001',
    } = req.body;

    if (!order_number || !customer_name || !phone || !total_weight_kg || !total_price) {
      return sendError(res, 400, 'Missing required fields');
    }

    await db.execute(
      `INSERT INTO orders (order_number, customer_name, phone, email, items_list, total_weight_kg, service_type, total_price, status, pickup_date, delivery_date, assigned_staff, notes, branch_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_number,
        customer_name,
        phone,
        email || null,
        items_list,
        total_weight_kg,
        service_type,
        total_price,
        'pending',
        pickup_date,
        delivery_date,
        assigned_staff || null,
        notes || null,
        branch_id,
      ]
    );

    const newOrder = await db.execute('SELECT * FROM orders WHERE order_number = ?', [order_number]);

    sendSuccess(res, newOrder.rows[0], 'Order created successfully');
  } catch (error) {
    console.error('Create order error:', error);
    sendError(res, 500, 'Failed to create order');
  }
});

// PUT update order
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      order_number,
      customer_name,
      phone,
      email,
      items_list,
      total_weight_kg,
      service_type,
      total_price,
      status,
      pickup_date,
      delivery_date,
      assigned_staff,
      notes,
    } = req.body;

    const checkOrder = await db.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (checkOrder.rows.length === 0) {
      return sendError(res, 404, 'Order not found');
    }

    await db.execute(
      `UPDATE orders SET order_number=?, customer_name=?, phone=?, email=?, items_list=?, total_weight_kg=?, service_type=?, total_price=?, status=?, pickup_date=?, delivery_date=?, assigned_staff=?, notes=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      [
        order_number || checkOrder.rows[0].order_number,
        customer_name || checkOrder.rows[0].customer_name,
        phone || checkOrder.rows[0].phone,
        email !== undefined ? email : checkOrder.rows[0].email,
        items_list || checkOrder.rows[0].items_list,
        total_weight_kg || checkOrder.rows[0].total_weight_kg,
        service_type || checkOrder.rows[0].service_type,
        total_price || checkOrder.rows[0].total_price,
        status || checkOrder.rows[0].status,
        pickup_date || checkOrder.rows[0].pickup_date,
        delivery_date || checkOrder.rows[0].delivery_date,
        assigned_staff !== undefined ? assigned_staff : checkOrder.rows[0].assigned_staff,
        notes !== undefined ? notes : checkOrder.rows[0].notes,
        id,
      ]
    );

    const updatedOrder = await db.execute('SELECT * FROM orders WHERE id = ?', [id]);

    sendSuccess(res, updatedOrder.rows[0], 'Order updated successfully');
  } catch (error) {
    console.error('Update order error:', error);
    sendError(res, 500, 'Failed to update order');
  }
});

// DELETE order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const checkOrder = await db.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (checkOrder.rows.length === 0) {
      return sendError(res, 404, 'Order not found');
    }

    await db.execute('DELETE FROM orders WHERE id = ?', [id]);

    sendSuccess(res, { id: parseInt(id) }, 'Order deleted successfully');
  } catch (error) {
    console.error('Delete order error:', error);
    sendError(res, 500, 'Failed to delete order');
  }
});

// ============ CUSTOMERS ENDPOINTS ============

// GET all customers with pagination
app.get('/api/customers', async (req, res) => {
  try {
    const { limit, offset } = getPaginationParams(req.query);
    const branchId = req.query.branch_id || 'BRANCH-001';

    const result = await db.execute({
      sql: 'SELECT * FROM customers WHERE branch_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      args: [branchId, limit, offset],
    });

    const countResult = await db.execute('SELECT COUNT(*) as total FROM customers WHERE branch_id = ?', [
      branchId,
    ]);

    sendSuccess(res, {
      data: result.rows,
      pagination: {
        total: countResult.rows[0].total,
        page: Math.floor(offset / limit) + 1,
        limit,
        pages: Math.ceil(countResult.rows[0].total / limit),
      },
    });
  } catch (error) {
    console.error('Get customers error:', error);
    sendError(res, 500, 'Failed to fetch customers');
  }
});

// GET customer by ID
app.get('/api/customers/:id', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM customers WHERE id = ?', [req.params.id]);

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Customer not found');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    console.error('Get customer error:', error);
    sendError(res, 500, 'Failed to fetch customer');
  }
});

// POST create new customer
app.post('/api/customers', async (req, res) => {
  try {
    const {
      customer_id,
      name,
      phone,
      email,
      address,
      city,
      branch_id = 'BRANCH-001',
    } = req.body;

    if (!customer_id || !name || !phone) {
      return sendError(res, 400, 'Missing required fields');
    }

    await db.execute(
      `INSERT INTO customers (customer_id, name, phone, email, address, city, loyalty_points, total_spent, registration_date, branch_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_id,
        name,
        phone,
        email || null,
        address || null,
        city || null,
        0,
        0,
        new Date().toISOString().split('T')[0],
        branch_id,
      ]
    );

    const newCustomer = await db.execute('SELECT * FROM customers WHERE customer_id = ?', [customer_id]);

    sendSuccess(res, newCustomer.rows[0], 'Customer created successfully');
  } catch (error) {
    console.error('Create customer error:', error);
    sendError(res, 500, 'Failed to create customer');
  }
});

// PUT update customer
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, city, loyalty_points, total_spent } = req.body;

    const checkCustomer = await db.execute('SELECT * FROM customers WHERE id = ?', [id]);
    if (checkCustomer.rows.length === 0) {
      return sendError(res, 404, 'Customer not found');
    }

    await db.execute(
      `UPDATE customers SET name=?, phone=?, email=?, address=?, city=?, loyalty_points=?, total_spent=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [
        name || checkCustomer.rows[0].name,
        phone || checkCustomer.rows[0].phone,
        email !== undefined ? email : checkCustomer.rows[0].email,
        address !== undefined ? address : checkCustomer.rows[0].address,
        city !== undefined ? city : checkCustomer.rows[0].city,
        loyalty_points !== undefined ? loyalty_points : checkCustomer.rows[0].loyalty_points,
        total_spent !== undefined ? total_spent : checkCustomer.rows[0].total_spent,
        id,
      ]
    );

    const updatedCustomer = await db.execute('SELECT * FROM customers WHERE id = ?', [id]);

    sendSuccess(res, updatedCustomer.rows[0], 'Customer updated successfully');
  } catch (error) {
    console.error('Update customer error:', error);
    sendError(res, 500, 'Failed to update customer');
  }
});

// DELETE customer
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const checkCustomer = await db.execute('SELECT * FROM customers WHERE id = ?', [id]);
    if (checkCustomer.rows.length === 0) {
      return sendError(res, 404, 'Customer not found');
    }

    await db.execute('DELETE FROM customers WHERE id = ?', [id]);

    sendSuccess(res, { id: parseInt(id) }, 'Customer deleted successfully');
  } catch (error) {
    console.error('Delete customer error:', error);
    sendError(res, 500, 'Failed to delete customer');
  }
});

// ============ STAFF ENDPOINTS ============

// GET all staff with pagination
app.get('/api/staff', async (req, res) => {
  try {
    const { limit, offset } = getPaginationParams(req.query);
    const branchId = req.query.branch_id || 'BRANCH-001';

    const result = await db.execute({
      sql: 'SELECT * FROM staff WHERE branch_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      args: [branchId, limit, offset],
    });

    const countResult = await db.execute('SELECT COUNT(*) as total FROM staff WHERE branch_id = ?', [
      branchId,
    ]);

    sendSuccess(res, {
      data: result.rows,
      pagination: {
        total: countResult.rows[0].total,
        page: Math.floor(offset / limit) + 1,
        limit,
        pages: Math.ceil(countResult.rows[0].total / limit),
      },
    });
  } catch (error) {
    console.error('Get staff error:', error);
    sendError(res, 500, 'Failed to fetch staff');
  }
});

// GET staff by ID
app.get('/api/staff/:id', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM staff WHERE id = ?', [req.params.id]);

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Staff not found');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    console.error('Get staff error:', error);
    sendError(res, 500, 'Failed to fetch staff');
  }
});

// POST create new staff
app.post('/api/staff', async (req, res) => {
  try {
    const { staff_id, name, role, phone, email, shift, salary, join_date, branch_id = 'BRANCH-001' } =
      req.body;

    if (!staff_id || !name || !role || !phone || !salary) {
      return sendError(res, 400, 'Missing required fields');
    }

    await db.execute(
      `INSERT INTO staff (staff_id, name, role, phone, email, shift, salary, join_date, status, branch_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [staff_id, name, role, phone, email || null, shift || null, salary, join_date, 'aktif', branch_id]
    );

    const newStaff = await db.execute('SELECT * FROM staff WHERE staff_id = ?', [staff_id]);

    sendSuccess(res, newStaff.rows[0], 'Staff created successfully');
  } catch (error) {
    console.error('Create staff error:', error);
    sendError(res, 500, 'Failed to create staff');
  }
});

// PUT update staff
app.put('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, phone, email, shift, salary, status } = req.body;

    const checkStaff = await db.execute('SELECT * FROM staff WHERE id = ?', [id]);
    if (checkStaff.rows.length === 0) {
      return sendError(res, 404, 'Staff not found');
    }

    await db.execute(
      `UPDATE staff SET name=?, role=?, phone=?, email=?, shift=?, salary=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [
        name || checkStaff.rows[0].name,
        role || checkStaff.rows[0].role,
        phone || checkStaff.rows[0].phone,
        email !== undefined ? email : checkStaff.rows[0].email,
        shift !== undefined ? shift : checkStaff.rows[0].shift,
        salary || checkStaff.rows[0].salary,
        status || checkStaff.rows[0].status,
        id,
      ]
    );

    const updatedStaff = await db.execute('SELECT * FROM staff WHERE id = ?', [id]);

    sendSuccess(res, updatedStaff.rows[0], 'Staff updated successfully');
  } catch (error) {
    console.error('Update staff error:', error);
    sendError(res, 500, 'Failed to update staff');
  }
});

// DELETE staff
app.delete('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const checkStaff = await db.execute('SELECT * FROM staff WHERE id = ?', [id]);
    if (checkStaff.rows.length === 0) {
      return sendError(res, 404, 'Staff not found');
    }

    await db.execute('DELETE FROM staff WHERE id = ?', [id]);

    sendSuccess(res, { id: parseInt(id) }, 'Staff deleted successfully');
  } catch (error) {
    console.error('Delete staff error:', error);
    sendError(res, 500, 'Failed to delete staff');
  }
});

// ============ MACHINES ENDPOINTS ============

// GET all machines with pagination
app.get('/api/machines', async (req, res) => {
  try {
    const { limit, offset } = getPaginationParams(req.query);
    const branchId = req.query.branch_id || 'BRANCH-001';

    const result = await db.execute({
      sql: 'SELECT * FROM machines WHERE branch_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      args: [branchId, limit, offset],
    });

    const countResult = await db.execute('SELECT COUNT(*) as total FROM machines WHERE branch_id = ?', [
      branchId,
    ]);

    sendSuccess(res, {
      data: result.rows,
      pagination: {
        total: countResult.rows[0].total,
        page: Math.floor(offset / limit) + 1,
        limit,
        pages: Math.ceil(countResult.rows[0].total / limit),
      },
    });
  } catch (error) {
    console.error('Get machines error:', error);
    sendError(res, 500, 'Failed to fetch machines');
  }
});

// GET machine by ID
app.get('/api/machines/:id', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM machines WHERE id = ?', [req.params.id]);

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Machine not found');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    console.error('Get machine error:', error);
    sendError(res, 500, 'Failed to fetch machine');
  }
});

// POST create new machine
app.post('/api/machines', async (req, res) => {
  try {
    const {
      machine_id,
      name,
      type,
      capacity_kg,
      location,
      last_maintenance,
      next_maintenance,
      branch_id = 'BRANCH-001',
    } = req.body;

    if (!machine_id || !name || !type || !capacity_kg || !location) {
      return sendError(res, 400, 'Missing required fields');
    }

    await db.execute(
      `INSERT INTO machines (machine_id, name, type, capacity_kg, location, status, last_maintenance, next_maintenance, branch_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        machine_id,
        name,
        type,
        capacity_kg,
        location,
        'aktif',
        last_maintenance || null,
        next_maintenance || null,
        branch_id,
      ]
    );

    const newMachine = await db.execute('SELECT * FROM machines WHERE machine_id = ?', [machine_id]);

    sendSuccess(res, newMachine.rows[0], 'Machine created successfully');
  } catch (error) {
    console.error('Create machine error:', error);
    sendError(res, 500, 'Failed to create machine');
  }
});

// PUT update machine
app.put('/api/machines/:id',