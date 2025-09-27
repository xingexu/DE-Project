const { pool } = require('./database');

async function createSocialTables() {
  try {
    console.log('Creating social feature tables...');

    // Friend requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS friend_requests (
        id SERIAL PRIMARY KEY,
        requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP,
        UNIQUE(requester_id, target_user_id)
      );
    `);

    // Friendships table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, friend_id),
        CHECK (user_id != friend_id)
      );
    `);

    // Groups table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        icon VARCHAR(10) DEFAULT '👥',
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true
      );
    `);

    // Group members table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
        joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP,
        UNIQUE(group_id, user_id)
      );
    `);

    // Posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        image TEXT,
        type VARCHAR(20) NOT NULL DEFAULT 'status' CHECK (type IN ('status', 'achievement', 'trip', 'photo')),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Post likes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(post_id, user_id)
      );
    `);

    // Post comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Direct messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS direct_messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'location')),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        read_at TIMESTAMP,
        CHECK (sender_id != recipient_id)
      );
    `);

    // Group messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_messages (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'location')),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Message reads table (for tracking read status in groups)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS message_reads (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message_id INTEGER NOT NULL REFERENCES group_messages(id) ON DELETE CASCADE,
        read_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, message_id)
      );
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_friend_requests_requester ON friend_requests(requester_id);
      CREATE INDEX IF NOT EXISTS idx_friend_requests_target ON friend_requests(target_user_id);
      CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

      CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
      CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);

      CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
      CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

      CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);

      CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);

      CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);

      CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at);

      CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id);
      CREATE INDEX IF NOT EXISTS idx_group_messages_sender ON group_messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at);

      CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id);
      CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads(message_id);
    `);

    console.log('✅ Social feature tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating social tables:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  createSocialTables()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createSocialTables };
