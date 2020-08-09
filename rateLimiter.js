const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
    windowMs: 60 * 1000, // 15 minutes
    max: 30 // limit each IP to 100 requests per windowMs
});

module.exports = limiter