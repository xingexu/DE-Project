const { pool, query } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create new user
  static async create(userData) {
    const { email, password, name, avatar = '👤', isPremium = false } = userData;
    
    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Calculate initial points based on account type
        const initialPoints = isPremium ? 2000 : 1000;
        
        // Premium expiry (30 days if premium)
        const premiumExpiry = isPremium ? 
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
        
        // Insert user
        const userResult = await client.query(`
          INSERT INTO users (
            email, password_hash, name, avatar, points, 
            is_premium, premium_expiry
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, email, name, avatar, points, level, experience, 
                   is_premium, premium_expiry, created_at
        `, [email, passwordHash, name, avatar, initialPoints, isPremium, premiumExpiry]);
        
        await client.query('COMMIT');
        return userResult.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const result = await query(`
        SELECT * FROM users WHERE email = $1
      `, [email]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const result = await query(`
        SELECT id, email, name, avatar, points, level, experience, weekly_points, 
               total_trips, total_distance, total_time, is_premium, premium_expiry,
               location_sharing, friend_requests, chat_enabled, message_requests, created_at
        FROM users WHERE id = $1
      `, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Authenticate user
  static async authenticate(email, password) {
    try {
      const user = await this.findByEmail(email);
      if (!user) return null;
      
      const isValid = await bcrypt.compare(password, user.password_hash);
      
      // If valid, check if premium has expired
      if (isValid && user.is_premium && user.premium_expiry) {
        const now = new Date();
        const expiryDate = new Date(user.premium_expiry);
        
        if (expiryDate < now) {
          // Premium has expired, update user
          await query(`
            UPDATE users 
            SET is_premium = false, premium_expiry = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [user.id]);
          
          user.is_premium = false;
          user.premium_expiry = null;
        }
      }
      
      return isValid ? user : null;
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  }

  // Update user points and experience
  static async updatePoints(id, pointsEarned, distance, time) {
    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Get user info to check premium status
        const userResult = await client.query(`
          SELECT is_premium FROM users WHERE id = $1
        `, [id]);
        
        const user = userResult.rows[0];
        if (!user) {
          throw new Error('User not found');
        }
        
        // Apply premium multiplier if applicable
        const multiplier = user.is_premium ? 2 : 1;
        const adjustedPoints = Math.floor(pointsEarned * multiplier);
        
        // Update user stats
        const updatedUserResult = await client.query(`
          UPDATE users 
          SET points = points + $1,
              weekly_points = weekly_points + $1,
              total_trips = total_trips + 1,
              total_distance = total_distance + $2,
              total_time = total_time + $3,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
          RETURNING *
        `, [adjustedPoints, distance, time, id]);
        
        // Calculate new level based on experience
        const newExperience = Math.floor(adjustedPoints * 0.1); // 10% of points become experience
        const currentLevel = updatedUserResult.rows[0].level;
        const totalExperience = updatedUserResult.rows[0].experience + newExperience;
        const newLevel = Math.floor(totalExperience / 100) + 1;
        
        // Update level and experience
        await client.query(`
          UPDATE users 
          SET level = $1, experience = $2
          WHERE id = $3
        `, [newLevel, totalExperience, id]);
        
        // Get final user data
        const finalResult = await client.query(`
          SELECT id, email, name, avatar, points, level, experience, weekly_points,
                 total_trips, total_distance, total_time, is_premium
          FROM users WHERE id = $1
        `, [id]);
        
        await client.query('COMMIT');
        
        // Return updated user with level up info
        return {
          user: finalResult.rows[0],
          levelUp: newLevel > currentLevel,
          pointsEarned: adjustedPoints,
          experience: newExperience
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating points:', error);
      throw error;
    }
  }

  // Get user statistics
  static async getStats(id) {
    try {
      const result = await query(`
        SELECT 
          points, level, experience, weekly_points,
          total_trips, total_distance, total_time,
          is_premium, premium_expiry
        FROM users WHERE id = $1
      `, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(id, updates) {
    try {
      const allowedFields = ['name', 'avatar', 'location_sharing', 'friend_requests', 'chat_enabled', 'message_requests'];
      const updateFields = [];
      const values = [];
      let paramCount = 1;
      
      // Build dynamic update query
      for (const [field, value] of Object.entries(updates)) {
        if (allowedFields.includes(field)) {
          updateFields.push(`${field} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }
      
      // If no valid fields, return null
      if (updateFields.length === 0) return null;
      
      values.push(id);
      
      const result = await query(`
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING id, email, name, avatar, points, level, experience, weekly_points,
                 total_trips, total_distance, total_time, is_premium, premium_expiry,
                 location_sharing, friend_requests, chat_enabled, message_requests, created_at
      `, values);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Update password
  static async updatePassword(id, currentPassword, newPassword) {
    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Get current password hash
        const userResult = await client.query(`
          SELECT password_hash FROM users WHERE id = $1
        `, [id]);
        
        const user = userResult.rows[0];
        if (!user) {
          throw new Error('User not found');
        }
        
        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValid) {
          return { success: false, message: 'Current password is incorrect' };
        }
        
        // Hash new password
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        
        // Update password
        await client.query(`
          UPDATE users 
          SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [newPasswordHash, id]);
        
        // Invalidate all sessions
        await client.query(`
          DELETE FROM user_sessions WHERE user_id = $1
        `, [id]);
        
        await client.query('COMMIT');
        
        return { success: true, message: 'Password updated successfully' };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  // Upgrade to premium
  static async upgradeToPremium(id, expiryDate) {
    try {
      // Default to 30 days if no expiry date provided
      const expiry = expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const result = await query(`
        UPDATE users 
        SET is_premium = true, premium_expiry = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, email, name, avatar, points, level, experience, 
                 is_premium, premium_expiry, created_at
      `, [expiry, id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      throw error;
    }
  }
  
  // Cancel premium
  static async cancelPremium(id) {
    try {
      const result = await query(`
        UPDATE users 
        SET is_premium = false, premium_expiry = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, name, avatar, points, level, experience, 
                 is_premium, premium_expiry, created_at
      `, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error canceling premium:', error);
      throw error;
    }
  }
  
  // Reset user's weekly stats
  static async resetWeeklyStats(id) {
    try {
      const result = await query(`
        UPDATE users 
        SET weekly_points = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, weekly_points
      `, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error resetting weekly stats:', error);
      throw error;
    }
  }
  
  // Delete user account
  static async deleteAccount(id) {
    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Delete user's sessions
        await client.query(`
          DELETE FROM user_sessions WHERE user_id = $1
        `, [id]);
        
        // Delete the user
        await client.query(`
          DELETE FROM users WHERE id = $1
        `, [id]);
        
        await client.query('COMMIT');
        
        return { success: true };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }
}

module.exports = User;