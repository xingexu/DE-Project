const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token - user not found' 
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

// Middleware to check if user is premium
const requirePremium = (req, res, next) => {
  if (!req.user.is_premium) {
    return res.status(403).json({ 
      success: false, 
      message: 'Premium account required' 
    });
  }
  next();
};

// Middleware to check if user owns the resource
const requireOwnership = (paramName = 'id') => {
  return (req, res, next) => {
    const resourceId = req.params[paramName];
    const userId = req.user.id;
    
    if (parseInt(resourceId) !== parseInt(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied - you can only access your own resources' 
      });
    }
    next();
  };
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  authenticateToken,
  requirePremium,
  requireOwnership,
  generateToken
};

