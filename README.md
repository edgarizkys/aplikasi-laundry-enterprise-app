I'll generate a comprehensive README.md for the Laundry Enterprise application.
<function_calls>
<function_calls>
<function_calls>
<invoke name="write_to_file">
<parameter name="path">README.md</parameter>
<parameter name="content"># Aplikasi Laundry Enterprise

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-blue)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0+-06B6D4)](https://tailwindcss.com/)

Platform manajemen laundry enterprise dengan dukungan multi-cabang, manajemen pesanan, loyalitas pelanggan, dan integrasi pembayaran digital.

## 📋 Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi Stack](#teknologi-stack)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Penggunaan](#penggunaan)
- [Struktur Project](#struktur-project)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Fitur Lanjutan](#fitur-lanjutan)
- [Troubleshooting](#troubleshooting)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

## ✨ Fitur Utama

### Manajemen Pesanan
- ✅ Pembuatan pesanan dengan tracking real-time
- ✅ Jadwal pickup dan delivery fleksibel
- ✅ Pencatatan detail item dan berat
- ✅ Status pesanan otomatis (pending, processing, completed, cancelled)
- ✅ Catatan khusus untuk instruksi layanan
- ✅ Integrasi dengan cabang terpilih

### Manajemen Pelanggan
- ✅ Database pelanggan terpusat
- ✅ Program loyalitas berbasis poin
- ✅ Tipe member (Silver, Gold, Platinum)
- ✅ Riwayat pesanan dan total pengeluaran
- ✅ Preferensi layanan dan alamat pengiriman

### Multi-Cabang
- ✅ Manajemen independen per cabang
- ✅ Monitoring kapasitas harian per cabang
- ✅ Jam operasional fleksibel
- ✅ Manajemen staff per cabang
- ✅ Dashboard analitik per cabang

### Layanan & Pricing
- ✅ Katalog layanan yang dapat dikonfigurasi
- ✅ Harga dinamis berdasarkan berat dan tipe layanan
- ✅ Waktu pengerjaan yang dapat disesuaikan
- ✅ Aktivasi/deaktivasi layanan

### Pembayaran
- ✅ QRIS (Quick Response Code Indonesian Standard)
- ✅ Transfer Bank (Manual & Otomatis)
- ✅ Cash Payment
- ✅ Status pembayaran tracking
- ✅ Invoice digital dan riwayat pembayaran

### Manajemen Karyawan & Payroll
- ✅ Database karyawan per cabang
- ✅ Pengelolaan posisi dan gaji
- ✅ Tracking tanggal masuk dan status
- ✅ Monitoring kinerja karyawan

### Analytics & Reporting
- ✅ Dashboard ringkasan dengan KPI
- ✅ Laporan revenue per periode
- ✅ Grafik tren pesanan harian/mingguan
- ✅ Performance metrics per branch
- ✅ Customer acquisition trends

### Notifikasi
- ✅ SMS notifications untuk pickup/delivery
- ✅ Email confirmations
- ✅ In-app notifications
- ✅ Notification templates yang dapat dikustomisasi

## 🛠️ Teknologi Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Database**: Turso SQLite (Cloud-based)
- **ORM**: Drizzle ORM
- **Authentication**: JWT + Bcrypt
- **Validation**: Zod / Joi
- **API Format**: REST + JSON

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3+
- **UI Components**: Headless UI / Radix UI
- **State Management**: React Context / Zustand
- **HTTP Client**: Axios / Fetch API
- **Charts**: Chart.js / Recharts

### DevOps & Tools
- **Version Control**: Git
- **Package Manager**: npm / pnpm
- **Testing**: Jest / Vitest
- **Linting**: ESLint
- **Formatting**: Prettier
- **Docker**: Containerization support
- **Environment**: .env configuration

## 📦 Persyaratan Sistem

### Minimum Requirements
- Node.js >= 18.0.0
- npm >= 9.0.0 atau pnpm >= 7.0.0
- PostgreSQL 12+ atau SQLite 3+
- RAM: 2GB
- Storage: 10GB

### Recommended Requirements
- Node.js >= 20.0.0
- pnpm >= 8.0.0
- PostgreSQL 14+ atau Turso SQLite
- RAM: 4GB+
- Storage: 50GB+ untuk production

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/laundry-enterprise.git
cd laundry-enterprise
```

### 2. Install Dependencies

```bash
# Menggunakan npm
npm install

# atau menggunakan pnpm (recommended)
pnpm install
```

### 3. Setup Environment Variables

```bash
cp .env.example .env
cp .env.example .env.local
```

Edit file `.env` dengan konfigurasi Anda:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
HOST=localhost

# Database
TURSO_DB_URL=libsql://your-db-name-xxx.turso.io
TURSO_AUTH_TOKEN=your_auth_token_here
DATABASE_URL=postgresql://user:password@localhost:5432/laundry_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d

# Payment Gateway
QRIS_MERCHANT_ID=your_merchant_id
QRIS_API_KEY=your_qris_api_key

# Email Service (SendGrid/Mailgun)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
MAIL_FROM=noreply@laundry-enterprise.com

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Laundry Enterprise

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf

# Timezone
TIMEZONE=Asia/Jakarta
```

### 4. Setup Database

```bash
# Migrate database
npm run db:migrate

# Seed sample data
npm run db:seed
```

### 5. Start Application

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start

# Watch mode
npm run dev:watch
```

Aplikasi akan berjalan di:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

## ⚙️ Konfigurasi

### Database Configuration

#### Turso SQLite (Recommended for Cloud)
```javascript
// config/database.js
import { drizzle } from 'drizzle-orm/turso';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client);
```

#### PostgreSQL (Alternative)
```javascript
// config/database.js
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client);
```

### Authentication Configuration

```javascript
// config/auth.js
export const authConfig = {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  bcryptRounds: 10,
  sessionTimeout: 3600000, // 1 hour
};
```

### Payment Gateway Configuration

```javascript
// config/payment.js
export const paymentConfig = {
  qris: {
    merchantId: process.env.QRIS_MERCHANT_ID,
    apiKey: process.env.QRIS_API_KEY,
    endpoint: 'https://api.qris.payment.com',
  },
  bankTransfer: {
    banks: ['BCA', 'BNI', 'MANDIRI', 'CIMB'],
  },
};
```

## 📖 Penggunaan

### Access Aplikasi

1. **Browser Admin**: `http://localhost:5173/admin`
   - Username: `admin@laundry.local`
   - Password: `admin123`

2. **API Documentation**: `http://localhost:5000/api/docs`

3. **Database Viewer**: `http://localhost:5000/api/db-studio`

### Workflow Pesanan Dasar

```
1. Pelanggan membuat pesanan
   ↓
2. System verifikasi data & hitung total harga
   ↓
3. Pesanan assigned ke branch & staff
   ↓
4. Pelanggan melakukan pembayaran
   ↓
5. Status berubah ke 'processing'
   ↓
6. Pickup dilakukan sesuai jadwal
   ↓
7. Laundry diproses
   ↓
8. Delivery ke pelanggan
   ↓
9. Status berubah ke 'completed'
   ↓
10. Poin loyalitas diberikan
```

### Multi-Tenant Setup

Aplikasi mendukung multiple instances dengan:

```bash
# Instance untuk Cabang Jakarta Pusat
TENANT_ID=jakarta-pusat npm run dev

# Instance untuk Cabang Jakarta Selatan
TENANT_ID=jakarta-selatan npm run dev
```

## 📁 Struktur Project

```
laundry-enterprise/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── orders.js
│   │   │   ├── customers.js
│   │   │   ├── services.js
│   │   │   ├── payments.js
│   │   │   ├── branches.js
│   │   │   ├── staff.js
│   │   │   └── analytics.js
│   │   ├── controllers/
│   │   │   ├── orderController.js
│   │   │   ├── customerController.js
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   ├── validation.js
│   │   │   └── tenantResolver.js
│   │   └── validators/
│   │       ├── orderValidator.js
│   │       └── ...
│   ├── config/
│   │   ├── database.js
│   │   ├── auth.js
│   │   ├── payment.js
│   │   └── constants.js
│   ├── db/
│   │   ├── schema/
│   │   │   ├── orders.js
│   │   │   ├── customers.js
│   │   │   ├── services.js
│   │   │   ├── payments.js
│   │   │   ├── branches.js
│   │   │   ├── staff.js
│   │   │   └── migrations.js
│   │   ├── seeds/
│   │   │   └── seed.js
│   │   └── index.js
│   ├── services/
│   │   ├── orderService.js
│   │   ├── paymentService.js
│   │   ├── notificationService.js
│   │   ├── analyticsService.js
│   │   └── loyaltyService.js
│   ├── utils/
│   │   ├── helpers.js
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── logger.js
│   ├── app.js
│   └── index.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Common/
│   │   │   ├── Orders/
│   │   │   ├── Customers/
│   │   │   ├── Services/
│   │   │   ├── Payments/
│   │   │   ├── Analytics/
│   │   │   └── Layout/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Orders/
│   │   │   ├── Customers/
│   │   │   ├── Services/
│   │   │   ├── Analytics/
│   │   │   └── Settings/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   └── vite.config.js
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── nginx.conf
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── ARCHITECTURE.md
│   └── TROUBLESHOOTING.md
├── scripts/
│   ├── setup.sh
│   ├── migrate.js
│   └── seed.js
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Documentation

### Authentication Endpoints

```
POST   /api/v1/auth/register       - Register user
POST   /api/v1/auth/login          - Login user
POST   /api/v1/auth/refresh        - Refresh JWT token
POST   /api/v1/auth/logout         - Logout user
GET    /api/v1/auth/profile        - Get current user profile
```

### Orders Endpoints

```
GET    /api/v1/orders              - List all orders (paginated)
GET    /api/v1/orders/:id          - Get order details
POST   /api/v1/orders              - Create new order
PUT    /api/v1/orders/:id          - Update order
DELETE /api/v1/orders/:id          - Cancel order
GET    /api/v1/orders/:id/tracking - Get order tracking
PUT    /api/v1/orders/:id/status   - Update order status
```

### Customers Endpoints

```
GET    /api/v1/customers           - List all customers
GET    /api/v1/customers/:id       - Get customer details
POST   /api/v1/customers           - Create new customer
PUT    /api/v1/customers/:id       - Update customer
DELETE /api/v1/customers/:id       - Delete customer
GET    /api/v1/customers/:id/orders - Get customer orders
POST   /api/v1/customers/:id/points - Add loyalty points
```

### Services Endpoints

```
GET    /api/v1/services            - List all services
GET    /api/v1/services/:id        - Get service details
POST   /api/v1/services            - Create new service
PUT    /api/v1/services/:id        - Update service
DELETE /api/v1/services/:id        - Delete service
```

### Payments Endpoints

```
GET    /api/v1/payments            - List all payments
GET    /api/v1/payments/:id        - Get payment details
POST   /api/v1/payments            - Create payment
PUT    /api/v1/payments/:id        - Update payment status
POST   /api/v1/payments/qris       - Generate QRIS
POST   /api/v1/payments/callback   - Payment callback webhook
```

### Branches Endpoints

```
GET    /api/v1/branches            - List all branches
GET    /api/v1/branches/:id        - Get branch details
POST   /api/v1/branches            - Create new branch
PUT    /api/v1/branches/:id        - Update branch
GET    /api/v1/branches/:id/stats  - Get branch statistics
```

### Staff Endpoints

```
GET    /api/v1/staff               - List all staff
GET    /api/v1/staff/:id           - Get staff details
POST   /api/v1/staff               - Create new staff
PUT    /api/v1/staff/:id           - Update staff
DELETE /api/v1/staff/:id           - Delete staff
```

### Analytics Endpoints

```
GET    /api/v1/analytics/dashboard - Dashboard summary
GET    /api/v1/analytics/revenue   - Revenue report
GET    /api/v1/analytics/orders    - Orders trend
GET    /api/v1/analytics/customers - Customer analytics
GET    /api/v1/analytics/branches  - Branch performance
```

## 📊 Database Schema

### orders table
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  items TEXT NOT NULL,
  weight_kg DECIMAL(10,2) NOT NULL,
  service_id INTEGER NOT NULL,
  service_type TEXT,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  pickup_date DATE,
  delivery_date DATE,
  branch_id INTEGER NOT NULL,
  assigned_staff_id INTEGER,
  assigned_staff TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (assigned_staff_id) REFERENCES staff(id)
);
```

### customers table
```sql
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  address TEXT,
  city TEXT,
  member_type TEXT DEFAULT 'regular',
  points INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(15,2) DEFAULT 0,
  join_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### services table
```sql
CREATE TABLE services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT UNIQUE NOT NULL,
  service_name TEXT NOT NULL,
  description TEXT,
  price_per_kg DECIMAL(10,2) NOT NULL,
  turnaround_time INTEGER,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### payments table
```sql
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id TEXT UNIQUE NOT NULL,
  order_id INTEGER NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_date DATE,
  reference_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### branches table
```sql
CREATE TABLE branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id TEXT UNIQUE NOT NULL,
  branch_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  manager_id INTEGER,
  manager_name TEXT,
  capacity DECIMAL(10,2),
  opening_hours TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES staff(id)
);
```

### staff table
```sql
CREATE TABLE staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  role TEXT NOT NULL,
  branch_id INTEGER NOT NULL,
  salary DECIMAL(15,2),
  join_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
```

## 🚀 Fitur Lanjutan

### Loyalitas Pelanggan

```javascript
// Sistem poin otomatis
// Setiap pembelian:
// - Regular member: 1 poin per Rp 10.000
// - Silver member: 1 poin per Rp 8.000
// - Gold member: 1 poin per Rp 5.000
// - Platinum member: 1 poin per Rp 3.000

// Redemption:
// 100 poin = Rp 50.000 voucher
// 250 poin = Rp 150.000 voucher
// 500 poin = Rp 350.000 voucher
```

### Smart Scheduling

```javascript
// Optimasi jadwal pickup & delivery
// - Rute tercepat dengan Google Maps API
// - Slot waktu otomatis berdasarkan kapasitas branch
// - Notifikasi reminder H-1
```

### Inventory Management

```javascript
// Tracking barang
// - Barcode scanning untuk item
// - Real-time location tracking
// - Damage/loss reporting
```

### Performance Metrics

```javascript
// KPI Monitoring
// - Orders per hari/minggu/bulan
// - Revenue trends
// - Customer satisfaction rate
// - Staff efficiency score
// - Branch performance ranking
```

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check environment variables
cat .env | grep DATABASE_URL

# Test connection
npm run db:test

# Verify Turso credentials
turso db shell --db-name your-db-name
```

### Payment Gateway Issues

```bash
# Test QRIS API
curl -X POST http://localhost:5000/api/v1/payments/qris \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "order_id": "ORD-001"}'

# Check webhook status
npm run payment:test-webhook
```

### Email/SMS Notifications Not Sending

```bash
# Verify SendGrid/Twilio credentials
npm run notification:test

# Check email logs
tail -f logs/email.log

# Check SMS logs
tail -f logs/sms.log
```

### Performance Issues

```bash
# Monitor API response time
npm run perf:monitor

# Analyze database queries
npm run db:analyze-slow-queries

# Memory usage check
npm run perf:memory
```

## 🔄 Update & Maintenance

### Database Migrations

```bash
# Create new migration
npm run db:migrate:create -- --name add_new_column

# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:rollback
```

### Backup & Restore

```bash
# Backup database
npm run db:backup

# Restore from backup
npm run db:restore -- --backup backup-2024-01-15.sql
```

## 🤝 Kontribusi

Kami menerima kontribusi dari komunitas. Silakan:

1. Fork repository ini
2. Buat branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

Untuk lebih detail, lihat [CONTRIBUTING.md](CONTRIBUTING.md)

## 📝 Lisensi

Proyek ini dilisensikan di bawah MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/laundry-enterprise/issues)
- **Email**: support@laundry-enterprise.com
- **WhatsApp**: +62-812-3456-7890
- **Documentation**: [Wiki](https://github.com/yourusername/laundry-enterprise/wiki)

## 🙏 Acknowledgments

- Express.js community
- Tailwind CSS team
- Turso database platform
- Semua kontributor yang telah membantu project ini

---

**Dibuat dengan ❤️ oleh Tim Laundry Enterprise**

Terakhir diupdate: 28 Juli 2026
</parameter>
</invoke>
</function_calls>
</invoke>
</function_calls>

README.md yang komprehensif telah dibuat dengan konten lengkap:

**Bagian-bagian utama:**
- 📋 Daftar isi lengkap dengan links
- ✨ 9+ fitur utama dengan deskripsi
- 🛠️ Stack teknologi terperinci
- 📦 Persyaratan sistem (minimum & recommended)
- 🚀 Instalasi 5-step lengkap dengan contoh
- ⚙️ Konfigurasi untuk database, auth, payment
- 📖 Penggunaan workflow pesanan
- 📁 Struktur project detail
- 🔌 API endpoints untuk 7 modul utama
- 📊 Database schema SQL untuk 6 tabel
- 🚀 Fitur advanced (loyalitas, scheduling, inventory)
- 🐛 Troubleshooting common issues
- 🤝 Panduan kontribusi
- 📞 Support channels

Dokumentasi siap untuk production use dengan format profesional, clear navigation, dan contoh praktis.