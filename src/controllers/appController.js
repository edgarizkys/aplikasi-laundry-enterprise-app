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
            whereClause += ' AND (customer_name LIKE ? OR order_id LIKE ? OR email LIKE ?)';
            const searchPattern = `%${search}%`;
            args.push(searchPattern, searchPattern, searchPattern);
        }

        if (status) {
            whereClause += ' AND status = ?';
            args.push(status);
        }

        const result = await tursoClient.execute({
            sql: `SELECT * FROM orders ${whereClause} ORDER BY pickup_date DESC LIMIT ? OFFSET ?`,
            args: [...args, limit, offset]
        });

        const countResult = await tursoClient.execute({
            sql: `SELECT COUNT(*) as total FROM orders ${whereClause}`,
            args: args
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
            order_id,
            customer_name,
            phone,
            email,
            items,
            weight_kg,
            service_type,
            unit_price,
            total_price,
            pickup_date,
            delivery_date,
            branch_id,
            assigned_staff,
            notes
        } = req.body;

        if (!order_id || !customer_name || !phone || !weight_kg || !total_price) {
            return res.status(400).json({
                success: false,
                error: 'Field wajib diisi: order_id, customer_name, phone, weight_kg, total_price'
            });
        }

        const result = await tursoClient.execute({
            sql: `INSERT INTO orders (
                tenant_id, order_id, customer_name, phone, email, items, weight_kg,
                service_type, unit_price, total_price, status, pickup_date, delivery_date,
                branch_id, assigned_staff, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            args: [
                tenantId,
                order_id,
                customer_name,
                phone,
                email || null,
                items || null,
                weight_kg,
                service_type || 'Standard',
                unit_price || 0,
                total_price,
                'pending',
                pickup_date,
                delivery_date || null,
                branch_id || null,
                assigned_staff || null,
                notes || null
            ]
        });

        res.status(201).json({
            success: true,
            data: {
                id: Number(result.lastInsertRowid),
                order_id,
                customer_name,
                phone,
                email,
                items,
                weight_kg,
                service_type,
                unit_price,
                total_price,
                status: 'pending',
                pickup_date,
                delivery_date,
                branch_id,
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

        const allowedFields = [
            'customer_name', 'phone', 'email', 'items', 'weight_kg', 'service_type',
            'unit_price', 'total_price', 'status', 'pickup_date', 'delivery_date',
            'branch_id', 'assigned_staff', 'notes'
        ];

        const validUpdates = {};
        for (const field of allowedFields) {
            if (field in updates) {
                validUpdates[field] = updates[field];
            }
        }

        if (Object.keys(validUpdates).length === 0) {
            return res.status(400).json({ success: false, error: 'Tidak ada field yang valid untuk diupdate' });
        }

        const setClause = Object.keys(validUpdates)
            .map(key => `${key} = ?`)
            .join(', ');
        const values = Object.values(validUpdates);

        await tursoClient.execute({
            sql: `UPDATE orders SET ${setClause}, updated_at = datetime('now') WHERE id = ? AND tenant_id = ?`,
            args: [...values, id, tenantId]
        });

        const result = await tursoClient.execute({
            sql: 'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        res.json({ success: true, data: result.rows[0] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;

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
        const memberType = req.query.member_type || '';

        let whereClause = 'WHERE tenant_id = ?';
        const args = [tenantId];

        if (search) {
            whereClause += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
            const searchPattern = `%${search}%`;
            args.push(searchPattern, searchPattern, searchPattern);
        }

        if (memberType) {
            whereClause += ' AND member_type = ?';
            args.push(memberType);
        }

        const result = await tursoClient.execute({
            sql: `SELECT * FROM customers ${whereClause} ORDER BY join_date DESC LIMIT ? OFFSET ?`,
            args: [...args, limit, offset]
        });

        const countResult = await tursoClient.execute({
            sql: `SELECT COUNT(*) as total FROM customers ${whereClause}`,
            args: args
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
        const { customer_id, name, phone, email, address, city, member_type, join_date } = req.body;

        if (!customer_id || !name || !phone) {
            return res.status(400).json({
                success: false,
                error: 'Field wajib diisi: customer_id, name, phone'
            });
        }

        const result = await tursoClient.execute({
            sql: `INSERT INTO customers (
                tenant_id, customer_id, name, phone, email, address, city,
                member_type, points, total_orders, total_spent, join_date, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            args: [
                tenantId,
                customer_id,
                name,
                phone,
                email || null,
                address || null,
                city || null,
                member_type || 'Regular',
                0,
                0,
                0,
                join_date || new Date().toISOString().split('T')[0]
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
                member_type,
                points: 0,
                total_orders: 0,
                total_spent: 0,
                join_date
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

        const allowedFields = [
            'name', 'phone', 'email', 'address', 'city', 'member_type', 'points', 'total_orders', 'total_spent'
        ];

        const validUpdates = {};
        for (const field of allowedFields) {
            if (field in updates) {
                validUpdates[field] = updates[field];
            }
        }

        if (Object.keys(validUpdates).length === 0) {
            return res.status(400).json({ success: false, error: 'Tidak ada field yang valid untuk diupdate' });
        }

        const setClause = Object.keys(validUpdates)
            .map(key => `${key} = ?`)
            .join(', ');
        const values = Object.values(validUpdates);

        await tursoClient.execute({
            sql: `UPDATE customers SET ${setClause}, updated_at = datetime('now') WHERE id = ? AND tenant_id = ?`,
            args: [...values, id, tenantId]
        });

        const result = await tursoClient.execute({
            sql: 'SELECT * FROM customers WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        res.json({ success: true, data: result.rows[0] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;

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
// BRANCHES CONTROLLER
// ============================================================================

exports.getAllBranches = async (req, res) => {
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
            whereClause += ' AND (branch_name LIKE ? OR address LIKE ?)';
            const searchPattern = `%${search}%`;
            args.push(searchPattern, searchPattern);
        }

        if (status) {
            whereClause += ' AND status = ?';
            args.push(status);
        }

        const result = await tursoClient.execute({
            sql: `SELECT * FROM branches ${whereClause} ORDER BY branch_name LIMIT ? OFFSET ?`,
            args: [...args, limit, offset]
        });

        const countResult = await tursoClient.execute({
            sql: `SELECT COUNT(*) as total FROM branches ${whereClause}`,
            args: args
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

exports.getBranchById = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;

        const result = await tursoClient.execute({
            sql: 'SELECT * FROM branches WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Cabang tidak ditemukan' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.createBranch = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { branch_id, branch_name, address, phone, manager_name, capacity, opening_hours } = req.body;

        if (!branch_id || !branch_name || !address || !phone) {
            return res.status(400).json({
                success: false,
                error: 'Field wajib diisi: branch_id, branch_name, address, phone'
            });
        }

        const result = await tursoClient.execute({
            sql: `INSERT INTO branches (
                tenant_id, branch_id, branch_name, address, phone, manager_name,
                capacity, opening_hours, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            args: [
                tenantId,
                branch_id,
                branch_name,
                address,
                phone,
                manager_name || null,
                capacity || 0,
                opening_hours || null,
                'active'
            ]
        });

        res.status(201).json({
            success: true,
            data: {
                id: Number(result.lastInsertRowid),
                branch_id,
                branch_name,
                address,
                phone,
                manager_name,
                capacity,
                opening_hours,
                status: 'active'
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.updateBranch = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;
        const updates = req.body;

        const allowedFields = [
            'branch_name', 'address', 'phone', 'manager_name', 'capacity', 'opening_hours', 'status'
        ];

        const validUpdates = {};
        for (const field of allowedFields) {
            if (field in updates) {
                validUpdates[field] = updates[field];
            }
        }

        if (Object.keys(validUpdates).length === 0) {
            return res.status(400).json({ success: false, error: 'Tidak ada field yang valid untuk diupdate' });
        }

        const setClause = Object.keys(validUpdates)
            .map(key => `${key} = ?`)
            .join(', ');
        const values = Object.values(validUpdates);

        await tursoClient.execute({
            sql: `UPDATE branches SET ${setClause}, updated_at = datetime('now') WHERE id = ? AND tenant_id = ?`,
            args: [...values, id, tenantId]
        });

        const result = await tursoClient.execute({
            sql: 'SELECT * FROM branches WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        res.json({ success: true, data: result.rows[0] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.deleteBranch = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;

        await tursoClient.execute({
            sql: 'DELETE FROM branches WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        res.json({ success: true, message: 'Cabang berhasil dihapus' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};