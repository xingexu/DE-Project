const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5001;

// Import our simple database
const { users, transitLines, rewards, trips } = require('./config/database-simple');

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// JWT Secret (in production, use environment variable)
const JWT_SECRET = 'transit_rewards_super_secret_key_2024';

// Simple auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token - user not found' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Transit Rewards API is running',
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, avatar = '👤', isPremium = false } = req.body;

    // Check if user already exists
    const existingUser = Array.from(users.values()).find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const userId = `user-${Date.now()}`;
    const passwordHash = await bcrypt.hash(password, 12);
    const initialPoints = isPremium ? 2000 : 1000;

    const newUser = {
      id: userId,
      name,
      email,
      password_hash: passwordHash,
      avatar,
      points: initialPoints,
      level: 1,
      experience: 0,
      weekly_points: 0,
      total_trips: 0,
      total_distance: 0,
      total_time: 0,
      is_premium: isPremium,
      premium_expiry: isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      location_sharing: false,
      friend_requests: true,
      chat_enabled: true,
      message_requests: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    users.set(userId, newUser);

    // Generate token
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

    // Remove password from response
    const { password_hash, ...userResponse } = newUser;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = Array.from(users.values()).find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Remove password from response
    const { password_hash, ...userResponse } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const { password_hash, ...userResponse } = req.user;
    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// Transit routes
app.get('/api/transit/lines', (req, res) => {
  try {
    const lines = Array.from(transitLines.values());
    res.json({
      success: true,
      data: lines
    });
  } catch (error) {
    console.error('Get transit lines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transit lines'
    });
  }
});

app.get('/api/transit/lines/:id', (req, res) => {
  try {
    const { id } = req.params;
    const line = transitLines.get(parseInt(id));
    
    if (!line) {
      return res.status(404).json({
        success: false,
        message: 'Transit line not found'
      });
    }
    
    res.json({
      success: true,
      data: line
    });
  } catch (error) {
    console.error('Get transit line error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transit line'
    });
  }
});

app.post('/api/transit/lines/:id/rate', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { rating, noiseLevel, occupancy, feedback } = req.body;
    
    const line = transitLines.get(parseInt(id));
    if (!line) {
      return res.status(404).json({
        success: false,
        message: 'Transit line not found'
      });
    }

    // Update rating (simplified)
    const newRatingCount = line.rating_count + 1;
    const newRating = ((line.rating * line.rating_count) + rating) / newRatingCount;
    
    line.rating = parseFloat(newRating.toFixed(2));
    line.rating_count = newRatingCount;
    line.noise_level = noiseLevel;
    line.occupancy = occupancy;
    line.updated_at = new Date().toISOString();

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        transitLine: line,
        pointsEarned: 50
      }
    });
  } catch (error) {
    console.error('Rate transit line error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating'
    });
  }
});

// Rewards routes
app.get('/api/rewards', (req, res) => {
  try {
    const rewardsList = Array.from(rewards.values());
    res.json({
      success: true,
      data: rewardsList
    });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rewards'
    });
  }
});

app.get('/api/rewards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const reward = rewards.get(parseInt(id));
    
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }
    
    res.json({
      success: true,
      data: reward
    });
  } catch (error) {
    console.error('Get reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reward'
    });
  }
});

app.post('/api/rewards/:id/redeem', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const reward = rewards.get(parseInt(id));
    
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    if (!reward.is_available) {
      return res.status(400).json({
        success: false,
        message: 'This reward is not available for redemption'
      });
    }

    if (reward.is_premium && !req.user.is_premium) {
      return res.status(403).json({
        success: false,
        message: 'This reward is only available to premium users'
      });
    }

    if (req.user.points < reward.points_cost) {
      return res.status(400).json({
        success: false,
        message: 'Not enough points to redeem this reward'
      });
    }

    // Deduct points
    req.user.points -= reward.points_cost;
    req.user.updated_at = new Date().toISOString();

    res.json({
      success: true,
      message: 'Reward redeemed successfully',
      data: {
        reward,
        pointsDeducted: reward.points_cost
      }
    });
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to redeem reward'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Transit Rewards API server running on port ${PORT}`);
  console.log(`📊 Environment: development`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
});

module.exports = app;
