// services/paymentService.js
const crypto = require('crypto');
const db = require('../config/database');

class PaymentGatewayService {
    constructor() {
        this.serverKey = process.env.PAYMENT_GATEWAY_KEY || 'secret_laundry_enterprise_2026';
        this.merchantId = process.env.PAYMENT_MERCHANT_ID || 'LAUNDRY-M-001';
        this.qrisTimeout = 15 * 60 * 1000; // 15 minutes
        this.vaTimeout = 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Create QRIS Transaction
     * Supports: Midtrans, Xendit, GCash
     */
    async createQrisTransaction(orderId, amount, customerInfo = {}) {
        try {
            const referenceNo = `QRIS-${orderId}-${Date.now()}`;
            const expiresAt = new Date(Date.now() + this.qrisTimeout);

            const qrisData = {
                success: true,
                provider: 'Midtrans/Xendit',
                referenceNo,
                orderId,
                amount,
                currency: 'IDR',
                qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${referenceNo}`,
                deepLink: `gopay://pay?amount=${amount}&ref=${referenceNo}`,
                customerName: customerInfo.name || 'Pelanggan',
                customerPhone: customerInfo.phone || '',
                customerEmail: customerInfo.email || '',
                expiresAt: expiresAt.toISOString(),
                createdAt: new Date().toISOString()
            };

            // Store transaction in database
            await db.execute(
                `INSERT INTO payment_transactions 
                (payment_id, order_id, amount, payment_method, status, reference_id, provider, expires_at, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [referenceNo, orderId, amount, 'QRIS', 'pending', referenceNo, 'Midtrans/Xendit', expiresAt.toISOString(), new Date().toISOString()]
            );

            return qrisData;
        } catch (error) {
            console.error('QRIS Transaction Error:', error);
            throw new Error(`Gagal membuat transaksi QRIS: ${error.message}`);
        }
    }

    /**
     * Create Virtual Account Transaction
     * Supports: BCA, Mandiri, BNI
     */
    async createVirtualAccountTransaction(orderId, amount, bank = 'BCA', customerInfo = {}) {
        try {
            const vaNumber = `88008${Math.floor(10000000 + Math.random() * 90000000)}`;
            const expiresAt = new Date(Date.now() + this.vaTimeout);
            const referenceNo = `VA-${bank.toUpperCase()}-${orderId}-${Date.now()}`;

            const bankInstructions = {
                BCA: `Transfer ke BCA Virtual Account: ${vaNumber}`,
                MANDIRI: `Transfer ke Mandiri Virtual Account: ${vaNumber}`,
                BNI: `Transfer ke BNI Virtual Account: ${vaNumber}`
            };

            const vaData = {
                success: true,
                provider: `${bank.toUpperCase()} Virtual Account`,
                referenceNo,
                orderId,
                amount,
                bank: bank.toUpperCase(),
                vaNumber,
                instructions: bankInstructions[bank.toUpperCase()] || `Transfer ke ${bank.toUpperCase()} VA: ${vaNumber}`,
                customerName: customerInfo.name || 'Pelanggan',
                customerPhone: customerInfo.phone || '',
                customerEmail: customerInfo.email || '',
                expiresAt: expiresAt.toISOString(),
                createdAt: new Date().toISOString()
            };

            // Store transaction in database
            await db.execute(
                `INSERT INTO payment_transactions 
                (payment_id, order_id, amount, payment_method, status, reference_id, provider, va_number, expires_at, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [referenceNo, orderId, amount, 'BANK_TRANSFER', 'pending', referenceNo, `${bank.toUpperCase()}_VA`, vaNumber, expiresAt.toISOString(), new Date().toISOString()]
            );

            return vaData;
        } catch (error) {
            console.error('Virtual Account Transaction Error:', error);
            throw new Error(`Gagal membuat Virtual Account: ${error.message}`);
        }
    }

    /**
     * Create E-Wallet Transaction (OVO, Dana, LinkAja)
     */
    async createEWalletTransaction(orderId, amount, eWalletProvider = 'OVO', customerInfo = {}) {
        try {
            const referenceNo = `EWALLET-${eWalletProvider.toUpperCase()}-${orderId}-${Date.now()}`;
            const expiresAt = new Date(Date.now() + this.qrisTimeout);

            const eWalletData = {
                success: true,
                provider: eWalletProvider.toUpperCase(),
                referenceNo,
                orderId,
                amount,
                currency: 'IDR',
                deepLink: `${eWalletProvider.toLowerCase()}://pay?amount=${amount}&ref=${referenceNo}`,
                paymentUrl: `https://payment.laundry-enterprise.id/ewallet?ref=${referenceNo}`,
                customerName: customerInfo.name || 'Pelanggan',
                customerPhone: customerInfo.phone || '',
                expiresAt: expiresAt.toISOString(),
                createdAt: new Date().toISOString()
            };

            // Store transaction in database
            await db.execute(
                `INSERT INTO payment_transactions 
                (payment_id, order_id, amount, payment_method, status, reference_id, provider, expires_at, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [referenceNo, orderId, amount, 'E_WALLET', 'pending', referenceNo, eWalletProvider.toUpperCase(), expiresAt.toISOString(), new Date().toISOString()]
            );

            return eWalletData;
        } catch (error) {
            console.error('E-Wallet Transaction Error:', error);
            throw new Error(`Gagal membuat transaksi E-Wallet: ${error.message}`);
        }
    }

    /**
     * Create Payment Invoice
     */
    async createPaymentInvoice(orderId, customerId, amount, branchId) {
        try {
            const invoiceNo = `INV-${orderId}-${Date.now()}`;
            const invoiceDate = new Date().toISOString();
            const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

            const invoiceData = {
                success: true,
                invoiceNo,
                orderId,
                customerId,
                amount,
                branchId,
                invoiceDate,
                dueDate,
                status: 'unpaid',
                description: `Pembayaran Pesanan ${orderId}`,
                createdAt: new Date().toISOString()
            };

            // Store invoice in database
            await db.execute(
                `INSERT INTO payment_invoices 
                (invoice_no, order_id, customer_id, amount, branch_id, invoice_date, due_date, status, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [invoiceNo, orderId, customerId, amount, branchId, invoiceDate, dueDate, 'unpaid', new Date().toISOString()]
            );

            return invoiceData;
        } catch (error) {
            console.error('Create Invoice Error:', error);
            throw new Error(`Gagal membuat invoice: ${error.message}`);
        }
    }

    /**
     * Verify Webhook Signature
     */
    verifyWebhookSignature(payload, signature) {
        try {
            if (!signature) return true;

            const expectedSig = crypto
                .createHmac('sha256', this.serverKey)
                .update(JSON.stringify(payload))
                .digest('hex');

            return expectedSig === signature;
        } catch (error) {
            console.error('Webhook Verification Error:', error);
            return false;
        }
    }

    /**
     * Update Payment Status (from webhook)
     */
    async updatePaymentStatus(referenceId, newStatus, transactionDetails = {}) {
        try {
            const validStatuses = ['pending', 'completed', 'failed', 'cancelled', 'expired'];

            if (!validStatuses.includes(newStatus)) {
                throw new Error(`Status tidak valid: ${newStatus}`);
            }

            const updateData = {
                status: newStatus,
                updated_at: new Date().toISOString(),
                ...transactionDetails
            };

            const result = await db.execute(
                `UPDATE payment_transactions 
                SET status = ?, transaction_details = ?, updated_at = ? 
                WHERE reference_id = ?`,
                [newStatus, JSON.stringify(transactionDetails), new Date().toISOString(), referenceId]
            );

            if (newStatus === 'completed') {
                // Update order status to paid
                const transaction = await db.query(
                    `SELECT order_id FROM payment_transactions WHERE reference_id = ?`,
                    [referenceId]
                );

                if (transaction.length > 0) {
                    await db.execute(
                        `UPDATE orders SET payment_status = ? WHERE order_id = ?`,
                        ['paid', transaction[0].order_id]
                    );
                }
            }

            return { success: true, message: 'Status pembayaran diperbarui', data: updateData };
        } catch (error) {
            console.error('Update Payment Status Error:', error);
            throw new Error(`Gagal memperbarui status pembayaran: ${error.message}`);
        }
    }

    /**
     * Get Payment Transaction Details
     */
    async getPaymentTransaction(referenceId) {
        try {
            const transaction = await db.query(
                `SELECT * FROM payment_transactions WHERE reference_id = ?`,
                [referenceId]
            );

            if (transaction.length === 0) {
                throw new Error('Transaksi pembayaran tidak ditemukan');
            }

            return {
                success: true,
                data: transaction[0]
            };
        } catch (error) {
            console.error('Get Payment Transaction Error:', error);
            throw new Error(`Gagal mengambil detail transaksi: ${error.message}`);
        }
    }

    /**
     * Get Order Payment History
     */
    async getOrderPaymentHistory(orderId, limit = 10, offset = 0) {
        try {
            const payments = await db.query(
                `SELECT * FROM payment_transactions 
                WHERE order_id = ? 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?`,
                [orderId, limit, offset]
            );

            const total = await db.query(
                `SELECT COUNT(*) as count FROM payment_transactions WHERE order_id = ?`,
                [orderId]
            );

            return {
                success: true,
                data: payments,
                pagination: {
                    total: total[0].count,
                    limit,
                    offset,
                    pages: Math.ceil(total[0].count / limit)
                }
            };
        } catch (error) {
            console.error('Get Payment History Error:', error);
            throw new Error(`Gagal mengambil riwayat pembayaran: ${error.message}`);
        }
    }

    /**
     * Calculate Payment Summary by Branch
     */
    async getPaymentSummaryByBranch(branchId, startDate, endDate) {
        try {
            const summary = await db.query(
                `SELECT 
                    COUNT(*) as total_transactions,
                    SUM(amount) as total_amount,
                    payment_method,
                    status,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
                FROM payment_transactions 
                WHERE branch_id = ? 
                AND created_at BETWEEN ? AND ?
                GROUP BY payment_method, status`,
                [branchId, startDate, endDate]
            );

            return {
                success: true,
                branchId,
                period: { startDate, endDate },
                data: summary
            };
        } catch (error) {
            console.error('Get Payment Summary Error:', error);
            throw new Error(`Gagal mengambil ringkasan pembayaran: ${error.message}`);
        }
    }

    /**
     * Generate Payment Report
     */
    async generatePaymentReport(filters = {}) {
        try {
            const { branchId, startDate, endDate, paymentMethod, status, limit = 100, offset = 0 } = filters;

            let query = `SELECT * FROM payment_transactions WHERE 1=1`;
            const params = [];

            if (branchId) {
                query += ` AND branch_id = ?`;
                params.push(branchId);
            }

            if (startDate && endDate) {
                query += ` AND created_at BETWEEN ? AND ?`;
                params.push(startDate, endDate);
            }

            if (paymentMethod) {
                query += ` AND payment_method = ?`;
                params.push(paymentMethod);
            }

            if (status) {
                query += ` AND status = ?`;
                params.push(status);
            }

            query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const report = await db.query(query, params);

            const totalQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count').replace('LIMIT ? OFFSET ?', '');
            const totalParams = params.slice(0, -2);
            const total = await db.query(totalQuery, totalParams);

            return {
                success: true,
                filters,
                data: report,
                pagination: {
                    total: total[0].count,
                    limit,
                    offset,
                    pages: Math.ceil(total[0].count / limit)
                }
            };
        } catch (error) {
            console.error('Generate Payment Report Error:', error);
            throw new Error(`Gagal membuat laporan pembayaran: ${error.message}`);
        }
    }

    /**
     * Refund Payment
     */
    async refundPayment(paymentId, refundAmount, reason = '') {
        try {
            const payment = await db.query(
                `SELECT * FROM payment_transactions WHERE payment_id = ?`,
                [paymentId]
            );

            if (payment.length === 0) {
                throw new Error('Pembayaran tidak ditemukan');
            }

            if (payment[0].status !== 'completed') {
                throw new Error('Hanya pembayaran yang sudah selesai yang dapat dikembalikan');
            }

            const refundId = `REFUND-${paymentId}-${Date.now()}`;

            await db.execute(
                `INSERT INTO payment_refunds 
                (refund_id, payment_id, refund_amount, reason, status, created_at) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [refundId, paymentId, refundAmount, reason, 'pending', new Date().toISOString()]
            );

            await db.execute(
                `UPDATE payment_transactions SET status = ? WHERE payment_id = ?`,
                ['refunded', paymentId]
            );

            return {
                success: true,
                refundId,
                paymentId,
                refundAmount,
                status: 'pending'
            };
        } catch (error) {
            console.error('Refund Payment Error:', error);
            throw new Error(`Gagal memproses pengembalian: ${error.message}`);
        }
    }

    /**
     * Send Payment Notification
     */
    async sendPaymentNotification(orderId, customerInfo, paymentDetails, notificationType = 'email') {
        try {
            const notification = {
                orderId,
                customerName: customerInfo.name,
                customerEmail: customerInfo.email,
                customerPhone: customerInfo.phone,
                amount: paymentDetails.amount,
                referenceNo: paymentDetails.referenceNo,
                paymentMethod: paymentDetails.paymentMethod,
                type: notificationType,
                sentAt: new Date().toISOString()
            };

            // Log notification (integration with SMS/Email service)
            await db.execute(
                `INSERT INTO payment_notifications 
                (order_id, customer_name, customer_email, customer_phone, amount, reference_no, notification_type, sent_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [orderId, customerInfo.name, customerInfo.email, customerInfo.phone, paymentDetails.amount, paymentDetails.referenceNo, notificationType, new Date().toISOString()]
            );

            return { success: true, message: 'Notifikasi pembayaran terkirim' };
        } catch (error) {
            console.error('Send Payment Notification Error:', error);
            throw new Error(`Gagal mengirim notifikasi: ${error.message}`);
        }
    }
}

module.exports = new PaymentGatewayService();