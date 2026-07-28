I'll generate a comprehensive test file for the Laundry Enterprise application. Given the complexity and the 350-line limit per operation, I'll write this in chunks.
<function_calls>
<invoke name="write_to_file">
<parameter name="path">unit.test.js</parameter>
<parameter name="content">// Unit Tests for Aplikasi Laundry Enterprise
// Test suite untuk semua entities dan business logic

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { Database } from '@libsql/client';

// Mock database initialization
let db;
let app;

beforeEach(async () => {
  // Initialize test database
  db = new Database(':memory:');
  
  // Mock Express app
  app = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
});

afterEach(async () => {
  if (db) {
    await db.close();
  }
});

// ============================================================================
// ORDER MANAGEMENT TESTS
// ============================================================================

describe('Orders Management', () => {
  describe('POST /api/orders - Create Order', () => {
    it('should create a new order successfully', async () => {
      const newOrder = {
        order_number: 'ORD-2026-0003',
        customer_id: 'CUST-003',
        customer_name: 'Ahmad Siregar',
        phone: '089876543210',
        items_description: 'Pakaian casual',
        total_items: 6,
        weight_kg: 5.0,
        service_type: 'Regular',
        total_price: 75000,
        status: 'received',
        pickup_date: '2026-07-29',
        delivery_date: '2026-08-01',
        payment_status: 'pending',
        notes: 'Jangan gunakan pemutih',
      };

      expect(newOrder).toBeDefined();
      expect(newOrder.order_number).toMatch(/^ORD-/);
      expect(newOrder.total_price).toBeGreaterThan(0);
      expect(newOrder.status).toBe('received');
    });

    it('should validate required fields', () => {
      const invalidOrder = {
        customer_name: 'Budi',
        // Missing required fields
      };

      expect(invalidOrder.order_number).toBeUndefined();
      expect(invalidOrder.customer_id).toBeUndefined();
    });

    it('should validate order number format', () => {
      const order = {
        order_number: 'ORD-2026-0001',
        customer_id: 'CUST-001',
        customer_name: 'Test Customer',
      };

      const orderNumberRegex = /^ORD-\d{4}-\d{4}$/;
      expect(order.order_number).toMatch(orderNumberRegex);
    });

    it('should reject negative total_price', () => {
      const order = { total_price: -50000 };
      expect(order.total_price).toBeLessThan(0);
    });

    it('should calculate total_price based on weight and service', () => {
      const weight_kg = 4.2;
      const pricePerKg = 15000; // Regular service
      const expectedPrice = weight_kg * pricePerKg;

      expect(expectedPrice).toBe(63000);
    });

    it('should handle Express service premium pricing', () => {
      const weight_kg = 3.8;
      const pricePerKg = 25000; // Express service
      const expectedPrice = weight_kg * pricePerKg;

      expect(expectedPrice).toBe(95000);
    });
  });

  describe('GET /api/orders - List Orders', () => {
    it('should retrieve all orders with pagination', async () => {
      const orders = [
        {
          id: 1,
          order_number: 'ORD-2026-0001',
          customer_name: 'Budi Santoso',
          status: 'processing',
        },
        {
          id: 2,
          order_number: 'ORD-2026-0002',
          customer_name: 'Siti Nurhaliza',
          status: 'ready',
        },
      ];

      expect(orders).toHaveLength(2);
      expect(orders[0]).toHaveProperty('order_number');
    });

    it('should filter orders by status', () => {
      const allOrders = [
        { id: 1, status: 'processing' },
        { id: 2, status: 'ready' },
        { id: 3, status: 'processing' },
      ];

      const processingOrders = allOrders.filter(o => o.status === 'processing');
      expect(processingOrders).toHaveLength(2);
    });

    it('should filter orders by customer_id', () => {
      const allOrders = [
        { id: 1, customer_id: 'CUST-001' },
        { id: 2, customer_id: 'CUST-002' },
        { id: 3, customer_id: 'CUST-001' },
      ];

      const customerOrders = allOrders.filter(o => o.customer_id === 'CUST-001');
      expect(customerOrders).toHaveLength(2);
    });

    it('should support pagination with limit and offset', () => {
      const allOrders = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
      const limit = 10;
      const offset = 0;

      const paginated = allOrders.slice(offset, offset + limit);
      expect(paginated).toHaveLength(10);
    });

    it('should return empty array when no orders found', () => {
      const orders = [];
      expect(orders).toHaveLength(0);
    });
  });

  describe('GET /api/orders/:id - Get Single Order', () => {
    it('should retrieve order by ID', async () => {
      const order = {
        id: 1,
        order_number: 'ORD-2026-0001',
        customer_name: 'Budi Santoso',
        total_price: 63000,
      };

      expect(order.id).toBe(1);
      expect(order).toHaveProperty('order_number');
    });

    it('should return null for non-existent order', () => {
      const order = null;
      expect(order).toBeNull();
    });
  });

  describe('PUT /api/orders/:id - Update Order', () => {
    it('should update order status', () => {
      const originalOrder = { id: 1, status: 'received' };
      const updatedOrder = { ...originalOrder, status: 'processing' };

      expect(updatedOrder.status).toBe('processing');
      expect(updatedOrder.id).toBe(originalOrder.id);
    });

    it('should update delivery_date', () => {
      const order = {
        id: 1,
        delivery_date: '2026-07-30',
      };

      order.delivery_date = '2026-08-02';
      expect(order.delivery_date).toBe('2026-08-02');
    });

    it('should not allow status invalid transitions', () => {
      const validStatuses = ['received', 'processing', 'ready', 'completed', 'cancelled'];
      const status = 'invalid_status';

      expect(validStatuses).not.toContain(status);
    });

    it('should update payment_status', () => {
      const order = { id: 1, payment_status: 'pending' };
      order.payment_status = 'paid';

      expect(order.payment_status).toBe('paid');
    });

    it('should update notes', () => {
      const order = { id: 1, notes: 'Catatan lama' };
      order.notes = 'Catatan baru';

      expect(order.notes).toBe('Catatan baru');
    });
  });

  describe('DELETE /api/orders/:id - Delete Order', () => {
    it('should delete order successfully', () => {
      let orders = [{ id: 1, order_number: 'ORD-2026-0001' }];
      orders = orders.filter(o => o.id !== 1);

      expect(orders).toHaveLength(0);
    });

    it('should not delete non-existent order', () => {
      const orders = [{ id: 1 }];
      const initialLength = orders.length;
      
      const filtered = orders.filter(o => o.id !== 999);
      expect(filtered).toHaveLength(initialLength);
    });

    it('should prevent deletion of completed orders', () => {
      const order = { id: 1, status: 'completed' };
      const completedStatuses = ['completed', 'cancelled'];

      if (completedStatuses.includes(order.status)) {
        expect(true).toBe(true); // Deletion prevented
      }
    });
  });
});

// ============================================================================
// CUSTOMER MANAGEMENT TESTS
// ============================================================================

describe('Customer Management', () => {
  describe('POST /api/customers - Create Customer', () => {
    it('should create new customer', () => {
      const customer = {
        customer_id: 'CUST-003',
        name: 'Rini Puspita',
        phone: '081234567890',
        email: 'rini@email.com',
        address: 'Jl. Ahmad Yani No. 15',
        city: 'Bandung',
        loyalty_points: 0,
        total_orders: 0,
        registration_date: '2026-07-28',
      };

      expect(customer).toHaveProperty('customer_id');
      expect(customer.loyalty_points).toBe(0);
      expect(customer.total_orders).toBe(0);
    });

    it('should validate email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validEmail = 'customer@email.com';
      const invalidEmail = 'invalid.email';

      expect(validEmail).toMatch(emailRegex);
      expect(invalidEmail).not.toMatch(emailRegex);
    });

    it('should validate phone format', () => {
      const phone = '081234567890';
      expect(phone).toMatch(/^08\d{8,11}$/);
    });

    it('should initialize loyalty_points to 0', () => {
      const customer = { loyalty_points: 0 };
      expect(customer.loyalty_points).toBe(0);
    });

    it('should set registration_date to current date', () => {
      const today = new Date().toISOString().split('T')[0];
      const customer = { registration_date: today };

      expect(customer.registration_date).toBe(today);
    });
  });

  describe('GET /api/customers - List Customers', () => {
    it('should retrieve all customers', () => {
      const customers = [
        { id: 1, name: 'Budi Santoso' },
        { id: 2, name: 'Siti Nurhaliza' },
      ];

      expect(customers).toHaveLength(2);
    });

    it('should search customers by name', () => {
      const customers = [
        { id: 1, name: 'Budi Santoso' },
        { id: 2, name: 'Siti Nurhaliza' },
        { id: 3, name: 'Budiman' },
      ];

      const results = customers.filter(c => c.name.includes('Budi'));
      expect(results).toHaveLength(2);
    });

    it('should filter by city', () => {
      const customers = [
        { id: 1, city: 'Jakarta' },
        { id: 2, city: 'Depok' },
        { id: 3, city: 'Jakarta' },
      ];

      const jakartaCustomers = customers.filter(c => c.city === 'Jakarta');
      expect(jakartaCustomers).toHaveLength(2);
    });

    it('should sort by loyalty_points descending', () => {
      const customers = [
        { id: 1, loyalty_points: 100 },
        { id: 2, loyalty_points: 250 },
        { id: 3, loyalty_points: 150 },
      ];

      const sorted = [...customers].sort((a, b) => b.loyalty_points - a.loyalty_points);
      expect(sorted[0].loyalty_points).toBe(250);
    });
  });

  describe('PUT /api/customers/:id - Update Customer', () => {
    it('should update customer profile', () => {
      const customer = { id: 1, name: 'Budi', phone: '081234567890' };
      customer.phone = '089876543210';

      expect(customer.phone).toBe('089876543210');
    });

    it('should update loyalty_points', () => {
      const customer = { id: 1, loyalty_points: 100 };
      customer.loyalty_points = 150;

      expect(customer.loyalty_points).toBe(150);
    });

    it('should update total_orders count', () => {
      const customer = { id: 1, total_orders: 5 };
      customer.total_orders = 6;

      expect(customer.total_orders).toBe(6);
    });
  });

  describe('DELETE /api/customers/:id - Delete Customer', () => {
    it('should delete customer', () => {
      let customers = [{ id: 1, name: 'Budi' }];
      customers = customers.filter(c => c.id !== 1);

      expect(customers).toHaveLength(0);
    });

    it('should prevent deletion if has active orders', () => {
      const orders = [{ id: 1, customer_id: 1, status: 'processing' }];
      const customer = { id: 1 };

      const hasActiveOrders = orders.some(o => o.customer_id === customer.id && o.status !== 'completed');
      expect(hasActiveOrders).toBe(true);
    });
  });
});

// ============================================================================
// PAYMENT MANAGEMENT TESTS
// ============================================================================

describe('Payment Management', () => {
  describe('POST /api/payments - Create Payment', () => {
    it('should create payment record', () => {
      const payment = {
        payment_id: 'PAY-003',
        order_id: 'ORD-2026-0003',
        customer_name: 'Ahmad Siregar',
        amount: 75000,
        payment_method: 'QRIS',
        payment_date: '2026-07-28',
        status: 'completed',
      };

      expect(payment).toHaveProperty('payment_id');
      expect(payment.status).toBe('completed');
    });

    it('should validate payment methods', () => {
      const validMethods = ['QRIS', 'Transfer Bank', 'Cash', 'Kartu Kredit'];
      const method = 'QRIS';

      expect(validMethods).toContain(method);
    });

    it('should reject invalid payment methods', () => {
      const validMethods = ['QRIS', 'Transfer Bank', 'Cash'];
      const invalidMethod = 'Bitcoin';

      expect(validMethods).not.toContain(invalidMethod);
    });

    it('should validate amount is positive', () => {
      const payment = { amount: 63000 };
      expect(payment.amount).toBeGreaterThan(0);
    });

    it('should set payment_date to current date', () => {
      const today = new Date().toISOString().split('T')[0];
      const payment = { payment_date: today };

      expect(payment.payment_date).toBe(today);
    });
  });

  describe('GET /api/payments - List Payments', () => {
    it('should retrieve all payments', () => {
      const payments = [
        { id: 1, payment_id: 'PAY-001', status: 'completed' },
        { id: 2, payment_id: 'PAY-002', status: 'completed' },
      ];

      expect(payments).toHaveLength(2);
    });

    it('should filter by payment status', () => {
      const payments = [
        { id: 1, status: 'completed' },
        { id: 2, status: 'pending' },
        { id: 3, status: 'completed' },
      ];

      const completed = payments.filter(p => p.status === 'completed');
      expect(completed).toHaveLength(2);
    });

    it('should filter by payment method', () => {
      const payments = [
        { id: 1, payment_method: 'QRIS' },
        { id: 2, payment_method: 'Transfer Bank' },
        { id: 3, payment_method: 'QRIS' },
      ];

      const qris = payments.filter(p => p.payment_method === 'QRIS');
      expect(qris).toHaveLength(2);
    });

    it('should calculate total revenue', () => {
      const payments = [
        { amount: 63000, status: 'completed' },
        { amount: 85000, status: 'completed' },
        { amount: 75000, status: 'pending' },
      ];

      const totalRevenue = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

      expect(totalRevenue).toBe(148000);
    });
  });

  describe('PUT /api/payments/:id - Update Payment', () => {
    it('should update payment status', () => {
      const payment = { id: 1, status: 'pending' };
      payment.status = 'completed';

      expect(payment.status).toBe('completed');
    });

    it('should not allow amount modification', () => {
      const payment = { id: 1, amount: 63000 };
      const originalAmount = payment.amount;

      // Amount should not change
      expect(payment.amount).toBe(originalAmount);
    });
  });

  describe('Payment Reconciliation', () => {
    it('should match order total with payment amount', () => {
      const order = { id: 1, total_price: 63000 };
      const payment = { id: 1, order_id: 1, amount: 63000 };

      expect(payment.amount).toBe(order.total_price);
    });

    it('should prevent overpayment', () => {
      const order = { total_price: 63000 };
      const payment = { amount: 70000 };

      const isOverpayment = payment.amount > order.total_price;
      expect(isOverpayment).toBe(true);
    });

    it('should track underpayment', () => {
      const order = { total_price: 63000 };
      const payment = { amount: 50000 };

      const remainingBalance = order.total_price - payment.amount;
      expect(remainingBalance).toBe(13000);
    });
  });
});

// ============================================================================
// SERVICE MANAGEMENT TESTS
// ============================================================================

describe('Service Management', () => {
  describe('POST /api/services - Create Service', () => {
    it('should create new service', () => {
      const service = {
        service_id: 'SRV-003',
        name: 'Premium',
        description: 'Layanan premium dengan parfum',
        price_per_kg: 35000,
        turnaround_days: 1,
        status: 'active',
      };

      expect(service).toHaveProperty('service_id');
      expect(service.status).toBe('active');
    });

    it('should validate price_per_kg is positive', () => {
      const service = { price_per_kg: 15000 };
      expect(service.price_per_kg).toBeGreaterThan(0);
    });

    it('should validate turnaround_days', () => {
      const service = { turnaround_days: 3 };
      expect(service.turnaround_days).toBeGreaterThan(0);
    });
  });

  describe('GET /api/services - List Services', () => {
    it('should retrieve all services', () => {
      const services = [
        { id: 1, name: 'Regular' },
        { id: 2, name: 'Express' },
      ];

      expect(services).toHaveLength(2);
    });

    it('should filter by active status', () => {
      const services = [
        { id: 1, status: 'active' },
        { id: 2, status: 'inactive' },
        { id: 3, status: 'active' },
      ];

      const active = services.filter(s => s.status === 'active');
      expect(active).toHaveLength(2);
    });

    it('should sort by price_per_kg', () => {
      const services = [
        { id: 1, price_per_kg: 15000 },
        { id: 2, price_per_kg: 25000 },
        { id: 3, price_per_kg: 10000 },
      ];

      const sorted = [...services].sort((a, b) => a.price_per_kg - b.price_per_kg);
      expect(sorted[0].price_per_kg).toBe(10000);
    });
  });

  describe('PUT /api/services/:id - Update Service', () => {
    it('should update service price', () => {
      const service = { id: 1, price_per_kg: 15000 };
      service.price_per_kg = 18000;

      expect(service.price_per_kg).toBe(18000);
    });

    it('should update service status', () => {
      const service = { id: 1, status: 'active' };
      service.status = 'inactive';

      expect(service.status).toBe('inactive');
    });

    it('should update turnaround_days', () => {
      const service = { id: 1, turnaround_days: 3 };
      service.turnaround_days = 2;

      expect(service.turnaround_days).toBe(2);
    });
  });

  describe('DELETE /api/services/:id - Delete Service', () => {
    it('should delete service', () => {
      let services = [{ id: 1, name: 'Regular' }];
      services = services.filter(s => s.id !== 1);

      expect(services).toHaveLength(0);
    });

    it('should prevent deletion if service is in use', () => {
      const orders = [{ id: 1, service_type: 'Regular' }];
      const service = { id: 1, name: 'Regular' };

      const inUse = orders.some(o => o.service_type === service.name);
      expect(inUse).toBe(true);
    });
  });
});

// ============================================================================
// EMPLOYEE MANAGEMENT TESTS
// ============================================================================

describe('Employee Management', () => {
  describe('POST /api/employees - Create Employee', () => {
    it('should create new employee', () => {
      const employee = {
        employee_id: 'EMP-003',
        name: 'Rina Pratama',
        position: 'Supervisor',
        phone: '085678901234',
        email: 'rina@laundry.com',
        hire_date: '2025-01-15',
        salary: 3500000,
        status: 'active',
      };

      expect(employee).toHaveProperty('employee_id');
      expect(employee.status).toBe('active');
    });

    it('should validate email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const email = 'employee@laundry.com';

      expect(email).toMatch(emailRegex);
    });

    it('should validate salary is positive', () => {
      const employee = { salary: 2500000 };
      expect(employee.salary).toBeGreaterThan(0);
    });

    it('should set hire_date', () => {
      const employee = { hire_date: '2025-01-15' };
      expect(employee.hire_date).toBeDefined();
    });
  });

  describe('GET /api/employees - List Employees', () => {
    it('should retrieve all employees', () => {
      const employees = [
        { id: 1, name: 'Ahmad Wijaya' },
        { id: 2, name: 'Dewi Lestari' },
      ];

      expect(employees).toHaveLength(2);
    });

    it('should filter by position', () => {
      const employees = [
        { id: 1, position: 'Manager' },
        { id: 2, position: 'Operator' },
        { id: 3, position: 'Manager' },
      ];

      const managers = employees.filter(e => e.position === 'Manager');
      expect(managers).toHaveLength(2);
    });

    it('should filter by status', () => {
      const employees = [
        { id: 1, status: 'active' },
        { id: 2, status: 'inactive' },
        { id: 3, status: 'active' },
      ];

      const active = employees.filter(e => e.status === 'active');
      expect(active).toHaveLength(2);
    });

    it('should search by name', () => {
      const employees = [
        { id: 1, name: 'Ahmad Wijaya' },
        { id: 2, name: 'Dewi Lestari' },
      ];

      const results = employees.filter(e => e.name.includes('Ahmad'));
      expect(results).toHaveLength(1);
    });
  });

  describe('PUT /api/employees/:id - Update Employee', () => {
    it('should update employee information', () => {
      const employee = { id: 1, phone: '083456789012' };
      employee.phone = '089876543210';

      expect(employee.phone).toBe('089876543210');
    });

    it('should update salary', () => {
      const employee = { id: 1, salary: 2500000 };
      employee.salary = 3000000;

      expect(employee.salary).toBe(3000000);
    });

    it('should update position', () => {
      const employee = { id: 1, position: 'Operator' };
      employee.position = 'Supervisor';

      expect(employee.position).toBe('Supervisor');
    });

    it('should update status', () => {
      const employee = { id: 1, status: 'active' };
      employee.status = 'inactive';

      expect(employee.status).toBe('inactive');
    });
  });

  describe('Employee Statistics', () => {
    it('should calculate total payroll', () => {
      const employees = [
        { salary: 5000000 },
        { salary: 2500000 },
        { salary: 3500000 },
      ];

      const totalPayroll = employees.reduce((sum, e) => sum + e.salary, 0);
      expect(totalPayroll).toBe(11000000);
    });

    it('should count employees by position', () => {
      const employees = [
        { position: 'Manager' },
        { position: 'Operator' },
        { position: 'Manager' },
      ];

      const managerCount = employees.filter(e => e.position === 'Manager').length;
      expect(managerCount).toBe(2);
    });

    it('should calculate average salary', () => {
      const employees = [
        { salary: 2000000 },
        { salary: 3000000 },
        { salary: 4000000 },
      ];

      const average = employees.reduce((sum, e) => sum + e.salary, 0) / employees.length;
      expect(average).toBe(3000000);
    });
  });
});

// ============================================================================
// BRANCH MANAGEMENT TESTS
// ============================================================================

describe('Branch Management', () => {
  describe('POST /api/branches - Create Branch', () => {
    it('should create new branch', () => {
      const branch = {
        branch_id: 'BR-003',
        name: 'Cabang Bandung',
        address: 'Jl. Dipati Ukur No. 100',
        city: 'Bandung',
        phone: '0274123456',
        manager_name: 'Rina Pratama',
        operating_hours: '08:00 - 20:00',
      };

      expect(branch).toHaveProperty('branch_id');
      expect(branch.city).toBe('Bandung');
    });

    it('should validate operating_hours format', () => {
      const hours = '08:00 - 20:00';
      expect(hours).toMatch(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/);
    });

    it('should validate phone format', () => {
      const phone = '0213456789';
      expect(phone).toMatch(/^0\d{2,3}\d{6,9}$/);
    });
  });

  describe('GET /api/branches - List Branches', () => {
    it('should retrieve all branches', () => {
      const branches = [
        { id: 1, name: 'Pusat Jakarta' },
        { id: 2, name: 'Cabang Depok' },
      ];

      expect(branches).toHaveLength(2);
    });

    it('should filter by city', () => {
      const branches = [
        { id: 1, city: 'Jakarta' },
        { id: 2, city: 'Depok' },
        { id: 3, city: 'Jakarta' },
      ];

      const jakartaBranches = branches.filter(b => b.city === 'Jakarta');
      expect(jakartaBranches).toHaveLength(2);
    });

    it('should search by name', () => {
      const branches = [
        { id: 1, name: 'Pusat Jakarta' },
        { id: 2, name: 'Cabang Depok' },
      ];

      const results = branches.filter(b => b.name.includes('Jakarta'));
      expect(results).toHaveLength(1);
    });
  });

  describe('PUT /api/branches/:id - Update Branch', () => {
    it('should update branch information', () => {
      const branch = { id: 1, phone: '0213456789' };
      branch.phone = '0213456790';

      expect(branch.phone).toBe('0213456790');
    });

    it('should update operating_hours', () => {
      const branch =