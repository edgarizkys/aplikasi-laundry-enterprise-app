// api/api.js - Laundry Enterprise API Client
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const getHeaders = (tenantId = 'default_tenant') => ({
  'Content-Type': 'application/json',
  'x-tenant-id': tenantId,
});

// ============================================================================
// ORDERS API
// ============================================================================

export const ordersAPI = {
  // Get all orders with pagination
  getAll: async (page = 1, limit = 20, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/orders?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch orders');
      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Get single order by ID
  getById: async (id, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: 'GET',
        headers: getHeaders(tenantId),
      });
      if (!response.ok) throw new Error('Failed to fetch order');
      return await response.json();
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  // Create new order
  create: async (data, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: getHeaders(tenantId),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create order');
      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Update order
  update: async (id, data, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: 'PUT',
        headers: getHeaders(tenantId),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update order');
      return await response.json();
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  // Delete order
  delete: async (id, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: 'DELETE',
        headers: getHeaders(tenantId),
      });
      if (!response.ok) throw new Error('Failed to delete order');
      return await response.json();
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  },

  // Get orders by status
  getByStatus: async (status, page = 1, limit = 20, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/orders/status/${status}?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch orders by status');
      return await response.json();
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      throw error;
    }
  },

  // Search orders
  search: async (query, page = 1, limit = 20, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/orders/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to search orders');
      return await response.json();
    } catch (error) {
      console.error('Error searching orders:', error);
      throw error;
    }
  },
};

// ============================================================================
// CUSTOMERS API
// ============================================================================

export const customersAPI = {
  // Get all customers with pagination
  getAll: async (page = 1, limit = 20, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/customers?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch customers');
      return await response.json();
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  // Get single customer by ID
  getById: async (id, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'GET',
        headers: getHeaders(tenantId),
      });
      if (!response.ok) throw new Error('Failed to fetch customer');
      return await response.json();
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },

  // Create new customer
  create: async (data, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: getHeaders(tenantId),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create customer');
      return await response.json();
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  // Update customer
  update: async (id, data, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'PUT',
        headers: getHeaders(tenantId),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update customer');
      return await response.json();
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  // Delete customer
  delete: async (id, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'DELETE',
        headers: getHeaders(tenantId),
      });
      if (!response.ok) throw new Error('Failed to delete customer');
      return await response.json();
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },

  // Get customer loyalty info
  getLoyalty: async (id, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${id}/loyalty`, {
        method: 'GET',
        headers: getHeaders(tenantId),
      });
      if (!response.ok) throw new Error('Failed to fetch loyalty info');
      return await response.json();
    } catch (error) {
      console.error('Error fetching loyalty info:', error);
      throw error;
    }
  },

  // Update loyalty points
  updateLoyalty: async (id, points, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${id}/loyalty`, {
        method: 'PUT',
        headers: getHeaders(tenantId),
        body: JSON.stringify({ points }),
      });
      if (!response.ok) throw new Error('Failed to update loyalty points');
      return await response.json();
    } catch (error) {
      console.error('Error updating loyalty points:', error);
      throw error;
    }
  },

  // Search customers
  search: async (query, page = 1, limit = 20, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/customers/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to search customers');
      return await response.json();
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  },
};

// ============================================================================
// STAFF API
// ============================================================================

export const staffAPI = {
  // Get all staff with pagination
  getAll: async (page = 1, limit = 20, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/staff?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch staff');
      return await response.json();
    } catch (error) {
      console.error('Error fetching staff:', error);
      throw error;
    }
  },

  // Get single staff by ID
  getById: async (id, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/${id}`, {
        method: 'GET',
        headers: getHeaders(tenantId),
      });
      if (!response.ok) throw new Error('Failed to fetch staff');
      return await response.json();
    } catch (error) {
      console.error('Error fetching staff:', error);
      throw error;
    }
  },

  // Create new staff
  create: async (data, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff`, {
        method: 'POST',
        headers: getHeaders(tenantId),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create staff');
      return await response.json();
    } catch (error) {
      console.error('Error creating staff:', error);
      throw error;
    }
  },

  // Update staff
  update: async (id, data, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/${id}`, {
        method: 'PUT',
        headers: getHeaders(tenantId),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update staff');
      return await response.json();
    } catch (error) {
      console.error('Error updating staff:', error);
      throw error;
    }
  },

  // Delete staff
  delete: async (id, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/${id}`, {
        method: 'DELETE',
        headers: getHeaders(tenantId),
      });
      if (!response.ok) throw new Error('Failed to delete staff');
      return await response.json();
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
  },

  // Get staff by role
  getByRole: async (role, page = 1, limit = 20, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/staff/role/${role}?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch staff by role');
      return await response.json();
    } catch (error) {
      console.error('Error fetching staff by role:', error);
      throw error;
    }
  },

  // Get staff performance metrics
  getPerformance: async (id, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/${id}/performance`, {
        method: 'GET',
        headers: getHeaders(tenantId),
      });
      if (!response.ok) throw new Error('Failed to fetch performance metrics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw error;
    }
  },
};

// ============================================================================
// MACHINES API
// ============================================================================

export const machinesAPI = {
  // Get all machines with pagination
  getAll: async (page = 1, limit = 20, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/machines?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch machines');
      return await response.json();
    } catch (error) {
      console.error('Error fetching machines:', error);
      throw error;
    }
  },

  // Get single machine by ID
  getById: async (id, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/machines/${id}`, {
        method: 'GET',
        headers: getHeaders(tenantId),
      });
      if (!response.ok) throw new Error('Failed to fetch machine');
      return await response.json();
    } catch (error) {
      console.error('Error fetching machine:', error);
      throw error;
    }
  },

  // Create new machine
  create: async (data, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/machines`, {
        method: 'POST',
        headers: getHeaders(tenantId),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create machine');
      return await response.json();
    } catch (error) {
      console.error('Error creating machine:', error);
      throw error;
    }
  },

  // Update machine
  update: async (id, data, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/machines/${id}`, {
        method: 'PUT',
        headers: getHeaders(tenantId),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update machine');
      return await response.json();
    } catch (error) {
      console.error('Error updating machine:', error);
      throw error;
    }
  },

  // Delete machine
  delete: async (id, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/machines/${id}`, {
        method: 'DELETE',
        headers: getHeaders(tenantId),
      });
      if (!response.ok) throw new Error('Failed to delete machine');
      return await response.json();
    } catch (error) {
      console.error('Error deleting machine:', error);
      throw error;
    }
  },

  // Update maintenance schedule
  updateMaintenance: async (id, data, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/machines/${id}/maintenance`, {
        method: 'PUT',
        headers: getHeaders(tenantId),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update maintenance');
      return await response.json();
    } catch (error) {
      console.error('Error updating maintenance:', error);
      throw error;
    }
  },

  // Get machines requiring maintenance
  getMaintenanceDue: async (page = 1, limit = 20, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/machines/maintenance/due?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch maintenance due');
      return await response.json();
    } catch (error) {
      console.error('Error fetching maintenance due:', error);
      throw error;
    }
  },
};

// ============================================================================
// PAYMENTS API
// ============================================================================

export const paymentsAPI = {
  // Get all payments with pagination
  getAll: async (page = 1, limit = 20, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/payments?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch payments');
      return await response.json();
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  // Get single payment by ID
  getById: async (id, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
        method: 'GET',
        headers: getHeaders(tenantId),
      });
      if (!response.ok) throw new Error('Failed to fetch payment');
      return await response.json();
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  },

  // Create new payment
  create: async (data, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: getHeaders(tenantId),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create payment');
      return await response.json();
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  // Update payment
  update: async (id, data, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
        method: 'PUT',
        headers: getHeaders(tenantId),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update payment');
      return await response.json();
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  },

  // Delete payment
  delete: async (id, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
        method: 'DELETE',
        headers: getHeaders(tenantId),
      });
      if (!response.ok) throw new Error('Failed to delete payment');
      return await response.json();
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  },

  // Get payments by status
  getByStatus: async (status, page = 1, limit = 20, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/payments/status/${status}?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch payments by status');
      return await response.json();
    } catch (error) {
      console.error('Error fetching payments by status:', error);
      throw error;
    }
  },

  // Get payments by method
  getByMethod: async (method, page = 1, limit = 20, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/payments/method/${method}?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch payments by method');
      return await response.json();
    } catch (error) {
      console.error('Error fetching payments by method:', error);
      throw error;
    }
  },

  // Verify payment
  verify: async (paymentId, data, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/verify`, {
        method: 'POST',
        headers: getHeaders(tenantId),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to verify payment');
      return await response.json();
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  },
};

// ============================================================================
// BRANCHES API
// ============================================================================

export const branchesAPI = {
  // Get all branches with pagination
  getAll: async (page = 1, limit = 20, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/branches?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch branches');
      return await response.json();
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  },

  // Get single branch by ID
  getById: async (id, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches/${id}`, {
        method: 'GET',
        headers: getHeaders(tenantId),
      });
      if (!response.ok) throw new Error('Failed to fetch branch');
      return await response.json();
    } catch (error) {
      console.error('Error fetching branch:', error);
      throw error;
    }
  },

  // Create new branch
  create: async (data, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches`, {
        method: 'POST',
        headers: getHeaders(tenantId),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create branch');
      return await response.json();
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  },

  // Update branch
  update: async (id, data, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches/${id}`, {
        method: 'PUT',
        headers: getHeaders(tenantId),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update branch');
      return await response.json();
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  },

  // Delete branch
  delete: async (id, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches/${id}`, {
        method: 'DELETE',
        headers: getHeaders(tenantId),
      });
      if (!response.ok) throw new Error('Failed to delete branch');
      return await response.json();
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error;
    }
  },

  // Get branch performance metrics
  getMetrics: async (id, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches/${id}/metrics`, {
        method: 'GET',
        headers: getHeaders(tenantId),
      });
      if (!response.ok) throw new Error('Failed to fetch branch metrics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching branch metrics:', error);
      throw error;
    }
  },
};

// ============================================================================
// ANALYTICS & DASHBOARD API
// ============================================================================

export const analyticsAPI = {
  // Get dashboard overview
  getDashboardOverview: async (dateFrom, dateTo, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/analytics/dashboard?from=${dateFrom}&to=${dateTo}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch dashboard overview');
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  },

  // Get revenue report
  getRevenueReport: async (dateFrom, dateTo, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/analytics/revenue?from=${dateFrom}&to=${dateTo}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch revenue report');
      return await response.json();
    } catch (error) {
      console.error('Error fetching revenue report:', error);
      throw error;
    }
  },

  // Get order statistics
  getOrderStats: async (dateFrom, dateTo, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/analytics/orders?from=${dateFrom}&to=${dateTo}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch order statistics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching order statistics:', error);
      throw error;
    }
  },

  // Get customer analytics
  getCustomerAnalytics: async (dateFrom, dateTo, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/analytics/customers?from=${dateFrom}&to=${dateTo}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch customer analytics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      throw error;
    }
  },

  // Get staff performance report
  getStaffPerformance: async (dateFrom, dateTo, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/analytics/staff-performance?from=${dateFrom}&to=${dateTo}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch staff performance');
      return await response.json();
    } catch (error) {
      console.error('Error fetching staff performance:', error);
      throw error;
    }
  },

  // Get branch comparison
  getBranchComparison: async (dateFrom, dateTo, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/analytics/branch-comparison?from=${dateFrom}&to=${dateTo}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch branch comparison');
      return await response.json();
    } catch (error) {
      console.error('Error fetching branch comparison:', error);
      throw error;
    }
  },

  // Get payment method breakdown
  getPaymentMethodBreakdown: async (dateFrom, dateTo, tenantId = 'default_tenant') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/analytics/payment-methods?from=${dateFrom}&to=${dateTo}`,
        {
          method: 'GET',
          headers: getHeaders(tenantId),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch payment method breakdown');
      return await response.json();
    } catch (error) {
      console.error('Error fetching payment method breakdown:', error);
      throw error;
    }
  },
};

// ============================================================================
// EXPORT ALL APIs
// ============================================================================

export default {
  ordersAPI,
  customersAPI,
  staffAPI,
  machinesAPI,
  paymentsAPI,
  branchesAPI,
  analyticsAPI,
};