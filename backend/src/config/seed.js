const { query } = require('./database');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Seed transit lines
    const transitLines = [
      {
        name: '501 Queen',
        type: 'streetcar',
        route: [{ lat: 43.6532, lng: -79.3832 }, { lat: 43.6500, lng: -79.3800 }],
        rating: 4.2,
        rating_count: 156,
        reliability: 85
      },
      {
        name: '1 Yonge-University',
        type: 'subway',
        route: [{ lat: 43.6532, lng: -79.3832 }, { lat: 43.6500, lng: -79.3800 }],
        rating: 4.5,
        rating_count: 89,
        reliability: 92
      },
      {
        name: '25 Don Mills',
        type: 'bus',
        route: [{ lat: 43.6532, lng: -79.3832 }, { lat: 43.6500, lng: -79.3800 }],
        rating: 3.8,
        rating_count: 234,
        reliability: 78
      }
    ];

    for (const line of transitLines) {
      await query(`
        INSERT INTO transit_lines (name, type, route, rating, rating_count, reliability)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (name) DO NOTHING
      `, [line.name, line.type, JSON.stringify(line.route), line.rating, line.rating_count, line.reliability]);
    }
    console.log('✅ Transit lines seeded');

    // Seed rewards
    const rewards = [
      { name: 'Free Coffee', description: 'Redeem for a free coffee', points_cost: 100, category: 'food' },
      { name: 'Premium Pass', description: '1 month premium access', points_cost: 500, category: 'premium' },
      { name: 'Transit Credit', description: '$5 transit credit', points_cost: 200, category: 'transit' }
    ];

    for (const reward of rewards) {
      await query(`
        INSERT INTO rewards (name, description, points_cost, category)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO NOTHING
      `, [reward.name, reward.description, reward.points_cost, reward.category]);
    }
    console.log('✅ Rewards seeded');

    console.log('🎉 Database seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

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

