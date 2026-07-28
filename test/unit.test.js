I'll generate comprehensive unit tests for the Laundry Enterprise application. Let me create the test file in chunks.
<function_calls>
<invoke name="write_to_file">
<parameter name="path">unit.test.js</parameter>
<parameter name="content">const request = require('supertest');
const { describe, it, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const app = require('../src/app');
const { db } = require('../src/database');

// Mock database
jest.mock('../src/database', () => ({
  db: {
    execute: jest.fn(),
    query: jest.fn(),
  }
}));

describe('Laundry Enterprise API Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ============================================
  // ORDER MANAGEMENT TESTS
  // ============================================
  
  describe('Order Management', () => {
    
    describe('POST /api/orders - Create Order', () => {
      it('should create a new order with valid data', async () => {
        const orderData = {
          order_number: 'ORD-003',
          customer_id: 'CUST-001',
          customer_name: 'Budi Santoso',
          phone: '081234567890',
          items_count: 12,
          weight_kg: 4.5,
          service_type: 'Regular',
          total_price: 67500,
          status: 'pending',
          pickup_date: '2026-07-28',
          delivery_date: '2026-07-30',
          assigned_staff: 'Ahmad',
          notes: 'Jangan pemutihan'
        };

        db.execute.mockResolvedValueOnce({ lastID: 3 });

        const response = await request(app)
          .post('/api/orders')
          .send(orderData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.order_number).toBe('ORD-003');
        expect(response.body.status).toBe('pending');
        expect(db.execute).toHaveBeenCalled();
      });

      it('should return 400 when required fields are missing', async () => {
        const incompleteOrder = {
          order_number: 'ORD-003',
          customer_id: 'CUST-001'
        };

        const response = await request(app)
          .post('/api/orders')
          .send(incompleteOrder)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('required');
      });

      it('should validate weight_kg is a positive number', async () => {
        const orderData = {
          order_number: 'ORD-003',
          customer_id: 'CUST-001',
          customer_name: 'Budi Santoso',
          phone: '081234567890',
          items_count: 12,
          weight_kg: -5,
          service_type: 'Regular',
          total_price: 67500,
          status: 'pending',
          pickup_date: '2026-07-28',
          delivery_date: '2026-07-30',
          assigned_staff: 'Ahmad',
          notes: ''
        };

        const response = await request(app)
          .post('/api/orders')
          .send(orderData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should validate total_price is a positive number', async () => {
        const orderData = {
          order_number: 'ORD-003',
          customer_id: 'CUST-001',
          customer_name: 'Budi Santoso',
          phone: '081234567890',
          items_count: 12,
          weight_kg: 4.5,
          service_type: 'Regular',
          total_price: -1000,
          status: 'pending',
          pickup_date: '2026-07-28',
          delivery_date: '2026-07-30',
          assigned_staff: 'Ahmad',
          notes: ''
        };

        const response = await request(app)
          .post('/api/orders')
          .send(orderData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/orders - List Orders', () => {
      it('should return paginated list of orders', async () => {
        const mockOrders = [
          {
            id: 1,
            order_number: 'ORD-001',
            customer_name: 'Budi Santoso',
            status: 'processing',
            total_price: 82500
          },
          {
            id: 2,
            order_number: 'ORD-002',
            customer_name: 'Siti Nurhaliza',
            status: 'completed',
            total_price: 64000
          }
        ];

        db.query.mockResolvedValueOnce(mockOrders);

        const response = await request(app)
          .get('/api/orders?page=1&limit=10')
          .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(2);
        expect(response.body).toHaveProperty('pagination');
      });

      it('should filter orders by status', async () => {
        const mockOrders = [
          {
            id: 1,
            order_number: 'ORD-001',
            customer_name: 'Budi Santoso',
            status: 'processing',
            total_price: 82500
          }
        ];

        db.query.mockResolvedValueOnce(mockOrders);

        const response = await request(app)
          .get('/api/orders?status=processing')
          .expect(200);

        expect(response.body.data[0].status).toBe('processing');
      });

      it('should filter orders by customer_id', async () => {
        const mockOrders = [
          {
            id: 1,
            order_number: 'ORD-001',
            customer_id: 'CUST-001',
            customer_name: 'Budi Santoso',
            status: 'processing',
            total_price: 82500
          }
        ];

        db.query.mockResolvedValueOnce(mockOrders);

        const response = await request(app)
          .get('/api/orders?customer_id=CUST-001')
          .expect(200);

        expect(response.body.data[0].customer_id).toBe('CUST-001');
      });

      it('should return empty array when no orders match filter', async () => {
        db.query.mockResolvedValueOnce([]);

        const response = await request(app)
          .get('/api/orders?status=nonexistent')
          .expect(200);

        expect(response.body.data).toEqual([]);
      });
    });

    describe('GET /api/orders/:id - Get Single Order', () => {
      it('should return a single order by id', async () => {
        const mockOrder = {
          id: 1,
          order_number: 'ORD-001',
          customer_id: 'CUST-001',
          customer_name: 'Budi Santoso',
          phone: '081234567890',
          items_count: 15,
          weight_kg: 5.5,
          service_type: 'Regular',
          total_price: 82500,
          status: 'processing',
          pickup_date: '2026-07-28',
          delivery_date: '2026-07-30',
          assigned_staff: 'Ahmad',
          notes: 'Hindari pemutihan'
        };

        db.query.mockResolvedValueOnce([mockOrder]);

        const response = await request(app)
          .get('/api/orders/1')
          .expect(200);

        expect(response.body.id).toBe(1);
        expect(response.body.order_number).toBe('ORD-001');
      });

      it('should return 404 when order not found', async () => {
        db.query.mockResolvedValueOnce([]);

        const response = await request(app)
          .get('/api/orders/9999')
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('PUT /api/orders/:id - Update Order', () => {
      it('should update an existing order', async () => {
        const updateData = {
          status: 'completed',
          delivery_date: '2026-07-29'
        };

        db.query.mockResolvedValueOnce([{ id: 1 }]);
        db.execute.mockResolvedValueOnce({ changes: 1 });

        const response = await request(app)
          .put('/api/orders/1')
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(db.execute).toHaveBeenCalled();
      });

      it('should not allow invalid status values', async () => {
        const updateData = {
          status: 'invalid_status'
        };

        const response = await request(app)
          .put('/api/orders/1')
          .send(updateData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should return 404 when updating non-existent order', async () => {
        db.query.mockResolvedValueOnce([]);

        const response = await request(app)
          .put('/api/orders/9999')
          .send({ status: 'completed' })
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('DELETE /api/orders/:id - Delete Order', () => {
      it('should delete an order', async () => {
        db.query.mockResolvedValueOnce([{ id: 1 }]);
        db.execute.mockResolvedValueOnce({ changes: 1 });

        const response = await request(app)
          .delete('/api/orders/1')
          .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(db.execute).toHaveBeenCalled();
      });

      it('should return 404 when deleting non-existent order', async () => {
        db.query.mockResolvedValueOnce([]);

        const response = await request(app)
          .delete('/api/orders/9999')
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  // ============================================
  // CUSTOMER MANAGEMENT TESTS
  // ============================================
  
  describe('Customer Management', () => {
    
    describe('POST /api/customers - Create Customer', () => {
      it('should create a new customer with valid data', async () => {
        const customerData = {
          customer_id: 'CUST-003',
          name: 'Ahmad Suryanto',
          phone: '083456789012',
          email: 'ahmad.suryanto@email.com',
          address: 'Jl. Ahmad Yani No. 15',
          loyalty_points: 0,
          total_spent: 0,
          member_tier: 'Bronze',
          joined_date: '2026-07-28'
        };

        db.execute.mockResolvedValueOnce({ lastID: 3 });

        const response = await request(app)
          .post('/api/customers')
          .send(customerData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Ahmad Suryanto');
        expect(response.body.member_tier).toBe('Bronze');
      });

      it('should validate email format', async () => {
        const customerData = {
          customer_id: 'CUST-003',
          name: 'Ahmad Suryanto',
          phone: '083456789012',
          email: 'invalid-email',
          address: 'Jl. Ahmad Yani No. 15',
          loyalty_points: 0,
          total_spent: 0,
          member_tier: 'Bronze',
          joined_date: '2026-07-28'
        };

        const response = await request(app)
          .post('/api/customers')
          .send(customerData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should validate phone number format', async () => {
        const customerData = {
          customer_id: 'CUST-003',
          name: 'Ahmad Suryanto',
          phone: '12345',
          email: 'ahmad@email.com',
          address: 'Jl. Ahmad Yani No. 15',
          loyalty_points: 0,
          total_spent: 0,
          member_tier: 'Bronze',
          joined_date: '2026-07-28'
        };

        const response = await request(app)
          .post('/api/customers')
          .send(customerData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/customers - List Customers', () => {
      it('should return paginated list of customers', async () => {
        const mockCustomers = [
          {
            id: 1,
            customer_id: 'CUST-001',
            name: 'Budi Santoso',
            phone: '081234567890',
            member_tier: 'Gold',
            loyalty_points: 450
          },
          {
            id: 2,
            customer_id: 'CUST-002',
            name: 'Siti Nurhaliza',
            phone: '082345678901',
            member_tier: 'Silver',
            loyalty_points: 220
          }
        ];

        db.query.mockResolvedValueOnce(mockCustomers);

        const response = await request(app)
          .get('/api/customers?page=1&limit=10')
          .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(2);
      });

      it('should filter customers by member tier', async () => {
        const mockCustomers = [
          {
            id: 1,
            customer_id: 'CUST-001',
            name: 'Budi Santoso',
            member_tier: 'Gold',
            loyalty_points: 450
          }
        ];

        db.query.mockResolvedValueOnce(mockCustomers);

        const response = await request(app)
          .get('/api/customers?member_tier=Gold')
          .expect(200);

        expect(response.body.data[0].member_tier).toBe('Gold');
      });

      it('should search customers by name', async () => {
        const mockCustomers = [
          {
            id: 1,
            customer_id: 'CUST-001',
            name: 'Budi Santoso',
            member_tier: 'Gold'
          }
        ];

        db.query.mockResolvedValueOnce(mockCustomers);

        const response = await request(app)
          .get('/api/customers?search=Budi')
          .expect(200);

        expect(response.body.data[0].name).toContain('Budi');
      });
    });

    describe('PUT /api/customers/:id - Update Customer', () => {
      it('should update customer loyalty points', async () => {
        const updateData = {
          loyalty_points: 500
        };

        db.query.mockResolvedValueOnce([{ id: 1 }]);
        db.execute.mockResolvedValueOnce({ changes: 1 });

        const response = await request(app)
          .put('/api/customers/1')
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });

      it('should update customer tier based on total spent', async () => {
        const updateData = {
          total_spent: 5000000
        };

        db.query.mockResolvedValueOnce([{ id: 1 }]);
        db.execute.mockResolvedValueOnce({ changes: 1 });

        const response = await request(app)
          .put('/api/customers/1')
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });

      it('should not allow negative loyalty points', async () => {
        const updateData = {
          loyalty_points: -100
        };

        const response = await request(app)
          .put('/api/customers/1')
          .send(updateData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('DELETE /api/customers/:id - Delete Customer', () => {
      it('should delete a customer', async () => {
        db.query.mockResolvedValueOnce([{ id: 1 }]);
        db.execute.mockResolvedValueOnce({ changes: 1 });

        const response = await request(app)
          .delete('/api/customers/1')
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });
    });
  });

  // ============================================
  // STAFF MANAGEMENT TESTS
  // ============================================
  
  describe('Staff Management', () => {
    
    describe('POST /api/staff - Create Staff', () => {
      it('should create a new staff member', async () => {
        const staffData = {
          staff_id: 'STF-003',
          name: 'Rudi Hermawan',
          position: 'Courier',
          phone: '085456789012',
          email: 'rudi@laundry.com',
          salary: 3200000,
          hire_date: '2026-01-15',
          status: 'active'
        };

        db.execute.mockResolvedValueOnce({ lastID: 3 });

        const response = await request(app)
          .post('/api/staff')
          .send(staffData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Rudi Hermawan');
        expect(response.body.status).toBe('active');
      });

      it('should validate salary is positive', async () => {
        const staffData = {
          staff_id: 'STF-003',
          name: 'Rudi Hermawan',
          position: 'Courier',
          phone: '085456789012',
          email: 'rudi@laundry.com',
          salary: -1000000,
          hire_date: '2026-01-15',
          status: 'active'
        };

        const response = await request(app)
          .post('/api/staff')
          .send(staffData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should validate position field', async () => {
        const staffData = {
          staff_id: 'STF-003',
          name: 'Rudi Hermawan',
          position: '',
          phone: '085456789012',
          email: 'rudi@laundry.com',
          salary: 3200000,
          hire_date: '2026-01-15',
          status: 'active'
        };

        const response = await request(app)
          .post('/api/staff')
          .send(staffData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/staff - List Staff', () => {
      it('should return list of active staff', async () => {
        const mockStaff = [
          {
            id: 1,
            staff_id: 'STF-001',
            name: 'Ahmad Wijaya',
            position: 'Operator',
            status: 'active',
            salary: 3500000
          },
          {
            id: 2,
            staff_id: 'STF-002',
            name: 'Dewi Lestari',
            position: 'Quality Control',
            status: 'active',
            salary: 3750000
          }
        ];

        db.query.mockResolvedValueOnce(mockStaff);

        const response = await request(app)
          .get('/api/staff?status=active')
          .expect(200);

        expect(response.body.data.length).toBe(2);
        expect(response.body.data[0].status).toBe('active');
      });

      it('should filter staff by position', async () => {
        const mockStaff = [
          {
            id: 1,
            staff_id: 'STF-001',
            name: 'Ahmad Wijaya',
            position: 'Operator',
            status: 'active'
          }
        ];

        db.query.mockResolvedValueOnce(mockStaff);

        const response = await request(app)
          .get('/api/staff?position=Operator')
          .expect(200);

        expect(response.body.data[0].position).toBe('Operator');
      });
    });

    describe('PUT /api/staff/:id - Update Staff', () => {
      it('should update staff salary', async () => {
        const updateData = {
          salary: 4000000
        };

        db.query.mockResolvedValueOnce([{ id: 1 }]);
        db.execute.mockResolvedValueOnce({ changes: 1 });

        const response = await request(app)
          .put('/api/staff/1')
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });

      it('should update staff status', async () => {
        const updateData = {
          status: 'inactive'
        };

        db.query.mockResolvedValueOnce([{ id: 1 }]);
        db.execute.mockResolvedValueOnce({ changes: 1 });

        const response = await request(app)
          .put('/api/staff/1')
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });
    });

    describe('DELETE /api/staff/:id - Delete Staff', () => {
      it('should delete a staff member', async () => {
        db.query.mockResolvedValueOnce([{ id: 1 }]);
        db.execute.mockResolvedValueOnce({ changes: 1 });

        const response = await request(app)
          .delete('/api/staff/1')
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });
    });
  });
});
</parameter>
</invoke name="write_to_file">
<parameter name="path">unit.test.js</parameter>
<parameter name="append">true</parameter>
<parameter name="content">
  // ============================================
  // SERVICE MANAGEMENT TESTS
  // ============================================
  
  describe('Service Management', () => {
    
    describe('POST /api/services - Create Service', () => {
      it('should create a new service', async () => {
        const serviceData = {
          service_id: 'SVC-003',
          name: 'Premium Wash',
          price_per_kg: 25000,
          turnaround_days: 1,
          description: 'Cuci premium dengan kondisioner khusus',
          active: true
        };

        db.execute.mockResolvedValueOnce({ lastID: 3 });

        const response = await request(app)
          .post('/api/services')
          .send(serviceData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Premium Wash');
        expect(response.body.price_per_kg).toBe(25000);
      });

      it('should validate price_per_kg is positive', async () => {
        const serviceData = {
          service_id: 'SVC-003',
          name: 'Premium Wash',
          price_per_kg: -5000,
          turnaround_days: 1,
          description: 'Cuci premium',
          active: true
        };

        const response = await request(app)
          .post('/api/services')
          .send(serviceData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should validate turnaround_days is positive', async () => {
        const serviceData = {
          service_id: 'SVC-003',
          name: 'Premium Wash',
          price_per_kg: 25000,
          turnaround_days: 0,
          description: 'Cuci premium',
          active: true
        };

        const response = await request(app)
          .post('/api/services')
          .send(serviceData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/services - List Services', () => {
      it('should return all active services', async () => {
        const mockServices = [
          {
            id: 1,
            service_id: 'SVC-001',
            name: 'Regular Wash',
            price_per_kg: 15000,
            turnaround_days: 2,
            active: true
          },
          {
            id: 2,
            service_id: 'SVC-002',
            name: 'Express',
            price_per_kg: 20000,
            turnaround_days: 1,
            active: true
          }
        ];

        db.query.mockResolvedValueOnce(mockServices);

        const response = await request(app)
          .get('/api/services?active=true')
          .expect(200);

        expect(response.body.data.length).toBe(2);
        expect(response.body.data[0].active).toBe(true);
      });

      it('should return all services including inactive', async () => {
        const mockServices = [
          {
            id: 1,
            service_id: 'SVC-001',
            name: 'Regular Wash',
            active: true
          },
          {
            id: 3,
            service_id: 'SVC-003',
            name: 'Old Service',
            active: false
          }
        ];

        db.query.mockResolvedValueOnce(mockServices);

        const response = await request(app)
          .get('/api/services')
          .expect(200);

        expect(response.body.data.length).toBe(2);
      });
    });

    describe('PUT /api/services/:id - Update Service', () => {
      it('should update service price', async () => {
        const updateData = {
          price_per_kg: 18000
        };

        db.query.mockResolvedValueOnce([{ id: 1 }]);
        db.execute.mockResolvedValueOnce({ changes: 1 });

        const response = await request(app)
          .put('/api/services/1')
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });

      it('should deactivate a service', async () => {
        const updateData = {
          active: false
        };

        db.query.mockResolvedValueOnce([{ id: 1 }]);
        db.execute.mockResolvedValueOnce({ changes: 1 });

        const response = await request(app)
          .put('/api/services/1')
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });
    });

    describe('DELETE /api/services/:id - Delete Service', () => {
      it('should delete a service', async () => {
        db.query.mockResolvedValueOnce([{ id: 1 }]);
        db.execute.mockResolvedValueOnce({ changes: 1 });

        const response = await request(app)
          .delete('/api/services/1')
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });
    });
  });

  // ============================================
  // PAYMENT MANAGEMENT TESTS
  // ============================================
  
  describe('Payment Management', () => {
    
    describe('POST /api/payments - Create Payment', () => {
      it('should create a payment for an order', async () => {
        const paymentData = {
          payment_id: 'PAY-003',
          order_id: 'ORD-003',
          amount: 67500,
          payment_method: 'QRIS',
          status: 'pending',
          paid_date: '2026-07-28',
          reference: 'QRIS20260728003'
        };

        db.execute.mockResolvedValueOnce({ lastID: 3 });

        const response = await request(app)
          .post('/api/payments')
          .send(paymentData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.payment_method).toBe('QRIS');
        expect(response.body.status).toBe('pending');
      });

      it('should validate amount is positive', async () => {
        const paymentData = {
          payment_id: 'PAY-003',
          order_id: 'ORD-003',
          amount: -67500,
          payment_method: 'QRIS',
          status: 'pending',
          paid_date: '2026-07-28',
          reference: 'QRIS20260728003'
        };

        const response = await request(app)
          .post('/api/payments')
          .send(paymentData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should validate payment_method', async () => {
        const paymentData = {
          payment_id: 'PAY-003',
          order_id: 'ORD-003',
          amount: 67500,
          payment_method: 'InvalidMethod',
          status: 'pending',
          paid_date: '2026-07-28',
          reference: 'QRIS20260728003'
        };

        const response = await request(app)
          .post('/api/payments')
          .send(paymentData)
          .expect(400);

        expect(response.body).to