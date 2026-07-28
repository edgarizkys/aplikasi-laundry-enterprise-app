// api.js - Laundry Enterprise API Routes and Controllers
const express = require('express');
const router = express.Router();
const { tursoClient } = require('../config/database');

// ============================================================================
// MIDDLEWARE
// ============================================================================

const getTenantId = (req) => req.headers['x-tenant-id'] || 'default_tenant';

const handleError = (res, error, statusCode = 500) => {
  console.error('API Error:', error);
  res.status(statusCode).json({
    success: false,
    error: error.message || 'Terjadi kesalahan pada server'
  });
};

// ============================================================================
// ORDERS ENDPOINTS
// ============================================================================

// GET all orders with pagination
router.get('/orders', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let sql = 'SELECT * FROM orders WHERE tenant_id = ?';
    let args = [tenantId];

    if (status) {
      sql += ' AND status = ?';
      args.push(status);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const result = await tursoClient.execute({
      sql,
      args
    });

    let countSql = 'SELECT COUNT(*) as total FROM orders WHERE tenant_id = ?';
    let countArgs = [tenantId];

    if (status) {
      countSql += ' AND status = ?';
      countArgs.push(status);
    }

    const countResult = await tursoClient.execute({
      sql: countSql,
      args: countArgs
    });

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0].total,
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// GET single order by ID
router.get('/orders/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const result = await tursoClient.execute({
      sql: 'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
      args: [id, tenantId]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pesanan tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    handleError(res, error);
  }
});

// CREATE new order
router.post('/orders', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
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
      notes
    } = req.body;

    if (!order_number || !customer_name || !phone || !weight_kg || !total_price) {
      return res.status(400).json({
        success: false,
        error: 'Data pesanan tidak lengkap'
      });
    }

    const result = await tursoClient.execute({
      sql: `INSERT INTO orders 
            (tenant_id, order_number, customer_id, customer_name, phone, items_count, 
             weight_kg, service_type, total_price, status, pickup_date, delivery_date, 
             assigned_staff, notes, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        tenantId,
        order_number,
        customer_id || null,
        customer_name,
        phone,
        items_count || 0,
        weight_kg,
        service_type || 'Regular',
        total_price,
        'pending',
        pickup_date,
        delivery_date || null,
        assigned_staff || null,
        notes || ''
      ]
    });

    res.status(201).json({
      success: true,
      data: {
        id: Number(result.lastInsertRowid),
        order_number,
        customer_name,
        phone,
        weight_kg,
        total_price,
        status: 'pending'
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// UPDATE order
router.put('/orders/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const updates = req.body;

    const checkResult = await tursoClient.execute({
      sql: 'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
      args: [id, tenantId]
    });

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pesanan tidak ditemukan'
      });
    }

    const allowedFields = [
      'customer_name', 'phone', 'items_count', 'weight_kg', 'service_type',
      'total_price', 'status', 'pickup_date', 'delivery_date', 'assigned_staff', 'notes'
    ];

    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tidak ada field yang dapat diperbarui'
      });
    }

    fields.push('updated_at = datetime("now")');
    values.push(id, tenantId);

    await tursoClient.execute({
      sql: `UPDATE orders SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      args: values
    });

    res.json({
      success: true,
      data: { id, ...updates }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// DELETE order
router.delete('/orders/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const result = await tursoClient.execute({
      sql: 'DELETE FROM orders WHERE id = ? AND tenant_id = ?',
      args: [id, tenantId]
    });

    if (result.rowsChanged === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pesanan tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Pesanan berhasil dihapus'
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// CUSTOMERS ENDPOINTS
// ============================================================================

// GET all customers
router.get('/customers', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await tursoClient.execute({
      sql: 'SELECT * FROM customers WHERE tenant_id = ? ORDER BY id DESC LIMIT ? OFFSET ?',
      args: [tenantId, limit, offset]
    });

    const countResult = await tursoClient.execute({
      sql: 'SELECT COUNT(*) as total FROM customers WHERE tenant_id = ?',
      args: [tenantId]
    });

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0].total,
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// GET single customer
router.get('/customers/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const result = await tursoClient.execute({
      sql: 'SELECT * FROM customers WHERE id = ? AND tenant_id = ?',
      args: [id, tenantId]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pelanggan tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    handleError(res, error);
  }
});

// CREATE customer
router.post('/customers', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const {
      customer_id,
      name,
      phone,
      email,
      address,
      member_tier,
      joined_date
    } = req.body;

    if (!customer_id || !name || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Data pelanggan tidak lengkap'
      });
    }

    const result = await tursoClient.execute({
      sql: `INSERT INTO customers 
            (tenant_id, customer_id, name, phone, email, address, loyalty_points, 
             total_spent, member_tier, joined_date, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        tenantId,
        customer_id,
        name,
        phone,
        email || null,
        address || null,
        0,
        0,
        member_tier || 'Bronze',
        joined_date || new Date().toISOString().split('T')[0]
      ]
    });

    res.status(201).json({
      success: true,
      data: {
        id: Number(result.lastInsertRowid),
        customer_id,
        name,
        phone,
        loyalty_points: 0,
        total_spent: 0,
        member_tier: member_tier || 'Bronze'
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// UPDATE customer
router.put('/customers/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const updates = req.body;

    const checkResult = await tursoClient.execute({
      sql: 'SELECT * FROM customers WHERE id = ? AND tenant_id = ?',
      args: [id, tenantId]
    });

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pelanggan tidak ditemukan'
      });
    }

    const allowedFields = [
      'name', 'phone', 'email', 'address', 'loyalty_points', 
      'total_spent', 'member_tier'
    ];

    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tidak ada field yang dapat diperbarui'
      });
    }

    fields.push('updated_at = datetime("now")');
    values.push(id, tenantId);

    await tursoClient.execute({
      sql: `UPDATE customers SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      args: values
    });

    res.json({
      success: true,
      data: { id, ...updates }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// DELETE customer
router.delete('/customers/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const result = await tursoClient.execute({
      sql: 'DELETE FROM customers WHERE id = ? AND tenant_id = ?',
      args: [id, tenantId]
    });

    if (result.rowsChanged === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pelanggan tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Pelanggan berhasil dihapus'
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// STAFF ENDPOINTS
// ============================================================================

// GET all staff
router.get('/staff', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let sql = 'SELECT * FROM staff WHERE tenant_id = ?';
    let args = [tenantId];

    if (status) {
      sql += ' AND status = ?';
      args.push(status);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const result = await tursoClient.execute({
      sql,
      args
    });

    let countSql = 'SELECT COUNT(*) as total FROM staff WHERE tenant_id = ?';
    let countArgs = [tenantId];

    if (status) {
      countSql += ' AND status = ?';
      countArgs.push(status);
    }

    const countResult = await tursoClient.execute({
      sql: countSql,
      args: countArgs
    });

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0].total,
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// GET single staff
router.get('/staff/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const result = await tursoClient.execute({
      sql: 'SELECT * FROM staff WHERE id = ? AND tenant_id = ?',
      args: [id, tenantId]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Staff tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    handleError(res, error);
  }
});

// CREATE staff
router.post('/staff', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const {
      staff_id,
      name,
      position,
      phone,
      email,
      salary,
      hire_date
    } = req.body;

    if (!staff_id || !name || !position) {
      return res.status(400).json({
        success: false,
        error: 'Data staff tidak lengkap'
      });
    }

    const result = await tursoClient.execute({
      sql: `INSERT INTO staff 
            (tenant_id, staff_id, name, position, phone, email, salary, 
             hire_date, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        tenantId,
        staff_id,
        name,
        position,
        phone || null,
        email || null,
        salary || 0,
        hire_date || new Date().toISOString().split('T')[0],
        'active'
      ]
    });

    res.status(201).json({
      success: true,
      data: {
        id: Number(result.lastInsertRowid),
        staff_id,
        name,
        position,
        status: 'active'
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// UPDATE staff
router.put('/staff/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const updates = req.body;

    const checkResult = await tursoClient.execute({
      sql: 'SELECT * FROM staff WHERE id = ? AND tenant_id = ?',
      args: [id, tenantId]
    });

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Staff tidak ditemukan'
      });
    }

    const allowedFields = [
      'name', 'position', 'phone', 'email', 'salary', 'status'
    ];

    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tidak ada field yang dapat diperbarui'
      });
    }

    fields.push('updated_at = datetime("now")');
    values.push(id, tenantId);

    await tursoClient.execute({
      sql: `UPDATE staff SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      args: values
    });

    res.json({
      success: true,
      data: { id, ...updates }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// DELETE staff
router.delete('/staff/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const result = await tursoClient.execute({
      sql: 'DELETE FROM staff WHERE id = ? AND tenant_id = ?',
      args: [id, tenantId]
    });

    if (result.rowsChanged === 0) {
      return res.status(404).json({
        success: false,
        error: 'Staff tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Staff berhasil dihapus'
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// SERVICES ENDPOINTS
// ============================================================================

// GET all services
router.get('/services', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const active = req.query.active;

    let sql = 'SELECT * FROM services WHERE tenant_id = ?';
    let args = [tenantId];

    if (active !== undefined) {
      sql += ' AND active = ?';
      args.push(active === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY id DESC';

    const result = await tursoClient.execute({
      sql,
      args
    });

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    handleError(res, error);
  }
});

// GET single service
router.get('/services/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const result = await tursoClient.execute({
      sql: 'SELECT * FROM services WHERE id = ? AND tenant_id = ?',
      args: [id, tenantId]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Layanan tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    handleError(res, error);
  }
});

// CREATE service
router.post('/services', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const {
      service_id,
      name,
      price_per_kg,
      turnaround_days,
      description
    } = req.body;

    if (!service_id || !name || !price_per_kg) {
      return res.status(400).json({
        success: false,
        error: 'Data layanan tidak lengkap'
      });
    }

    const result = await tursoClient.execute({
      sql: `INSERT INTO services 
            (tenant_id, service_id, name, price_per_kg, turnaround_days, 
             description, active, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        tenantId,
        service_id,
        name,
        price_per_kg,
        turnaround_days || 1,
        description || '',
        1
      ]
    });

    res.status(201).json({
      success: true,
      data: {
        id: Number(result.lastInsertRowid),
        service_id,
        name,
        price_per_kg,
        turnaround_days: turnaround_days || 1,
        active: true
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// UPDATE service
router.put('/services/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const updates = req.body;

    const checkResult = await tursoClient.execute({
      sql: 'SELECT * FROM services WHERE id = ? AND tenant_id = ?',
      args: [id, tenantId]
    });

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Layanan tidak ditemukan'
      });
    }

    const allowedFields = [
      'name', 'price_per_kg', 'turnaround_days', 'description', 'active'
    ];

    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tidak ada field yang dapat diperbarui'
      });
    }

    fields.push('updated_at = datetime("now")');
    values.push(id, tenantId);

    await tursoClient.execute({
      sql: `UPDATE services SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      args: values
    });

    res.json({
      success: true,
      data: { id, ...updates }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// DELETE service
router.delete('/services/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const result = await tursoClient.execute({
      sql: 'DELETE FROM services WHERE id = ? AND tenant_id = ?',
      args: [id, tenantId]
    });

    if (result.rowsChanged === 0) {
      return res.status(404).json({
        success: false,
        error: 'Layanan tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Layanan berhasil dihapus'
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// PAYMENTS ENDPOINTS
// ============================================================================

// GET all payments
router.get('/payments', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let sql = 'SELECT * FROM payments WHERE tenant_id = ?';
    let args = [tenantId];

    if (status) {
      sql += ' AND status = ?';
      args.push(status);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const result = await tursoClient.execute({
      sql,
      args
    });

    let countSql = 'SELECT COUNT(*) as total FROM payments WHERE tenant_id = ?';
    let countArgs = [tenantId];

    if (status) {
      countSql += ' AND status = ?';
      countArgs.push(status);
    }

    const countResult = await tursoClient.execute({
      sql: countSql,
      args: countArgs
    });

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0].total,
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// GET single payment
router.get('/payments/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const result = await tursoClient.execute({
      sql: 'SELECT * FROM payments WHERE id = ? AND tenant_id = ?',
      args: [id, tenantId]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pembayaran tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    handleError(res, error);
  }
});

// CREATE payment
router.post('/payments', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const {
      payment_id,
      order_id,
      amount,
      payment_method,
      reference
    } = req.body;

    if (!payment_id || !order_id || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        error: 'Data pembayaran tidak lengkap'
      });
    }

    const result = await tursoClient.execute({
      sql: `INSERT INTO payments 
            (tenant_id, payment_id, order_id, amount, payment_method, 
             status, paid_date, reference, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'))`,
      args: [
        tenantId,
        payment_id,
        order_id,
        amount,
        payment_method,
        'completed',
        reference || ''
      ]
    });

    res.status(201).json({
      success: true,
      data: {
        id: Number(result.lastInsertRowid),
        payment_id,
        order_id,
        amount,
        payment_method,
        status: 'completed'
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// UPDATE payment status
router.put('/payments/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status pembayaran harus disediakan'
      });
    }

    const checkResult = await tursoClient.execute({
      sql: 'SELECT * FROM payments WHERE id = ? AND tenant_id = ?',
      args: [id, tenantId]
    });

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pembayaran tidak ditemukan'
      });
    }

    await tursoClient.execute({
      sql: 'UPDATE payments SET status = ?, updated_at = datetime("now") WHERE id = ? AND tenant_id = ?',
      args: [status, id, tenantId]
    });

    res.json({
      success: true,
      data: { id, status }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// DELETE payment
router.delete('/payments/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const result = await tursoClient.execute({
      sql: 'DELETE FROM payments WHERE id = ? AND tenant_id = ?',
      args: [id, tenantId]
    });

    if (result.rowsChanged === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pembayaran tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Pembayaran berhasil dihapus'
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
//