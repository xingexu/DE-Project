const { pool } = require('../config/database');

class Message {
  // Send a message to a group chat
  static async sendGroupMessage(groupId, senderId, content, type = 'text') {
    const query = `
      INSERT INTO group_messages (group_id, sender_id, content, type, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [groupId, senderId, content, type]);
    return result.rows[0];
  }

  // Send a direct message
  static async sendDirectMessage(senderId, recipientId, content, type = 'text') {
    const query = `
      INSERT INTO direct_messages (sender_id, recipient_id, content, type, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [senderId, recipientId, content, type]);
    return result.rows[0];
  }

  // Get group messages
  static async getGroupMessages(groupId, limit = 50, offset = 0) {
    const query = `
      SELECT gm.*,
             u.name as sender_name,
             u.avatar as sender_avatar,
             u.level as sender_level
      FROM group_messages gm
      JOIN users u ON gm.sender_id = u.id
      WHERE gm.group_id = $1
      ORDER BY gm.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [groupId, limit, offset]);

    // Reverse to get chronological order (oldest first)
    return result.rows.reverse();
  }

  // Get direct messages between two users
  static async getDirectMessages(userId1, userId2, limit = 50, offset = 0) {
    const query = `
      SELECT dm.*,
             CASE
               WHEN dm.sender_id = $1 THEN $1
               ELSE $2
             END as current_user_id,
             u1.name as sender_name,
             u1.avatar as sender_avatar,
             u1.level as sender_level
      FROM direct_messages dm
      JOIN users u1 ON dm.sender_id = u1.id
      WHERE (dm.sender_id = $1 AND dm.recipient_id = $2)
         OR (dm.sender_id = $2 AND dm.recipient_id = $1)
      ORDER BY dm.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    const result = await pool.query(query, [userId1, userId2, limit, offset]);

    // Reverse to get chronological order (oldest first)
    return result.rows.reverse();
  }

  // Get user's recent conversations
  static async getRecentConversations(userId, limit = 20) {
    const query = `
      SELECT
        CASE
          WHEN gm.group_id IS NOT NULL THEN 'group'
          ELSE 'direct'
        END as conversation_type,
        CASE
          WHEN gm.group_id IS NOT NULL THEN gm.group_id::text
          ELSE (
            CASE
              WHEN dm.sender_id = $1 THEN dm.recipient_id::text
              ELSE dm.sender_id::text
            END
          )
        END as conversation_id,
        CASE
          WHEN gm.group_id IS NOT NULL THEN g.name
          ELSE (
            CASE
              WHEN dm.sender_id = $1 THEN u2.name
              ELSE u1.name
            END
          )
        END as conversation_name,
        CASE
          WHEN gm.group_id IS NOT NULL THEN g.icon
          ELSE (
            CASE
              WHEN dm.sender_id = $1 THEN u2.avatar
              ELSE u1.avatar
            END
          )
        END as conversation_avatar,
        GREATEST(
          COALESCE(gm.created_at, '1970-01-01'),
          COALESCE(dm.created_at, '1970-01-01')
        ) as last_message_time,
        CASE
          WHEN gm.group_id IS NOT NULL THEN gm.content
          ELSE dm.content
        END as last_message
      FROM (
        -- Group conversations
        SELECT DISTINCT gm.group_id, gm.created_at, gm.content
        FROM group_messages gm
        JOIN group_members gmem ON gm.group_id = gmem.group_id
        WHERE gmem.user_id = $1
      ) gm
      FULL OUTER JOIN (
        -- Direct conversations
        SELECT dm.sender_id, dm.recipient_id, dm.created_at, dm.content
        FROM direct_messages dm
        WHERE dm.sender_id = $1 OR dm.recipient_id = $1
      ) dm ON false
      LEFT JOIN groups g ON gm.group_id = g.id
      LEFT JOIN users u1 ON dm.sender_id = u1.id
      LEFT JOIN users u2 ON dm.recipient_id = u2.id
      ORDER BY last_message_time DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  // Mark messages as read
  static async markAsRead(userId, messageIds) {
    if (!messageIds || messageIds.length === 0) return;

    const query = `
      UPDATE direct_messages
      SET read_at = NOW()
      WHERE recipient_id = $1 AND id = ANY($2::int[])
    `;
    await pool.query(query, [userId, messageIds]);
  }

  // Get unread message count for user
  static async getUnreadCount(userId) {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM direct_messages WHERE recipient_id = $1 AND read_at IS NULL) as direct_unread,
        (SELECT COUNT(*) FROM group_messages gm
         JOIN group_members gmem ON gm.group_id = gmem.group_id
         WHERE gmem.user_id = $1 AND gm.id NOT IN (
           SELECT message_id FROM message_reads WHERE user_id = $1
         )) as group_unread
    `;
    const result = await pool.query(query, [userId]);
    return {
      direct: parseInt(result.rows[0].direct_unread) || 0,
      group: parseInt(result.rows[0].group_unread) || 0,
      total: (parseInt(result.rows[0].direct_unread) || 0) + (parseInt(result.rows[0].group_unread) || 0)
    };
  }

  // Mark group message as read
  static async markGroupMessageAsRead(userId, messageId) {
    const query = `
      INSERT INTO message_reads (user_id, message_id, read_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id, message_id) DO UPDATE SET read_at = NOW()
    `;
    await pool.query(query, [userId, messageId]);
  }

  // Delete message
  static async delete(messageId, userId) {
    // For direct messages, only sender can delete
    const directQuery = `
      DELETE FROM direct_messages
      WHERE id = $1 AND sender_id = $2
    `;
    const directResult = await pool.query(directQuery, [messageId, userId]);

    if (directResult.rowCount > 0) {
      return { type: 'direct', deleted: true };
    }

    // For group messages, check if user is admin or sender
    const groupQuery = `
      DELETE FROM group_messages
      WHERE id = $1 AND (sender_id = $2 OR EXISTS(
        SELECT 1 FROM group_members gm
        JOIN groups g ON gm.group_id = g.id
        WHERE gm.user_id = $2 AND gm.group_id = group_messages.group_id
        AND (gm.role = 'admin' OR g.created_by = $2)
      ))
    `;
    const groupResult = await pool.query(groupQuery, [messageId, userId]);

    if (groupResult.rowCount > 0) {
      return { type: 'group', deleted: true };
    }

    return { deleted: false };
  }

  // Get message statistics for analytics
  static async getMessageStats(userId, period = 'week') {
    const interval = period === 'week' ? '7 days' : period === 'month' ? '30 days' : '24 hours';

    const query = `
      SELECT
        COUNT(CASE WHEN sender_id = $1 THEN 1 END) as sent_count,
        COUNT(CASE WHEN recipient_id = $1 THEN 1 END) as received_count,
        COUNT(DISTINCT CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END) as unique_conversations
      FROM direct_messages
      WHERE (sender_id = $1 OR recipient_id = $1)
        AND created_at > NOW() - INTERVAL '${interval}'
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }
}

module.exports = Message;
