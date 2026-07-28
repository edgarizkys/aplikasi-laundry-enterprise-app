// controllers/appController.js - Enterprise CRUD Controllers for Laundry Management
const { tursoClient } = require('../config/database');

// ============================================================================
// ORDERS MANAGEMENT
// ============================================================================

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
            sql += ' AND (customer_name LIKE ? OR order_number LIKE ? OR phone LIKE ?)';
            args.push(`%${search}%`, `%${search}%`, `%${search}%`);
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
            countSql += ' AND (customer_name LIKE ? OR order_number LIKE ? OR phone LIKE ?)';
            countArgs.push(`%${search}%`, `%${search}%`, `%${search}%`);
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
            items_count,
            weight_kg,
            service_type,
            total_price,
            pickup_date,
            delivery_date,
            assigned_staff,
            notes
        } = req.body;

        if (!customer_name || !phone || !weight_kg || !total_price) {
            return res.status(400).json({ success: false, error: 'Data pesanan tidak lengkap' });
        }

        const result = await tursoClient.execute({
            sql: `INSERT INTO orders (
                tenant_id, order_number, customer_id, customer_name, phone,
                items_count, weight_kg, service_type, total_price, status,
                pickup_date, delivery_date, assigned_staff, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            args: [
                tenantId,
                order_number || `ORD-${Date.now()}`,
                customer_id || null,
                customer_name,
                phone,
                items_count || 0,
                weight_kg,
                service_type || 'Regular',
                total_price,
                'pending',
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
                order_number: order_number || `ORD-${Date.now()}`,
                customer_name,
                phone,
                weight_kg,
                total_price,
                status: 'pending'
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
        const {
            customer_name,
            phone,
            items_count,
            weight_kg,
            service_type,
            total_price,
            status,
            pickup_date,
            delivery_date,
            assigned_staff,
            notes
        } = req.body;

        const checkResult = await tursoClient.execute({
            sql: 'SELECT id FROM orders WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
        }

        const updates = [];
        const args = [];

        if (customer_name !== undefined) {
            updates.push('customer_name = ?');
            args.push(customer_name);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            args.push(phone);
        }
        if (items_count !== undefined) {
            updates.push('items_count = ?');
            args.push(items_count);
        }
        if (weight_kg !== undefined) {
            updates.push('weight_kg = ?');
            args.push(weight_kg);
        }
        if (service_type !== undefined) {
            updates.push('service_type = ?');
            args.push(service_type);
        }
        if (total_price !== undefined) {
            updates.push('total_price = ?');
            args.push(total_price);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            args.push(status);
        }
        if (pickup_date !== undefined) {
            updates.push('pickup_date = ?');
            args.push(pickup_date);
        }
        if (delivery_date !== undefined) {
            updates.push('delivery_date = ?');
            args.push(delivery_date);
        }
        if (assigned_staff !== undefined) {
            updates.push('assigned_staff = ?');
            args.push(assigned_staff);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            args.push(notes);
        }

        updates.push('updated_at = datetime("now")');

        if (updates.length === 0) {
            return res.status(400).json({ success: false, error: 'Tidak ada data untuk diupdate' });
        }

        args.push(id);
        args.push(tenantId);

        await tursoClient.execute({
            sql: `UPDATE orders SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
            args
        });

        res.json({ success: true, message: 'Pesanan berhasil diupdate' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;

        const checkResult = await tursoClient.execute({
            sql: 'SELECT id FROM orders WHERE id = ? AND tenant_id = ?',
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
// CUSTOMERS MANAGEMENT
// ============================================================================

exports.getAllCustomers = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search;
        const tier = req.query.tier;

        let sql = 'SELECT * FROM customers WHERE tenant_id = ?';
        let args = [tenantId];

        if (search) {
            sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
            args.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (tier) {
            sql += ' AND member_tier = ?';
            args.push(tier);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        args.push(limit, offset);

        const result = await tursoClient.execute({
            sql,
            args
        });

        let countSql = 'SELECT COUNT(*) as total FROM customers WHERE tenant_id = ?';
        let countArgs = [tenantId];

        if (search) {
            countSql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
            countArgs.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (tier) {
            countSql += ' AND member_tier = ?';
            countArgs.push(tier);
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
        const { customer_id, name, phone, email, address, member_tier } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ success: false, error: 'Nama dan telepon wajib diisi' });
        }

        const result = await tursoClient.execute({
            sql: `INSERT INTO customers (
                tenant_id, customer_id, name, phone, email, address,
                loyalty_points, total_spent, member_tier, joined_date, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            args: [
                tenantId,
                customer_id || `CUST-${Date.now()}`,
                name,
                phone,
                email || null,
                address || null,
                0,
                0,
                member_tier || 'Regular'
            ]
        });

        res.status(201).json({
            success: true,
            data: {
                id: Number(result.lastInsertRowid),
                customer_id: customer_id || `CUST-${Date.now()}`,
                name,
                phone,
                member_tier: member_tier || 'Regular'
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
        const { name, phone, email, address, loyalty_points, total_spent, member_tier } = req.body;

        const checkResult = await tursoClient.execute({
            sql: 'SELECT id FROM customers WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Pelanggan tidak ditemukan' });
        }

        const updates = [];
        const args = [];

        if (name !== undefined) {
            updates.push('name = ?');
            args.push(name);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            args.push(phone);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            args.push(email);
        }
        if (address !== undefined) {
            updates.push('address = ?');
            args.push(address);
        }
        if (loyalty_points !== undefined) {
            updates.push('loyalty_points = ?');
            args.push(loyalty_points);
        }
        if (total_spent !== undefined) {
            updates.push('total_spent = ?');
            args.push(total_spent);
        }
        if (member_tier !== undefined) {
            updates.push('member_tier = ?');
            args.push(member_tier);
        }

        updates.push('updated_at = datetime("now")');

        if (updates.length === 0) {
            return res.status(400).json({ success: false, error: 'Tidak ada data untuk diupdate' });
        }

        args.push(id);
        args.push(tenantId);

        await tursoClient.execute({
            sql: `UPDATE customers SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
            args
        });

        res.json({ success: true, message: 'Pelanggan berhasil diupdate' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;

        const checkResult = await tursoClient.execute({
            sql: 'SELECT id FROM customers WHERE id = ? AND tenant_id = ?',
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