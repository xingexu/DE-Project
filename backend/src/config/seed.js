const { query } = require('./database');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if users table has data
    const userCheck = await query('SELECT COUNT(*) FROM users');
    if (userCheck.rows[0].count > 0) {
      console.log('📊 Users table already has data, skipping user seeding');
    } else {
      // Create admin user
      const saltRounds = 12;
      const adminPasswordHash = await bcrypt.hash('admin123', saltRounds);
      
      await query(`
        INSERT INTO users (
          email, password_hash, name, avatar, points, level, 
          experience, is_premium, location_sharing
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        'admin@transportaution.com', 
        adminPasswordHash, 
        'Admin User',
        '👑', 
        5000,
        10,
        950,
        true,
        true
      ]);
      
      // Create demo user
      const demoPasswordHash = await bcrypt.hash('demo123', saltRounds);
      
      await query(`
        INSERT INTO users (
          email, password_hash, name, avatar, points, level, 
          experience, is_premium, location_sharing
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        'demo@transportaution.com', 
        demoPasswordHash, 
        'Demo User',
        '🚌', 
        1500,
        3,
        250,
        false,
        false
      ]);
      
      console.log('✅ Users seeded successfully');
    }

    // Check if transit_lines table has data
    const transitLineCheck = await query('SELECT COUNT(*) FROM transit_lines');
    if (transitLineCheck.rows[0].count > 0) {
      console.log('📊 Transit lines table already has data, skipping transit line seeding');
    } else {
      // Seed transit lines
      await query(`
        INSERT INTO transit_lines (name, type, route, rating, rating_count, reliability, noise_level, occupancy)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8),
        ($9, $10, $11, $12, $13, $14, $15, $16),
        ($17, $18, $19, $20, $21, $22, $23, $24)
      `, [
        // Line 1
        '501 Queen', 
        'streetcar',
        JSON.stringify([
          { lat: 43.6532, lng: -79.3832 },
          { lat: 43.6540, lng: -79.3840 },
          { lat: 43.6550, lng: -79.3850 }
        ]),
        4.2,
        156,
        85,
        'low',
        'medium',
        
        // Line 2
        '510 Spadina',
        'streetcar',
        JSON.stringify([
          { lat: 43.6540, lng: -79.3840 },
          { lat: 43.6550, lng: -79.3850 },
          { lat: 43.6560, lng: -79.3860 }
        ]),
        4.5,
        203,
        92,
        'low',
        'high',
        
        // Line 3
        '1 Yonge-University',
        'subway',
        JSON.stringify([
          { lat: 43.6550, lng: -79.3850 },
          { lat: 43.6560, lng: -79.3860 },
          { lat: 43.6570, lng: -79.3870 }
        ]),
        4.8,
        342,
        95,
        'medium',
        'high'
      ]);
      
      console.log('✅ Transit lines seeded successfully');
    }

    // Check if rewards table has data
    const rewardsCheck = await query('SELECT COUNT(*) FROM rewards');
    if (rewardsCheck.rows[0].count > 0) {
      console.log('📊 Rewards table already has data, skipping rewards seeding');
    } else {
      // Seed rewards
      await query(`
        INSERT INTO rewards (name, description, points_cost, category, is_premium, is_available, image_url)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7),
        ($8, $9, $10, $11, $12, $13, $14),
        ($15, $16, $17, $18, $19, $20, $21)
      `, [
        // Reward 1
        'Free Coffee',
        'Get a free coffee at participating locations',
        100,
        'discount',
        false,
        true,
        '☕',
        
        // Reward 2
        'Premium Avatar',
        'Unlock a special premium avatar',
        500,
        'avatar',
        true,
        true,
        '👑',
        
        // Reward 3
        'Route Skin',
        'Customize your transit route display',
        300,
        'route-skin',
        false,
        true,
        '🎨'
      ]);
      
      console.log('✅ Rewards seeded successfully');
    }

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };