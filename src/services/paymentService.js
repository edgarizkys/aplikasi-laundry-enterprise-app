// services/paymentService.js
const crypto = require('crypto');
const { db } = require('../config/database');

class PaymentService {
    constructor() {
        this.serverKey = process.env.PAYMENT_GATEWAY_KEY || 'laundry-enterprise-secret-key-2026';
        this.merchantId = process.env.PAYMENT_MERCHANT_ID || 'LAUNDRY-MERCHANT-001';
        this.qrisTimeout = 15 * 60 * 1000; // 15 minutes
        this.vaTimeout = 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Create QRIS Payment Transaction
     * QR Code format for instant payment via mobile banking
     */
    async createQrisTransaction(orderId, amount, customerInfo = {}) {
        try {
            const referenceNo = `QRIS-${orderId}-${Date.now()}`;
            const expiresAt = new Date(Date.now() + this.qrisTimeout);

            // Generate QR code data
            const qrData = {
                merchantId: this.merchantId,
                orderId,
                amount,
                timestamp: new Date().toISOString(),
                reference: referenceNo
            };

            const qrPayload = Buffer.from(JSON.stringify(qrData)).toString('base64');
            const signature = this.generateSignature(qrPayload);

            const transaction = {
                payment_id: `PAY-${Date.now()}`,
                order_id: orderId,
                amount,
                payment_method: 'QRIS',
                status: 'pending',
                reference: referenceNo,
                provider: 'Midtrans/Xendit',
                channel: 'qris',
                customer_name: customerInfo.name || 'Pelanggan',
                customer_phone: customerInfo.phone || '',
                customer_email: customerInfo.email || '',
                expires_at: expiresAt.toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                metadata: JSON.stringify({
                    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referenceNo)}`,
                    deepLink: `https://link.midtrans.com/${referenceNo}`,
                    signature
                })
            };

            // Store transaction
            await this.storeTransaction(transaction);

            return {
                success: true,
                provider: 'Midtrans / Xendit',
                paymentId: transaction.payment_id,
                referenceNo,
                orderId,
                amount,
                currency: 'IDR',
                qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referenceNo)}`,
                deepLink: `https://link.midtrans.com/${referenceNo}`,
                customer: {
                    name: customerInfo.name || 'Pelanggan',
                    phone: customerInfo.phone || '',
                    email: customerInfo.email || ''
                },
                expiresAt: expiresAt.toISOString(),
                expiresIn: Math.floor(this.qrisTimeout / 1000)
            };
        } catch (error) {
            throw new Error(`QRIS Transaction Error: ${error.message}`);
        }
    }

    /**
     * Create Virtual Account Payment
     * Bank transfer payment with unique VA number
     */
    async createVirtualAccountTransaction(orderId, amount, bank = 'BCA', customerInfo = {}) {
        try {
            const vaNumber = `${this.getVAPrefix(bank)}${Math.floor(1000000000 + Math.random() * 9000000000)}`;
            const expiresAt = new Date(Date.now() + this.vaTimeout);

            const transaction = {
                payment_id: `PAY-${Date.now()}`,
                order_id: orderId,
                amount,
                payment_method: 'Bank Transfer',
                status: 'pending',
                reference: vaNumber,
                provider: `${bank.toUpperCase()} Virtual Account`,
                channel: 'virtual_account',
                customer_name: customerInfo.name || 'Pelanggan',
                customer_phone: customerInfo.phone || '',
                customer_email: customerInfo.email || '',
                expires_at: expiresAt.toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                metadata: JSON.stringify({
                    bank: bank.toUpperCase(),
                    vaNumber,
                    instructions: `Transfer ke rekening virtual ${bank.toUpperCase()}: ${vaNumber}`,
                    minimumTransfer: amount,
                    maximumTransfer: amount * 2
                })
            };

            // Store transaction
            await this.storeTransaction(transaction);

            return {
                success: true,
                provider: `${bank.toUpperCase()} Virtual Account`,
                paymentId: transaction.payment_id,
                orderId,
                amount,
                vaNumber,
                bank: bank.toUpperCase(),
                instructions: `Transfer ke rekening virtual ${bank.toUpperCase()}: ${vaNumber} sebelum ${expiresAt.toLocaleDateString('id-ID')} ${expiresAt.toLocaleTimeString('id-ID')}.`,
                customer: {
                    name: customerInfo.name || 'Pelanggan',
                    phone: customerInfo.phone || '',
                    email: customerInfo.email || ''
                },
                expiresAt: expiresAt.toISOString(),
                expiresIn: Math.floor(this.vaTimeout / 1000)
            };
        } catch (error) {
            throw new Error(`Virtual Account Transaction Error: ${error.message}`);
        }
    }

    /**
     * Create E-Wallet Payment
     * OVO, DANA, LinkAja, etc.
     */
    async createEWalletTransaction(orderId, amount, walletType = 'OVO', customerInfo = {}) {
        try {
            const referenceNo = `EWALLET-${orderId}-${Date.now()}`;
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            const transaction = {
                payment_id: `PAY-${Date.now()}`,
                order_id: orderId,
                amount,
                payment_method: walletType.toUpperCase(),
                status: 'pending',
                reference: referenceNo,
                provider: walletType,
                channel: 'e_wallet',
                customer_name: customerInfo.name || 'Pelanggan',
                customer_phone: customerInfo.phone || '',
                customer_email: customerInfo.email || '',
                expires_at: expiresAt.toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                metadata: JSON.stringify({
                    walletType,
                    deepLink: `https://wallet.${walletType.toLowerCase()}.co.id/pay/${referenceNo}`,
                    checkoutUrl: `https://checkout.midtrans.com/${referenceNo}`
                })
            };

            await this.storeTransaction(transaction);

            return {
                success: true,
                provider: walletType,
                paymentId: transaction.payment_id,
                referenceNo,
                orderId,
                amount,
                currency: 'IDR',
                deepLink: `https://wallet.${walletType.toLowerCase()}.co.id/pay/${referenceNo}`,
                checkoutUrl: `https://checkout.midtrans.com/${referenceNo}`,
                customer: {
                    name: customerInfo.name || 'Pelanggan',
                    phone: customerInfo.phone || ''
                },
                expiresAt: expiresAt.toISOString()
            };
        } catch (error) {
            throw new Error(`E-Wallet Transaction Error: ${error.message}`);
        }
    }

    /**
     * Manual Cash Payment (Over The Counter)
     * Immediate confirmation payment
     */
    async createCashPayment(orderId, amount, receivedBy, customerInfo = {}) {
        try {
            const referenceNo = `CASH-${orderId}-${Date.now()}`;
            const now = new Date();

            const transaction = {
                payment_id: `PAY-${Date.now()}`,
                order_id: orderId,
                amount,
                payment_method: 'Cash',
                status: 'completed',
                reference: referenceNo,
                provider: 'Manual/OTC',
                channel: 'cash',
                customer_name: customerInfo.name || 'Pelanggan',
                customer_phone: customerInfo.phone || '',
                customer_email: customerInfo.email || '',
                paid_date: now.toISOString(),
                created_at: now.toISOString(),
                updated_at: now.toISOString(),
                metadata: JSON.stringify({
                    receivedBy,
                    paymentLocation: 'Toko Laundry',
                    method: 'Tunai'
                })
            };

            await this.storeTransaction(transaction);

            return {
                success: true,
                provider: 'Tunai',
                paymentId: transaction.payment_id,
                referenceNo,
                orderId,
                amount,
                currency: 'IDR',
                status: 'completed',
                paidDate: now.toISOString(),
                receivedBy,
                customer: {
                    name: customerInfo.name || 'Pelanggan',
                    phone: customerInfo.phone || ''
                }
            };
        } catch (error) {
            throw new Error(`Cash Payment Error: ${error.message}`);
        }
    }

    /**
     * Store transaction to database
     */
    async storeTransaction(transaction) {
        try {
            const sql = `
                INSERT INTO payments (
                    payment_id, order_id, amount, payment_method, status,
                    reference, provider, channel, customer_name, customer_phone,
                    customer_email, expires_at, paid_date, created_at, updated_at, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            await db.execute(sql, [
                transaction.payment_id,
                transaction.order_id,
                transaction.amount,
                transaction.payment_method,
                transaction.status,
                transaction.reference,
                transaction.provider,
                transaction.channel,
                transaction.customer_name,
                transaction.customer_phone,
                transaction.customer_email,
                transaction.expires_at || null,
                transaction.paid_date || null,
                transaction.created_at,
                transaction.updated_at,
                transaction.metadata
            ]);

            return transaction;
        } catch (error) {
            throw new Error(`Database Store Error: ${error.message}`);
        }
    }

    /**
     * Get payment details
     */
    async getPaymentDetails(paymentId) {
        try {
            const sql = `
                SELECT * FROM payments WHERE payment_id = ? LIMIT 1
            `;

            const result = await db.execute(sql, [paymentId]);

            if (result.rows.length === 0) {
                return null;
            }

            const payment = result.rows[0];
            if (payment.metadata) {
                payment.metadata = JSON.parse(payment.metadata);
            }

            return payment;
        } catch (error) {
            throw new Error(`Get Payment Error: ${error.message}`);
        }
    }

    /**
     * Get payments by order ID
     */
    async getPaymentsByOrderId(orderId) {
        try {
            const sql = `
                SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC
            `;

            const result = await db.execute(sql, [orderId]);

            return result.rows.map(payment => {
                if (payment.metadata) {
                    payment.metadata = JSON.parse(payment.metadata);
                }
                return payment;
            });
        } catch (error) {
            throw new Error(`Get Payments Error: ${error.message}`);
        }
    }

    /**
     * Update payment status
     */
    async updatePaymentStatus(paymentId, status, paidDate = null) {
        try {
            const now = new Date().toISOString();
            const sql = `
                UPDATE payments 
                SET status = ?, paid_date = ?, updated_at = ?
                WHERE payment_id = ?
            `;

            await db.execute(sql, [status, paidDate || null, now, paymentId]);

            return await this.getPaymentDetails(paymentId);
        } catch (error) {
            throw new Error(`Update Payment Status Error: ${error.message}`);
        }
    }

    /**
     * Verify webhook signature from payment gateway
     */
    verifyWebhookSignature(payload, signature) {
        if (!signature) return true;

        const expectedSig = crypto
            .createHmac('sha256', this.serverKey)
            .update(JSON.stringify(payload))
            .digest('hex');

        return expectedSig === signature;
    }

    /**
     * Generate signature for transaction
     */
    generateSignature(data) {
        return crypto
            .createHmac('sha256', this.serverKey)
            .update(data)
            .digest('hex');
    }

    /**
     * Get VA prefix by bank
     */
    getVAPrefix(bank) {
        const prefixes = {
            bca: '8800',
            mandiri: '8910',
            bni: '8888',
            cimb: '8800',
            bri: '8880'
        };

        return prefixes[bank.toLowerCase()] || '8800';
    }

    /**
     * Calculate payment summary for period
     */
    async getPaymentSummary(startDate, endDate) {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_transactions,
                    SUM(amount) as total_amount,
                    payment_method,
                    status,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments
                FROM payments
                WHERE created_at >= ? AND created_at <= ?
                GROUP BY payment_method, status
            `;

            const result = await db.execute(sql, [startDate, endDate]);

            return result.rows;
        } catch (error) {
            throw new Error(`Get Payment Summary Error: ${error.message}`);
        }
    }

    /**
     * Handle payment webhook from gateway
     */
    async handleWebhook(payload, signature) {
        try {
            // Verify signature
            const isValid = this.verifyWebhookSignature(payload, signature);
            if (!isValid) {
                throw new Error('Invalid webhook signature');
            }

            const { reference, status, amount } = payload;

            // Find payment by reference
            const sql = `SELECT * FROM payments WHERE reference = ? LIMIT 1`;
            const result = await db.execute(sql, [reference]);

            if (result.rows.length === 0) {
                throw new Error('Payment not found');
            }

            const payment = result.rows[0];

            // Update payment status
            const newStatus = status === 'success' ? 'completed' : status === 'failed' ? 'failed' : 'pending';
            return await this.updatePaymentStatus(payment.payment_id, newStatus, new Date().toISOString());
        } catch (error) {
            throw new Error(`Webhook Handler Error: ${error.message}`);
        }
    }

    /**
     * Check and expire pending payments
     */
    async expirePendingPayments() {
        try {
            const now = new Date().toISOString();
            const sql = `
                UPDATE payments 
                SET status = 'expired', updated_at = ?
                WHERE status = 'pending' AND expires_at < ? AND expires_at IS NOT NULL
            `;

            await db.execute(sql, [now, now]);

            return { message: 'Expired payments updated' };
        } catch (error) {
            throw new Error(`Expire Payments Error: ${error.message}`);
        }
    }
}

module.exports = new PaymentService();