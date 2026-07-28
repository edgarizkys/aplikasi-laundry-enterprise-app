// api.js - API Client for Laundry Enterprise Application
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Utility function to get headers with tenant ID
const getHeaders = (tenantId = 'default_tenant') => ({
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId
});

// Utility function to handle API responses
const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
    }
    return response.json();
};

// ============ ORDERS API ============
export const ordersApi = {
    // Get all orders with pagination
    getAll: async (page = 1, limit = 20, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/orders?page=${page}&limit=${limit}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get single order by ID
    getById: async (orderId, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/orders/${orderId}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Create new order
    create: async (data, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/orders`,
            {
                method: 'POST',
                headers: getHeaders(tenantId),
                body: JSON.stringify(data)
            }
        );
        return handleResponse(response);
    },

    // Update order
    update: async (orderId, data, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/orders/${orderId}`,
            {
                method: 'PUT',
                headers: getHeaders(tenantId),
                body: JSON.stringify(data)
            }
        );
        return handleResponse(response);
    },

    // Delete order
    delete: async (orderId, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/orders/${orderId}`,
            {
                method: 'DELETE',
                headers: getHeaders(tenantId)
            }
        );
        return handleResponse(response);
    },

    // Get orders by status
    getByStatus: async (status, page = 1, limit = 20, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/orders/status/${status}?page=${page}&limit=${limit}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get orders by customer
    getByCustomer: async (customerId, page = 1, limit = 20, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/orders/customer/${customerId}?page=${page}&limit=${limit}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get orders by branch
    getByBranch: async (branchId, page = 1, limit = 20, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/orders/branch/${branchId}?page=${page}&limit=${limit}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Update order status
    updateStatus: async (orderId, status, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/orders/${orderId}/status`,
            {
                method: 'PATCH',
                headers: getHeaders(tenantId),
                body: JSON.stringify({ status })
            }
        );
        return handleResponse(response);
    }
};

// ============ CUSTOMERS API ============
export const customersApi = {
    // Get all customers with pagination
    getAll: async (page = 1, limit = 20, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/customers?page=${page}&limit=${limit}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get single customer by ID
    getById: async (customerId, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/customers/${customerId}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Create new customer
    create: async (data, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/customers`,
            {
                method: 'POST',
                headers: getHeaders(tenantId),
                body: JSON.stringify(data)
            }
        );
        return handleResponse(response);
    },

    // Update customer
    update: async (customerId, data, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/customers/${customerId}`,
            {
                method: 'PUT',
                headers: getHeaders(tenantId),
                body: JSON.stringify(data)
            }
        );
        return handleResponse(response);
    },

    // Delete customer
    delete: async (customerId, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/customers/${customerId}`,
            {
                method: 'DELETE',
                headers: getHeaders(tenantId)
            }
        );
        return handleResponse(response);
    },

    // Get customers by member type
    getByMemberType: async (memberType, page = 1, limit = 20, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/customers/type/${memberType}?page=${page}&limit=${limit}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Add loyalty points
    addPoints: async (customerId, points, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/customers/${customerId}/points`,
            {
                method: 'POST',
                headers: getHeaders(tenantId),
                body: JSON.stringify({ points })
            }
        );
        return handleResponse(response);
    },

    // Search customers
    search: async (query, page = 1, limit = 20, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/customers/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    }
};

// ============ BRANCHES API ============
export const branchesApi = {
    // Get all branches
    getAll: async (page = 1, limit = 20, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/branches?page=${page}&limit=${limit}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get single branch by ID
    getById: async (branchId, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/branches/${branchId}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Create new branch
    create: async (data, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/branches`,
            {
                method: 'POST',
                headers: getHeaders(tenantId),
                body: JSON.stringify(data)
            }
        );
        return handleResponse(response);
    },

    // Update branch
    update: async (branchId, data, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/branches/${branchId}`,
            {
                method: 'PUT',
                headers: getHeaders(tenantId),
                body: JSON.stringify(data)
            }
        );
        return handleResponse(response);
    },

    // Delete branch
    delete: async (branchId, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/branches/${branchId}`,
            {
                method: 'DELETE',
                headers: getHeaders(tenantId)
            }
        );
        return handleResponse(response);
    },

    // Get active branches only
    getActive: async (tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/branches/status/active`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get branch capacity status
    getCapacityStatus: async (branchId, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/branches/${branchId}/capacity`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    }
};

// ============ STAFF API ============
export const staffApi = {
    // Get all staff with pagination
    getAll: async (page = 1, limit = 20, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/staff?page=${page}&limit=${limit}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get single staff by ID
    getById: async (staffId, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/staff/${staffId}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Create new staff
    create: async (data, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/staff`,
            {
                method: 'POST',
                headers: getHeaders(tenantId),
                body: JSON.stringify(data)
            }
        );
        return handleResponse(response);
    },

    // Update staff
    update: async (staffId, data, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/staff/${staffId}`,
            {
                method: 'PUT',
                headers: getHeaders(tenantId),
                body: JSON.stringify(data)
            }
        );
        return handleResponse(response);
    },

    // Delete staff
    delete: async (staffId, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/staff/${staffId}`,
            {
                method: 'DELETE',
                headers: getHeaders(tenantId)
            }
        );
        return handleResponse(response);
    },

    // Get staff by branch
    getByBranch: async (branchId, page = 1, limit = 20, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/staff/branch/${branchId}?page=${page}&limit=${limit}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get staff by role
    getByRole: async (role, page = 1, limit = 20, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/staff/role/${role}?page=${page}&limit=${limit}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get active staff
    getActive: async (tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/staff/status/active`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    }
};

// ============ SERVICES API ============
export const servicesApi = {
    // Get all services
    getAll: async (page = 1, limit = 20, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/services?page=${page}&limit=${limit}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get single service by ID
    getById: async (serviceId, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/services/${serviceId}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Create new service
    create: async (data, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/services`,
            {
                method: 'POST',
                headers: getHeaders(tenantId),
                body: JSON.stringify(data)
            }
        );
        return handleResponse(response);
    },

    // Update service
    update: async (serviceId, data, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/services/${serviceId}`,
            {
                method: 'PUT',
                headers: getHeaders(tenantId),
                body: JSON.stringify(data)
            }
        );
        return handleResponse(response);
    },

    // Delete service
    delete: async (serviceId, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/services/${serviceId}`,
            {
                method: 'DELETE',
                headers: getHeaders(tenantId)
            }
        );
        return handleResponse(response);
    },

    // Get active services only
    getActive: async (tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/services/status/active`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    }
};

// ============ PAYMENTS API ============
export const paymentsApi = {
    // Get all payments with pagination
    getAll: async (page = 1, limit = 20, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/payments?page=${page}&limit=${limit}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get single payment by ID
    getById: async (paymentId, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/payments/${paymentId}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Create new payment
    create: async (data, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/payments`,
            {
                method: 'POST',
                headers: getHeaders(tenantId),
                body: JSON.stringify(data)
            }
        );
        return handleResponse(response);
    },

    // Update payment
    update: async (paymentId, data, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/payments/${paymentId}`,
            {
                method: 'PUT',
                headers: getHeaders(tenantId),
                body: JSON.stringify(data)
            }
        );
        return handleResponse(response);
    },

    // Delete payment
    delete: async (paymentId, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/payments/${paymentId}`,
            {
                method: 'DELETE',
                headers: getHeaders(tenantId)
            }
        );
        return handleResponse(response);
    },

    // Get payments by order
    getByOrder: async (orderId, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/payments/order/${orderId}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get payments by status
    getByStatus: async (status, page = 1, limit = 20, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/payments/status/${status}?page=${page}&limit=${limit}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get payments by method
    getByMethod: async (method, page = 1, limit = 20, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/payments/method/${method}?page=${page}&limit=${limit}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Update payment status
    updateStatus: async (paymentId, status, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/payments/${paymentId}/status`,
            {
                method: 'PATCH',
                headers: getHeaders(tenantId),
                body: JSON.stringify({ status })
            }
        );
        return handleResponse(response);
    }
};

// ============ ANALYTICS API ============
export const analyticsApi = {
    // Get dashboard summary
    getSummary: async (tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/analytics/summary`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get revenue report
    getRevenueReport: async (startDate, endDate, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/analytics/revenue?start=${startDate}&end=${endDate}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get branch performance metrics
    getBranchMetrics: async (branchId, startDate, endDate, tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/analytics/branch/${branchId}?start=${startDate}&end=${endDate}`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get order statistics
    getOrderStats: async (tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/analytics/orders`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get customer statistics
    getCustomerStats: async (tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/analytics/customers`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    },

    // Get payment statistics
    getPaymentStats: async (tenantId = 'default_tenant') => {
        const response = await fetch(
            `${API_BASE_URL}/analytics/payments`,
            { headers: getHeaders(tenantId) }
        );
        return handleResponse(response);
    }
};

export default {
    ordersApi,
    customersApi,
    branchesApi,
    staffApi,
    servicesApi,
    paymentsApi,
    analyticsApi
};