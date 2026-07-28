const express = require('express');
const router = express.Router();
const db = require('../config/database');
const paymentService = require('../services/paymentService');
const { validateRequest, asyncHandler } = require('../middleware/validators');
const { requireAuth, requireRole } = require('../middleware/auth');

// Get all payments with pagination
router.get('/', requireAuth, asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || null;
    const paymentMethod = req.query.paymentMethod || null;
    const tenantId = req.user.tenantId;

    let query = 'SELECT * FROM payments WHERE tenant_id = ?';
    const params = [tenantId];

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    if (paymentMethod) {
        query += ' AND payment_method = ?';
        params.push(paymentMethod);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await db.execute(countQuery, params);
    const total = countResult.rows[0]?.total || 0;

    query += ' ORDER BY payment_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await db.execute(query, params);
    const payments = result.rows || [];

    res.json({
        success: true,
        data: payments,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
}));

// Get payment by ID
router.get('/:paymentId', requireAuth, asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const tenantId = req.user.tenantId;

    const result = await db.execute(
        'SELECT * FROM payments WHERE payment_id = ? AND tenant_id = ?',
        [paymentId, tenantId]
    );

    const payment = result.rows?.[0];

    if (!payment) {
        return res.status(404).json({
            success: false,
            message: 'Pembayaran tidak ditemukan'
        });
    }

    res.json({
        success: true,
        data: payment
    });
}));

// Create QRIS payment
router.post('/qris/create', requireAuth, validateRequest({
    orderId: 'required|string',
    amount: 'required|number|positive',
    customerName: 'string'
}), asyncHandler(async (req, res) => {
    const { orderId, amount, customerName } = req.body;
    const tenantId = req.user.tenantId;

    // Check order exists
    const orderResult = await db.execute(
        'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
        [orderId, tenantId]
    );

    if (!orderResult.rows?.[0]) {
        return res.status(404).json({
            success: false,
            message: 'Pesanan tidak ditemukan'
        });
    }

    const order = orderResult.rows[0];

    // Create QRIS transaction
    const qrisTransaction = await paymentService.createQrisTransaction(
        order.order_number,
        amount,
        { name: customerName || order.customer_name }
    );

    const paymentId = `PAY-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await db.execute(
        `INSERT INTO payments (
            payment_id, tenant_id, order_id, customer_name, amount, 
            payment_method, reference_no, status, qr_code_url, 
            expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            paymentId,
            tenantId,
            orderId,
            customerName || order.customer_name,
            amount,
            'QRIS',
            qrisTransaction.referenceNo,
            'pending',
            qrisTransaction.qrCodeUrl,
            expiresAt,
            new Date().toISOString()
        ]
    );

    res.json({
        success: true,
        data: {
            paymentId,
            ...qrisTransaction,
            expiresAt
        }
    });
}));

// Create Virtual Account payment
router.post('/va/create', requireAuth, validateRequest({
    orderId: 'required|string',
    amount: 'required|number|positive',
    bank: 'required|string|in:BCA,BNI,MANDIRI,OVO'
}), asyncHandler(async (req, res) => {
    const { orderId, amount, bank } = req.body;
    const tenantId = req.user.tenantId;

    // Check order exists
    const orderResult = await db.execute(
        'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
        [orderId, tenantId]
    );

    if (!orderResult.rows?.[0]) {
        return res.status(404).json({
            success: false,
            message: 'Pesanan tidak ditemukan'
        });
    }

    const order = orderResult.rows[0];

    // Create VA transaction
    const vaTransaction = await paymentService.createVirtualAccountTransaction(
        order.order_number,
        amount,
        bank
    );

    const paymentId = `PAY-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db.execute(
        `INSERT INTO payments (
            payment_id, tenant_id, order_id, customer_name, amount, 
            payment_method, va_number, status, bank, expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            paymentId,
            tenantId,
            orderId,
            order.customer_name,
            amount,
            'Virtual Account',
            vaTransaction.vaNumber,
            'pending',
            bank,
            expiresAt,
            new Date().toISOString()
        ]
    );

    res.json({
        success: true,
        data: {
            paymentId,
            ...vaTransaction,
            expiresAt
        }
    });
}));

// Process payment (simulate webhook)
router.post('/process', requireAuth, validateRequest({
    paymentId: 'required|string',
    status: 'required|string|in:completed,failed,cancelled'
}), asyncHandler(async (req, res) => {
    const { paymentId, status } = req.body;
    const tenantId = req.user.tenantId;

    // Get payment
    const paymentResult = await db.execute(
        'SELECT * FROM payments WHERE payment_id = ? AND tenant_id = ?',
        [paymentId, tenantId]
    );

    const payment = paymentResult.rows?.[0];

    if (!payment) {
        return res.status(404).json({
            success: false,
            message: 'Pembayaran tidak ditemukan'
        });
    }

    // Update payment status
    await db.execute(
        'UPDATE payments SET status = ?, updated_at = ? WHERE payment_id = ? AND tenant_id = ?',
        [status, new Date().toISOString(), paymentId, tenantId]
    );

    // Update order payment status if completed
    if (status === 'completed') {
        await db.execute(
            'UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ? AND tenant_id = ?',
            ['paid', new Date().toISOString(), payment.order_id, tenantId]
        );
    }

    res.json({
        success: true,
        message: `Pembayaran ${status}`,
        data: {
            paymentId,
            status,
            updatedAt: new Date().toISOString()
        }
    });
}));

// Get payment summary by date range
router.get('/summary/range', requireAuth, requireRole('admin', 'manager'), 
    asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const tenantId = req.user.tenantId;

    if (!startDate || !endDate) {
        return res.status(400).json({
            success: false,
            message: 'startDate dan endDate diperlukan'
        });
    }

    const result = await db.execute(
        `SELECT 
            payment_method,
            status,
            COUNT(*) as total_transactions,
            SUM(amount) as total_amount,
            AVG(amount) as avg_amount
         FROM payments 
         WHERE tenant_id = ? 
         AND payment_date BETWEEN ? AND ?
         GROUP BY payment_method, status
         ORDER BY total_amount DESC`,
        [tenantId, startDate, endDate]
    );

    const summary = result.rows || [];

    const totals = summary.reduce((acc, item) => {
        acc.totalTransactions += item.total_transactions;
        acc.totalAmount += item.total_amount || 0;
        return acc;
    }, { totalTransactions: 0, totalAmount: 0 });

    res.json({
        success: true,
        data: {
            summary,
            totals,
            period: { startDate, endDate }
        }
    });
}));

// Verify webhook signature
router.post('/webhook/verify', asyncHandler(async (req, res) => {
    const signature = req.headers['x-payment-signature'];
    const payload = req.body;

    const isValid = paymentService.verifyWebhookSignature(payload, signature);

    if (!isValid) {
        return res.status(401).json({
            success: false,
            message: 'Signature tidak valid'
        });
    }

    res.json({
        success: true,
        message: 'Signature valid'
    });
}));

// Get payment methods available
router.get('/methods/available', requireAuth, asyncHandler(async (req, res) => {
    const methods = [
        {
            code: 'QRIS',
            name: 'QRIS (QR Code)',
            description: 'Pembayaran via QR Code untuk semua dompet digital',
            icon: 'qrcode',
            minAmount: 10000,
            maxAmount: 500000000,
            processingTime: '5-10 menit'
        },
        {
            code: 'VA_BCA',
            name: 'Transfer BCA Virtual Account',
            description: 'Transfer ke nomor virtual account BCA',
            icon: 'bank',
            minAmount: 10000,
            maxAmount: 500000000,
            processingTime: '5-30 menit'
        },
        {
            code: 'VA_BNI',
            name: 'Transfer BNI Virtual Account',
            description: 'Transfer ke nomor virtual account BNI',
            icon: 'bank',
            minAmount: 10000,
            maxAmount: 500000000,
            processingTime: '5-30 menit'
        },
        {
            code: 'VA_MANDIRI',
            name: 'Transfer MANDIRI Virtual Account',
            description: 'Transfer ke nomor virtual account MANDIRI',
            icon: 'bank',
            minAmount: 10000,
            maxAmount: 500000000,
            processingTime: '5-30 menit'
        },
        {
            code: 'CASH',
            name: 'Bayar di Tempat',
            description: 'Pembayaran langsung di lokasi cabang',
            icon: 'cash',
            minAmount: 0,
            maxAmount: null,
            processingTime: 'Instant'
        }
    ];

    res.json({
        success: true,
        data: methods
    });
}));

module.exports = router;