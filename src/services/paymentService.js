// services/paymentService.js
const crypto = require('crypto');
const db = require('../config/database');

class PaymentService {
    constructor() {
        this.serverKey = process.env.PAYMENT_GATEWAY_KEY || 'secret-key-2026';
        this.merchantId = process.env.PAYMENT_MERCHANT_ID || 'LAUNDRY-ENTERPRISE-001';
        this.clientKey = process.env.PAYMENT_CLIENT_KEY || 'client-key-2026';
    }

    async createQrisTransaction(orderId, amount, customerInfo = {}) {
        try {
            if (!orderId || !amount || amount <= 0) {
                throw new Error('Invalid order ID or amount');
            }

            const referenceNo = `QRIS-${orderId}-${Date.now()}`;
            const timestamp = new Date().toISOString();
            
            const transaction = {
                success: true,
                provider: 'Midtrans / Xendit',
                referenceNo,
                orderId,
                amount,
                currency: 'IDR',
                qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(referenceNo)}`,
                deepLink: `gopay://pay?amount=${amount}&ref=${referenceNo}`,
                customerName: customerInfo.name || 'Pelanggan',
                customerPhone: customerInfo.phone || '',
                customerEmail: customerInfo.email || '',
                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                createdAt: timestamp,
                status: 'pending'
            };

            // Save to database
            await db.execute(
                `INSERT INTO payments (
                    order_number, customer_name, amount, payment_method, 
                    status, reference_number, payment_date, branch_id, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    customerInfo.name || 'Pelanggan',
                    amount,
                    'QRIS',
                    'pending',
                    referenceNo,
                    new Date().toISOString().split('T')[0],
                    customerInfo.branchId || 'BRANCH-001',
                    timestamp
                ]
            );

            return transaction;
        } catch (error) {
            throw new Error(`QRIS Transaction Error: ${error.message}`);
        }
    }

    async createVirtualAccountTransaction(orderId, amount, bank = 'BCA', customerInfo = {}) {
        try {
            if (!orderId || !amount || amount <= 0) {
                throw new Error('Invalid order ID or amount');
            }

            const supportedBanks = ['BCA', 'BNI', 'MANDIRI', 'BTN'];
            const bankCode = supportedBanks.includes(bank.toUpperCase()) ? bank.toUpperCase() : 'BCA';
            
            const vaNumber = `88008${Math.floor(10000000 + Math.random() * 90000000)}`;
            const timestamp = new Date().toISOString();
            
            const transaction = {
                success: true,
                provider: `${bankCode} Virtual Account`,
                orderId,
                amount,
                bank: bankCode,
                vaNumber,
                bankInstructions: this.getBankInstructions(bankCode, vaNumber),
                instructions: `Transfer ke ${bankCode} VA: ${vaNumber} sebelum 24 jam.`,
                customerName: customerInfo.name || 'Pelanggan',
                customerPhone: customerInfo.phone || '',
                customerEmail: customerInfo.email || '',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                createdAt: timestamp,
                status: 'pending'
            };

            // Save to database
            await db.execute(
                `INSERT INTO payments (
                    order_number, customer_name, amount, payment_method, 
                    status, reference_number, payment_date, branch_id, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    customerInfo.name || 'Pelanggan',
                    amount,
                    `Virtual Account - ${bankCode}`,
                    'pending',
                    vaNumber,
                    new Date().toISOString().split('T')[0],
                    customerInfo.branchId || 'BRANCH-001',
                    timestamp
                ]
            );

            return transaction;
        } catch (error) {
            throw new Error(`Virtual Account Transaction Error: ${error.message}`);
        }
    }

    async createBankTransferTransaction(orderId, amount, customerInfo = {}) {
        try {
            if (!orderId || !amount || amount <= 0) {
                throw new Error('Invalid order ID or amount');
            }

            const referenceNo = `BT-${orderId}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            const timestamp = new Date().toISOString();
            
            const transaction = {
                success: true,
                provider: 'Bank Transfer',
                referenceNo,
                orderId,
                amount,
                currency: 'IDR',
                accountNumber: '1234567890',
                bankName: 'BCA',
                accountHolder: 'PT Laundry Enterprise Indonesia',
                instructions: `Transfer ke rekening BCA atas nama PT Laundry Enterprise Indonesia dengan nomor referensi: ${referenceNo}`,
                customerName: customerInfo.name || 'Pelanggan',
                customerPhone: customerInfo.phone || '',
                customerEmail: customerInfo.email || '',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                createdAt: timestamp,
                status: 'pending'
            };

            // Save to database
            await db.execute(
                `INSERT INTO payments (
                    order_number, customer_name, amount, payment_method, 
                    status, reference_number, payment_date, branch_id, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    customerInfo.name || 'Pelanggan',
                    amount,
                    'Bank Transfer',
                    'pending',
                    referenceNo,
                    new Date().toISOString().split('T')[0],
                    customerInfo.branchId || 'BRANCH-001',
                    timestamp
                ]
            );

            return transaction;
        } catch (error) {
            throw new Error(`Bank Transfer Transaction Error: ${error.message}`);
        }
    }

    async confirmPayment(referenceNo, paymentMethod = 'QRIS') {
        try {
            if (!referenceNo) {
                throw new Error('Reference number is required');
            }

            const result = await db.execute(
                `UPDATE payments SET status = ?, payment_date = ? 
                 WHERE reference_number = ?`,
                ['paid', new Date().toISOString().split('T')[0], referenceNo]
            );

            if (result.changes === 0) {
                throw new Error('Payment record not found');
            }

            // Update order status
            const payment = await db.execute(
                `SELECT order_number FROM payments WHERE reference_number = ?`,
                [referenceNo]
            );

            if (payment.rows.length > 0) {
                await db.execute(
                    `UPDATE orders SET status = ? WHERE order_number = ?`,
                    ['paid', payment.rows[0].order_number]
                );
            }

            return {
                success: true,
                message: 'Pembayaran berhasil dikonfirmasi',
                referenceNo
            };
        } catch (error) {
            throw new Error(`Confirm Payment Error: ${error.message}`);
        }
    }

    verifyWebhookSignature(payload, signature) {
        try {
            if (!signature) return true;
            
            const expectedSig = crypto.createHmac('sha256', this.serverKey)
                .update(JSON.stringify(payload))
                .digest('hex');
            
            return expectedSig === signature;
        } catch (error) {
            console.error('Webhook verification error:', error);
            return false;
        }
    }

    async processWebhookPayment(webhookData) {
        try {
            if (!webhookData.referenceNo || !webhookData.transactionStatus) {
                throw new Error('Invalid webhook data');
            }

            let paymentStatus = 'pending';
            if (webhookData.transactionStatus === 'settlement' || webhookData.transactionStatus === 'paid') {
                paymentStatus = 'paid';
            } else if (webhookData.transactionStatus === 'failed' || webhookData.transactionStatus === 'deny') {
                paymentStatus = 'failed';
            } else if (webhookData.transactionStatus === 'expired') {
                paymentStatus = 'expired';
            }

            const result = await db.execute(
                `UPDATE payments SET status = ? WHERE reference_number = ?`,
                [paymentStatus, webhookData.referenceNo]
            );

            if (result.changes === 0) {
                throw new Error('Payment record not found for webhook');
            }

            return {
                success: true,
                message: `Webhook processed: payment status updated to ${paymentStatus}`,
                status: paymentStatus
            };
        } catch (error) {
            throw new Error(`Webhook Processing Error: ${error.message}`);
        }
    }

    async getPaymentHistory(orderId, branchId = null) {
        try {
            let query = `SELECT * FROM payments WHERE order_number = ?`;
            let params = [orderId];

            if (branchId) {
                query += ` AND branch_id = ?`;
                params.push(branchId);
            }

            query += ` ORDER BY payment_date DESC LIMIT 10`;

            const result = await db.execute(query, params);
            return result.rows || [];
        } catch (error) {
            throw new Error(`Get Payment History Error: ${error.message}`);
        }
    }

    async getPaymentStats(branchId = null, startDate = null, endDate = null) {
        try {
            let query = `SELECT 
                        payment_method,
                        status,
                        COUNT(*) as count,
                        SUM(amount) as total
                    FROM payments
                    WHERE 1=1`;
            let params = [];

            if (branchId) {
                query += ` AND branch_id = ?`;
                params.push(branchId);
            }

            if (startDate) {
                query += ` AND payment_date >= ?`;
                params.push(startDate);
            }

            if (endDate) {
                query += ` AND payment_date <= ?`;
                params.push(endDate);
            }

            query += ` GROUP BY payment_method, status`;

            const result = await db.execute(query, params);
            return result.rows || [];
        } catch (error) {
            throw new Error(`Get Payment Stats Error: ${error.message}`);
        }
    }

    getBankInstructions(bankCode, vaNumber) {
        const instructions = {
            'BCA': `1. Masuk ke BCA Mobile atau ATM BCA
2. Pilih Transfer → Ke Rekening BCA
3. Masukkan nomor VA: ${vaNumber}
4. Jumlah akan tertampil otomatis
5. Selesaikan transaksi`,
            'BNI': `1. Buka BNI Mobile Banking
2. Pilih Pembayaran → Virtual Account
3. Masukkan nomor VA: ${vaNumber}
4. Konfirmasi pembayaran
5. Transaksi selesai`,
            'MANDIRI': `1. Akses Mandiri Online atau ATM Mandiri
2. Pilih Transfer → Dari Bank Lain
3. Masukkan nomor VA: ${vaNumber}
4. Verifikasi data
5. Selesaikan transaksi`,
            'BTN': `1. Login BTN Mobile
2. Pilih Pembayaran/Transfer
3. Masukkan nomor VA: ${vaNumber}
4. Review detail
5. Konfirmasi dan selesai`
        };
        
        return instructions[bankCode] || instructions['BCA'];
    }

    async refundPayment(referenceNo, amount, reason = '') {
        try {
            if (!referenceNo || !amount || amount <= 0) {
                throw new Error('Invalid reference number or amount');
            }

            const refundId = `REF-${Date.now()}`;
            const timestamp = new Date().toISOString();

            // Get original payment
            const payment = await db.execute(
                `SELECT * FROM payments WHERE reference_number = ?`,
                [referenceNo]
            );

            if (payment.rows.length === 0) {
                throw new Error('Payment not found');
            }

            // Create refund record
            await db.execute(
                `INSERT INTO refunds (
                    payment_id, reference_number, amount, reason, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    payment.rows[0].id,
                    refundId,
                    amount,
                    reason || 'Pengembalian dana',
                    'processing',
                    timestamp
                ]
            );

            return {
                success: true,
                refundId,
                originalPayment: referenceNo,
                amount,
                message: 'Refund request berhasil dibuat'
            };
        } catch (error) {
            throw new Error(`Refund Payment Error: ${error.message}`);
        }
    }
}

module.exports = new PaymentService();