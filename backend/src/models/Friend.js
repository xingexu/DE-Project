const { pool } = require('../config/database');

class Friend {
  // Send friend request
  static async sendFriendRequest(requesterId, targetUserId) {
    const query = `
      INSERT INTO friend_requests (requester_id, target_user_id, status, created_at)
      VALUES ($1, $2, 'pending', NOW())
      ON CONFLICT (requester_id, target_user_id)
      DO UPDATE SET created_at = NOW()
      RETURNING *
    `;
    const result = await pool.query(query, [requesterId, targetUserId]);
    return result.rows[0];
  }

  // Get friend requests for a user
  static async getFriendRequests(userId) {
    const query = `
      SELECT fr.*, u.name, u.avatar, u.email
      FROM friend_requests fr
      JOIN users u ON fr.requester_id = u.id
      WHERE fr.target_user_id = $1 AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Accept friend request
  static async acceptFriendRequest(requestId, targetUserId) {
    // First verify the request exists and belongs to the user
    const checkQuery = `
      SELECT * FROM friend_requests
      WHERE id = $1 AND target_user_id = $2 AND status = 'pending'
    `;
    const checkResult = await pool.query(checkQuery, [requestId, targetUserId]);

    if (checkResult.rows.length === 0) {
      throw new Error('Friend request not found or already processed');
    }

    // Start transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update friend request status
      const updateQuery = `
        UPDATE friend_requests
        SET status = 'accepted', updated_at = NOW()
        WHERE id = $1
      `;
      await client.query(updateQuery, [requestId]);

      // Add friendship records
      const friendshipData = [
        { user_id: checkResult.rows[0].requester_id, friend_id: targetUserId },
        { user_id: targetUserId, friend_id: checkResult.rows[0].requester_id }
      ];

      const insertFriendshipQuery = `
        INSERT INTO friendships (user_id, friend_id, created_at)
        VALUES ($1, $2, NOW()), ($3, $4, NOW())
        ON CONFLICT (user_id, friend_id) DO NOTHING
      `;
      await client.query(insertFriendshipQuery, [
        friendshipData[0].user_id,
        friendshipData[0].friend_id,
        friendshipData[1].user_id,
        friendshipData[1].friend_id
      ]);

      await client.query('COMMIT');

      return { success: true, message: 'Friend request accepted' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Reject friend request
  static async rejectFriendRequest(requestId, targetUserId) {
    const query = `
      UPDATE friend_requests
      SET status = 'rejected', updated_at = NOW()
      WHERE id = $1 AND target_user_id = $2 AND status = 'pending'
    `;
    const result = await pool.query(query, [requestId, targetUserId]);

    if (result.rowCount === 0) {
      throw new Error('Friend request not found or already processed');
    }

    return { success: true, message: 'Friend request rejected' };
  }

  // Remove friend
  static async removeFriend(userId, friendId) {
    const query = `
      DELETE FROM friendships
      WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
    `;
    const result = await pool.query(query, [userId, friendId]);

    if (result.rowCount === 0) {
      throw new Error('Friendship not found');
    }

    return { success: true, message: 'Friend removed' };
  }

  // Get user's friends
  static async getFriends(userId) {
    const query = `
      SELECT u.id, u.name, u.avatar, u.email,
             CASE WHEN u.last_seen > NOW() - INTERVAL '5 minutes' THEN true ELSE false END as is_online,
             u.last_seen,
             f.created_at as friendship_date
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = $1
      ORDER BY u.name
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Check if users are friends
  static async areFriends(userId1, userId2) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM friendships
        WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
      ) as is_friends
    `;
    const result = await pool.query(query, [userId1, userId2]);
    return result.rows[0].is_friends;
  }

  // Get friendship status between users
  static async getFriendshipStatus(userId1, userId2) {
    // Check if they are friends
    const friendsQuery = `
      SELECT EXISTS(
        SELECT 1 FROM friendships
        WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
      ) as is_friends
    `;
    const friendsResult = await pool.query(friendsQuery, [userId1, userId2]);

    if (friendsResult.rows[0].is_friends) {
      return 'friends';
    }

    // Check if there's a pending request
    const requestQuery = `
      SELECT
        CASE
          WHEN requester_id = $1 THEN 'sent'
          WHEN target_user_id = $1 THEN 'received'
          ELSE 'none'
        END as request_status
      FROM friend_requests
      WHERE (requester_id = $1 AND target_user_id = $2)
         OR (requester_id = $2 AND target_user_id = $1)
      LIMIT 1
    `;
    const requestResult = await pool.query(requestQuery, [userId1, userId2]);

    if (requestResult.rows.length > 0) {
      return requestResult.rows[0].request_status;
    }

    return 'none';
  }
}

module.exports = Friend;
