const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create new user
  static async create(userData) {
    const { email, password, name, avatar = '👤', isPremium = false } = userData;
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Calculate initial points based on account type
    const initialPoints = isPremium ? 2000 : 1000;
    
    const result = await query(`
      INSERT INTO users (email, password_hash, name, avatar, points, is_premium)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, name, avatar, points, level, experience, is_premium, created_at
    `, [email, passwordHash, name, avatar, initialPoints, isPremium]);
    
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query(`
      SELECT * FROM users WHERE email = $1
    `, [email]);
    
    return result.rows[0] || null;
  }

  // Find user by ID
  static async findById(id) {
    const result = await query(`
      SELECT id, email, name, avatar, points, level, experience, weekly_points, 
             total_trips, total_distance, total_time, is_premium, premium_expiry,
             location_sharing, friend_requests, chat_enabled, message_requests, created_at
      FROM users WHERE id = $1
    `, [id]);
    
    return result.rows[0] || null;
  }

  // Authenticate user
  static async authenticate(email, password) {
    const user = await this.findByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    return isValid ? user : null;
  }

  // Update user points and experience
  static async updatePoints(id, pointsEarned, distance, time) {
    const client = await query.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Update user stats
      const userResult = await client.query(`
        UPDATE users 
        SET points = points + $1,
            weekly_points = weekly_points + $1,
            total_trips = total_trips + 1,
            total_distance = total_distance + $2,
            total_time = total_time + $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `, [pointsEarned, distance, time, id]);
      
      // Calculate new level based on experience
      const newExperience = Math.floor(pointsEarned * 0.1); // 10% of points become experience
      const currentLevel = userResult.rows[0].level;
      const newLevel = Math.floor(newExperience / 100) + currentLevel;
      
      if (newLevel > currentLevel) {
        await client.query(`
          UPDATE users 
          SET level = $1, experience = experience + $2
          WHERE id = $3
        `, [newLevel, newExperience, id]);
      }
      
      await client.query('COMMIT');
      return userResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get user statistics
  static async getStats(id) {
    const result = await query(`
      SELECT 
        points, level, experience, weekly_points,
        total_trips, total_distance, total_time,
        is_premium, premium_expiry
      FROM users WHERE id = $1
    `, [id]);
    
    return result.rows[0] || null;
  }

  // Update user profile
  static async updateProfile(id, updates) {
    const allowedFields = ['name', 'avatar', 'location_sharing', 'friend_requests', 'chat_enabled'];
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        updateFields.push(`${field} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (updateFields.length === 0) return null;
    
    values.push(id);
    const result = await query(`
      UPDATE users 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `, values);
    
    return result.rows[0] || null;
  }

  // Upgrade to premium
  static async upgradeToPremium(id, expiryDate) {
    const result = await query(`
      UPDATE users 
      SET is_premium = true, premium_expiry = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [expiryDate, id]);
    
    return result.rows[0] || null;
  }
}

module.exports = User;

