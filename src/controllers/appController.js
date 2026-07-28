const { tursoClient } = require('../config/database');

// ============================================================================
// ORDERS CONTROLLER
// ============================================================================

exports.getAllOrders = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || '';

        let whereClause = 'WHERE tenant_id = ?';
        const args = [tenantId];

        if (search) {
            whereClause += ' AND (order_number LIKE ? OR customer_name LIKE ? OR phone LIKE ?)';
            const searchPattern = `%${search}%`;
            args.push(searchPattern, searchPattern, searchPattern);
        }

        if (status) {
            whereClause += ' AND status = ?';
            args.push(status);
        }

        const countResult = await tursoClient.execute({
            sql: `SELECT COUNT(*) as total FROM orders ${whereClause}`,
            args: args
        });

        const result = await tursoClient.execute({
            sql: `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            args: [...args, limit, offset]
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
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;

        const result = await tursoClient.execute({
            sql: 'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
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
            notes
        } = req.body;

        // Validation
        if (!order_number || !customer_name || !phone || !total_price) {
            return res.status(400).json({
                success: false,
                error: 'Field required: order_number, customer_name, phone, total_price'
            });
        }

        const result = await tursoClient.execute({
            sql: `INSERT INTO orders 
                  (tenant_id, order_number, customer_name, phone, email, items_list, total_weight_kg, 
                   service_type, total_price, status, pickup_date, delivery_date, assigned_staff, notes, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            args: [
                tenantId,
                order_number,
                customer_name,
                phone,
                email || null,
                items_list || null,
                total_weight_kg || 0,
                service_type || 'Regular',
                total_price,
                status || 'pending',
                pickup_date || null,
                delivery_date || null,
                assigned_staff || null,
                notes || null
            ]
        });

        res.status(201).json({
            success: true,
            data: {
                id: Number(result.lastInsertRowid),
                order_number,
                customer_name,
                phone,
                email,
                items_list,
                total_weight_kg,
                service_type,
                total_price,
                status: status || 'pending',
                pickup_date,
                delivery_date,
                assigned_staff,
                notes
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;
        const updates = req.body;

        // Check if order exists
        const checkResult = await tursoClient.execute({
            sql: 'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
        }

        const allowedFields = [
            'order_number', 'customer_name', 'phone', 'email', 'items_list',
            'total_weight_kg', 'service_type', 'total_price', 'status',
            'pickup_date', 'delivery_date', 'assigned_staff', 'notes'
        ];

        const updateFields = Object.keys(updates)
            .filter(key => allowedFields.includes(key))
            .map(key => `${key} = ?`);

        const updateValues = Object.keys(updates)
            .filter(key => allowedFields.includes(key))
            .map(key => updates[key]);

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, error: 'Tidak ada field yang valid untuk diupdate' });
        }

        await tursoClient.execute({
            sql: `UPDATE orders SET ${updateFields.join(', ')}, updated_at = datetime('now') 
                  WHERE id = ? AND tenant_id = ?`,
            args: [...updateValues, id, tenantId]
        });

        res.json({
            success: true,
            data: { id, ...updates }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;

        const checkResult = await tursoClient.execute({
            sql: 'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
        }

        await tursoClient.execute({
            sql: 'DELETE FROM orders WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        res.json({ success: true, message: 'Pesanan berhasil dihapus' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

// ============================================================================
// CUSTOMERS CONTROLLER
// ============================================================================

exports.getAllCustomers = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let whereClause = 'WHERE tenant_id = ?';
        const args = [tenantId];

        if (search) {
            whereClause += ' AND (customer_id LIKE ? OR name LIKE ? OR phone LIKE ? OR email LIKE ?)';
            const searchPattern = `%${search}%`;
            args.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        const countResult = await tursoClient.execute({
            sql: `SELECT COUNT(*) as total FROM customers ${whereClause}`,
            args: args
        });

        const result = await tursoClient.execute({
            sql: `SELECT * FROM customers ${whereClause} ORDER BY registration_date DESC LIMIT ? OFFSET ?`,
            args: [...args, limit, offset]
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
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.getCustomerById = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;

        const result = await tursoClient.execute({
            sql: 'SELECT * FROM customers WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Pelanggan tidak ditemukan' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.createCustomer = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const {
            customer_id,
            name,
            phone,
            email,
            address,
            city,
            loyalty_points,
            total_spent,
            registration_date
        } = req.body;

        if (!customer_id || !name || !phone) {
            return res.status(400).json({
                success: false,
                error: 'Field required: customer_id, name, phone'
            });
        }

        const result = await tursoClient.execute({
            sql: `INSERT INTO customers 
                  (tenant_id, customer_id, name, phone, email, address, city, loyalty_points, total_spent, registration_date, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            args: [
                tenantId,
                customer_id,
                name,
                phone,
                email || null,
                address || null,
                city || null,
                loyalty_points || 0,
                total_spent || 0,
                registration_date || new Date().toISOString().split('T')[0]
            ]
        });

        res.status(201).json({
            success: true,
            data: {
                id: Number(result.lastInsertRowid),
                customer_id,
                name,
                phone,
                email,
                address,
                city,
                loyalty_points: loyalty_points || 0,
                total_spent: total_spent || 0,
                registration_date
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;
        const updates = req.body;

        const checkResult = await tursoClient.execute({
            sql: 'SELECT * FROM customers WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Pelanggan tidak ditemukan' });
        }

        const allowedFields = [
            'customer_id', 'name', 'phone', 'email', 'address', 'city',
            'loyalty_points', 'total_spent', 'registration_date'
        ];

        const updateFields = Object.keys(updates)
            .filter(key => allowedFields.includes(key))
            .map(key => `${key} = ?`);

        const updateValues = Object.keys(updates)
            .filter(key => allowedFields.includes(key))
            .map(key => updates[key]);

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, error: 'Tidak ada field yang valid untuk diupdate' });
        }

        await tursoClient.execute({
            sql: `UPDATE customers SET ${updateFields.join(', ')}, updated_at = datetime('now') 
                  WHERE id = ? AND tenant_id = ?`,
            args: [...updateValues, id, tenantId]
        });

        res.json({
            success: true,
            data: { id, ...updates }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;

        const checkResult = await tursoClient.execute({
            sql: 'SELECT * FROM customers WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Pelanggan tidak ditemukan' });
        }

        await tursoClient.execute({
            sql: 'DELETE FROM customers WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        res.json({ success: true, message: 'Pelanggan berhasil dihapus' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

// ============================================================================
// STAFF CONTROLLER
// ============================================================================

exports.getAllStaff = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const role = req.query.role || '';

        let whereClause = 'WHERE tenant_id = ?';
        const args = [tenantId];

        if (search) {
            whereClause += ' AND (staff_id LIKE ? OR name LIKE ? OR phone LIKE ?)';
            const searchPattern = `%${search}%`;
            args.push(searchPattern, searchPattern, searchPattern);
        }

        if (role) {
            whereClause += ' AND role = ?';
            args.push(role);
        }

        const countResult = await tursoClient.execute({
            sql: `SELECT COUNT(*) as total FROM staff ${whereClause}`,
            args: args
        });

        const result = await tursoClient.execute({
            sql: `SELECT * FROM staff ${whereClause} ORDER BY join_date DESC LIMIT ? OFFSET ?`,
            args: [...args, limit, offset]
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
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.getStaffById = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;

        const result = await tursoClient.execute({
            sql: 'SELECT * FROM staff WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Staff tidak ditemukan' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.createStaff = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const {
            staff_id,
            name,
            role,
            phone,
            email,
            shift,
            salary,
            join_date,
            status
        } = req.body;

        if (!staff_id || !name || !role) {
            return res.status(400).json({
                success: false,
                error: 'Field required: staff_id, name, role'
            });
        }

        const result = await tursoClient.execute({
            sql: `INSERT INTO staff 
                  (tenant_id, staff_id, name, role, phone, email, shift, salary, join_date, status, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            args: [
                tenantId,
                staff_id,
                name,
                role,
                phone || null,
                email || null,
                shift || null,
                salary || 0,
                join_date || new Date().toISOString().split('T')[0],
                status || 'aktif'
            ]
        });

        res.status(201).json({
            success: true,
            data: {
                id: Number(result.lastInsertRowid),
                staff_id,
                name,
                role,
                phone,
                email,
                shift,
                salary,
                join_date,
                status: status || 'aktif'
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.updateStaff = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;
        const updates = req.body;

        const checkResult = await tursoClient.execute({
            sql: 'SELECT * FROM staff WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Staff tidak ditemukan' });
        }

        const allowedFields = [
            'staff_id', 'name', 'role', 'phone', 'email', 'shift',
            'salary', 'join_date', 'status'
        ];

        const updateFields = Object.keys(updates)
            .filter(key => allowedFields.includes(key))
            .map(key => `${key} = ?`);

        const updateValues = Object.keys(updates)
            .filter(key => allowedFields.includes(key))
            .map(key => updates[key]);

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, error: 'Tidak ada field yang valid untuk diupdate' });
        }

        await tursoClient.execute({
            sql: `UPDATE staff SET ${updateFields.join(', ')}, updated_at = datetime('now') 
                  WHERE id = ? AND tenant_id = ?`,
            args: [...updateValues, id, tenantId]
        });

        res.json({
            success: true,
            data: { id, ...updates }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.deleteStaff = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;

        const checkResult = await tursoClient.execute({
            sql: 'SELECT * FROM staff WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Staff tidak ditemukan' });
        }

        await tursoClient.execute({
            sql: 'DELETE FROM staff WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        res.json({ success: true, message: 'Staff berhasil dihapus' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};