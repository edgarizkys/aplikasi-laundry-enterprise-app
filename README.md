# Aplikasi Laundry Enterprise

Sistem manajemen laundry enterprise dengan dukungan multi-cabang, manajemen pesanan, pelanggan, staff, mesin, dan pembayaran.

## 📋 Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Struktur Proyek](#struktur-proyek)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Fitur Enterprise](#fitur-enterprise)
- [Panduan Penggunaan](#panduan-penggunaan)
- [Troubleshooting](#troubleshooting)
- [Lisensi](#lisensi)

## ✨ Fitur Utama

### Manajemen Pesanan
- CRUD pesanan (Buat, Baca, Ubah, Hapus)
- Status tracking real-time (pending, processing, completed, cancelled)
- Penjadwalan pickup dan delivery
- Assign staff ke pesanan
- Catatan pesanan dengan timestamp

### Database Pelanggan
- Profil pelanggan lengkap
- Program loyalitas dengan poin reward
- Tracking total pengeluaran
- Riwayat pesanan pelanggan
- Multi-contact support (phone, email)

### Manajemen Staff
- Master data staff dengan role dan shift
- Tracking gaji dan tanggal bergabung
- Status aktif/non-aktif
- Performa staff per periode

### Tracking Mesin
- Inventory mesin (cuci, pengering, setrika)
- Kapasitas dan lokasi mesin
- Jadwal maintenance preventif
- Alert maintenance overdue
- Status operasional real-time

### Manajemen Pembayaran
- Multiple payment methods (QRIS, Bank Transfer, Cash)
- Payment status tracking
- Reference number untuk reconciliation
- Payment receipt generation
- Unpaid order alerts

### Multi-Cabang
- Manajemen data per cabang
- Konsolidasi laporan antar cabang
- Staff dan mesin per cabang
- Operating hours per cabang

### Analytics & Reporting
- Dashboard KPI real-time
- Revenue tracking
- Order volume analytics
- Staff performance metrics
- Customer insights
- Export reports (PDF, Excel)

### Inventory Tracking
- Item quantity management
- Usage tracking per pesanan
- Stock alerts
- Reorder recommendations

### Penjadwalan Pickup & Delivery
- Calendar view untuk jadwal
- Notifikasi reminder otomatis
- Route optimization (future enhancement)
- Customer confirmation

### Loyalty Program
- Automatic poin calculation
- Redemption untuk discount
- Tier-based benefits
- Referral rewards

## 🛠️ Teknologi yang Digunakan

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js v4.18+
- **Database**: Turso SQLite (dengan libSQL)
- **Authentication**: JWT
- **Validation**: Zod
- **Logging**: Winston
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: React v18+
- **Styling**: Tailwind CSS v3+
- **State Management**: TanStack Query (React Query)
- **UI Components**: Radix UI / Headless UI
- **Charts**: Recharts
- **Forms**: React Hook Form

### DevOps & Tools
- **Package Manager**: npm
- **Build Tool**: Vite
- **Testing**: Jest, Supertest
- **Linting**: ESLint, Prettier
- **Version Control**: Git

## 📋 Persyaratan Sistem

### Minimum Requirements
- Node.js: v18.0.0 atau lebih tinggi
- npm: v9.0.0 atau lebih tinggi
- RAM: 2GB
- Storage: 1GB
- Browser modern (Chrome, Firefox, Safari, Edge)

### Recommended Requirements
- Node.js: v20.0.0 LTS
- npm: v10.0.0
- RAM: 4GB+
- Storage: 5GB+

## 🚀 Instalasi

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/laundry-enterprise.git
cd laundry-enterprise
```

### Step 2: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 3: Environment Setup

**Backend (.env)**
```
NODE_ENV=development
PORT=3001
DATABASE_URL=file:./laundry.db
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_EXPIRY=7d
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:5173
QRIS_MERCHANT_ID=your_merchant_id
BANK_API_KEY=your_bank_api_key
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Aplikasi Laundry Enterprise
VITE_BRAND_COLOR=#3B82F6
```

### Step 4: Database Setup

```bash
cd backend
npm run migrate
npm run seed  # Optional: Load sample data
```

## ⚙️ Konfigurasi

### Database Configuration
File: `backend/config/database.js`

```javascript
export const dbConfig = {
  url: process.env.DATABASE_URL,
  syncInterval: 5000, // WebSocket sync interval
  connectionPool: 10
}
```

### Authentication Configuration
File: `backend/config/auth.js`

```javascript
export const authConfig = {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: process.env.JWT_EXPIRY,
  refreshTokenExpiry: '30d',
  passwordMinLength: 8
}
```

### Server Configuration
File: `backend/config/server.js`

```javascript
export const serverConfig = {
  port: process.env.PORT,
  corsOrigin: process.env.CORS_ORIGIN,
  apiVersion: 'v1',
  requestTimeout: 30000
}
```

## 🎯 Menjalankan Aplikasi

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server berjalan di http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App berjalan di http://localhost:5173
```

### Production Mode

**Build:**
```bash
cd frontend
npm run build

cd ../backend
npm run build
```

**Run:**
```bash
cd backend
NODE_ENV=production npm start
```

### Docker (Optional)

```bash
# Build image
docker-compose build

# Run containers
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📁 Struktur Proyek

```
laundry-enterprise/
├── backend/
│   ├── src/
│   │   ├── config/              # Konfigurasi aplikasi
│   │   ├── controllers/          # Business logic
│   │   ├── middleware/           # Middleware (auth, error, validation)
│   │   ├── models/               # Database models
│   │   ├── routes/               # API routes
│   │   ├── services/             # Business services
│   │   ├── utils/                # Utility functions
│   │   ├── migrations/           # Database migrations
│   │   ├── seeders/              # Database seeders
│   │   └── server.js             # Entry point
│   ├── tests/                    # Test suite
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/                # Page components
│   │   ├── hooks/                # Custom hooks
│   │   ├── services/             # API services
│   │   ├── store/                # State management
│   │   ├── styles/               # Global styles
│   │   ├── utils/                # Utility functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/                   # Static assets
│   ├── tests/                    # Test suite
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api/v1
```

### Authentication
Semua endpoint (kecuali login/register) memerlukan Bearer Token:

```
Authorization: Bearer {token}
```

### Entities Overview

#### 1. Orders (Pesanan)
**GET** `/orders` - List pesanan (dengan pagination)
**POST** `/orders` - Buat pesanan baru
**GET** `/orders/:id` - Detail pesanan
**PUT** `/orders/:id` - Update pesanan
**DELETE** `/orders/:id` - Hapus pesanan
**PATCH** `/orders/:id/status` - Update status pesanan

#### 2. Customers (Pelanggan)
**GET** `/customers` - List pelanggan
**POST** `/customers` - Buat pelanggan baru
**GET** `/customers/:id` - Detail pelanggan
**PUT** `/customers/:id` - Update data pelanggan
**DELETE** `/customers/:id` - Hapus pelanggan
**GET** `/customers/:id/orders` - Riwayat pesanan

#### 3. Staff
**GET** `/staff` - List staff
**POST** `/staff` - Tambah staff
**GET** `/staff/:id` - Detail staff
**PUT** `/staff/:id` - Update staff
**DELETE** `/staff/:id` - Hapus staff
**GET** `/staff/:id/performance` - Performa staff

#### 4. Machines (Mesin)
**GET** `/machines` - List mesin
**POST** `/machines` - Tambah mesin
**GET** `/machines/:id` - Detail mesin
**PUT** `/machines/:id` - Update mesin
**DELETE** `/machines/:id` - Hapus mesin
**PATCH** `/machines/:id/maintenance` - Schedule maintenance

#### 5. Payments (Pembayaran)
**GET** `/payments` - List pembayaran
**POST** `/payments` - Buat pembayaran
**GET** `/payments/:id` - Detail pembayaran
**PATCH** `/payments/:id/status` - Update status pembayaran
**GET** `/payments/verify/:reference` - Verifikasi pembayaran

#### 6. Branches (Cabang)
**GET** `/branches` - List cabang
**POST** `/branches` - Tambah cabang
**GET** `/branches/:id` - Detail cabang
**PUT** `/branches/:id` - Update cabang
**GET** `/branches/:id/analytics` - Analytics per cabang

#### 7. Analytics
**GET** `/analytics/dashboard` - KPI dashboard
**GET** `/analytics/revenue` - Revenue analytics
**GET** `/analytics/orders` - Order analytics
**GET** `/analytics/staff-performance` - Staff performance
**GET** `/analytics/customer-insights` - Customer insights

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error code",
  "message": "Error description",
  "details": {...}
}
```

**Pagination Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

## 🗄️ Database Schema

### Orders Table
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  items_list TEXT,
  total_weight_kg REAL,
  service_type TEXT,
  total_price REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  pickup_date DATE,
  delivery_date DATE,
  assigned_staff TEXT,
  notes TEXT,
  branch_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
)
```

### Customers Table
```sql
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  address TEXT,
  city TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_spent REAL DEFAULT 0,
  registration_date DATE,
  branch_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
)
```

### Staff Table
```sql
CREATE TABLE staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE,
  shift TEXT,
  salary REAL,
  join_date DATE,
  status TEXT DEFAULT 'aktif',
  branch_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
)
```

### Machines Table
```sql
CREATE TABLE machines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  capacity_kg REAL,
  location TEXT,
  status TEXT DEFAULT 'aktif',
  last_maintenance DATE,
  next_maintenance DATE,
  branch_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
)
```

### Payments Table
```sql
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id TEXT UNIQUE NOT NULL,
  order_number TEXT NOT NULL,
  customer_name TEXT,
  amount REAL NOT NULL,
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  payment_date DATE,
  reference_number TEXT UNIQUE,
  branch_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_number) REFERENCES orders(order_number),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
)
```

### Branches Table
```sql
CREATE TABLE branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  manager_name TEXT,
  operating_hours TEXT,
  total_machines INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## 🏢 Fitur Enterprise

### Multi-Tenant Architecture
- Isolasi data per cabang
- Role-based access control (RBAC)
- Audit logging untuk semua transaksi
- Data encryption untuk informasi sensitif

### Scalability
- Pagination di semua list endpoint
- Caching strategy untuk data statis
- Database connection pooling
- Async task processing

### Security
- JWT authentication dengan refresh tokens
- Password hashing (bcrypt)
- SQL injection prevention (prepared statements)
- CORS configuration
- Rate limiting
- Input validation & sanitization

### Reliability
- Transaction support untuk critical operations
- Error logging dan monitoring
- Graceful error handling
- Database backup recommendations

### Performance
- Indexed database queries
- API response compression
- Frontend lazy loading
- Optimistic updates di client

## 📖 Panduan Penggunaan

### Login
1. Buka http://localhost:5173
2. Masukkan username dan password
3. Klik "Masuk"

### Membuat Pesanan Baru
1. Navigasi ke menu "Pesanan"
2. Klik tombol "Buat Pesanan"
3. Isi form dengan data pelanggan dan item
4. Pilih tanggal pickup dan delivery
5. Tentukan service type dan staff penugasan
6. Klik "Simpan"

### Kelola Pelanggan
1. Navigasi ke menu "Pelanggan"
2. Lihat daftar atau cari pelanggan
3. Klik nama untuk detail/edit
4. Update data atau lihat riwayat pesanan
5. Monitor poin loyalitas

### Tracking Mesin
1. Navigasi ke menu "Mesin"
2. Lihat status semua mesin
3. Schedule maintenance jika diperlukan
4. Monitor kapasitas dan alert maintenance

### Manajemen Pembayaran
1. Navigasi ke menu "Pembayaran"
2. Lihat status pembayaran pesanan
3. Konfirmasi pembayaran yang masuk
4. Generate receipt untuk pelanggan

### Analytics Dashboard
1. Navigasi ke menu "Analytics"
2. Lihat KPI real-time
3. Generate laporan per periode
4. Export data untuk analisis lebih lanjut

## 🔧 Troubleshooting

### Database Connection Error
```
Error: SQLITE_CANTOPEN
```
**Solusi:**
- Pastikan folder database writable
- Cek permission file
- Jalankan migration ulang: `npm run migrate`

### Authentication Failed
```
Error: Invalid token
```
**Solusi:**
- Clear localStorage di browser
- Login ulang
- Check JWT_SECRET di .env matching

### Port Already in Use
```
Error: listen EADDRINUSE :::3001
```
**Solusi:**
- Cek process yang menggunakan port: `lsof -i :3001`
- Kill process: `kill -9 <PID>`
- Atau ganti PORT di .env

### CORS Error
```
Error: Access to XMLHttpRequest blocked by CORS policy
```
**Solusi:**
- Pastikan CORS_ORIGIN di backend match frontend URL
- Check browser console untuk detail error
- Clear browser cache

### Migration Error
```
Error: Migration failed
```
**Solusi:**
```bash
# Reset database
npm run db:reset

# Re-run migration
npm run migrate

# Re-seed data
npm run seed
```

## 📞 Support & Kontribusi

Untuk pertanyaan, bug report, atau feature request:
1. Buat issue di GitHub
2. Jelaskan masalah dengan detail
3. Sertakan error log dan screenshot
4. Tunggu response dari team

## 📄 Lisensi

MIT License - Bebas digunakan untuk keperluan pribadi maupun komersial.

---

**Aplikasi Laundry Enterprise** | Dibangun dengan ❤️ untuk efisiensi bisnis laundry Anda