# Aplikasi Laundry Enterprise

Platform manajemen laundry terintegrasi dengan fitur CRUD pesanan, manajemen pelanggan, tracking real-time, dan integrasi pembayaran.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- SQLite3
- npm/yarn

### Installation

```bash
git clone <repo-url>
cd laundry-enterprise
npm install
```

### Environment Setup

Buat file `.env`:

```env
# Database
DATABASE_URL=file:./local.db

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_key_change_this_in_production

# Payment (Optional)
QRIS_API_KEY=your_qris_key
BANK_API_KEY=your_bank_key

# Notification (Optional)
WHATSAPP_API_KEY=your_whatsapp_key
```

### Running the App

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

## 📊 Database Schema

### Tables

**orders**
- order_number (TEXT, unique)
- customer_id (TEXT)
- customer_name (TEXT)
- phone (TEXT)
- items_description (TEXT)
- total_items (INTEGER)
- weight_kg (REAL)
- service_type (TEXT)
- total_price (REAL)
- status (TEXT): pending, processing, ready, completed, cancelled
- pickup_date (DATE)
- delivery_date (DATE)
- payment_status (TEXT): unpaid, paid, partially_paid
- notes (TEXT)
- created_at (DATETIME)
- updated_at (DATETIME)

**customers**
- customer_id (TEXT, unique)
- name (TEXT)
- phone (TEXT)
- email (TEXT)
- address (TEXT)
- city (TEXT)
- loyalty_points (INTEGER)
- total_orders (INTEGER)
- registration_date (DATE)
- created_at (DATETIME)
- updated_at (DATETIME)

**employees**
- employee_id (TEXT, unique)
- name (TEXT)
- position (TEXT)
- phone (TEXT)
- email (TEXT)
- hire_date (DATE)
- salary (REAL)
- status (TEXT): active, inactive, on_leave
- created_at (DATETIME)
- updated_at (DATETIME)

**branches**
- branch_id (TEXT, unique)
- name (TEXT)
- address (TEXT)
- city (TEXT)
- phone (TEXT)
- manager_name (TEXT)
- operating_hours (TEXT)
- created_at (DATETIME)
- updated_at (DATETIME)

**services**
- service_id (TEXT, unique)
- name (TEXT)
- description (TEXT)
- price_per_kg (REAL)
- turnaround_days (INTEGER)
- status (TEXT): active, inactive
- created_at (DATETIME)
- updated_at (DATETIME)

**payments**
- payment_id (TEXT, unique)
- order_id (TEXT)
- customer_name (TEXT)
- amount (REAL)
- payment_method (TEXT): QRIS, Transfer_Bank, Cash
- payment_date (DATE)
- status (TEXT): pending, completed, failed
- created_at (DATETIME)
- updated_at (DATETIME)

## 🎨 Features

### Core Management
- ✅ CRUD Pesanan dengan status real-time
- ✅ Manajemen Pelanggan & Riwayat Pesanan
- ✅ Manajemen Karyawan & Jadwal Kerja
- ✅ Multi-cabang dengan operasional terpisah
- ✅ Manajemen Layanan & Harga Dinamis

### Advanced Features
- ✅ Tracking Status Pesanan Real-time
- ✅ Integrasi Pembayaran QRIS & Bank Transfer
- ✅ Program Loyalitas Poin Pelanggan
- ✅ Pickup & Delivery Management
- ✅ Invoice & Receipt Generation
- ✅ SMS/Notifikasi Status Otomatis

### Analytics & Reporting
- ✅ Dashboard Statistik Penjualan
- ✅ Laporan Transaksi Pembayaran
- ✅ Analisis Kinerja Karyawan
- ✅ Metrik Kepuasan Pelanggan
- ✅ Export Data ke Excel/PDF

### Multi-Tenant Support
- ✅ Isolasi Data Per-Cabang
- ✅ Manajemen Pengguna Granular
- ✅ Audit Trail Lengkap

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite + Turso
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Auth**: JWT
- **API Docs**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18+
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI / Radix UI
- **State Management**: TanStack Query + Zustand
- **Form**: React Hook Form
- **Tables**: TanStack Table
- **Charts**: Recharts

### DevOps
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel/Railway

## 📁 Project Structure

```
laundry-enterprise/
├── server/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   └── migrations/
│   │   ├── routes/
│   │   │   ├── orders.ts
│   │   │   ├── customers.ts
│   │   │   ├── employees.ts
│   │   │   ├── branches.ts
│   │   │   ├── services.ts
│   │   │   ├── payments.ts
│   │   │   └── analytics.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── index.ts
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── common/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Orders/
│   │   │   ├── Customers/
│   │   │   ├── Employees/
│   │   │   ├── Branches/
│   │   │   ├── Services/
│   │   │   ├── Payments/
│   │   │   └── Analytics/
│   │   ├── hooks/
│   │   ├── services/api.ts
│   │   ├── store/
│   │   ├── types/
│   │   └── App.tsx
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🔐 API Endpoints

### Orders
- `GET /api/orders` - List pesanan dengan filter & pagination
- `GET /api/orders/:id` - Detail pesanan
- `POST /api/orders` - Buat pesanan baru
- `PUT /api/orders/:id` - Update pesanan
- `DELETE /api/orders/:id` - Hapus pesanan
- `PATCH /api/orders/:id/status` - Update status pesanan

### Customers
- `GET /api/customers` - List pelanggan
- `GET /api/customers/:id` - Detail pelanggan
- `POST /api/customers` - Tambah pelanggan
- `PUT /api/customers/:id` - Update pelanggan
- `GET /api/customers/:id/orders` - Riwayat pesanan

### Employees
- `GET /api/employees` - List karyawan
- `POST /api/employees` - Tambah karyawan
- `PUT /api/employees/:id` - Update karyawan
- `DELETE /api/employees/:id` - Hapus karyawan

### Payments
- `GET /api/payments` - List pembayaran
- `POST /api/payments` - Buat pembayaran
- `GET /api/payments/:id` - Detail pembayaran
- `PATCH /api/payments/:id/confirm` - Konfirmasi pembayaran

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/revenue` - Revenue report
- `GET /api/analytics/orders-trend` - Orders trend
- `GET /api/analytics/top-customers` - Top customers

## 🔄 Data Flow

```
Client Request
    ↓
Express Middleware (Auth, Validation)
    ↓
Route Handler
    ↓
Service Layer (Business Logic)
    ↓
Database Query (Drizzle ORM)
    ↓
SQLite/Turso
    ↓
Response Format (JSON)
    ↓
Client Response
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# Coverage
npm run test:coverage
```

## 📝 Seeding Database

```bash
npm run seed
```

Ini akan mengisi database dengan data sample dari file configuration.

## 🚀 Deployment

### Vercel (Frontend)
```bash
vercel deploy
```

### Railway/Render (Backend)
```bash
# Connect repository
# Set environment variables
# Deploy
```

### Docker
```bash
docker-compose up -d
```

## 📞 Support

Untuk pertanyaan atau issue, hubungi:
- Email: support@laundryenterprise.com
- WhatsApp: +62-XXX-XXXX-XXXX

## 📄 License

MIT License - Lihat file LICENSE untuk detail.

## 👥 Contributing

1. Fork repository
2. Buat branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced scheduling system
- [ ] AI-powered demand forecasting
- [ ] Integasi lebih banyak payment gateway
- [ ] Multi-bahasa support
- [ ] Voice order system

---

**Last Updated**: 2026-07-28
**Version**: 1.0.0