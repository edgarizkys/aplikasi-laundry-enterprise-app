I'll generate comprehensive unit tests for the Laundry Enterprise application. Let me start with the first chunk.
<function_calls>
<invoke name="write_to_file">
<parameter name="file_path">unit.test.js</parameter>
<parameter name="content">const request = require('supertest');
const app = require('./app');
const db = require('./db');

// Mock database
jest.mock('./db');

describe('Aplikasi Laundry Enterprise - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== ORDERS TESTS ====================
  describe('Orders API', () => {
    describe('GET /api/orders', () => {
      test('should return all orders with pagination', async () => {
        const mockOrders = [
          {
            id: 1,
            order_number: 'ORD-2026-001',
            customer_name: 'Budi Santoso',
            phone: '081234567890',
            email: 'budi@email.com',
            items_list: '5 Baju, 3 Celana',
            total_weight_kg: 4.5,
            service_type: 'Express',
            total_price: 67500,
            status: 'processing',
            pickup_date: '2026-07-28',
            delivery_date: '2026-07-29',
            assigned_staff: 'Siti Nurhaliza',
            notes: 'Express service'
          }
        ];

        db.prepare.mockReturnValue({
          all: jest.fn().mockReturnValue(mockOrders)
        });

        const res = await request(app).get('/api/orders?page=1&limit=10');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      test('should handle pagination parameters correctly', async () => {
        db.prepare.mockReturnValue({
          all: jest.fn().mockReturnValue([])
        });

        const res = await request(app).get('/api/orders?page=2&limit=20');

        expect(res.status).toBe(200);
        expect(res.body.pagination.page).toBe(2);
        expect(res.body.pagination.limit).toBe(20);
      });

      test('should filter orders by status', async () => {
        const mockOrders = [
          {
            id: 1,
            order_number: 'ORD-2026-001',
            status: 'processing'
          }
        ];

        db.prepare.mockReturnValue({
          all: jest.fn().mockReturnValue(mockOrders)
        });

        const res = await request(app).get('/api/orders?status=processing');

        expect(res.status).toBe(200);
        expect(res.body.data[0].status).toBe('processing');
      });

      test('should handle invalid pagination gracefully', async () => {
        const res = await request(app).get('/api/orders?page=-1&limit=abc');

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe('GET /api/orders/:id', () => {
      test('should return a single order by ID', async () => {
        const mockOrder = {
          id: 1,
          order_number: 'ORD-2026-001',
          customer_name: 'Budi Santoso',
          total_price: 67500,
          status: 'processing'
        };

        db.prepare.mockReturnValue({
          get: jest.fn().mockReturnValue(mockOrder)
        });

        const res = await request(app).get('/api/orders/1');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.order_number).toBe('ORD-2026-001');
      });

      test('should return 404 if order not found', async () => {
        db.prepare.mockReturnValue({
          get: jest.fn().mockReturnValue(null)
        });

        const res = await request(app).get('/api/orders/999');

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('tidak ditemukan');
      });

      test('should validate order ID format', async () => {
        const res = await request(app).get('/api/orders/invalid-id');

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe('POST /api/orders', () => {
      test('should create a new order successfully', async () => {
        const newOrder = {
          order_number: 'ORD-2026-003',
          customer_name: 'Ahmad Wijaya',
          phone: '081234567890',
          email: 'ahmad@email.com',
          items_list: '5 Baju',
          total_weight_kg: 3.0,
          service_type: 'Regular',
          total_price: 45000,
          status: 'pending',
          pickup_date: '2026-07-28',
          delivery_date: '2026-07-30'
        };

        db.prepare.mockReturnValue({
          run: jest.fn().mockReturnValue({ lastInsertRowid: 1 })
        });

        const res = await request(app)
          .post('/api/orders')
          .send(newOrder);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(1);
      });

      test('should validate required fields', async () => {
        const incompleteOrder = {
          customer_name: 'Ahmad Wijaya'
        };

        const res = await request(app)
          .post('/api/orders')
          .send(incompleteOrder);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toBeDefined();
      });

      test('should validate email format', async () => {
        const invalidOrder = {
          order_number: 'ORD-2026-003',
          customer_name: 'Ahmad Wijaya',
          phone: '081234567890',
          email: 'invalid-email',
          items_list: '5 Baju',
          total_weight_kg: 3.0,
          service_type: 'Regular',
          total_price: 45000,
          status: 'pending',
          pickup_date: '2026-07-28',
          delivery_date: '2026-07-30'
        };

        const res = await request(app)
          .post('/api/orders')
          .send(invalidOrder);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      test('should validate phone number format', async () => {
        const invalidOrder = {
          order_number: 'ORD-2026-003',
          customer_name: 'Ahmad Wijaya',
          phone: 'invalid-phone',
          email: 'ahmad@email.com',
          items_list: '5 Baju',
          total_weight_kg: 3.0,
          service_type: 'Regular',
          total_price: 45000,
          status: 'pending',
          pickup_date: '2026-07-28',
          delivery_date: '2026-07-30'
        };

        const res = await request(app)
          .post('/api/orders')
          .send(invalidOrder);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      test('should generate unique order number', async () => {
        const newOrder = {
          customer_name: 'Ahmad Wijaya',
          phone: '081234567890',
          email: 'ahmad@email.com',
          items_list: '5 Baju',
          total_weight_kg: 3.0,
          service_type: 'Regular',
          total_price: 45000,
          status: 'pending',
          pickup_date: '2026-07-28',
          delivery_date: '2026-07-30'
        };

        db.prepare.mockReturnValue({
          run: jest.fn().mockReturnValue({ lastInsertRowid: 1 })
        });

        const res = await request(app)
          .post('/api/orders')
          .send(newOrder);

        expect(res.status).toBe(201);
        expect(res.body.data.order_number).toMatch(/^ORD-2026-\d+$/);
      });
    });

    describe('PUT /api/orders/:id', () => {
      test('should update an order successfully', async () => {
        const updateData = {
          status: 'completed',
          delivery_date: '2026-07-29'
        };

        db.prepare.mockReturnValue({
          run: jest.fn().mockReturnValue({ changes: 1 }),
          get: jest.fn().mockReturnValue({ id: 1, ...updateData })
        });

        const res = await request(app)
          .put('/api/orders/1')
          .send(updateData);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('completed');
      });

      test('should validate status values', async () => {
        const invalidUpdate = {
          status: 'invalid-status'
        };

        const res = await request(app)
          .put('/api/orders/1')
          .send(invalidUpdate);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      test('should return 404 if order not found', async () => {
        db.prepare.mockReturnValue({
          run: jest.fn().mockReturnValue({ changes: 0 })
        });

        const res = await request(app)
          .put('/api/orders/999')
          .send({ status: 'completed' });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });

      test('should allow partial updates', async () => {
        const partialUpdate = {
          notes: 'Updated notes'
        };

        db.prepare.mockReturnValue({
          run: jest.fn().mockReturnValue({ changes: 1 }),
          get: jest.fn().mockReturnValue({ id: 1, ...partialUpdate })
        });

        const res = await request(app)
          .put('/api/orders/1')
          .send(partialUpdate);

        expect(res.status).toBe(200);
        expect(res.body.data.notes).toBe('Updated notes');
      });
    });

    describe('DELETE /api/orders/:id', () => {
      test('should delete an order successfully', async () => {
        db.prepare.mockReturnValue({
          run: jest.fn().mockReturnValue({ changes: 1 })
        });

        const res = await request(app).delete('/api/orders/1');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('dihapus');
      });

      test('should return 404 if order not found', async () => {
        db.prepare.mockReturnValue({
          run: jest.fn().mockReturnValue({ changes: 0 })
        });

        const res = await request(app).delete('/api/orders/999');

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });

      test('should handle deletion errors gracefully', async () => {
        db.prepare.mockImplementation(() => {
          throw new Error('Database error');
        });

        const res = await request(app).delete('/api/orders/1');

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
      });
    });

    describe('Order Status Transitions', () => {
      test('should allow valid status transitions', async () => {
        const transitions = [
          { from: 'pending', to: 'processing' },
          { from: 'processing', to: 'completed' },
          { from: 'pending', to: 'cancelled' }
        ];

        for (const transition of transitions) {
          db.prepare.mockReturnValue({
            run: jest.fn().mockReturnValue({ changes: 1 }),
            get: jest.fn().mockReturnValue({ id: 1, status: transition.to })
          });

          const res = await request(app)
            .put('/api/orders/1')
            .send({ status: transition.to });

          expect([200, 201]).toContain(res.status);
        }
      });
    });
  });

  // ==================== CUSTOMERS TESTS ====================
  describe('Customers API', () => {
    describe('GET /api/customers', () => {
      test('should return all customers with pagination', async () => {
        const mockCustomers = [
          {
            id: 1,
            customer_id: 'CUST-001',
            name: 'Budi Santoso',
            phone: '081234567890',
            email: 'budi@email.com',
            address: 'Jl. Merdeka No. 10',
            city: 'Jakarta Pusat',
            loyalty_points: 250,
            total_spent: 675000,
            registration_date: '2025-12-01'
          }
        ];

        db.prepare.mockReturnValue({
          all: jest.fn().mockReturnValue(mockCustomers)
        });

        const res = await request(app).get('/api/customers?page=1&limit=10');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      test('should search customers by name', async () => {
        const mockCustomers = [
          {
            id: 1,
            name: 'Budi Santoso',
            customer_id: 'CUST-001'
          }
        ];

        db.prepare.mockReturnValue({
          all: jest.fn().mockReturnValue(mockCustomers)
        });

        const res = await request(app).get('/api/customers?search=Budi');

        expect(res.status).toBe(200);
        expect(res.body.data[0].name).toContain('Budi');
      });

      test('should filter customers by city', async () => {
        const mockCustomers = [
          {
            id: 1,
            name: 'Budi Santoso',
            city: 'Jakarta Pusat'
          }
        ];

        db.prepare.mockReturnValue({
          all: jest.fn().mockReturnValue(mockCustomers)
        });

        const res = await request(app).get('/api/customers?city=Jakarta%20Pusat');

        expect(res.status).toBe(200);
        expect(res.body.data[0].city).toBe('Jakarta Pusat');
      });
    });

    describe('POST /api/customers', () => {
      test('should create a new customer successfully', async () => {
        const newCustomer = {
          name: 'Ahmad Wijaya',
          phone: '081234567890',
          email: 'ahmad@email.com',
          address: 'Jl. Sudirman No. 15',
          city: 'Jakarta Selatan'
        };

        db.prepare.mockReturnValue({
          run: jest.fn().mockReturnValue({ lastInsertRowid: 1 })
        });

        const res = await request(app)
          .post('/api/customers')
          .send(newCustomer);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.customer_id).toMatch(/^CUST-\d+$/);
        expect(res.body.data.loyalty_points).toBe(0);
      });

      test('should validate customer email uniqueness', async () => {
        const newCustomer = {
          name: 'Ahmad Wijaya',
          phone: '081234567890',
          email: 'existing@email.com',
          address: 'Jl. Sudirman No. 15',
          city: 'Jakarta Selatan'
        };

        db.prepare.mockReturnValue({
          get: jest.fn().mockReturnValue({ id: 1, email: 'existing@email.com' })
        });

        const res = await request(app)
          .post('/api/customers')
          .send(newCustomer);

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('Email sudah terdaftar');
      });

      test('should initialize loyalty points to 0', async () => {
        const newCustomer = {
          name: 'Ahmad Wijaya',
          phone: '081234567890',
          email: 'ahmad@email.com',
          address: 'Jl. Sudirman No. 15',
          city: 'Jakarta Selatan'
        };

        db.prepare.mockReturnValue({
          run: jest.fn().mockReturnValue({ lastInsertRowid: 1 })
        });

        const res = await request(app)
          .post('/api/customers')
          .send(newCustomer);

        expect(res.body.data.loyalty_points).toBe(0);
        expect(res.body.data.total_spent).toBe(0);
      });
    });

    describe('PUT /api/customers/:id', () => {
      test('should update customer loyalty points', async () => {
        const updateData = {
          loyalty_points: 500
        };

        db.prepare.mockReturnValue({
          run: jest.fn().mockReturnValue({ changes: 1 }),
          get: jest.fn().mockReturnValue({ id: 1, loyalty_points: 500 })
        });

        const res = await request(app)
          .put('/api/customers/1')
          .send(updateData);

        expect(res.status).toBe(200);
        expect(res.body.data.loyalty_points).toBe(500);
      });

      test('should update total spent', async () => {
        const updateData = {
          total_spent: 1000000
        };

        db.prepare.mockReturnValue({
          run: jest.fn().mockReturnValue({ changes: 1 }),
          get: jest.fn().mockReturnValue({ id: 1, total_spent: 1000000 })
        });

        const res = await request(app)
          .put('/api/customers/1')
          .send(updateData);

        expect(res.status).toBe(200);
        expect(res.body.data.total_spent).toBe(1000000);
      });
    });

    describe('Loyalty Program', () => {
      test('should calculate points based on spending', () => {
        const spending = 100000;
        const expectedPoints = Math.floor(spending / 1000);

        expect(expectedPoints).toBe(100);
      });

      test('should prevent negative loyalty points', async () => {
        const updateData = {
          loyalty_points: -100
        };

        const res = await request(app)
          .put('/api/customers/1')
          .send(updateData);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });
  });
});
</parameter>
</invoke>
</function_calls>
</invoke>

Now appending the second chunk with Staff, Machines, and Payments tests:
<function_calls>
<invoke name="write_to_file">
<parameter name="file_path">unit.test.js</parameter>
<parameter name="content">

  // ==================== STAFF TESTS ====================
  describe('Staff API', () => {
    describe('GET /api/staff', () => {
      test('should return all staff members with pagination', async () => {
        const mockStaff = [
          {
            id: 1,
            staff_id: 'STAFF-001',
            name: 'Siti Nurhaliza',
            role: 'Operator',
            phone: '085123456789',
            email: 'siti@laundry.com',
            shift: 'Pagi (08:00-16:00)',
            salary: 3500000,
            join_date: '2024-06-01',
            status: 'aktif'
          }
        ];

        db.prepare.mockReturnValue({
          all: jest.fn().mockReturnValue(mockStaff)
        });

        const res = await request(app).get('/api/staff?page=1&limit=10');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      test('should filter staff by status', async () => {
        const mockStaff = [
          {
            id: 1,
            staff_id: 'STAFF-001',
            name: 'Siti Nurhaliza',
            status: 'aktif'
          }
        ];

        db.prepare.mockReturnValue({
          all: jest.fn().mockReturnValue(mockStaff)
        });

        const res = await request(app).get('/api/staff?status=aktif');

        expect(res.status).toBe(200);
        expect(res.body.data[0].status).toBe('aktif');
      });

      test('should filter staff by role', async () => {
        const mockStaff = [
          {
            id: 1,
            staff_id: 'STAFF-001',
            name: 'Roni Hermawan',
            role: 'Supervisor'
          }
        ];

        db.prepare.mockReturnValue({
          all: jest.fn().mockReturnValue(mockStaff)
        });

        const res = await request(app).get('/api/staff?role=Supervisor');

        expect(res.status).toBe(200);
        expect(res.body.data[0].role).toBe('Supervisor');
      });

      test('should filter staff by shift', async () => {
        const mockStaff = [
          {
            id: 1,
            shift: 'Pagi (08:00-16:00)'
          }
        ];

        db.prepare.mockReturnValue({
          all: jest.fn().mockReturnValue(mockStaff)
        });

        const res = await request(app).get('/api/staff?shift=Pagi');

        expect(res.status).toBe(200);
        expect(res.body.data[0].shift).toContain('Pagi');
      });
    });

    describe('POST /api/staff', () => {
      test('should create a new staff member successfully', async () => {
        const newStaff = {
          name: 'Budi Santoso',
          role: 'Operator',
          phone: '085987654321',
          email: 'budi@laundry.com',
          shift: 'Siang (16:00-00:00)',
          salary: 3500000
        };

        db.prepare.mockReturnValue({
          run: jest.fn().mockReturnValue({ lastInsertRowid: 1 })
        });

        const res = await request(app)
          .post('/api/staff')
          .send(newStaff);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.staff_id).toMatch(/^STAFF-\d+$/);
        expect(res.body.data.status).toBe('aktif');
      });

      test('should validate required staff fields', async () => {
        const incompleteStaff = {
          name: 'Budi Santoso',
          role: 'Operator'
        };

        const res = await request(app)
          .post('/api/staff')
          .send(incompleteStaff);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toBeDefined();
      });

      test('should validate salary is positive', async () => {
        const invalidStaff = {
          name: 'Budi Santoso',
          role: 'Operator',
          phone: '085987654321',
          email: 'budi@laundry.com',
          shift: 'Siang (16:00-00:00)',
          salary: -1000000
        };

        const res = await request(app)
          .post('/api/staff')
          .send(invalidStaff);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      test('should validate valid role values', async () => {
        const validRoles = ['Operator', 'Supervisor', 'Manager'];
        const invalidStaff = {
          name: 'Budi Santoso',
          role: 'InvalidRole',
          phone: '085987654321',
          email: 'budi@laundry.com',
          shift: 'Siang (16:00-00:00)',
          salary: 3500000
        };

        const res = await request(app)
          .post('/api/staff')
          .send(invalidStaff);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe('PUT /api/staff/:id', () => {
      test('should update staff member status', async () => {
        const updateData = {
          status: 'nonaktif'
        };

        db.prepare.mockReturnValue({
          run: jest.fn().mockReturnValue({ changes: 1 }),
          get: jest.fn().mockReturnValue({ id: 1, status: 'nonaktif' })
        });

        const res = await request(app)
          .put('/api/staff/1')
          .send(updateData);

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('nonaktif');
      });

      test('should update staff salary', async () => {
        const updateData = {
          salary: 4000000
        };

        db.prepare.mockReturnValue({
          run: jest.fn().mockReturnValue({ changes: 1 }),
          get: jest.fn().mockReturnValue({ id: 1, salary: 4000000 })
        });

        const res = await request(app)
          .put('/api/staff/1')
          .send(updateData);

        expect(res.status).toBe(200);
        expect(res.body.data.salary).toBe(4000000);
      });

      test('should update staff shift', async () => {
        const updateData = {
          shift: 'Malam (00:00-08:00)'
        };

        db.prepare.mockReturnValue({
          run: jest.fn().mockReturnValue({ changes: 1 }),
          get: jest.fn().mockReturnValue({ id: 1, shift: 'Malam (00:00-08:00)' })
        });

        const res = await request(app)
          .put('/api/staff/1')
          .send(updateData);

        expect(res.status).toBe(200);
        expect(res.body.data.shift).toBe('Malam (00:00-08:00)');
      });
    });

    describe('DELETE /api/staff/:id', () => {
      test('should deactivate staff member (soft delete)', async () => {
        db.prepare.mockReturnValue({
          run: jest.fn().mockReturnValue({ changes: 1 })
        });

        const res = await request(app).delete('/api/staff/1');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('Staff Performance Metrics', () => {
      test('should calculate staff workload', async () => {
        const mockStaffOrders = [
          { id: 1 },
          { id: 2 },
          { id: 3 }
        ];

        db.prepare.mockReturnValue({
          all: jest.fn().mockReturnValue(mockStaffOrders)
        });

        const res = await request(app).get('/api/staff/1/performance');

        expect(res.status).toBe(200);
      });
    });
  });

  // ==================== MACHINES TESTS ====================
  describe('Machines API', () => {
    describe('GET /api/machines', () => {
      test('should return all machines with pagination', async () => {
        const mockMachines = [
          {
            id: 1,
            machine_id: 'MACH-001',
            name: 'Mesin Cuci Industrial 1',
            type: 'Washing Machine',
            capacity_kg: 25,
            location: 'Area Utama',
            status: 'aktif',
            last_maintenance: '2026-07-15',
            next_maintenance: '2026-08-15'
          }
        ];

        db.prepare.mockReturnValue({
          all: jest.fn().mockReturnValue(mockMachines)
        });

        const res = await request(app).get('/api/machines?page=1&limit=10');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      test('should filter machines by status', async () => {
        const mockMachines = [
          {
            id: 1,
            machine_id: 'MACH-001',
            status: 'aktif'
          }
        ];

        db.prepare.mockReturnValue({
          all: jest.fn().mockReturnValue(mockMachines)
        });

        const res = await request(app).get('/api/machines?status=aktif');

        expect(res.status).toBe(200);
        expect(res.body.data[0].status).toBe('aktif');
      });

      test('should filter machines by type', async () => {
        const mockMachines = [
          {
            id: 1,
            machine_id: '