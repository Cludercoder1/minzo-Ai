const jwt = require('jsonwebtoken');
const config = require('../config');

const optional = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
    } catch (error) {
      // Token is invalid but we continue without user data
      console.log('Invalid token provided, continuing without authentication');
    }
  }
  
  next();
};

const required = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Please provide a valid token.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired token. Please authenticate again.'
    });
  }
};

module.exports = {
  optional,
  required
};