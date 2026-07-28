// controllers/appController.js
const { tursoClient } = require('../config/database');

// ==================== ORDERS CRUD ====================

exports.getAllOrders = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const search = req.query.search;

        let sql = 'SELECT * FROM orders WHERE tenant_id = ?';
        let args = [tenantId];

        if (status) {
            sql += ' AND status = ?';
            args.push(status);
        }

        if (search) {
            sql += ' AND (order_number LIKE ? OR customer_name LIKE ? OR phone LIKE ?)';
            const searchPattern = `%${search}%`;
            args.push(searchPattern, searchPattern, searchPattern);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
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

        if (search) {
            countSql += ' AND (order_number LIKE ? OR customer_name LIKE ? OR phone LIKE ?)';
            const searchPattern = `%${search}%`;
            countArgs.push(searchPattern, searchPattern, searchPattern);
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
            customer_id,
            customer_name,
            phone,
            items_description,
            total_items,
            weight_kg,
            service_type,
            total_price,
            pickup_date,
            delivery_date,
            notes
        } = req.body;

        // Validate required fields
        if (!order_number || !customer_name || !phone || !weight_kg || !total_price) {
            return res.status(400).json({
                success: false,
                error: 'Nomor pesanan, nama pelanggan, telepon, berat, dan total harga wajib diisi'
            });
        }

        const result = await tursoClient.execute({
            sql: `INSERT INTO orders (
                    tenant_id, order_number, customer_id, customer_name, phone,
                    items_description, total_items, weight_kg, service_type, total_price,
                    status, payment_status, pickup_date, delivery_date, notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                tenantId, order_number, customer_id, customer_name, phone,
                items_description, total_items, weight_kg, service_type, total_price,
                'pending', 'unpaid', pickup_date, delivery_date, notes, new Date().toISOString()
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Pesanan berhasil dibuat',
            data: {
                id: Number(result.lastInsertRowid),
                order_number,
                customer_name,
                phone,
                total_price,
                status: 'pending',
                payment_status: 'unpaid'
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

        // Verify order exists
        const existing = await tursoClient.execute({
            sql: 'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
        }

        const allowedFields = [
            'customer_id', 'customer_name', 'phone', 'items_description', 'total_items',
            'weight_kg', 'service_type', 'total_price', 'status', 'pickup_date',
            'delivery_date', 'payment_status', 'notes'
        ];

        const updateFields = Object.keys(updates)
            .filter(key => allowedFields.includes(key))
            .map(key => `${key} = ?`);

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, error: 'Tidak ada field yang dapat diupdate' });
        }

        const updateValues = Object.keys(updates)
            .filter(key => allowedFields.includes(key))
            .map(key => updates[key]);

        updateValues.push(new Date().toISOString(), id, tenantId);

        const sql = `UPDATE orders SET ${updateFields.join(', ')}, updated_at = ? WHERE id = ? AND tenant_id = ?`;

        await tursoClient.execute({
            sql,
            args: updateValues
        });

        res.json({
            success: true,
            message: 'Pesanan berhasil diperbarui',
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

        const existing = await tursoClient.execute({
            sql: 'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (existing.rows.length === 0) {
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

// ==================== CUSTOMERS CRUD ====================

exports.getAllCustomers = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search;

        let sql = 'SELECT * FROM customers WHERE tenant_id = ?';
        let args = [tenantId];

        if (search) {
            sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
            const searchPattern = `%${search}%`;
            args.push(searchPattern, searchPattern, searchPattern);
        }

        sql += ' ORDER BY registration_date DESC LIMIT ? OFFSET ?';
        args.push(limit, offset);

        const result = await tursoClient.execute({
            sql,
            args
        });

        let countSql = 'SELECT COUNT(*) as total FROM customers WHERE tenant_id = ?';
        let countArgs = [tenantId];

        if (search) {
            countSql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
            const searchPattern = `%${search}%`;
            countArgs.push(searchPattern, searchPattern, searchPattern);
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
            city
        } = req.body;

        if (!customer_id || !name || !phone) {
            return res.status(400).json({
                success: false,
                error: 'ID pelanggan, nama, dan telepon wajib diisi'
            });
        }

        const result = await tursoClient.execute({
            sql: `INSERT INTO customers (
                    tenant_id, customer_id, name, phone, email, address, city,
                    loyalty_points, total_orders, registration_date, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                tenantId, customer_id, name, phone, email || null, address || null, city || null,
                0, 0, new Date().toISOString(), new Date().toISOString()
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Pelanggan berhasil dibuat',
            data: {
                id: Number(result.lastInsertRowid),
                customer_id,
                name,
                phone,
                loyalty_points: 0,
                total_orders: 0
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

        const existing = await tursoClient.execute({
            sql: 'SELECT * FROM customers WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Pelanggan tidak ditemukan' });
        }

        const allowedFields = ['name', 'phone', 'email', 'address', 'city', 'loyalty_points'];

        const updateFields = Object.keys(updates)
            .filter(key => allowedFields.includes(key))
            .map(key => `${key} = ?`);

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, error: 'Tidak ada field yang dapat diupdate' });
        }

        const updateValues = Object.keys(updates)
            .filter(key => allowedFields.includes(key))
            .map(key => updates[key]);

        updateValues.push(new Date().toISOString(), id, tenantId);

        const sql = `UPDATE customers SET ${updateFields.join(', ')}, updated_at = ? WHERE id = ? AND tenant_id = ?`;

        await tursoClient.execute({
            sql,
            args: updateValues
        });

        res.json({
            success: true,
            message: 'Pelanggan berhasil diperbarui',
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

        const existing = await tursoClient.execute({
            sql: 'SELECT * FROM customers WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (existing.rows.length === 0) {
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