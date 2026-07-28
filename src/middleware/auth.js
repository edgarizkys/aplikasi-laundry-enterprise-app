// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'laundry-enterprise-secret-key-2026';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user context to request
 * Falls back to demo user for development/testing
 */
module.exports = function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        
        // Extract token from "Bearer <token>" format
        if (!authHeader) {
            // Demo mode: attach default user for development
            req.user = {
                id: 1,
                email: 'demo@laundry.com',
                name: 'Demo User',
                role: 'admin',
                tenant_id: 'tenant-demo-001',
                permissions: ['read', 'write', 'delete', 'manage_staff']
            };
            req.isDemo = true;
            return next();
        }

        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        // Verify and decode token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role || 'user',
            tenant_id: decoded.tenant_id,
            permissions: decoded.permissions || []
        };
        req.isDemo = false;
        
        next();
    } catch (error) {
        // Invalid or expired token
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token telah kadaluarsa',
                code: 'TOKEN_EXPIRED',
                message: 'Silakan login kembali'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token tidak valid',
                code: 'INVALID_TOKEN',
                message: 'Silakan gunakan token yang benar'
            });
        }

        return res.status(401).json({
            error: 'Tidak terautentikasi',
            code: 'UNAUTHORIZED',
            message: error.message
        });
    }
};

/**
 * Generate JWT Token
 * Used during login/registration
 */
module.exports.generateToken = function(user, options = {}) {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        tenant_id: user.tenant_id,
        permissions: user.permissions || []
    };

    const tokenOptions = {
        expiresIn: options.expiresIn || JWT_EXPIRY,
        issuer: 'laundry-enterprise',
        audience: 'laundry-app'
    };

    return jwt.sign(payload, JWT_SECRET, tokenOptions);
};

/**
 * Role-based Authorization Middleware
 * Restricts access based on user role
 */
module.exports.authorize = function(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Tidak terautentikasi',
                code: 'UNAUTHORIZED'
            });
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Akses ditolak',
                code: 'FORBIDDEN',
                message: `Diperlukan role: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Permission-based Authorization Middleware
 * Restricts access based on user permissions
 */
module.exports.requirePermission = function(...requiredPermissions) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Tidak terautentikasi',
                code: 'UNAUTHORIZED'
            });
        }

        const hasPermission = requiredPermissions.every(perm => 
            req.user.permissions && req.user.permissions.includes(perm)
        );

        if (!hasPermission) {
            return res.status(403).json({
                error: 'Akses ditolak',
                code: 'FORBIDDEN',
                message: `Diperlukan izin: ${requiredPermissions.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Tenant Isolation Middleware
 * Ensures user can only access their own tenant's data
 */
module.exports.tenantContext = function(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            error: 'Tidak terautentikasi',
            code: 'UNAUTHORIZED'
        });
    }

    // Attach tenant_id to request for query filtering
    req.tenant_id = req.user.tenant_id;
    
    next();
};

/**
 * Verify user is admin
 * Convenience middleware for admin-only routes
 */
module.exports.requireAdmin = function(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            error: 'Tidak terautentikasi',
            code: 'UNAUTHORIZED'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Hanya admin yang dapat mengakses',
            code: 'FORBIDDEN',
            message: 'Anda tidak memiliki akses administratif'
        });
    }

    next();
};

/**
 * Optional auth - doesn't fail if token missing
 * Useful for public endpoints with optional user context
 */
module.exports.optionalAuth = function(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            req.user = null;
            req.isAuthenticated = false;
            return next();
        }

        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        req.isAuthenticated = true;
        
    } catch (error) {
        // Silently ignore auth errors for optional routes
        req.user = null;
        req.isAuthenticated = false;
    }
    
    next();
};