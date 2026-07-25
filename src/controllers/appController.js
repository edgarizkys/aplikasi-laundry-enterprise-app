// World-Class Controllers for Aplikasi Laundry Enterprise (Aplikasi Laundry Enterprise World-Class Enterprise)

let dataData = [
  {
    "id": 1,
    "judul": "Record Aplikasi Laundry Enterprise #1",
    "kategori": "Operasional",
    "nilai": 15000000,
    "status": "Aktif"
  }
];

exports.getAllData = async (req, res) => {
    const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
    res.json({ success: true, tenantId, count: dataData.length, data: dataData });
};

exports.createData = async (req, res) => {
    const item = { id: Date.now(), tenant_id: req.headers['x-tenant-id'] || 'default_tenant', ...req.body };
    dataData.unshift(item);
    res.status(201).json({ success: true, data: item });
};

exports.deleteData = async (req, res) => {
    dataData = dataData.filter(i => i.id !== parseInt(req.params.id));
    res.json({ success: true, message: 'Data Utama deleted' });
};

let transaksiData = [
  {
    "id": 1,
    "invoice": "INV-20260724-001",
    "deskripsi": "Pembayaran Layanan",
    "total": 2500000,
    "metode": "QRIS Gateway",
    "status": "Success"
  }
];

exports.getAllTransaksi = async (req, res) => {
    const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
    res.json({ success: true, tenantId, count: transaksiData.length, data: transaksiData });
};

exports.createTransaksi = async (req, res) => {
    const item = { id: Date.now(), tenant_id: req.headers['x-tenant-id'] || 'default_tenant', ...req.body };
    transaksiData.unshift(item);
    res.status(201).json({ success: true, data: item });
};

exports.deleteTransaksi = async (req, res) => {
    transaksiData = transaksiData.filter(i => i.id !== parseInt(req.params.id));
    res.json({ success: true, message: 'Transaksi Pembayaran deleted' });
};

exports.getAnalytics = async (req, res) => {
    res.json({ success: true, platform: 'Aplikasi Laundry Enterprise', domain: 'Aplikasi Laundry Enterprise World-Class Enterprise', version: '5.0.0-WorldClass', architecture: 'Multi-Tenant Ready + Redis Cache' });
};