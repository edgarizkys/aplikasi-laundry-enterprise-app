// api/api.js - API Client for Laundry Enterprise Application

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
    const {
        method = 'GET',
        body = null,
        headers = {},
        params = {}
    } = options;

    try {
        let url = `${API_BASE_URL}${endpoint}`;
        
        // Add query parameters
        if (Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            url = `${url}?${queryString}`;
        }

        const requestOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'x-tenant-id': localStorage.getItem('tenantId') || 'default_tenant',
                ...headers
            }
        };

        if (body) {
            requestOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, requestOptions);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
};

// ==================== ORDERS API ====================

export const ordersAPI = {
    // Get all orders with pagination
    getAll: (page = 1, limit = 20, filters = {}) => {
        const params = { page, limit, ...filters };
        return apiRequest('/orders', { params });
    },

    // Get single order by ID
    getById: (orderId) => {
        return apiRequest(`/orders/${orderId}`);
    },

    // Create new order
    create: (orderData) => {
        return apiRequest('/orders', {
            method: 'POST',
            body: orderData
        });
    },

    // Update order
    update: (orderId, orderData) => {
        return apiRequest(`/orders/${orderId}`, {
            method: 'PUT',
            body: orderData
        });
    },

    // Delete order
    delete: (orderId) => {
        return apiRequest(`/orders/${orderId}`, {
            method: 'DELETE'
        });
    },

    // Search orders
    search: (searchTerm) => {
        return apiRequest('/orders/search', {
            params: { q: searchTerm }
        });
    },

    // Get orders by status
    getByStatus: (status, page = 1, limit = 20) => {
        return apiRequest('/orders/status/' + status, {
            params: { page, limit }
        });
    },

    // Update order status
    updateStatus: (orderId, status) => {
        return apiRequest(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: { status }
        });
    },

    // Update payment status
    updatePaymentStatus: (orderId, paymentStatus) => {
        return apiRequest(`/orders/${orderId}/payment-status`, {
            method: 'PUT',
            body: { payment_status: paymentStatus }
        });
    },

    // Get order by number
    getByOrderNumber: (orderNumber) => {
        return apiRequest(`/orders/number/${orderNumber}`);
    },

    // Assign to delivery
    assignDelivery: (orderId, deliveryData) => {
        return apiRequest(`/orders/${orderId}/assign-delivery`, {
            method: 'POST',
            body: deliveryData
        });
    }
};

// ==================== CUSTOMERS API ====================

export const customersAPI = {
    // Get all customers with pagination
    getAll: (page = 1, limit = 20) => {
        return apiRequest('/customers', {
            params: { page, limit }
        });
    },

    // Get single customer by ID
    getById: (customerId) => {
        return apiRequest(`/customers/${customerId}`);
    },

    // Create new customer
    create: (customerData) => {
        return apiRequest('/customers', {
            method: 'POST',
            body: customerData
        });
    },

    // Update customer
    update: (customerId, customerData) => {
        return apiRequest(`/customers/${customerId}`, {
            method: 'PUT',
            body: customerData
        });
    },

    // Delete customer
    delete: (customerId) => {
        return apiRequest(`/customers/${customerId}`, {
            method: 'DELETE'
        });
    },

    // Search customers
    search: (searchTerm) => {
        return apiRequest('/customers/search', {
            params: { q: searchTerm }
        });
    },

    // Get customer by phone
    getByPhone: (phone) => {
        return apiRequest(`/customers/phone/${phone}`);
    },

    // Get customer loyalty points
    getLoyaltyPoints: (customerId) => {
        return apiRequest(`/customers/${customerId}/loyalty-points`);
    },

    // Add loyalty points
    addLoyaltyPoints: (customerId, points) => {
        return apiRequest(`/customers/${customerId}/loyalty-points`, {
            method: 'POST',
            body: { points }
        });
    },

    // Get customer orders history
    getOrderHistory: (customerId, page = 1, limit = 10) => {
        return apiRequest(`/customers/${customerId}/orders`, {
            params: { page, limit }
        });
    }
};

// ==================== EMPLOYEES API ====================

export const employeesAPI = {
    // Get all employees with pagination
    getAll: (page = 1, limit = 20) => {
        return apiRequest('/employees', {
            params: { page, limit }
        });
    },

    // Get single employee by ID
    getById: (employeeId) => {
        return apiRequest(`/employees/${employeeId}`);
    },

    // Create new employee
    create: (employeeData) => {
        return apiRequest('/employees', {
            method: 'POST',
            body: employeeData
        });
    },

    // Update employee
    update: (employeeId, employeeData) => {
        return apiRequest(`/employees/${employeeId}`, {
            method: 'PUT',
            body: employeeData
        });
    },

    // Delete employee
    delete: (employeeId) => {
        return apiRequest(`/employees/${employeeId}`, {
            method: 'DELETE'
        });
    },

    // Search employees
    search: (searchTerm) => {
        return apiRequest('/employees/search', {
            params: { q: searchTerm }
        });
    },

    // Get employees by position
    getByPosition: (position, page = 1, limit = 20) => {
        return apiRequest('/employees/position/' + position, {
            params: { page, limit }
        });
    },

    // Update employee status
    updateStatus: (employeeId, status) => {
        return apiRequest(`/employees/${employeeId}/status`, {
            method: 'PUT',
            body: { status }
        });
    },

    // Get employees by branch
    getByBranch: (branchId, page = 1, limit = 20) => {
        return apiRequest(`/employees/branch/${branchId}`, {
            params: { page, limit }
        });
    }
};

// ==================== BRANCHES API ====================

export const branchesAPI = {
    // Get all branches
    getAll: (page = 1, limit = 50) => {
        return apiRequest('/branches', {
            params: { page, limit }
        });
    },

    // Get single branch by ID
    getById: (branchId) => {
        return apiRequest(`/branches/${branchId}`);
    },

    // Create new branch
    create: (branchData) => {
        return apiRequest('/branches', {
            method: 'POST',
            body: branchData
        });
    },

    // Update branch
    update: (branchId, branchData) => {
        return apiRequest(`/branches/${branchId}`, {
            method: 'PUT',
            body: branchData
        });
    },

    // Delete branch
    delete: (branchId) => {
        return apiRequest(`/branches/${branchId}`, {
            method: 'DELETE'
        });
    },

    // Search branches
    search: (searchTerm) => {
        return apiRequest('/branches/search', {
            params: { q: searchTerm }
        });
    },

    // Get branches by city
    getByCity: (city) => {
        return apiRequest(`/branches/city/${city}`);
    },

    // Get branch statistics
    getStatistics: (branchId) => {
        return apiRequest(`/branches/${branchId}/statistics`);
    }
};

// ==================== SERVICES API ====================

export const servicesAPI = {
    // Get all services
    getAll: (page = 1, limit = 50) => {
        return apiRequest('/services', {
            params: { page, limit }
        });
    },

    // Get single service by ID
    getById: (serviceId) => {
        return apiRequest(`/services/${serviceId}`);
    },

    // Create new service
    create: (serviceData) => {
        return apiRequest('/services', {
            method: 'POST',
            body: serviceData
        });
    },

    // Update service
    update: (serviceId, serviceData) => {
        return apiRequest(`/services/${serviceId}`, {
            method: 'PUT',
            body: serviceData
        });
    },

    // Delete service
    delete: (serviceId) => {
        return apiRequest(`/services/${serviceId}`, {
            method: 'DELETE'
        });
    },

    // Get active services
    getActive: () => {
        return apiRequest('/services/status/active');
    },

    // Update service status
    updateStatus: (serviceId, status) => {
        return apiRequest(`/services/${serviceId}/status`, {
            method: 'PUT',
            body: { status }
        });
    },

    // Calculate price
    calculatePrice: (weightKg, serviceId) => {
        return apiRequest('/services/calculate-price', {
            params: { weight_kg: weightKg, service_id: serviceId }
        });
    }
};

// ==================== PAYMENTS API ====================

export const paymentsAPI = {
    // Get all payments with pagination
    getAll: (page = 1, limit = 20) => {
        return apiRequest('/payments', {
            params: { page, limit }
        });
    },

    // Get single payment by ID
    getById: (paymentId) => {
        return apiRequest(`/payments/${paymentId}`);
    },

    // Create new payment
    create: (paymentData) => {
        return apiRequest('/payments', {
            method: 'POST',
            body: paymentData
        });
    },

    // Update payment
    update: (paymentId, paymentData) => {
        return apiRequest(`/payments/${paymentId}`, {
            method: 'PUT',
            body: paymentData
        });
    },

    // Delete payment
    delete: (paymentId) => {
        return apiRequest(`/payments/${paymentId}`, {
            method: 'DELETE'
        });
    },

    // Get payments by status
    getByStatus: (status, page = 1, limit = 20) => {
        return apiRequest(`/payments/status/${status}`, {
            params: { page, limit }
        });
    },

    // Get payment by order ID
    getByOrderId: (orderId) => {
        return apiRequest(`/payments/order/${orderId}`);
    },

    // Update payment status
    updateStatus: (paymentId, status) => {
        return apiRequest(`/payments/${paymentId}/status`, {
            method: 'PUT',
            body: { status }
        });
    },

    // Get payments by method
    getByMethod: (method, page = 1, limit = 20) => {
        return apiRequest(`/payments/method/${method}`, {
            params: { page, limit }
        });
    },

    // Process QRIS payment
    processQRIS: (paymentData) => {
        return apiRequest('/payments/qris', {
            method: 'POST',
            body: paymentData
        });
    },

    // Process bank transfer
    processBankTransfer: (paymentData) => {
        return apiRequest('/payments/bank-transfer', {
            method: 'POST',
            body: paymentData
        });
    }
};

// ==================== ANALYTICS API ====================

export const analyticsAPI = {
    // Get dashboard summary
    getDashboardSummary: () => {
        return apiRequest('/analytics/dashboard');
    },

    // Get revenue report
    getRevenueReport: (startDate, endDate) => {
        return apiRequest('/analytics/revenue', {
            params: { start_date: startDate, end_date: endDate }
        });
    },

    // Get orders report
    getOrdersReport: (startDate, endDate) => {
        return apiRequest('/analytics/orders', {
            params: { start_date: startDate, end_date: endDate }
        });
    },

    // Get customer report
    getCustomerReport: () => {
        return apiRequest('/analytics/customers');
    },

    // Get branch performance
    getBranchPerformance: (startDate, endDate) => {
        return apiRequest('/analytics/branch-performance', {
            params: { start_date: startDate, end_date: endDate }
        });
    },

    // Get service statistics
    getServiceStatistics: () => {
        return apiRequest('/analytics/services');
    },

    // Get payment statistics
    getPaymentStatistics: (startDate, endDate) => {
        return apiRequest('/analytics/payments', {
            params: { start_date: startDate, end_date: endDate }
        });
    }
};

// ==================== INVOICES API ====================

export const invoicesAPI = {
    // Generate invoice
    generate: (orderId) => {
        return apiRequest(`/invoices/generate/${orderId}`, {
            method: 'POST'
        });
    },

    // Get invoice
    getById: (invoiceId) => {
        return apiRequest(`/invoices/${invoiceId}`);
    },

    // Download invoice PDF
    downloadPDF: (invoiceId) => {
        const tenantId = localStorage.getItem('tenantId') || 'default_tenant';
        window.location.href = `${API_BASE_URL}/invoices/${invoiceId}/pdf?x-tenant-id=${tenantId}`;
    },

    // Get invoices by order
    getByOrderId: (orderId) => {
        return apiRequest(`/invoices/order/${orderId}`);
    },

    // Send invoice via email
    sendEmail: (invoiceId, email) => {
        return apiRequest(`/invoices/${invoiceId}/send-email`, {
            method: 'POST',
            body: { email }
        });
    }
};

// ==================== NOTIFICATIONS API ====================

export const notificationsAPI = {
    // Send SMS notification
    sendSMS: (phone, message) => {
        return apiRequest('/notifications/sms', {
            method: 'POST',
            body: { phone, message }
        });
    },

    // Send order status notification
    sendOrderStatus: (orderId, phone) => {
        return apiRequest(`/notifications/order-status/${orderId}`, {
            method: 'POST',
            body: { phone }
        });
    },

    // Send payment reminder
    sendPaymentReminder: (orderId, phone) => {
        return apiRequest(`/notifications/payment-reminder/${orderId}`, {
            method: 'POST',
            body: { phone }
        });
    },

    // Send delivery notification
    sendDeliveryNotification: (orderId, phone) => {
        return apiRequest(`/notifications/delivery/${orderId}`, {
            method: 'POST',
            body: { phone }
        });
    },

    // Send email notification
    sendEmail: (email, subject, message) => {
        return apiRequest('/notifications/email', {
            method: 'POST',
            body: { email, subject, message }
        });
    }
};

// ==================== REPORTS API ====================

export const reportsAPI = {
    // Export orders to CSV
    exportOrders: (startDate, endDate) => {
        const tenantId = localStorage.getItem('tenantId') || 'default_tenant';
        window.location.href = `${API_BASE_URL}/reports/orders/csv?start_date=${startDate}&end_date=${endDate}&x-tenant-id=${tenantId}`;
    },

    // Export payments to CSV
    exportPayments: (startDate, endDate) => {
        const tenantId = localStorage.getItem('tenantId') || 'default_tenant';
        window.location.href = `${API_BASE_URL}/reports/payments/csv?start_date=${startDate}&end_date=${endDate}&x-tenant-id=${tenantId}`;
    },

    // Export customers to CSV
    exportCustomers: () => {
        const tenantId = localStorage.getItem('tenantId') || 'default_tenant';
        window.location.href = `${API_BASE_URL}/reports/customers/csv?x-tenant-id=${tenantId}`;
    },

    // Get revenue summary
    getRevenueSummary: (startDate, endDate) => {
        return apiRequest('/reports/revenue-summary', {
            params: { start_date: startDate, end_date: endDate }
        });
    },

    // Get top customers
    getTopCustomers: (limit = 10) => {
        return apiRequest('/reports/top-customers', {
            params: { limit }
        });
    },

    // Get pending orders
    getPendingOrders: () => {
        return apiRequest('/reports/pending-orders');
    }
};

export default {
    ordersAPI,
    customersAPI,
    employeesAPI,
    branchesAPI,
    servicesAPI,
    paymentsAPI,
    analyticsAPI,
    invoicesAPI,
    notificationsAPI,
    reportsAPI
};