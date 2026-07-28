const express = require('express');
const db = require('../config/database');
const paymentService = require('../services/paymentService');
const { validatePayment, handleErrors } = require('../middleware/validation');
const { authenticateToken, authorizeBranch } = require('../middleware/auth');

class PaymentController {
    async createPayment(req, res) {
        try {
            const { orderId, amount, paymentMethod, customerInfo } = req.body;
            const branchId = req.user.branchId;

            if (!orderId || !amount || !paymentMethod) {
                return res.status(400).json({
                    success: false,
                    message: 'Parameter tidak lengkap: orderId, amount, paymentMethod diperlukan'
                });
            }

            const order = await db.query(
                'SELECT * FROM orders WHERE order_id = ? AND branch_id = ?',
                [orderId, branchId]
            );

            if (!order.rows || order.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Pesanan tidak ditemukan'
                });
            }

            let paymentResult;
            const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            if (paymentMethod === 'QRIS') {
                paymentResult = await paymentService.createQrisTransaction(orderId, amount, customerInfo);
            } else if (paymentMethod === 'Bank Transfer') {
                paymentResult = await paymentService.createVirtualAccountTransaction(orderId, amount);
            } else if (paymentMethod === 'Cash') {
                paymentResult = {
                    success: true,
                    provider: 'Cash',
                    orderId,
                    amount,
                    currency: 'IDR'
                };
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Metode pembayaran tidak didukung'
                });
            }

            await db.execute(
                `INSERT INTO payments (payment_id, order_id, amount, payment_method, status, payment_date, reference_id, branch_id, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [paymentId, orderId, amount, paymentMethod, 'pending', new Date().toISOString().split('T')[0], paymentResult.referenceNo || paymentResult.vaNumber || '', branchId, new Date().toISOString()]
            );

            await db.execute(
                'UPDATE orders SET status = ? WHERE order_id = ?',
                ['payment_pending', orderId]
            );

            return res.status(201).json({
                success: true,
                message: 'Pembayaran berhasil dibuat',
                data: {
                    paymentId,
                    ...paymentResult,
                    expiresAt: paymentResult.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                }
            });
        } catch (error) {
            console.error('Error creating payment:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal membuat pembayaran',
                error: error.message
            });
        }
    }

    async getPaymentById(req, res) {
        try {
            const { paymentId } = req.params;
            const branchId = req.user.branchId;

            const result = await db.query(
                `SELECT p.*, o.order_id, o.customer_name, o.total_price 
                 FROM payments p
                 LEFT JOIN orders o ON p.order_id = o.order_id
                 WHERE p.payment_id = ? AND p.branch_id = ?`,
                [paymentId, branchId]
            );

            if (!result.rows || result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Pembayaran tidak ditemukan'
                });
            }

            return res.status(200).json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error fetching payment:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil data pembayaran',
                error: error.message
            });
        }
    }

    async getPaymentsByOrder(req, res) {
        try {
            const { orderId } = req.params;
            const branchId = req.user.branchId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const result = await db.query(
                `SELECT * FROM payments 
                 WHERE order_id = ? AND branch_id = ?
                 ORDER BY payment_date DESC
                 LIMIT ? OFFSET ?`,
                [orderId, branchId, limit, offset]
            );

            const countResult = await db.query(
                `SELECT COUNT(*) as total FROM payments 
                 WHERE order_id = ? AND branch_id = ?`,
                [orderId, branchId]
            );

            const total = countResult.rows[0]?.total || 0;

            return res.status(200).json({
                success: true,
                data: result.rows || [],
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching payments by order:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil data pembayaran',
                error: error.message
            });
        }
    }

    async getAllPayments(req, res) {
        try {
            const branchId = req.user.branchId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const status = req.query.status || null;
            const paymentMethod = req.query.paymentMethod || null;
            const startDate = req.query.startDate || null;
            const endDate = req.query.endDate || null;

            let query = `SELECT p.*, o.customer_name, o.order_id, o.total_price 
                         FROM payments p
                         LEFT JOIN orders o ON p.order_id = o.order_id
                         WHERE p.branch_id = ?`;
            const params = [branchId];

            if (status) {
                query += ` AND p.status = ?`;
                params.push(status);
            }

            if (paymentMethod) {
                query += ` AND p.payment_method = ?`;
                params.push(paymentMethod);
            }

            if (startDate && endDate) {
                query += ` AND p.payment_date BETWEEN ? AND ?`;
                params.push(startDate, endDate);
            }

            query += ` ORDER BY p.payment_date DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const result = await db.query(query, params);

            let countQuery = `SELECT COUNT(*) as total FROM payments WHERE branch_id = ?`;
            const countParams = [branchId];

            if (status) {
                countQuery += ` AND status = ?`;
                countParams.push(status);
            }

            if (paymentMethod) {
                countQuery += ` AND payment_method = ?`;
                countParams.push(paymentMethod);
            }

            if (startDate && endDate) {
                countQuery += ` AND payment_date BETWEEN ? AND ?`;
                countParams.push(startDate, endDate);
            }

            const countResult = await db.query(countQuery, countParams);
            const total = countResult.rows[0]?.total || 0;

            return res.status(200).json({
                success: true,
                data: result.rows || [],
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching all payments:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil data pembayaran',
                error: error.message
            });
        }
    }

    async updatePaymentStatus(req, res) {
        try {
            const { paymentId } = req.params;
            const { status, referenceId } = req.body;
            const branchId = req.user.branchId;

            const validStatuses = ['pending', 'completed', 'failed', 'refunded', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status pembayaran tidak valid'
                });
            }

            const payment = await db.query(
                'SELECT * FROM payments WHERE payment_id = ? AND branch_id = ?',
                [paymentId, branchId]
            );

            if (!payment.rows || payment.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Pembayaran tidak ditemukan'
                });
            }

            const paymentData = payment.rows[0];

            await db.execute(
                `UPDATE payments 
                 SET status = ?, reference_id = ?, updated_at = ?
                 WHERE payment_id = ?`,
                [status, referenceId || paymentData.reference_id, new Date().toISOString(), paymentId]
            );

            if (status === 'completed') {
                await db.execute(
                    'UPDATE orders SET status = ? WHERE order_id = ?',
                    ['payment_completed', paymentData.order_id]
                );
            } else if (status === 'failed' || status === 'refunded') {
                await db.execute(
                    'UPDATE orders SET status = ? WHERE order_id = ?',
                    ['payment_failed', paymentData.order_id]
                );
            }

            return res.status(200).json({
                success: true,
                message: 'Status pembayaran berhasil diperbarui'
            });
        } catch (error) {
            console.error('Error updating payment status:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal memperbarui status pembayaran',
                error: error.message
            });
        }
    }

    async verifyPaymentWebhook(req, res) {
        try {
            const signature = req.headers['x-webhook-signature'];
            const payload = req.body;

            const isValid = paymentService.verifyWebhookSignature(payload, signature);

            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Signature tidak valid'
                });
            }

            const { orderId, status, referenceNo } = payload;

            const payment = await db.query(
                'SELECT * FROM payments WHERE order_id = ?',
                [orderId]
            );

            if (!payment.rows || payment.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Pembayaran tidak ditemukan'
                });
            }

            const paymentData = payment.rows[0];

            await db.execute(
                `UPDATE payments 
                 SET status = ?, reference_id = ?, updated_at = ?
                 WHERE payment_id = ?`,
                [status, referenceNo, new Date().toISOString(), paymentData.payment_id]
            );

            if (status === 'completed') {
                await db.execute(
                    'UPDATE orders SET status = ? WHERE order_id = ?',
                    ['payment_completed', orderId]
                );
            }

            return res.status(200).json({
                success: true,
                message: 'Webhook berhasil diproses'
            });
        } catch (error) {
            console.error('Error processing webhook:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal memproses webhook',
                error: error.message
            });
        }
    }

    async refundPayment(req, res) {
        try {
            const { paymentId } = req.params;
            const { reason } = req.body;
            const branchId = req.user.branchId;

            const payment = await db.query(
                'SELECT * FROM payments WHERE payment_id = ? AND branch_id = ?',
                [paymentId, branchId]
            );

            if (!payment.rows || payment.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Pembayaran tidak ditemukan'
                });
            }

            const paymentData = payment.rows[0];

            if (paymentData.status !== 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Hanya pembayaran yang sudah selesai yang dapat dikembalikan'
                });
            }

            await db.execute(
                `UPDATE payments 
                 SET status = ?, refund_reason = ?, refund_date = ?, updated_at = ?
                 WHERE payment_id = ?`,
                ['refunded', reason || '', new Date().toISOString().split('T')[0], new Date().toISOString(), paymentId]
            );

            await db.execute(
                'UPDATE orders SET status = ? WHERE order_id = ?',
                ['refunded', paymentData.order_id]
            );

            return res.status(200).json({
                success: true,
                message: 'Pembayaran berhasil dikembalikan'
            });
        } catch (error) {
            console.error('Error refunding payment:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengembalikan pembayaran',
                error: error.message
            });
        }
    }

    async getPaymentStatistics(req, res) {
        try {
            const branchId = req.user.branchId;
            const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const endDate = req.query.endDate || new Date().toISOString().split('T')[0];

            const totalRevenue = await db.query(
                `SELECT SUM(amount) as total FROM payments 
                 WHERE branch_id = ? AND status = 'completed' 
                 AND payment_date BETWEEN ? AND ?`,
                [branchId, startDate, endDate]
            );

            const paymentMethodStats = await db.query(
                `SELECT payment_method, COUNT(*) as count, SUM(amount) as total 
                 FROM payments 
                 WHERE branch_id = ? AND status = 'completed'
                 AND payment_date BETWEEN ? AND ?
                 GROUP BY payment_method`,
                [branchId, startDate, endDate]
            );

            const dailyRevenue = await db.query(
                `SELECT payment_date, SUM(amount) as total, COUNT(*) as count
                 FROM payments 
                 WHERE branch_id = ? AND status = 'completed'
                 AND payment_date BETWEEN ? AND ?
                 GROUP BY payment_date
                 ORDER BY payment_date ASC`,
                [branchId, startDate, endDate]
            );

            const failedPayments = await db.query(
                `SELECT COUNT(*) as total, SUM(amount) as totalAmount 
                 FROM payments 
                 WHERE branch_id = ? AND status IN ('failed', 'cancelled')
                 AND payment_date BETWEEN ? AND ?`,
                [branchId, startDate, endDate]
            );

            return res.status(200).json({
                success: true,
                data: {
                    totalRevenue: totalRevenue.rows[0]?.total || 0,
                    paymentMethods: paymentMethodStats.rows || [],
                    dailyRevenue: dailyRevenue.rows || [],
                    failedPayments: failedPayments.rows[0] || { total: 0, totalAmount: 0 },
                    period: {
                        startDate,
                        endDate
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching payment statistics:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil statistik pembayaran',
                error: error.message
            });
        }
    }
}

module.exports = new PaymentController();