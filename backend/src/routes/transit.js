const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const startTripSchema = Joi.object({
  transitLineId: Joi.number().integer().optional(),
  startLocation: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }).optional()
});

const endTripSchema = Joi.object({
  endLocation: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }).required()
});

// Start a trip
router.post('/trip/start', authenticateToken, async (req, res) => {
  try {
    const { error, value } = startTripSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Check if user already has an active trip
    const activeTrip = await query(`
      SELECT id FROM trips 
      WHERE user_id = $1 AND status = 'active'
    `, [req.user.id]);

    if (activeTrip.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active trip'
      });
    }

    // Create new trip
    const result = await query(`
      INSERT INTO trips (user_id, transit_line_id, start_time, start_location, status)
      VALUES ($1, $2, CURRENT_TIMESTAMP, $3, 'active')
      RETURNING id, start_time
    `, [req.user.id, value.transitLineId || null, JSON.stringify(value.startLocation || {})]);

    res.status(201).json({
      success: true,
      message: 'Trip started successfully',
      data: {
        tripId: result.rows[0].id,
        startTime: result.rows[0].start_time
      }
    });
  } catch (error) {
    console.error('Start trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start trip'
    });
  }
});

// End a trip
router.post('/trip/end', authenticateToken, async (req, res) => {
  try {
    const { error, value } = endTripSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Get active trip
    const activeTrip = await query(`
      SELECT id, start_time, start_location FROM trips 
      WHERE user_id = $1 AND status = 'active'
      ORDER BY start_time DESC LIMIT 1
    `, [req.user.id]);

    if (activeTrip.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active trip found'
      });
    }

    const trip = activeTrip.rows[0];
    const startTime = new Date(trip.start_time);
    const endTime = new Date();
    const duration = Math.floor((endTime - startTime) / (1000 * 60)); // minutes

    // Calculate distance (simplified - in real app, use actual GPS tracking)
    const startLat = trip.start_location?.lat || 43.6532;
    const startLng = trip.start_location?.lng || -79.3832;
    const endLat = value.endLocation.lat;
    const endLng = value.endLocation.lng;
    
    // Simple distance calculation (Haversine formula would be better)
    const distance = Math.sqrt(
      Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2)
    ) * 111; // Rough conversion to km

    // Calculate taubits: each km = 10 taubits, each minute = 10 taubits
    const taubitsEarned = Math.floor(distance * 10) + Math.floor(duration * 10);

    // Update trip
    await query(`
      UPDATE trips 
      SET end_time = CURRENT_TIMESTAMP, 
          end_location = $1,
          distance = $2,
          duration = $3,
          points_earned = $4,
          status = 'completed'
      WHERE id = $5
    `, [JSON.stringify(value.endLocation), distance, duration, taubitsEarned, trip.id]);

    // Update user points and stats
    const { query: userQuery } = require('../config/database');
    const client = await userQuery.getClient();
    
    try {
      await client.query('BEGIN');
      
      await client.query(`
        UPDATE users 
        SET points = points + $1,
            weekly_points = weekly_points + $1,
            total_trips = total_trips + 1,
            total_distance = total_distance + $2,
            total_time = total_time + $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [taubitsEarned, distance, duration, req.user.id]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    res.json({
      success: true,
      message: 'Trip completed successfully',
      data: {
        tripId: trip.id,
        distance: Math.round(distance * 100) / 100,
        duration,
        taubitsEarned,
        startTime: trip.start_time,
        endTime
      }
    });
  } catch (error) {
    console.error('End trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end trip'
    });
  }
});

// Get user's trip history
router.get('/trips', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(`
      SELECT t.*, tl.name as transit_line_name, tl.type as transit_line_type
      FROM trips t
      LEFT JOIN transit_lines tl ON t.transit_line_id = tl.id
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    const countResult = await query(`
      SELECT COUNT(*) FROM trips WHERE user_id = $1
    `, [req.user.id]);

    res.json({
      success: true,
      data: {
        trips: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trip history'
    });
  }
});

// Get transit lines
router.get('/lines', async (req, res) => {
  try {
    const { type, status = 'active' } = req.query;
    
    let queryText = `
      SELECT * FROM transit_lines 
      WHERE status = $1
    `;
    let queryParams = [status];

    if (type) {
      queryText += ' AND type = $2';
      queryParams.push(type);
    }

    queryText += ' ORDER BY name';

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get transit lines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transit lines'
    });
  }
});

// Rate a transit line
router.post('/lines/:id/rate', authenticateToken, async (req, res) => {
  try {
    const { rating, noiseLevel, occupancy } = req.body;
    const lineId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Get current line data
    const lineResult = await query(`
      SELECT rating, rating_count FROM transit_lines WHERE id = $1
    `, [lineId]);

    if (lineResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transit line not found'
      });
    }

    const currentLine = lineResult.rows[0];
    const newRatingCount = currentLine.rating_count + 1;
    const newRating = ((currentLine.rating * currentLine.rating_count) + rating) / newRatingCount;

    // Calculate new reliability based on rating
    let newReliability = currentLine.reliability || 80;
    if (rating >= 4) {
      newReliability = Math.min(100, newReliability + 2);
    } else if (rating <= 2) {
      newReliability = Math.max(60, newReliability - 3);
    }

    // Update line
    await query(`
      UPDATE transit_lines 
      SET rating = $1, 
          rating_count = $2, 
          reliability = $3,
          noise_level = $4,
          occupancy = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `, [newRating, newRatingCount, newReliability, noiseLevel || 'medium', occupancy || 'medium', lineId]);

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        newRating: Math.round(newRating * 100) / 100,
        newReliability
      }
    });
  } catch (error) {
    console.error('Rate line error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating'
    });
  }
});

module.exports = router;

