const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/appController');
const payCtrl = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.get('/analytics', auth, ctrl.getAnalytics);
router.post('/payment/qris', auth, payCtrl.createQris);
router.post('/payment/va', auth, payCtrl.createVa);
router.post('/payment/webhook', payCtrl.handleWebhook);

router.get('/data', auth, ctrl.getAllData);
router.post('/data', auth, ctrl.createData);
router.delete('/data/:id', auth, ctrl.deleteData);
router.get('/transaksi', auth, ctrl.getAllTransaksi);
router.post('/transaksi', auth, ctrl.createTransaksi);
router.delete('/transaksi/:id', auth, ctrl.deleteTransaksi);

module.exports = router;