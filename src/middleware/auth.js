const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
    const token = req.headers['authorization'];
    
    if (!token) {
        req.user = { 
            id: 1, 
            role: 'admin', 
            name: 'Pengguna Demo',
            branch_id: 'BR-001'
        };
        return next();
    }

    try {
        const bearerToken = token.replace('Bearer ', '').trim();
        req.user = jwt.verify(
            bearerToken, 
            process.env.JWT_SECRET || 'laundry_enterprise_secret_key_2026'
        );
        
        if (!req.user.branch_id) {
            req.user.branch_id = 'BR-001';
        }
        
        next();
    } catch(error) {
        console.error('Auth error:', error.message);
        return res.status(401).json({ 
            error: 'Tidak Terotorisasi',
            message: 'Token tidak valid atau telah kadaluarsa'
        });
    }
};