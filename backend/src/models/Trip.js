const { query } = require('../config/database');
const User = require('./User');

class Trip {
  // Create a new trip record
  static async create(tripData) {
    const {
      userId,
      transitLineId,
      startTime,
      endTime,
      distance,
      duration,
      startLocation,
      endLocation
    } = tripData;
    
    try {
      const { getClient } = require('../config/database');
      const client = await getClient();
      
      try {
        await client.query('BEGIN');
        
        // Calculate points earned: 10 points per km and 10 points per minute
        const distancePoints = Math.floor(distance * 10);
        const timePoints = Math.floor(duration * 10);
        const totalPoints = distancePoints + timePoints;
        
        // Insert trip record
        const tripResult = await client.query(`
          INSERT INTO trips (
            user_id, transit_line_id, start_time, end_time,
            distance, duration, points_earned, status,
            start_location, end_location
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `, [
          userId,
          transitLineId || null,
          startTime,
          endTime || null,
          distance,
          duration,
          totalPoints,
          'completed',
          JSON.stringify(startLocation),
          endLocation ? JSON.stringify(endLocation) : null
        ]);
        
        // Update user stats
        const userStatsResult = await User.updatePoints(
          userId,
          totalPoints,
          distance,
          duration
        );
        
        await client.query('COMMIT');
        
        return {
          tripId: tripResult.rows[0].id,
          pointsEarned: totalPoints,
          user: userStatsResult.user,
          levelUp: userStatsResult.levelUp
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      throw error;
    }
  }

  // Get trips for a specific user
  static async getByUserId(userId, options = {}) {
    const { limit = 10, offset = 0, sort = 'latest' } = options;
    
    try {
      const sortOrder = sort === 'oldest' ? 'ASC' : 'DESC';
      
      const result = await query(`
        SELECT t.id, t.start_time, t.end_time, t.distance, t.duration,
               t.points_earned, t.start_location, t.end_location,
               tl.id as line_id, tl.name as line_name, tl.type as line_type
        FROM trips t
        LEFT JOIN transit_lines tl ON t.transit_line_id = tl.id
        WHERE t.user_id = $1 AND t.status = 'completed'
        ORDER BY t.start_time ${sortOrder}
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);
      
      // Get total count
      const countResult = await query(`
        SELECT COUNT(*) FROM trips
        WHERE user_id = $1 AND status = 'completed'
      `, [userId]);
      
      return {
        trips: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
    } catch (error) {
      console.error('Error getting trips by user ID:', error);
      throw error;
    }
  }

  // Get trip by ID
  static async getById(id) {
    try {
      const result = await query(`
        SELECT t.id, t.user_id, t.transit_line_id, t.start_time, t.end_time, 
               t.distance, t.duration, t.points_earned, t.status,
               t.start_location, t.end_location, t.created_at,
               tl.name as line_name, tl.type as line_type
        FROM trips t
        LEFT JOIN transit_lines tl ON t.transit_line_id = tl.id
        WHERE t.id = $1
      `, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting trip by ID:', error);
      throw error;
    }
  }

  // Get user trips summary (for dashboard/stats)
  static async getUserSummary(userId) {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_trips,
          SUM(distance) as total_distance,
          SUM(duration) as total_duration,
          SUM(points_earned) as total_points,
          AVG(distance) as avg_distance,
          AVG(duration) as avg_duration,
          MAX(distance) as max_distance,
          MAX(duration) as max_duration,
          MAX(points_earned) as max_points
        FROM trips
        WHERE user_id = $1 AND status = 'completed'
      `, [userId]);
      
      // Weekly stats
      const weeklyResult = await query(`
        SELECT 
          COUNT(*) as weekly_trips,
          SUM(distance) as weekly_distance,
          SUM(duration) as weekly_duration,
          SUM(points_earned) as weekly_points
        FROM trips
        WHERE user_id = $1 
        AND status = 'completed'
        AND start_time > NOW() - INTERVAL '7 days'
      `, [userId]);
      
      // Most used transit lines
      const linesResult = await query(`
        SELECT 
          tl.id, tl.name, tl.type,
          COUNT(*) as trip_count,
          SUM(t.distance) as total_distance,
          AVG(t.duration) as avg_duration
        FROM trips t
        JOIN transit_lines tl ON t.transit_line_id = tl.id
        WHERE t.user_id = $1 AND t.status = 'completed'
        AND t.transit_line_id IS NOT NULL
        GROUP BY tl.id, tl.name, tl.type
        ORDER BY trip_count DESC
        LIMIT 5
      `, [userId]);
      
      return {
        summary: result.rows[0],
        weekly: weeklyResult.rows[0],
        favoriteLines: linesResult.rows
      };
    } catch (error) {
      console.error('Error getting user trips summary:', error);
      throw error;
    }
  }

  // Update trip status
  static async updateStatus(id, status) {
    try {
      const result = await query(`
        UPDATE trips
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, status
      `, [status, id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating trip status:', error);
      throw error;
    }
  }

  // Get premium insights (requires premium account)
  static async getPremiumInsights(userId) {
    try {
      // Get transit efficiency data
      const efficiencyResult = await query(`
        SELECT 
          DATE_TRUNC('day', start_time)::date as day,
          SUM(distance) as total_distance,
          SUM(duration) as total_duration,
          COUNT(*) as trip_count,
          AVG(points_earned) as avg_points
        FROM trips
        WHERE user_id = $1 AND status = 'completed'
        AND start_time > NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', start_time)
        ORDER BY day DESC
      `, [userId]);
      
      // Get most used transit lines
      const linesResult = await query(`
        SELECT 
          tl.id, tl.name, tl.type,
          COUNT(*) as trip_count,
          SUM(t.distance) as total_distance,
          AVG(t.duration) as avg_duration
        FROM trips t
        JOIN transit_lines tl ON t.transit_line_id = tl.id
        WHERE t.user_id = $1 AND t.status = 'completed'
        AND t.transit_line_id IS NOT NULL
        GROUP BY tl.id, tl.name, tl.type
        ORDER BY trip_count DESC
        LIMIT 5
      `, [userId]);
      
      // Get popular times
      const timesResult = await query(`
        SELECT 
          EXTRACT(DOW FROM start_time) as day_of_week,
          EXTRACT(HOUR FROM start_time) as hour_of_day,
          COUNT(*) as trip_count
        FROM trips
        WHERE user_id = $1 AND status = 'completed'
        GROUP BY day_of_week, hour_of_day
        ORDER BY trip_count DESC
        LIMIT 10
      `, [userId]);
      
      return {
        dailyStats: efficiencyResult.rows,
        favoriteLines: linesResult.rows,
        popularTimes: timesResult.rows
      };
    } catch (error) {
      console.error('Error getting premium insights:', error);
      throw error;
    }
  }
}

module.exports = Trip;
