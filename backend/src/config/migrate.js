const { query } = require('./database');

const createTables = async () => {
  try {
    console.log('🚀 Starting database migration...');

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar VARCHAR(10) DEFAULT '👤',
        points INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        weekly_points INTEGER DEFAULT 0,
        total_trips INTEGER DEFAULT 0,
        total_distance DECIMAL(10,2) DEFAULT 0,
        total_time DECIMAL(10,2) DEFAULT 0,
        is_premium BOOLEAN DEFAULT FALSE,
        premium_expiry TIMESTAMP,
        location_sharing BOOLEAN DEFAULT FALSE,
        friend_requests BOOLEAN DEFAULT TRUE,
        chat_enabled BOOLEAN DEFAULT TRUE,
        message_requests BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Transit lines table
    await query(`
      CREATE TABLE IF NOT EXISTS transit_lines (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        route JSONB NOT NULL,
        rating DECIMAL(3,2) DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        reliability INTEGER DEFAULT 80,
        noise_level VARCHAR(20) DEFAULT 'medium',
        occupancy VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Transit lines table created');

    // Trips table
    await query(`
      CREATE TABLE IF NOT EXISTS trips (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        transit_line_id INTEGER REFERENCES transit_lines(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        distance DECIMAL(10,2),
        duration INTEGER, -- in minutes
        points_earned INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        start_location JSONB,
        end_location JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Trips table created');

    // Rewards table
    await query(`
      CREATE TABLE IF NOT EXISTS rewards (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        points_cost INTEGER NOT NULL,
        category VARCHAR(100),
        is_premium BOOLEAN DEFAULT FALSE,
        is_available BOOLEAN DEFAULT TRUE,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Rewards table created');

    // User rewards table (for tracking redeemed rewards)
    await query(`
      CREATE TABLE IF NOT EXISTS user_rewards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reward_id INTEGER REFERENCES rewards(id),
        redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active'
      )
    `);
    console.log('✅ User rewards table created');

    // Friends table
    await query(`
      CREATE TABLE IF NOT EXISTS friends (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, friend_id)
      )
    `);
    console.log('✅ Friends table created');

    // User sessions table (for JWT token management)
    await query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ User sessions table created');

    // Create indexes for better performance
    await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await query('CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_transit_lines_type ON transit_lines(type)');
    await query('CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status)');
    
    console.log('✅ Database indexes created');

    console.log('🎉 Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createTables };

