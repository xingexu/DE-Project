const { pool } = require('../config/database');

class Post {
  // Create a new post
  static async create(postData) {
    const { authorId, content, image, type = 'status' } = postData;

    const query = `
      INSERT INTO posts (author_id, content, image, type, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [authorId, content, image, type]);
    return result.rows[0];
  }

  // Get posts from user's feed (friends + own posts)
  static async getFeed(userId, limit = 20, offset = 0) {
    const query = `
      SELECT p.*,
             u.name as author_name,
             u.avatar as author_avatar,
             u.level as author_level,
             COALESCE(pl.like_count, 0) as likes,
             COALESCE(pc.comment_count, 0) as comments,
             CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END as is_liked
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as like_count
        FROM post_likes
        GROUP BY post_id
      ) pl ON p.id = pl.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count
        FROM post_comments
        GROUP BY post_id
      ) pc ON p.id = pc.post_id
      LEFT JOIN post_likes ul ON p.id = ul.post_id AND ul.user_id = $1
      WHERE p.author_id = $1 OR p.author_id IN (
        SELECT friend_id FROM friendships WHERE user_id = $1
        UNION
        SELECT user_id FROM friendships WHERE friend_id = $1
      )
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  // Get posts by a specific user
  static async getByUserId(userId, limit = 20, offset = 0) {
    const query = `
      SELECT p.*,
             u.name as author_name,
             u.avatar as author_avatar,
             u.level as author_level,
             COALESCE(pl.like_count, 0) as likes,
             COALESCE(pc.comment_count, 0) as comments,
             CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END as is_liked
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as like_count
        FROM post_likes
        GROUP BY post_id
      ) pl ON p.id = pl.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count
        FROM post_comments
        GROUP BY post_id
      ) pc ON p.id = pc.post_id
      LEFT JOIN post_likes ul ON p.id = ul.post_id AND ul.user_id = $1
      WHERE p.author_id = $2
      ORDER BY p.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    const result = await pool.query(query, [userId, userId, limit, offset]);
    return result.rows;
  }

  // Get post by ID
  static async getById(postId) {
    const query = `
      SELECT p.*,
             u.name as author_name,
             u.avatar as author_avatar,
             u.level as author_level
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [postId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Like/unlike a post
  static async toggleLike(postId, userId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if like already exists
      const checkQuery = `
        SELECT * FROM post_likes
        WHERE post_id = $1 AND user_id = $2
      `;
      const checkResult = await client.query(checkQuery, [postId, userId]);

      if (checkResult.rows.length > 0) {
        // Unlike
        const unlikeQuery = `
          DELETE FROM post_likes
          WHERE post_id = $1 AND user_id = $2
        `;
        await client.query(unlikeQuery, [postId, userId]);
        await client.query('COMMIT');
        return { liked: false };
      } else {
        // Like
        const likeQuery = `
          INSERT INTO post_likes (post_id, user_id, created_at)
          VALUES ($1, $2, NOW())
        `;
        await client.query(likeQuery, [postId, userId]);
        await client.query('COMMIT');
        return { liked: true };
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Add comment to post
  static async addComment(postId, userId, content) {
    const query = `
      INSERT INTO post_comments (post_id, user_id, content, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [postId, userId, content]);
    return result.rows[0];
  }

  // Get comments for a post
  static async getComments(postId, limit = 50, offset = 0) {
    const query = `
      SELECT pc.*,
             u.name as author_name,
             u.avatar as author_avatar,
             u.level as author_level
      FROM post_comments pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.post_id = $1
      ORDER BY pc.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [postId, limit, offset]);
    return result.rows;
  }

  // Delete post
  static async delete(postId, userId) {
    const query = `
      DELETE FROM posts
      WHERE id = $1 AND author_id = $2
    `;
    const result = await pool.query(query, [postId, userId]);
    return result.rowCount > 0;
  }

  // Get trending posts (posts with most likes in last 24 hours)
  static async getTrending(limit = 10) {
    const query = `
      SELECT p.*,
             u.name as author_name,
             u.avatar as author_avatar,
             u.level as author_level,
             COUNT(pl.id) as likes
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN post_likes pl ON p.id = pl.post_id
      WHERE p.created_at > NOW() - INTERVAL '24 hours'
      GROUP BY p.id, u.name, u.avatar, u.level
      ORDER BY likes DESC, p.created_at DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  // Search posts
  static async search(searchTerm, userId, limit = 20, offset = 0) {
    const query = `
      SELECT p.*,
             u.name as author_name,
             u.avatar as author_avatar,
             u.level as author_level,
             COALESCE(pl.like_count, 0) as likes,
             CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END as is_liked
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as like_count
        FROM post_likes
        GROUP BY post_id
      ) pl ON p.id = pl.post_id
      LEFT JOIN post_likes ul ON p.id = ul.post_id AND ul.user_id = $2
      WHERE p.content ILIKE $1
        AND (p.author_id = $2 OR p.author_id IN (
          SELECT friend_id FROM friendships WHERE user_id = $2
          UNION
          SELECT user_id FROM friendships WHERE friend_id = $2
        ))
      ORDER BY p.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    const result = await pool.query(query, [`%${searchTerm}%`, userId, limit, offset]);
    return result.rows;
  }
}

module.exports = Post;
