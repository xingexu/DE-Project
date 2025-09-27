const { query } = require('../config/database');

class TransitLine {
  // Get all transit lines
  static async getAll() {
    try {
      const result = await query(`
        SELECT id, name, type, route, rating, rating_count,
               reliability, noise_level, occupancy, status, created_at, updated_at
        FROM transit_lines
        WHERE status = 'active'
        ORDER BY name
      `);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting transit lines:', error);
      throw error;
    }
  }

  // Get transit line by ID
  static async getById(id) {
    try {
      const result = await query(`
        SELECT id, name, type, route, rating, rating_count,
               reliability, noise_level, occupancy, status, created_at, updated_at
        FROM transit_lines
        WHERE id = $1
      `, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting transit line by ID:', error);
      throw error;
    }
  }

  // Get transit lines by type
  static async getByType(type) {
    try {
      const result = await query(`
        SELECT id, name, type, route, rating, rating_count,
               reliability, noise_level, occupancy, status, created_at, updated_at
        FROM transit_lines
        WHERE type = $1 AND status = 'active'
        ORDER BY name
      `, [type]);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting transit lines by type:', error);
      throw error;
    }
  }

  // Create a new transit line
  static async create(lineData) {
    const { name, type, route, rating = 0, ratingCount = 0, 
            reliability = 80, noiseLevel = 'medium', occupancy = 'medium' } = lineData;
    
    try {
      const result = await query(`
        INSERT INTO transit_lines
        (name, type, route, rating, rating_count, reliability, noise_level, occupancy)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, type, route, rating, rating_count, 
                 reliability, noise_level, occupancy, status, created_at
      `, [name, type, JSON.stringify(route), rating, ratingCount, reliability, noiseLevel, occupancy]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating transit line:', error);
      throw error;
    }
  }

  // Update transit line
  static async update(id, lineData) {
    try {
      const currentLine = await this.getById(id);
      if (!currentLine) {
        throw new Error('Transit line not found');
      }
      
      // Fields that can be updated
      const updates = [];
      const values = [];
      let paramCount = 1;
      
      // Build dynamic update query based on provided fields
      if (lineData.name !== undefined) {
        updates.push(`name = $${paramCount}`);
        values.push(lineData.name);
        paramCount++;
      }
      
      if (lineData.type !== undefined) {
        updates.push(`type = $${paramCount}`);
        values.push(lineData.type);
        paramCount++;
      }
      
      if (lineData.route !== undefined) {
        updates.push(`route = $${paramCount}`);
        values.push(JSON.stringify(lineData.route));
        paramCount++;
      }
      
      if (lineData.rating !== undefined) {
        updates.push(`rating = $${paramCount}`);
        values.push(lineData.rating);
        paramCount++;
      }
      
      if (lineData.ratingCount !== undefined) {
        updates.push(`rating_count = $${paramCount}`);
        values.push(lineData.ratingCount);
        paramCount++;
      }
      
      if (lineData.reliability !== undefined) {
        updates.push(`reliability = $${paramCount}`);
        values.push(lineData.reliability);
        paramCount++;
      }
      
      if (lineData.noiseLevel !== undefined) {
        updates.push(`noise_level = $${paramCount}`);
        values.push(lineData.noiseLevel);
        paramCount++;
      }
      
      if (lineData.occupancy !== undefined) {
        updates.push(`occupancy = $${paramCount}`);
        values.push(lineData.occupancy);
        paramCount++;
      }
      
      if (lineData.status !== undefined) {
        updates.push(`status = $${paramCount}`);
        values.push(lineData.status);
        paramCount++;
      }
      
      // Add updated_at timestamp
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // If no fields to update, return the current line
      if (updates.length === 0) {
        return currentLine;
      }
      
      // Add id as the last parameter
      values.push(id);
      
      const result = await query(`
        UPDATE transit_lines 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, name, type, route, rating, rating_count, 
                 reliability, noise_level, occupancy, status, created_at, updated_at
      `, values);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating transit line:', error);
      throw error;
    }
  }

  // Add or update rating for a transit line
  static async rate(id, userId, ratingData) {
    const { rating, noiseLevel, occupancy, feedback } = ratingData;
    
    try {
      const { getClient } = require('../config/database');
      const client = await getClient();
      
      try {
        await client.query('BEGIN');
        
        // Check if transit line exists
        const transitLineResult = await client.query(`
          SELECT id, name, rating, rating_count FROM transit_lines
          WHERE id = $1
        `, [id]);
        
        if (transitLineResult.rows.length === 0) {
          throw new Error('Transit line not found');
        }
        
        const transitLine = transitLineResult.rows[0];
        
        // Check if user has already rated this line
        const userRatingResult = await client.query(`
          SELECT id, rating FROM transit_line_ratings
          WHERE user_id = $1 AND transit_line_id = $2
        `, [userId, id]);
        
        let newRatingCount = transitLine.rating_count;
        let newRating;
        
        if (userRatingResult.rows.length > 0) {
          // User has already rated - update the rating
          const oldRating = userRatingResult.rows[0].rating;
          
          // Calculate the new average by removing old rating and adding new one
          const totalRatingPoints = transitLine.rating * transitLine.rating_count;
          const adjustedTotal = totalRatingPoints - oldRating + rating;
          newRating = adjustedTotal / newRatingCount;
          
          await client.query(`
            UPDATE transit_line_ratings
            SET rating = $1, noise_level = $2, occupancy = $3, feedback = $4, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $5 AND transit_line_id = $6
          `, [rating, noiseLevel, occupancy, feedback, userId, id]);
        } else {
          // New rating
          newRatingCount = transitLine.rating_count + 1;
          newRating = ((transitLine.rating * transitLine.rating_count) + rating) / newRatingCount;
          
          await client.query(`
            INSERT INTO transit_line_ratings 
            (user_id, transit_line_id, rating, noise_level, occupancy, feedback)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [userId, id, rating, noiseLevel, occupancy, feedback]);
        }
        
        // Update transit line with new rating
        const updatedLineResult = await client.query(`
          UPDATE transit_lines
          SET rating = $1, rating_count = $2, noise_level = $3, occupancy = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
          RETURNING id, name, type, rating, rating_count, reliability, noise_level, occupancy
        `, [parseFloat(newRating.toFixed(2)), newRatingCount, noiseLevel, occupancy, id]);
        
        await client.query('COMMIT');
        return updatedLineResult.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error rating transit line:', error);
      throw error;
    }
  }

  // Get nearby transit lines
  static async getNearby(lat, lng, radius = 2) {
    try {
      // Basic proximity calculation using PostgreSQL
      // Note: For production, use PostGIS or a better geo function
      const result = await query(`
        SELECT id, name, type, route, rating, rating_count,
               reliability, noise_level, occupancy, status
        FROM transit_lines
        WHERE status = 'active'
        ORDER BY name
        LIMIT 10
      `);
      
      // Filter lines by checking if any route point is within the radius
      const nearbyLines = result.rows.filter(line => {
        if (!line.route || !Array.isArray(line.route)) {
          return false;
        }
        
        return line.route.some(point => {
          const distance = this.calculateDistance(
            lat, lng, 
            point.lat, point.lng
          );
          return distance <= radius;
        });
      });
      
      return nearbyLines;
    } catch (error) {
      console.error('Error getting nearby transit lines:', error);
      throw error;
    }
  }
  
  // Calculate distance between two coordinates (Haversine formula)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  }
}

module.exports = TransitLine;
