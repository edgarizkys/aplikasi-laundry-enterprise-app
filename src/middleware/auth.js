// middleware/auth.js - JWT Authentication & Authorization
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'laundry_enterprise_secret_key_2026';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

// Role-based access control
const RBAC = {
  admin: ['orders', 'customers', 'employees', 'branches', 'services', 'payments', 'analytics'],
  manager: ['orders', 'customers', 'employees', 'services', 'payments', 'analytics'],
  operator: ['orders', 'customers', 'services'],
  customer: ['orders', 'payments'],
  guest: []
};

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : null;

  // Demo mode: allow unauthenticated access with demo user
  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      req.user = {
        id: 1,
        email: 'demo@laundry.com',
        name: 'Demo User',
        role: 'admin',
        tenant_id: 'tenant_001',
        permissions: RBAC.admin,
        iat: Math.floor(Date.now() / 1000)
      };
      return next();
    }
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token tidak ditemukan. Silakan login terlebih dahulu.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      ...decoded,
      permissions: RBAC[decoded.role] || []
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'TokenExpired',
        message: 'Token telah kadaluarsa. Silakan login kembali.'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'InvalidToken',
        message: 'Token tidak valid.'
      });
    }
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Autentikasi gagal.'
    });
  }
}

/**
 * Authorization Middleware
 * Checks if user has required role/permission
 */
function authorize(requiredRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User tidak ditemukan dalam request.'
      });
    }

    const hasRole = requiredRoles.length === 0 || 
                    requiredRoles.includes(req.user.role);

    if (!hasRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Akses ditolak. Diperlukan role: ${requiredRoles.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Generate JWT Token
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenant_id: user.tenant_id,
    branch_id: user.branch_id || null
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify Token (for external verification)
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Multi-tenant middleware
 * Ensures user can only access their tenant data
 */
function multiTenantMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User tidak terautentikasi.'
    });
  }

  // Attach tenant context to request
  req.tenant = {
    id: req.user.tenant_id,
    userId: req.user.id,
    branch_id: req.user.branch_id
  };

  next();
}

/**
 * Resource ownership check
 * Ensures user only accesses their own resources
 */
function checkOwnership(resourceOwnerId) {
  return (req, res, next) => {
    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check ownership
    if (req.user.id !== resourceOwnerId && req.user.role !== 'manager') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Anda tidak memiliki akses ke resource ini.'
      });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  authorize,
  generateToken,
  verifyToken,
  multiTenantMiddleware,
  checkOwnership,
  RBAC,
  JWT_SECRET,
  JWT_EXPIRY
};