const express = require('express');
const Joi = require('joi');
const { authenticateToken, requirePremium } = require('../middleware/auth');
const TransitLine = require('../models/TransitLine');
const Trip = require('../models/Trip');

const router = express.Router();

// Validation schemas
const tripSchema = Joi.object({
  transitLineId: Joi.number().optional(),
  startTime: Joi.date().required(),
  endTime: Joi.date().optional(),
  distance: Joi.number().positive().required(),
  duration: Joi.number().positive().required(),
  startLocation: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required()
  }).required(),
  endLocation: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required()
  }).optional(),
});

const ratingSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  noiseLevel: Joi.string().valid('low', 'medium', 'high').required(),
  occupancy: Joi.string().valid('low', 'medium', 'high').required(),
  feedback: Joi.string().max(500).optional()
});

const nearbySchema = Joi.object({
  lat: Joi.number().required(),
  lng: Joi.number().required(),
  radius: Joi.number().min(0.1).max(10).optional()
});

// Get all transit lines
router.get('/lines', async (req, res) => {
  try {
    const lines = await TransitLine.getAll();
    
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

// Get transit lines by type
router.get('/lines/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['bus', 'subway', 'streetcar'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transit line type'
      });
    }
    
    const lines = await TransitLine.getByType(type);
    
    res.json({
      success: true,
      data: lines
    });
  } catch (error) {
    console.error('Get transit lines by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transit lines'
    });
  }
});

// Get transit line by ID
router.get('/lines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const line = await TransitLine.getById(id);
    
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

// Get nearby transit lines
router.get('/nearby', async (req, res) => {
  try {
    // Validate input
    const { error, value } = nearbySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const { lat, lng, radius = 2 } = value;
    const nearbyLines = await TransitLine.getNearby(lat, lng, radius);
    
    res.json({
      success: true,
      data: nearbyLines
    });
  } catch (error) {
    console.error('Get nearby transit lines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby transit lines'
    });
  }
});

// Rate a transit line
router.post('/lines/:id/rate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate input
    const { error, value } = ratingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    // Rate the transit line
    const updatedLine = await TransitLine.rate(id, req.user.id, value);
    
    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        transitLine: updatedLine,
        pointsEarned: 50 // Fixed points for rating
      }
    });
  } catch (error) {
    console.error('Rate transit line error:', error);
    
    if (error.message === 'Transit line not found') {
      return res.status(404).json({
        success: false,
        message: 'Transit line not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating'
    });
  }
});

// Record a trip
router.post('/trips', authenticateToken, async (req, res) => {
  try {
    // Validate input
    const { error, value } = tripSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const tripData = {
      userId: req.user.id,
      transitLineId: value.transitLineId,
      startTime: value.startTime,
      endTime: value.endTime,
      distance: value.distance,
      duration: value.duration,
      startLocation: value.startLocation,
      endLocation: value.endLocation
    };
    
    // Create trip record
    const result = await Trip.create(tripData);
    
    res.status(201).json({
      success: true,
      message: 'Trip recorded successfully',
      data: result
    });
  } catch (error) {
    console.error('Record trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record trip'
    });
  }
});

// Get user's trips
router.get('/trips', authenticateToken, async (req, res) => {
  try {
    const { limit, offset, sort } = req.query;
    
    const result = await Trip.getByUserId(req.user.id, {
      limit: parseInt(limit) || 10,
      offset: parseInt(offset) || 0,
      sort: sort || 'latest'
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trips'
    });
  }
});

// Get trip details
router.get('/trips/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const trip = await Trip.getById(id);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    // Check if user owns the trip
    if (trip.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only access your own trips'
      });
    }
    
    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trip details'
    });
  }
});

// Get user trips summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const summary = await Trip.getUserSummary(req.user.id);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get trips summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trips summary'
    });
  }
});

// Get premium insights (requires premium account)
router.get('/insights', authenticateToken, requirePremium, async (req, res) => {
  try {
    const insights = await Trip.getPremiumInsights(req.user.id);
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get insights'
    });
  }
});

module.exports = router;