const express = require('express');
const Joi = require('joi');
const { authenticateToken, requirePremium } = require('../middleware/auth');
const Reward = require('../models/Reward');

const router = express.Router();

// Validation schema for redeeming rewards
const redeemSchema = Joi.object({
  rewardId: Joi.number().required()
});

// Get all available rewards
router.get('/', async (req, res) => {
  try {
    const rewards = await Reward.getAll();
    
    res.json({
      success: true,
      data: rewards
    });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rewards'
    });
  }
});

// Get specific reward
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const reward = await Reward.getById(id);
    
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

// Redeem a reward
router.post('/:id/redeem', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the reward to check if it exists
    const reward = await Reward.getById(id);
    
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }
    
    // Check if reward is available
    if (!reward.is_available) {
      return res.status(400).json({
        success: false,
        message: 'This reward is not available for redemption'
      });
    }
    
    // Check if premium only
    if (reward.is_premium && !req.user.is_premium) {
      return res.status(403).json({
        success: false,
        message: 'This reward is only available to premium users'
      });
    }
    
    try {
      // Redeem the reward
      const result = await Reward.redeem(id, req.user.id);
      
      res.json({
        success: true,
        message: 'Reward redeemed successfully',
        data: {
          reward: result.reward,
          pointsDeducted: result.pointsDeducted
        }
      });
    } catch (error) {
      if (error.message === 'Not enough points to redeem this reward') {
        return res.status(400).json({
          success: false,
          message: 'Not enough points to redeem this reward'
        });
      }
      
      if (error.message === 'This reward is only available to premium users') {
        return res.status(403).json({
          success: false,
          message: 'This reward is only available to premium users'
        });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to redeem reward'
    });
  }
});

// Get user's redeemed rewards
router.get('/user/redeemed', authenticateToken, async (req, res) => {
  try {
    const userRewards = await Reward.getUserRewards(req.user.id);
    
    res.json({
      success: true,
      data: userRewards
    });
  } catch (error) {
    console.error('Get user rewards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user rewards'
    });
  }
});

// Admin endpoints for managing rewards - would require admin authentication

// Create reward (admin only - not implemented here)
router.post('/admin/create', async (req, res) => {
  // This would require admin authentication
  res.status(501).json({
    success: false,
    message: 'Admin functionality not implemented'
  });
});

// Update reward (admin only - not implemented here)
router.put('/admin/:id', async (req, res) => {
  // This would require admin authentication
  res.status(501).json({
    success: false,
    message: 'Admin functionality not implemented'
  });
});

module.exports = router;
