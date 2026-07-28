const express = require('express');
const router = express.Router();
const db = require('../db/client');
const paymentService = require('../services/paymentService');
const { validatePayment, validateOrderId } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize } = require('../middleware/auth');

// Create QRIS Payment
router.post('/qris', authenticate, asyncHandler(async (req, res) => {
    const { orderId, amount, customerInfo } = req.body;
    
    validateOrderId(orderId);
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Jumlah pembayaran tidak valid' });
    }

    const order = await db.execute(
        'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
        [orderId, req.user.tenantId]
    );

    if (!order.rows.length) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    const qrisResult = await paymentService.createQrisTransaction(
        orderId,
        amount,
        customerInfo || {}
    );

    const payment = await db.execute(
        `INSERT INTO payments (
            order_id, customer_name, amount, payment_method, 
            status, reference_number, qr_code_url, deep_link, 
            expires_at, tenant_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        RETURNING *`,
        [
            orderId,
            customerInfo?.name || order.rows[0].customer_name,
            amount,
            'QRIS',
            'pending',
            qrisResult.referenceNo,
            qrisResult.qrCodeUrl,
            qrisResult.deepLink,
            qrisResult.expiresAt,
            req.user.tenantId
        ]
    );

    res.status(201).json({
        success: true,
        payment: payment.rows[0],
        qris: {
            referenceNo: qrisResult.referenceNo,
            qrCodeUrl: qrisResult.qrCodeUrl,
            deepLink: qrisResult.deepLink,
            expiresAt: qrisResult.expiresAt
        }
    });
}));

// Create Virtual Account Payment
router.post('/virtual-account', authenticate, asyncHandler(async (req, res) => {
    const { orderId, amount, bank = 'BCA' } = req.body;

    validateOrderId(orderId);
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Jumlah pembayaran tidak valid' });
    }

    const validBanks = ['BCA', 'MANDIRI', 'BNI', 'BTN', 'CIMB'];
    if (!validBanks.includes(bank.toUpperCase())) {
        return res.status(400).json({ error: 'Bank tidak didukung' });
    }

    const order = await db.execute(
        'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
        [orderId, req.user.tenantId]
    );

    if (!order.rows.length) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    const vaResult = await paymentService.createVirtualAccountTransaction(orderId, amount, bank);

    const payment = await db.execute(
        `INSERT INTO payments (
            order_id, customer_name, amount, payment_method, 
            status, reference_number, va_number, va_instructions,
            expires_at, tenant_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        RETURNING *`,
        [
            orderId,
            order.rows[0].customer_name,
            amount,
            `VA_${bank.toUpperCase()}`,
            'pending',
            vaResult.orderId,
            vaResult.vaNumber,
            vaResult.instructions,
            vaResult.expiresAt,
            req.user.tenantId
        ]
    );

    res.status(201).json({
        success: true,
        payment: payment.rows[0],
        virtualAccount: {
            vaNumber: vaResult.vaNumber,
            bank: bank.toUpperCase(),
            instructions: vaResult.instructions,
            expiresAt: vaResult.expiresAt
        }
    });
}));

// Create Bank Transfer Payment
router.post('/bank-transfer', authenticate, asyncHandler(async (req, res) => {
    const { orderId, amount } = req.body;

    validateOrderId(orderId);
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Jumlah pembayaran tidak valid' });
    }

    const order = await db.execute(
        'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
        [orderId, req.user.tenantId]
    );

    if (!order.rows.length) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    const referenceNo = `BT-${orderId}-${Date.now()}`;

    const payment = await db.execute(
        `INSERT INTO payments (
            order_id, customer_name, amount, payment_method, 
            status, reference_number, tenant_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        RETURNING *`,
        [
            orderId,
            order.rows[0].customer_name,
            amount,
            'Bank Transfer',
            'pending',
            referenceNo,
            req.user.tenantId
        ]
    );

    res.status(201).json({
        success: true,
        payment: payment.rows[0],
        bankTransfer: {
            referenceNo: referenceNo,
            instructions: 'Silahkan melakukan transfer manual dan informasikan nomor referensi.',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
    });
}));

// Get Payment by ID
router.get('/:paymentId', authenticate, asyncHandler(async (req, res) => {
    const { paymentId } = req.params;

    const payment = await db.execute(
        'SELECT * FROM payments WHERE id = ? AND tenant_id = ?',
        [paymentId, req.user.tenantId]
    );

    if (!payment.rows.length) {
        return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
    }

    res.json({
        success: true,
        payment: payment.rows[0]
    });
}));

// Get Payments by Order
router.get('/order/:orderId', authenticate, asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const payments = await db.execute(
        `SELECT * FROM payments 
         WHERE order_id = ? AND tenant_id = ?
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [orderId, req.user.tenantId, limit, offset]
    );

    const total = await db.execute(
        'SELECT COUNT(*) as count FROM payments WHERE order_id = ? AND tenant_id = ?',
        [orderId, req.user.tenantId]
    );

    res.json({
        success: true,
        payments: payments.rows,
        pagination: {
            total: total.rows[0].count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total.rows[0].count / limit)
        }
    });
}));

// List All Payments
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, method, startDate, endDate } = req.query;

    let query = 'SELECT * FROM payments WHERE tenant_id = ?';
    const params = [req.user.tenantId];

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    if (method) {
        query += ' AND payment_method = ?';
        params.push(method);
    }

    if (startDate) {
        query += ' AND date(created_at) >= date(?)';
        params.push(startDate);
    }

    if (endDate) {
        query += ' AND date(created_at) <= date(?)';
        params.push(endDate);
    }

    const offset = (page - 1) * limit;
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const payments = await db.execute(query, params);

    let countQuery = 'SELECT COUNT(*) as count FROM payments WHERE tenant_id = ?';
    const countParams = [req.user.tenantId];

    if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
    }
    if (method) {
        countQuery += ' AND payment_method = ?';
        countParams.push(method);
    }
    if (startDate) {
        countQuery += ' AND date(created_at) >= date(?)';
        countParams.push(startDate);
    }
    if (endDate) {
        countQuery += ' AND date(created_at) <= date(?)';
        countParams.push(endDate);
    }

    const total = await db.execute(countQuery, countParams);

    res.json({
        success: true,
        payments: payments.rows,
        pagination: {
            total: total.rows[0].count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total.rows[0].count / limit)
        }
    });
}));

// Confirm Payment (Manual confirmation for bank transfers)
router.post('/:paymentId/confirm', authenticate, authorize(['admin', 'finance']), asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const { notes } = req.body;

    const payment = await db.execute(
        'SELECT * FROM payments WHERE id = ? AND tenant_id = ?',
        [paymentId, req.user.tenantId]
    );

    if (!payment.rows.length) {
        return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
    }

    if (payment.rows[0].status === 'paid') {
        return res.status(400).json({ error: 'Pembayaran sudah dikonfirmasi' });
    }

    const updated = await db.execute(
        `UPDATE payments 
         SET status = ?, confirmed_at = datetime('now'), confirmed_by = ?, notes = ?, updated_at = datetime('now')
         WHERE id = ?
         RETURNING *`,
        ['paid', req.user.id, notes || null, paymentId]
    );

    // Update order status
    await db.execute(
        `UPDATE orders 
         SET status = 'ready_for_delivery', updated_at = datetime('now')
         WHERE id = ?`,
        [payment.rows[0].order_id]
    );

    res.json({
        success: true,
        message: 'Pembayaran berhasil dikonfirmasi',
        payment: updated.rows[0]
    });
}));

// Webhook for Payment Gateway
router.post('/webhook/payment-status', asyncHandler(async (req, res) => {
    const { signature } = req.headers;
    const payload = req.body;

    const isValid = paymentService.verifyWebhookSignature(payload, signature);
    if (!isValid) {
        return res.status(401).json({ error: 'Signature tidak valid' });
    }

    const { referenceNo, status, orderId, amount } = payload;

    const payment = await db.execute(
        'SELECT * FROM payments WHERE reference_number = ?',
        [referenceNo]
    );

    if (!payment.rows.length) {
        return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
    }

    const newStatus = status === 'completed' ? 'paid' : 'failed';

    const updated = await db.execute(
        `UPDATE payments 
         SET status = ?, updated_at = datetime('now')
         WHERE id = ?
         RETURNING *`,
        [newStatus, payment.rows[0].id]
    );

    if (newStatus === 'paid') {
        await db.execute(
            `UPDATE orders 
             SET status = 'ready_for_delivery', updated_at = datetime('now')
             WHERE id = ?`,
            [payment.rows[0].order_id]
        );
    }

    res.json({
        success: true,
        message: 'Webhook diproses',
        payment: updated.rows[0]
    });
}));

// Cancel Payment
router.post('/:paymentId/cancel', authenticate, authorize(['admin', 'finance']), asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await db.execute(
        'SELECT * FROM payments WHERE id = ? AND tenant_id = ?',
        [paymentId, req.user.tenantId]
    );

    if (!payment.rows.length) {
        return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
    }

    if (payment.rows[0].status !== 'pending') {
        return res.status(400).json({ error: 'Hanya pembayaran pending yang dapat dibatalkan' });
    }

    const updated = await db.execute(
        `UPDATE payments 
         SET status = ?, cancelled_at = datetime('now'), cancellation_reason = ?, updated_at = datetime('now')
         WHERE id = ?
         RETURNING *`,
        ['cancelled', reason || null, paymentId]
    );

    res.json({
        success: true,
        message: 'Pembayaran berhasil dibatalkan',
        payment: updated.rows[0]
    });
}));

// Get Payment Statistics
router.get('/stats/summary', authenticate, authorize(['admin', 'finance']), asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    let query = `
        SELECT 
            COUNT(*) as total_transactions,
            COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
            SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
            AVG(amount) as average_amount
        FROM payments 
        WHERE tenant_id = ?
    `;
    const params = [req.user.tenantId];

    if (startDate) {
        query += ' AND date(created_at) >= date(?)';
        params.push(startDate);
    }

    if (endDate) {
        query += ' AND date(created_at) <= date(?)';
        params.push(endDate);
    }

    const stats = await db.execute(query, params);

    res.json({
        success: true,
        statistics: stats.rows[0]
    });
}));

module.exports = router;