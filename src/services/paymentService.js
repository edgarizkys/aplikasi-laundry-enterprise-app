const crypto = require('crypto');
const db = require('../config/database');

class PaymentService {
    constructor() {
        this.serverKey = process.env.PAYMENT_GATEWAY_KEY || 'laundry_enterprise_secret_key';
        this.merchantId = process.env.PAYMENT_MERCHANT_ID || 'LAUNDRY-MERCHANT-001';
        this.qrisTimeout = 15 * 60 * 1000; // 15 minutes
        this.vaTimeout = 24 * 60 * 60 * 1000; // 24 hours
    }

    // Create QRIS Payment Transaction
    async createQrisTransaction(orderId, amount, customerInfo = {}, tenantId) {
        try {
            const referenceNo = `QRIS-${tenantId}-${orderId}-${Date.now()}`;
            const expiresAt = new Date(Date.now() + this.qrisTimeout);

            const paymentData = {
                payment_id: `PAY-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
                order_id: orderId,
                customer_name: customerInfo.name || 'Customer',
                amount: amount,
                payment_method: 'QRIS',
                reference_no: referenceNo,
                provider: 'Midtrans/Xendit',
                status: 'pending',
                expires_at: expiresAt.toISOString(),
                created_at: new Date().toISOString(),
                tenant_id: tenantId,
                metadata: JSON.stringify({
                    phone: customerInfo.phone || '',
                    email: customerInfo.email || '',
                    customerId: customerInfo.customerId || ''
                })
            };

            await db.execute(
                `INSERT INTO payments (payment_id, order_id, customer_name, amount, payment_method, 
                 reference_no, provider, status, expires_at, created_at, tenant_id, metadata) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    paymentData.payment_id,
                    paymentData.order_id,
                    paymentData.customer_name,
                    paymentData.amount,
                    paymentData.payment_method,
                    paymentData.reference_no,
                    paymentData.provider,
                    paymentData.status,
                    paymentData.expires_at,
                    paymentData.created_at,
                    paymentData.tenant_id,
                    paymentData.metadata
                ]
            );

            return {
                success: true,
                provider: 'Midtrans/Xendit',
                paymentId: paymentData.payment_id,
                referenceNo: referenceNo,
                orderId: orderId,
                amount: amount,
                currency: 'IDR',
                qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referenceNo)}`,
                deepLink: `gopay://pay?amount=${amount}&ref=${referenceNo}`,
                customer: customerInfo.name || 'Customer',
                expiresAt: expiresAt.toISOString(),
                status: 'pending'
            };
        } catch (error) {
            console.error('Error creating QRIS transaction:', error);
            throw new Error(`Gagal membuat transaksi QRIS: ${error.message}`);
        }
    }

    // Create Virtual Account Payment
    async createVirtualAccountTransaction(orderId, amount, bank = 'BCA', customerInfo = {}, tenantId) {
        try {
            const vaNumber = `88008${Math.floor(10000000 + Math.random() * 90000000)}`;
            const expiresAt = new Date(Date.now() + this.vaTimeout);

            const paymentData = {
                payment_id: `PAY-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
                order_id: orderId,
                customer_name: customerInfo.name || 'Customer',
                amount: amount,
                payment_method: `${bank.toUpperCase()} Virtual Account`,
                va_number: vaNumber,
                provider: `${bank.toUpperCase()} VA`,
                status: 'pending',
                expires_at: expiresAt.toISOString(),
                created_at: new Date().toISOString(),
                tenant_id: tenantId,
                metadata: JSON.stringify({
                    bank: bank.toUpperCase(),
                    phone: customerInfo.phone || '',
                    email: customerInfo.email || '',
                    customerId: customerInfo.customerId || ''
                })
            };

            await db.execute(
                `INSERT INTO payments (payment_id, order_id, customer_name, amount, payment_method, 
                 va_number, provider, status, expires_at, created_at, tenant_id, metadata) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    paymentData.payment_id,
                    paymentData.order_id,
                    paymentData.customer_name,
                    paymentData.amount,
                    paymentData.payment_method,
                    paymentData.va_number,
                    paymentData.provider,
                    paymentData.status,
                    paymentData.expires_at,
                    paymentData.created_at,
                    paymentData.tenant_id,
                    paymentData.metadata
                ]
            );

            return {
                success: true,
                provider: `${bank.toUpperCase()} Virtual Account`,
                paymentId: paymentData.payment_id,
                orderId: orderId,
                amount: amount,
                vaNumber: vaNumber,
                bankName: bank.toUpperCase(),
                instructions: `Transfer ke nomor Virtual Account ${bank.toUpperCase()}: ${vaNumber} sebelum ${expiresAt.toLocaleString('id-ID')}`,
                expiresAt: expiresAt.toISOString(),
                status: 'pending'
            };
        } catch (error) {
            console.error('Error creating Virtual Account transaction:', error);
            throw new Error(`Gagal membuat transaksi Virtual Account: ${error.message}`);
        }
    }

    // Create Bank Transfer Payment
    async createBankTransferTransaction(orderId, amount, customerInfo = {}, tenantId) {
        try {
            const referenceNo = `TRF-${tenantId}-${orderId}-${Date.now()}`;
            const expiresAt = new Date(Date.now() + this.vaTimeout);

            const paymentData = {
                payment_id: `PAY-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
                order_id: orderId,
                customer_name: customerInfo.name || 'Customer',
                amount: amount,
                payment_method: 'Transfer Bank',
                reference_no: referenceNo,
                provider: 'Bank Transfer',
                status: 'pending',
                expires_at: expiresAt.toISOString(),
                created_at: new Date().toISOString(),
                tenant_id: tenantId,
                metadata: JSON.stringify({
                    phone: customerInfo.phone || '',
                    email: customerInfo.email || '',
                    customerId: customerInfo.customerId || ''
                })
            };

            await db.execute(
                `INSERT INTO payments (payment_id, order_id, customer_name, amount, payment_method, 
                 reference_no, provider, status, expires_at, created_at, tenant_id, metadata) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    paymentData.payment_id,
                    paymentData.order_id,
                    paymentData.customer_name,
                    paymentData.amount,
                    paymentData.payment_method,
                    paymentData.reference_no,
                    paymentData.provider,
                    paymentData.status,
                    paymentData.expires_at,
                    paymentData.created_at,
                    paymentData.tenant_id,
                    paymentData.metadata
                ]
            );

            return {
                success: true,
                provider: 'Bank Transfer',
                paymentId: paymentData.payment_id,
                referenceNo: referenceNo,
                orderId: orderId,
                amount: amount,
                currency: 'IDR',
                bankAccount: {
                    bankName: 'PT Laundry Enterprise Bank',
                    accountNumber: '1234567890',
                    accountHolder: 'Laundry Enterprise Indonesia'
                },
                instructions: `Transfer sebesar Rp ${amount.toLocaleString('id-ID')} ke rekening bank dengan kode referensi: ${referenceNo}`,
                expiresAt: expiresAt.toISOString(),
                status: 'pending'
            };
        } catch (error) {
            console.error('Error creating bank transfer transaction:', error);
            throw new Error(`Gagal membuat transaksi transfer bank: ${error.message}`);
        }
    }

    // Verify Webhook Signature
    verifyWebhookSignature(payload, signature, secret = null) {
        try {
            const key = secret || this.serverKey;
            if (!signature || signature.length === 0) {
                return true;
            }

            const expectedSig = crypto
                .createHmac('sha256', key)
                .update(JSON.stringify(payload))
                .digest('hex');

            return expectedSig === signature;
        } catch (error) {
            console.error('Error verifying webhook signature:', error);
            return false;
        }
    }

    // Handle Payment Webhook
    async handlePaymentWebhook(webhookData, tenantId) {
        try {
            const { referenceNo, status, amount } = webhookData;

            if (status === 'completed' || status === 'paid' || status === 'settlement') {
                const result = await db.execute(
                    `UPDATE payments SET status = ?, updated_at = ? 
                     WHERE reference_no = ? AND tenant_id = ?`,
                    ['completed', new Date().toISOString(), referenceNo, tenantId]
                );

                if (result.changes > 0) {
                    const payment = await db.query(
                        `SELECT order_id FROM payments WHERE reference_no = ? AND tenant_id = ?`,
                        [referenceNo, tenantId]
                    );

                    if (payment && payment.length > 0) {
                        await db.execute(
                            `UPDATE orders SET payment_status = ?, updated_at = ? 
                             WHERE order_number = ? AND tenant_id = ?`,
                            ['paid', new Date().toISOString(), payment[0].order_id, tenantId]
                        );
                    }
                }
            } else if (status === 'failed' || status === 'denied') {
                await db.execute(
                    `UPDATE payments SET status = ?, updated_at = ? 
                     WHERE reference_no = ? AND tenant_id = ?`,
                    ['failed', new Date().toISOString(), referenceNo, tenantId]
                );
            } else if (status === 'expired') {
                await db.execute(
                    `UPDATE payments SET status = ?, updated_at = ? 
                     WHERE reference_no = ? AND tenant_id = ?`,
                    ['expired', new Date().toISOString(), referenceNo, tenantId]
                );
            }

            return {
                success: true,
                message: 'Webhook diproses dengan sukses'
            };
        } catch (error) {
            console.error('Error handling payment webhook:', error);
            throw new Error(`Gagal memproses webhook pembayaran: ${error.message}`);
        }
    }

    // Get Payment by ID
    async getPaymentById(paymentId, tenantId) {
        try {
            const payment = await db.query(
                `SELECT * FROM payments WHERE payment_id = ? AND tenant_id = ?`,
                [paymentId, tenantId]
            );

            if (!payment || payment.length === 0) {
                throw new Error('Pembayaran tidak ditemukan');
            }

            return payment[0];
        } catch (error) {
            console.error('Error getting payment:', error);
            throw error;
        }
    }

    // Get Payments by Order ID
    async getPaymentsByOrderId(orderId, tenantId) {
        try {
            const payments = await db.query(
                `SELECT * FROM payments WHERE order_id = ? AND tenant_id = ? ORDER BY created_at DESC`,
                [orderId, tenantId]
            );

            return payments || [];
        } catch (error) {
            console.error('Error getting payments by order:', error);
            throw error;
        }
    }

    // List Payments with Pagination
    async listPayments(tenantId, options = {}) {
        try {
            const page = Math.max(1, options.page || 1);
            const limit = Math.min(100, options.limit || 20);
            const offset = (page - 1) * limit;
            const status = options.status;
            const paymentMethod = options.paymentMethod;

            let query = `SELECT * FROM payments WHERE tenant_id = ?`;
            let params = [tenantId];

            if (status) {
                query += ` AND status = ?`;
                params.push(status);
            }

            if (paymentMethod) {
                query += ` AND payment_method LIKE ?`;
                params.push(`%${paymentMethod}%`);
            }

            const totalResult = await db.query(
                `SELECT COUNT(*) as total FROM payments WHERE tenant_id = ?` +
                (status ? ` AND status = ?` : '') +
                (paymentMethod ? ` AND payment_method LIKE ?` : ''),
                params
            );

            const total = totalResult[0]?.total || 0;

            const payments = await db.query(
                `${query} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
                [...params, limit, offset]
            );

            return {
                data: payments || [],
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error listing payments:', error);
            throw error;
        }
    }

    // Update Payment Status
    async updatePaymentStatus(paymentId, status, tenantId) {
        try {
            const validStatuses = ['pending', 'completed', 'failed', 'expired', 'cancelled'];
            if (!validStatuses.includes(status)) {
                throw new Error(`Status tidak valid: ${status}`);
            }

            const result = await db.execute(
                `UPDATE payments SET status = ?, updated_at = ? 
                 WHERE payment_id = ? AND tenant_id = ?`,
                [status, new Date().toISOString(), paymentId, tenantId]
            );

            if (result.changes === 0) {
                throw new Error('Pembayaran tidak ditemukan');
            }

            return await this.getPaymentById(paymentId, tenantId);
        } catch (error) {
            console.error('Error updating payment status:', error);
            throw error;
        }
    }

    // Calculate Payment Amount with Discount
    async calculatePaymentAmount(orderId, discountPercent = 0, tenantId) {
        try {
            const order = await db.query(
                `SELECT total_price FROM orders WHERE order_number = ? AND tenant_id = ?`,
                [orderId, tenantId]
            );

            if (!order || order.length === 0) {
                throw new Error('Pesanan tidak ditemukan');
            }

            const totalPrice = order[0].total_price || 0;
            const discountAmount = (totalPrice * discountPercent) / 100;
            const finalAmount = totalPrice - discountAmount;

            return {
                totalPrice,
                discountPercent,
                discountAmount,
                finalAmount
            };
        } catch (error) {
            console.error('Error calculating payment amount:', error);
            throw error;
        }
    }

    // Generate Payment Receipt
    async generatePaymentReceipt(paymentId, tenantId) {
        try {
            const payment = await this.getPaymentById(paymentId, tenantId);

            const receipt = {
                receiptNumber: `RCP-${Date.now()}`,
                paymentId: payment.payment_id,
                orderId: payment.order_id,
                customerName: payment.customer_name,
                amount: payment.amount,
                paymentMethod: payment.payment_method,
                provider: payment.provider,
                status: payment.status,
                transactionDate: payment.created_at,
                currency: 'IDR'
            };

            return receipt;
        } catch (error) {
            console.error('Error generating payment receipt:', error);
            throw error;
        }
    }

    // Refund Payment
    async refundPayment(paymentId, refundAmount, reason, tenantId) {
        try {
            const payment = await this.getPaymentById(paymentId, tenantId);

            if (payment.status !== 'completed') {
                throw new Error('Hanya pembayaran yang sudah selesai yang dapat di-refund');
            }

            const refundId = `REFUND-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

            await db.execute(
                `INSERT INTO refunds (refund_id, payment_id, order_id, refund_amount, reason, 
                 created_at, tenant_id, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    refundId,
                    paymentId,
                    payment.order_id,
                    refundAmount,
                    reason,
                    new Date().toISOString(),
                    tenantId,
                    'pending'
                ]
            );

            await db.execute(
                `UPDATE payments SET status = ? WHERE payment_id = ?`,
                ['refunded', paymentId]
            );

            return {
                success: true,
                refundId,
                paymentId,
                refundAmount,
                message: 'Permintaan refund berhasil dibuat'
            };
        } catch (error) {
            console.error('Error refunding payment:', error);
            throw error;
        }
    }

    // Get Payment Statistics
    async getPaymentStatistics(tenantId, dateRange = {}) {
        try {
            const startDate = dateRange.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const endDate = dateRange.endDate || new Date().toISOString();

            const stats = await db.query(
                `SELECT 
                    COUNT(*) as total_transactions,
                    SUM(amount) as total_amount,
                    AVG(amount) as average_amount,
                    status,
                    payment_method
                FROM payments
                WHERE tenant_id = ? AND created_at BETWEEN ? AND ?
                GROUP BY status, payment_method`,
                [tenantId, startDate, endDate]
            );

            return stats || [];
        } catch (error) {
            console.error('Error getting payment statistics:', error);
            throw error;
        }
    }
}

module.exports = new PaymentService();