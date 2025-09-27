const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

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
    const userResult = await query(`
      SELECT id, email, name, avatar, points, level, experience, weekly_points, 
             total_trips, total_distance, total_time, is_premium, premium_expiry,
             location_sharing, friend_requests, chat_enabled, message_requests, created_at
      FROM users WHERE id = $1
    `, [decoded.userId]);
    
    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token - user not found' 
      });
    }
    
    // Check if token is in active sessions
    const sessionResult = await query(`
      SELECT * FROM user_sessions 
      WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW()
    `, [user.id, hashToken(token)]);
    
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired session' 
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
  
  // If premium has expired, update user status
  if (req.user.premium_expiry && new Date(req.user.premium_expiry) < new Date()) {
    query(`
      UPDATE users 
      SET is_premium = false, premium_expiry = NULL 
      WHERE id = $1
    `, [req.user.id])
      .then(() => {
        return res.status(403).json({ 
          success: false, 
          message: 'Premium subscription has expired' 
        });
      })
      .catch((error) => {
        console.error('Error updating premium status:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to update premium status' 
        });
      });
  } else {
    next();
  }
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

// Generate JWT token and save session
const generateToken = async (userId) => {
  try {
    // Create JWT token
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    // Calculate expiry date
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const expiresInMs = ms(expiresIn);
    const expiresAt = new Date(Date.now() + expiresInMs);
    
    // Save token in sessions table
    await query(`
      INSERT INTO user_sessions (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `, [userId, hashToken(token), expiresAt]);
    
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

// Invalidate a specific token
const invalidateToken = async (token) => {
  try {
    await query(`
      DELETE FROM user_sessions 
      WHERE token_hash = $1
    `, [hashToken(token)]);
    return true;
  } catch (error) {
    console.error('Error invalidating token:', error);
    return false;
  }
};

// Invalidate all tokens for a user
const invalidateAllTokens = async (userId) => {
  try {
    await query(`
      DELETE FROM user_sessions 
      WHERE user_id = $1
    `, [userId]);
    return true;
  } catch (error) {
    console.error('Error invalidating all tokens:', error);
    return false;
  }
};

// Helper function to hash tokens for storage
const hashToken = (token) => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Helper function to parse time strings like '7d', '24h' into milliseconds
const ms = (timeString) => {
  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  
  const match = timeString.match(/^(\d+)([smhd])$/);
  if (match) {
    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }
  
  // Default to days if format is just a number
  if (!isNaN(timeString)) {
    return parseInt(timeString) * units.d;
  }
  
  // Default to 7 days
  return 7 * units.d;
};

module.exports = {
  authenticateToken,
  requirePremium,
  requireOwnership,
  generateToken,
  invalidateToken,
  invalidateAllTokens,
  hashToken
};