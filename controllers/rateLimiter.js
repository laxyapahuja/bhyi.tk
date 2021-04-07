const rateLimit = require('express-rate-limit')

const createAccountLimiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 30, 
    message:
      "Too many accounts created from this IP, please try again after a minute"
  });

module.exports = createAccountLimiter