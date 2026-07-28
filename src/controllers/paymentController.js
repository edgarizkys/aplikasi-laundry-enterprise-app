const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const paymentService = require('../services/paymentService');
const { asyncHandler } = require('../middlewares/errorHandler');
const { validatePayment } = require('../validators/paymentValidator');
const { authenticate } = require('../middlewares/auth');

// Create Payment Transaction
exports.createPayment = asyncHandler(async (req, res) => {
    const { order_id, amount, payment_method, customer_info } = req.body;
    
    // Validation
    if (!order_id || !amount || !payment_method) {
        return res.status(400).json({
            success: false,
            message: 'Order ID, amount, and payment method are required'
        });
    }

    // Verify order exists
    const order = await db.execute(
        'SELECT * FROM orders WHERE id = ?',
        [order_id]
    );

    if (order.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Pesanan tidak ditemukan'
        });
    }

    const orderData = order.rows[0];

    // Check if payment already exists and is completed
    const existingPayment = await db.execute(
        'SELECT * FROM payments WHERE order_id = ? AND status = ?',
        [order_id, 'completed']
    );

    if (existingPayment.rows.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Pembayaran untuk pesanan ini sudah selesai'
        });
    }

    let paymentData = {};
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
        // Process based on payment method
        if (payment_method === 'QRIS') {
            paymentData = await paymentService.createQrisTransaction(
                order_id,
                amount,
                customer_info
            );
        } else if (payment_method === 'VIRTUAL_ACCOUNT') {
            const bank = req.body.bank || 'BCA';
            paymentData = await paymentService.createVirtualAccountTransaction(
                order_id,
                amount,
                bank
            );
        } else if (payment_method === 'TRANSFER') {
            paymentData = {
                success: true,
                provider: 'Bank Transfer',
                orderId: order_id,
                amount,
                currency: 'IDR',
                bankAccount: process.env.COMPANY_BANK_ACCOUNT || '0123456789',
                bankName: process.env.COMPANY_BANK_NAME || 'BCA',
                accountName: process.env.COMPANY_ACCOUNT_NAME || 'PT Laundry Enterprise',
                reference: `TRF-${order_id}-${Date.now()}`
            };
        } else if (payment_method === 'CASH') {
            paymentData = {
                success: true,
                provider: 'Tunai',
                orderId: order_id,
                amount,
                currency: 'IDR',
                reference: `CASH-${order_id}-${Date.now()}`
            };
        } else {
            return res.status(400).json({
                success: false,
                message: 'Metode pembayaran tidak didukung'
            });
        }

        // Save payment record to database
        const reference = paymentData.reference || paymentData.vaNumber || paymentData.referenceNo || `${payment_method}-${Date.now()}`;
        
        await db.execute(
            `INSERT INTO payments (payment_id, order_id, amount, payment_method, status, reference, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [paymentId, order_id, amount, payment_method, 'pending', reference]
        );

        res.status(201).json({
            success: true,
            message: 'Transaksi pembayaran berhasil dibuat',
            data: {
                payment_id: paymentId,
                ...paymentData
            }
        });

    } catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal membuat transaksi pembayaran',
            error: error.message
        });
    }
});

// Get Payment Details
exports.getPayment = asyncHandler(async (req, res) => {
    const { payment_id } = req.params;

    const result = await db.execute(
        'SELECT * FROM payments WHERE payment_id = ?',
        [payment_id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Pembayaran tidak ditemukan'
        });
    }

    const payment = result.rows[0];

    // Get related order
    const orderResult = await db.execute(
        'SELECT * FROM orders WHERE id = ?',
        [payment.order_id]
    );

    res.json({
        success: true,
        data: {
            ...payment,
            order: orderResult.rows[0] || null
        }
    });
});

// Get Payments by Order
exports.getPaymentsByOrder = asyncHandler(async (req, res) => {
    const { order_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await db.execute(
        `SELECT * FROM payments 
         WHERE order_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [order_id, parseInt(limit), offset]
    );

    const countResult = await db.execute(
        'SELECT COUNT(*) as total FROM payments WHERE order_id = ?',
        [order_id]
    );

    res.json({
        success: true,
        data: result.rows,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult.rows[0].total,
            pages: Math.ceil(countResult.rows[0].total / parseInt(limit))
        }
    });
});

// List All Payments with Filters
exports.listPayments = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, payment_method, start_date, end_date } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = 'SELECT * FROM payments WHERE 1=1';
    const params = [];

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    if (payment_method) {
        query += ' AND payment_method = ?';
        params.push(payment_method);
    }

    if (start_date) {
        query += ' AND date(paid_date) >= ?';
        params.push(start_date);
    }

    if (end_date) {
        query += ' AND date(paid_date) <= ?';
        params.push(end_date);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const result = await db.execute(query, params);

    let countQuery = 'SELECT COUNT(*) as total FROM payments WHERE 1=1';
    const countParams = [];

    if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
    }
    if (payment_method) {
        countQuery += ' AND payment_method = ?';
        countParams.push(payment_method);
    }
    if (start_date) {
        countQuery += ' AND date(paid_date) >= ?';
        countParams.push(start_date);
    }
    if (end_date) {
        countQuery += ' AND date(paid_date) <= ?';
        countParams.push(end_date);
    }

    const countResult = await db.execute(countQuery, countParams);
    const total = countResult.rows[0].total;

    res.json({
        success: true,
        data: result.rows,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});

// Confirm Payment (Mark as Completed)
exports.confirmPayment = asyncHandler(async (req, res) => {
    const { payment_id } = req.params;
    const { reference, notes } = req.body;

    const payment = await db.execute(
        'SELECT * FROM payments WHERE payment_id = ?',
        [payment_id]
    );

    if (payment.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Pembayaran tidak ditemukan'
        });
    }

    const paymentData = payment.rows[0];

    if (paymentData.status === 'completed') {
        return res.status(400).json({
            success: false,
            message: 'Pembayaran sudah dikonfirmasi sebelumnya'
        });
    }

    await db.execute(
        `UPDATE payments 
         SET status = ?, paid_date = datetime('now'), reference = ?, updated_at = datetime('now')
         WHERE payment_id = ?`,
        [
            'completed',
            reference || paymentData.reference,
            payment_id
        ]
    );

    // Update order status if all payments completed
    const orderPayments = await db.execute(
        'SELECT * FROM payments WHERE order_id = ?',
        [paymentData.order_id]
    );

    const allCompleted = orderPayments.rows.every(p => 
        p.payment_id === payment_id || p.status === 'completed'
    );

    if (allCompleted) {
        await db.execute(
            `UPDATE orders SET status = ? WHERE id = ?`,
            ['payment_confirmed', paymentData.order_id]
        );
    }

    res.json({
        success: true,
        message: 'Pembayaran berhasil dikonfirmasi',
        data: {
            payment_id,
            status: 'completed',
            paid_date: new Date().toISOString()
        }
    });
});

// Cancel Payment
exports.cancelPayment = asyncHandler(async (req, res) => {
    const { payment_id } = req.params;
    const { reason } = req.body;

    const payment = await db.execute(
        'SELECT * FROM payments WHERE payment_id = ?',
        [payment_id]
    );

    if (payment.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Pembayaran tidak ditemukan'
        });
    }

    const paymentData = payment.rows[0];

    if (paymentData.status === 'completed') {
        return res.status(400).json({
            success: false,
            message: 'Tidak dapat membatalkan pembayaran yang sudah selesai'
        });
    }

    await db.execute(
        `UPDATE payments 
         SET status = ?, updated_at = datetime('now')
         WHERE payment_id = ?`,
        ['cancelled', payment_id]
    );

    res.json({
        success: true,
        message: 'Pembayaran berhasil dibatalkan',
        data: {
            payment_id,
            status: 'cancelled'
        }
    });
});

// Payment Statistics
exports.getPaymentStats = asyncHandler(async (req, res) => {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [];

    if (start_date && end_date) {
        dateFilter = ' WHERE date(paid_date) BETWEEN ? AND ?';
        params.push(start_date, end_date);
    }

    // Total revenue
    const revenueResult = await db.execute(
        `SELECT SUM(amount) as total_revenue FROM payments WHERE status = 'completed'${dateFilter ? ' AND ' + dateFilter.substring(7) : ''}`,
        dateFilter ? params : []
    );

    // Payment method breakdown
    const methodResult = await db.execute(
        `SELECT payment_method, COUNT(*) as count, SUM(amount) as total 
         FROM payments WHERE status = 'completed'${dateFilter ? ' AND ' + dateFilter.substring(7) : ''}
         GROUP BY payment_method`,
        dateFilter ? params : []
    );

    // Status breakdown
    const statusResult = await db.execute(
        `SELECT status, COUNT(*) as count FROM payments${dateFilter}
         GROUP BY status`,
        params
    );

    res.json({
        success: true,
        data: {
            total_revenue: revenueResult.rows[0]?.total_revenue || 0,
            by_method: methodResult.rows,
            by_status: statusResult.rows
        }
    });
});

// Webhook Handler for Payment Gateway
exports.handlePaymentWebhook = asyncHandler(async (req, res) => {
    const { body, headers } = req;
    const signature = headers['x-signature'] || headers['x-webhook-signature'];

    // Verify webhook signature
    const isValid = paymentService.verifyWebhookSignature(body, signature);

    if (!isValid) {
        return res.status(401).json({
            success: false,
            message: 'Signature verification failed'
        });
    }

    const { transaction_status, order_id, reference_no } = body;

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
        await db.execute(
            `UPDATE payments 
             SET status = ? 
             WHERE order_id = ? AND reference = ?`,
            ['completed', order_id, reference_no]
        );

        await db.execute(
            `UPDATE orders SET status = ? WHERE id = ?`,
            ['payment_confirmed', order_id]
        );
    } else if (transaction_status === 'expired' || transaction_status === 'deny') {
        await db.execute(
            `UPDATE payments 
             SET status = ? 
             WHERE order_id = ? AND reference = ?`,
            ['failed', order_id, reference_no]
        );
    }

    res.json({ success: true, message: 'Webhook processed' });
});

// Refund Payment
exports.refundPayment = asyncHandler(async (req, res) => {
    const { payment_id } = req.params;
    const { amount, reason } = req.body;

    const payment = await db.execute(
        'SELECT * FROM payments WHERE payment_id = ?',
        [payment_id]
    );

    if (payment.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Pembayaran tidak ditemukan'
        });
    }

    const paymentData = payment.rows[0];

    if (paymentData.status !== 'completed') {
        return res.status(400).json({
            success: false,
            message: 'Hanya pembayaran yang selesai yang dapat dikembalikan'
        });
    }

    const refundAmount = amount || paymentData.amount;

    if (refundAmount > paymentData.amount) {
        return res.status(400).json({
            success: false,
            message: 'Jumlah pengembalian melebihi jumlah pembayaran'
        });
    }

    const refundId = `REFUND-${Date.now()}`;

    await db.execute(
        `INSERT INTO payment_refunds (refund_id, payment_id, amount, reason, status, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [refundId, payment_id, refundAmount, reason, 'pending']
    );

    res.status(201).json({
        success: true,
        message: 'Permintaan pengembalian dana berhasil dibuat',
        data: {
            refund_id: refundId,
            payment_id,
            amount: refundAmount
        }
    });
});

// Export Payment Report
exports.exportPaymentReport = asyncHandler(async (req, res) => {
    const { start_date, end_date, format = 'json' } = req.query;

    let query = 'SELECT * FROM payments WHERE 1=1';
    const params = [];

    if (start_date) {
        query += ' AND date(paid_date) >= ?';
        params.push(start_date);
    }

    if (end_date) {
        query += ' AND date(paid_date) <= ?';
        params.push(end_date);
    }

    query += ' ORDER BY paid_date DESC';

    const result = await db.execute(query, params);

    if (format === 'csv') {
        const csv = convertToCSV(result.rows);
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename=payment-report.csv');
        res.send(csv);
    } else {
        res.json({
            success: true,
            data: result.rows
        });
    }
});

// Helper function to convert to CSV
function convertToCSV(data) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csv = [headers.join(',')];

    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            return value;
        });
        csv.push(values.join(','));
    });

    return csv.join('\n');
}

module.exports = exports;