# Aplikasi Laundry Enterprise

Aplikasi manajemen laundry enterprise berbasis web dengan fitur order management, customer loyalty program, payment processing, dan analytics dashboard.

## Stack Teknologi

- **Backend**: Express.js + Turso SQLite
- **Frontend**: HTML5 + Tailwind CSS + Vanilla JavaScript
- **Database**: Turso SQLite (edge database)
- **Authentication**: JWT
- **Payment**: QRIS, Cash, Transfer Bank
- **Styling**: Tailwind CSS (#6366F1 → #06B6D4)

## Fitur Utama

### 1. Order Management
- Create, Read, Update, Delete pesanan
- Real-time order tracking
- Status management (pending, processing, ready, completed)
- Pickup & delivery scheduling
- Order notes & special instructions

### 2. Customer Management
- Database pelanggan lengkap
- Loyalty points system
- Member tiers (Bronze, Silver, Gold, Platinum)
- Purchase history & analytics
- Contact management

### 3. Staff Management
- CRUD staff dengan roles (Admin, Operator, Quality Control, Pickup/Delivery)
- Salary tracking
- Schedule management
- Performance metrics
- Status tracking (active, inactive, leave)

### 4. Service Catalog
- Jenis layanan (Regular, Express, Premium)
- Pricing per kg
- Turnaround time management
- Service descriptions & features

### 5. Payment Processing
- Multiple payment methods (QRIS, Cash, Bank Transfer)
- Payment tracking & reconciliation
- Invoice generation
- Payment history

### 6. Inventory Management
- Chemical & supplies tracking
- Quantity monitoring
- Reorder level alerts
- Unit cost management
- Category organization

### 7. Financial Dashboard
- Revenue reports
- Expense tracking
- Profit margin analysis
- Payment method analytics
- Monthly/yearly comparisons

### 8. Analytics & Reports
- Order volume analytics
- Customer analytics
- Revenue trends
- Service popularity
- Loyalty program analytics

## Setup & Installation

### Prerequisites
- Node.js 18+
- npm atau yarn
- Turso CLI (optional untuk development)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd laundry-enterprise

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Edit .env dengan konfigurasi Anda
# DATABASE_URL=libsql://your-db.turso.io
# DATABASE_AUTH_TOKEN=your-token
# JWT_SECRET=your-secret-key
# PORT=3000

# Run migrations
npm run migrate

# Seed data (optional)
npm run seed

# Start development server
npm run dev

# Production build
npm run build
npm start
```

## Project Structure

```
laundry-enterprise/
├── server/
│   ├── config/              # Konfigurasi database & environment
│   ├── controllers/         # Request handlers
│   ├── routes/              # API routes
│   ├── middleware/          # Auth, validation, error handling
│   ├── models/              # Database schema & queries
│   ├── services/            # Business logic
│   ├── utils/               # Helper functions
│   └── server.js            # Entry point
├── public/
│   ├── css/                 # Tailwind & custom styles
│   ├── js/                  # Frontend logic
│   ├── assets/              # Images & icons
│   └── index.html           # Main page
├── views/                   # HTML templates
│   ├── dashboard.html
│   ├── orders.html
│   ├── customers.html
│   ├── staff.html
│   ├── services.html
│   ├── payments.html
│   └── inventory.html
├── migrations/              # Database migrations
├── seeds/                   # Seed data
├── .env.example
├── package.json
└── README.md
```

## API Endpoints

### Orders
- `GET /api/orders` - Daftar pesanan (dengan pagination)
- `GET /api/orders/:id` - Detail pesanan
- `POST /api/orders` - Buat pesanan
- `PUT /api/orders/:id` - Update pesanan
- `DELETE /api/orders/:id` - Hapus pesanan
- `GET /api/orders/status/:status` - Filter by status

### Customers
- `GET /api/customers` - Daftar pelanggan
- `GET /api/customers/:id` - Detail pelanggan
- `POST /api/customers` - Tambah pelanggan
- `PUT /api/customers/:id` - Update pelanggan
- `DELETE /api/customers/:id` - Hapus pelanggan
- `POST /api/customers/:id/points` - Update loyalty points

### Staff
- `GET /api/staff` - Daftar staff
- `GET /api/staff/:id` - Detail staff
- `POST /api/staff` - Tambah staff
- `PUT /api/staff/:id` - Update staff
- `DELETE /api/staff/:id` - Hapus staff

### Services
- `GET /api/services` - Daftar layanan
- `GET /api/services/:id` - Detail layanan
- `POST /api/services` - Tambah layanan
- `PUT /api/services/:id` - Update layanan
- `DELETE /api/services/:id` - Hapus layanan

### Payments
- `GET /api/payments` - Daftar pembayaran
- `POST /api/payments` - Buat pembayaran
- `PUT /api/payments/:id` - Update pembayaran
- `GET /api/payments/order/:order_id` - Pembayaran by order

### Inventory
- `GET /api/inventory` - Daftar inventori
- `POST /api/inventory` - Tambah item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Hapus item
- `POST /api/inventory/:id/adjust` - Adjust quantity

### Dashboard
- `GET /api/dashboard/summary` - Summary metrics
- `GET /api/dashboard/revenue` - Revenue data
- `GET /api/dashboard/orders-status` - Orders by status
- `GET /api/dashboard/top-customers` - Top customers
- `GET /api/dashboard/top-services` - Top services

## Authentication

Sistem menggunakan JWT token untuk API endpoints.

```javascript
// Login
POST /api/auth/login
{
  "username": "admin",
  "password": "password"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "username": "admin", "role": "admin" }
}

// Usage
Authorization: Bearer <token>
```

## Database Schema

### orders
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  order_number TEXT UNIQUE,
  customer_id TEXT,
  customer_name TEXT,
  phone TEXT,
  items_count INTEGER,
  weight_kg REAL,
  service_type TEXT,
  total_price REAL,
  status TEXT,
  pickup_date TEXT,
  delivery_date TEXT,
  assigned_staff TEXT,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT
)
```

### customers
```sql
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  customer_id TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  loyalty_points INTEGER,
  total_spent REAL,
  member_tier TEXT,
  joined_date TEXT,
  created_at TEXT,
  updated_at TEXT
)
```

### staff
```sql
CREATE TABLE staff (
  id INTEGER PRIMARY KEY,
  staff_id TEXT UNIQUE,
  name TEXT,
  position TEXT,
  phone TEXT,
  email TEXT,
  salary REAL,
  hire_date TEXT,
  status TEXT,
  created_at TEXT,
  updated_at TEXT
)
```

### services
```sql
CREATE TABLE services (
  id INTEGER PRIMARY KEY,
  service_id TEXT UNIQUE,
  name TEXT,
  price_per_kg REAL,
  turnaround_days INTEGER,
  description TEXT,
  active BOOLEAN,
  created_at TEXT,
  updated_at TEXT
)
```

### payments
```sql
CREATE TABLE payments (
  id INTEGER PRIMARY KEY,
  payment_id TEXT UNIQUE,
  order_id TEXT,
  amount REAL,
  payment_method TEXT,
  status TEXT,
  paid_date TEXT,
  reference TEXT,
  created_at TEXT,
  updated_at TEXT
)
```

### inventory
```sql
CREATE TABLE inventory (
  id INTEGER PRIMARY KEY,
  item_id TEXT UNIQUE,
  item_name TEXT,
  category TEXT,
  quantity REAL,
  unit TEXT,
  reorder_level REAL,
  unit_cost REAL,
  created_at TEXT,
  updated_at TEXT
)
```

## Sample Data

Aplikasi dilengkapi dengan sample data:
- 2 pesanan
- 2 pelanggan
- 2 staff
- 2 layanan
- 2 pembayaran
- 2 item inventori

Jalankan `npm run seed` untuk mengisi sample data.

## Color Scheme

- Primary Gradient: #6366F1 (Indigo) → #06B6D4 (Cyan)
- Primary: #6366F1
- Secondary: #06B6D4
- Success: #10B981
- Warning: #F59E0B
- Error: #EF4444

## Error Handling

Aplikasi mengimplementasikan error handling yang robust:

```javascript
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "data": null
}
```

## Pagination

Semua list endpoint mendukung pagination:

```
GET /api/orders?page=1&limit=10&sort=created_at&order=desc

{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## Security

- Input validation & sanitization
- SQL injection prevention
- XSS protection
- CSRF tokens
- Rate limiting
- JWT authentication
- Role-based access control (RBAC)
- Secure password hashing

## Development

```bash
# Run with nodemon
npm run dev

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

## Production

```bash
# Build
npm run build

# Start
npm start

# Environment
NODE_ENV=production
```

## Troubleshooting

### Database Connection Error
- Pastikan Turso CLI terinstall
- Cek DATABASE_URL dan DATABASE_AUTH_TOKEN di .env
- Jalankan `npm run migrate`

### Port Already in Use
```bash
# Gunakan port berbeda
PORT=3001 npm run dev
```

### Migration Errors
```bash
# Reset database (development only)
npm run migrate:reset
npm run seed
```

## Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

MIT License - lihat LICENSE file

## Support

Untuk support atau pertanyaan, silakan buat issue di repository.

## Changelog

### v1.0.0 (2026-07-28)
- Initial release
- Core CRUD operations
- Payment processing
- Loyalty program
- Analytics dashboard
- Multi-entity support

---

**Aplikasi Laundry Enterprise** - Built with ❤️ for Indonesian Laundry Businesses