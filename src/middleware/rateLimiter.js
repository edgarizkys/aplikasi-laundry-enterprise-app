// middleware/rateLimiter.js - Rate Limiting for Aplikasi Laundry Enterprise

const rateLimitMap = new Map();

module.exports = function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const now = Date.now();
    
    // Configuration
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100; // requests per window
    const maxRequestsPerHour = 1000; // hourly limit
    
    // Get or create rate limit record for IP
    let record = rateLimitMap.get(ip);
    
    if (!record) {
        record = {
            count: 0,
            resetTime: now + windowMs,
            hourlyCount: 0,
            hourlyResetTime: now + (60 * 60 * 1000)
        };
        rateLimitMap.set(ip, record);
    }
    
    // Reset minute window if expired
    if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + windowMs;
    }
    
    // Reset hourly window if expired
    if (now > record.hourlyResetTime) {
        record.hourlyCount = 0;
        record.hourlyResetTime = now + (60 * 60 * 1000);
    }
    
    // Increment counters
    record.count += 1;
    record.hourlyCount += 1;
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
    res.setHeader('X-RateLimit-Hourly-Limit', maxRequestsPerHour);
    res.setHeader('X-RateLimit-Hourly-Remaining', Math.max(0, maxRequestsPerHour - record.hourlyCount));
    
    // Check minute limit
    if (record.count > maxRequests) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
            error: 'Batas permintaan terlampaui',
            message: 'Terlalu banyak permintaan. Silakan coba lagi dalam ' + retryAfter + ' detik.',
            retryAfter: retryAfter
        });
    }
    
    // Check hourly limit
    if (record.hourlyCount > maxRequestsPerHour) {
        const retryAfter = Math.ceil((record.hourlyResetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
            error: 'Batas permintaan per jam terlampaui',
            message: 'Telah mencapai batas permintaan harian. Silakan coba lagi nanti.',
            retryAfter: retryAfter
        });
    }
    
    // Cleanup old entries (every 1000 requests)
    if (rateLimitMap.size > 10000) {
        for (let [key, value] of rateLimitMap.entries()) {
            if (now > value.hourlyResetTime + (60 * 60 * 1000)) {
                rateLimitMap.delete(key);
            }
        }
    }
    
    next();
};