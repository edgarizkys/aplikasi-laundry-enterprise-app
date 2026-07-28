// middleware/auth.js - JWT Authentication for Laundry Enterprise
const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

    // Demo/testing mode - allow unauthenticated access with demo user
    if (!token) {
        req.user = {
            id: 1,
            role: 'admin',
            name: 'Pengguna Demo',
            email: 'demo@laundry.com',
            branch_id: 'BRANCH-001',
            tenant_id: 'default'
        };
        req.authenticated = false;
        return next();
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'laundry_enterprise_default_secret_key_2026',
            {
                algorithms: ['HS256'],
                issuer: 'laundry-enterprise',
                audience: 'laundry-app'
            }
        );

        // Validate token structure
        if (!decoded.id || !decoded.role || !decoded.tenant_id) {
            return res.status(401).json({
                success: false,
                error: 'Token tidak valid',
                message: 'Structure token tidak sesuai'
            });
        }

        req.user = {
            id: decoded.id,
            role: decoded.role,
            name: decoded.name || 'User',
            email: decoded.email,
            branch_id: decoded.branch_id,
            tenant_id: decoded.tenant_id,
            permissions: decoded.permissions || []
        };
        req.authenticated = true;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token kadaluarsa',
                message: 'Silakan login kembali',
                expiredAt: error.expiredAt
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Token tidak valid',
                message: 'Signature tidak cocok atau token corrupted'
            });
        }

        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Akses ditolak'
        });
    }
};