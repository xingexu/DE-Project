const { query } = require('../config/database');
const User = require('./User');

class Reward {
  // Get all available rewards
  static async getAll() {
    try {
      const result = await query(`
        SELECT id, name, description, points_cost, category,
               is_premium, is_available, image_url, created_at
        FROM rewards
        WHERE is_available = true
        ORDER BY points_cost ASC
      `);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting all rewards:', error);
      throw error;
    }
  }

  // Get reward by ID
  static async getById(id) {
    try {
      const result = await query(`
        SELECT id, name, description, points_cost, category,
               is_premium, is_available, image_url, created_at
        FROM rewards
        WHERE id = $1
      `, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting reward by ID:', error);
      throw error;
    }
  }

  // Create a new reward
  static async create(rewardData) {
    const {
      name,
      description,
      pointsCost,
      category,
      isPremium = false,
      isAvailable = true,
      imageUrl
    } = rewardData;
    
    try {
      const result = await query(`
        INSERT INTO rewards
        (name, description, points_cost, category, is_premium, is_available, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, description, points_cost, category,
                 is_premium, is_available, image_url, created_at
      `, [name, description, pointsCost, category, isPremium, isAvailable, imageUrl]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating reward:', error);
      throw error;
    }
  }

  // Update a reward
  static async update(id, rewardData) {
    try {
      const currentReward = await this.getById(id);
      if (!currentReward) {
        throw new Error('Reward not found');
      }
      
      // Fields that can be updated
      const updates = [];
      const values = [];
      let paramCount = 1;
      
      if (rewardData.name !== undefined) {
        updates.push(`name = $${paramCount}`);
        values.push(rewardData.name);
        paramCount++;
      }
      
      if (rewardData.description !== undefined) {
        updates.push(`description = $${paramCount}`);
        values.push(rewardData.description);
        paramCount++;
      }
      
      if (rewardData.pointsCost !== undefined) {
        updates.push(`points_cost = $${paramCount}`);
        values.push(rewardData.pointsCost);
        paramCount++;
      }
      
      if (rewardData.category !== undefined) {
        updates.push(`category = $${paramCount}`);
        values.push(rewardData.category);
        paramCount++;
      }
      
      if (rewardData.isPremium !== undefined) {
        updates.push(`is_premium = $${paramCount}`);
        values.push(rewardData.isPremium);
        paramCount++;
      }
      
      if (rewardData.isAvailable !== undefined) {
        updates.push(`is_available = $${paramCount}`);
        values.push(rewardData.isAvailable);
        paramCount++;
      }
      
      if (rewardData.imageUrl !== undefined) {
        updates.push(`image_url = $${paramCount}`);
        values.push(rewardData.imageUrl);
        paramCount++;
      }
      
      // If no fields to update, return the current reward
      if (updates.length === 0) {
        return currentReward;
      }
      
      // Add id as the last parameter
      values.push(id);
      
      const result = await query(`
        UPDATE rewards 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, name, description, points_cost, category,
                 is_premium, is_available, image_url, created_at
      `, values);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating reward:', error);
      throw error;
    }
  }

  // Redeem a reward
  static async redeem(rewardId, userId) {
    try {
      const { getClient } = require('../config/database');
      const client = await getClient();
      
      try {
        await client.query('BEGIN');
        
        // Get reward details
        const rewardResult = await client.query(`
          SELECT * FROM rewards WHERE id = $1
        `, [rewardId]);
        
        if (rewardResult.rows.length === 0) {
          throw new Error('Reward not found');
        }
        
        const reward = rewardResult.rows[0];
        
        // Get user details
        const userResult = await client.query(`
          SELECT * FROM users WHERE id = $1
        `, [userId]);
        
        if (userResult.rows.length === 0) {
          throw new Error('User not found');
        }
        
        const user = userResult.rows[0];
        
        // Check if user can redeem this reward
        if (reward.is_premium && !user.is_premium) {
          throw new Error('This reward is only available to premium users');
        }
        
        if (user.points < reward.points_cost) {
          throw new Error('Not enough points to redeem this reward');
        }
        
        // Deduct points from user
        await client.query(`
          UPDATE users
          SET points = points - $1
          WHERE id = $2
        `, [reward.points_cost, userId]);
        
        // Record the redemption
        const redemptionResult = await client.query(`
          INSERT INTO user_rewards (user_id, reward_id)
          VALUES ($1, $2)
          RETURNING id
        `, [userId, rewardId]);
        
        await client.query('COMMIT');
        
        return {
          redemptionId: redemptionResult.rows[0].id,
          reward,
          pointsDeducted: reward.points_cost
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  }

  // Get user's redeemed rewards
  static async getUserRewards(userId) {
    try {
      const result = await query(`
        SELECT r.id, r.name, r.description, r.points_cost, r.category,
               r.is_premium, r.image_url, 
               ur.redeemed_at, ur.status
        FROM user_rewards ur
        JOIN rewards r ON ur.reward_id = r.id
        WHERE ur.user_id = $1
        ORDER BY ur.redeemed_at DESC
      `, [userId]);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting user rewards:', error);
      throw error;
    }
  }
}

module.exports = Reward;
