// Simple in-memory database for development
const users = new Map();
const transitLines = new Map();
const rewards = new Map();
const trips = new Map();

// Initialize with demo data
const initializeDemoData = () => {
  // Demo users
  users.set('demo-user', {
    id: 'demo-user',
    name: 'Demo User',
    email: 'demo@transit.com',
    password_hash: '$2a$12$GkZe6R/DceSK74/ctrqAFeKkF/Wu7MW/viySxp1DgqQqaM49I/4w.', // 'password'
    avatar: '🚌',
    points: 1250,
    level: 3,
    experience: 250,
    weekly_points: 150,
    total_trips: 25,
    total_distance: 125.5,
    total_time: 45.2,
    is_premium: false,
    premium_expiry: null,
    location_sharing: false,
    friend_requests: true,
    chat_enabled: true,
    message_requests: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Demo transit lines
  const demoLines = [
    {
      id: 1,
      name: '501 Queen',
      type: 'streetcar',
      route: [
        { lat: 43.6532, lng: -79.3832 },
        { lat: 43.6540, lng: -79.3840 },
        { lat: 43.6550, lng: -79.3850 }
      ],
      rating: 4.2,
      rating_count: 156,
      reliability: 85,
      noise_level: 'medium',
      occupancy: 'high',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      name: '510 Spadina',
      type: 'streetcar',
      route: [
        { lat: 43.6540, lng: -79.3840 },
        { lat: 43.6550, lng: -79.3850 },
        { lat: 43.6560, lng: -79.3860 }
      ],
      rating: 4.5,
      rating_count: 89,
      reliability: 92,
      noise_level: 'low',
      occupancy: 'medium',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      name: '504 King',
      type: 'streetcar',
      route: [
        { lat: 43.6550, lng: -79.3850 },
        { lat: 43.6560, lng: -79.3860 },
        { lat: 43.6570, lng: -79.3870 }
      ],
      rating: 4.0,
      rating_count: 203,
      reliability: 78,
      noise_level: 'high',
      occupancy: 'high',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Line 1 Yonge-University',
      type: 'subway',
      route: [
        { lat: 43.6560, lng: -79.3860 },
        { lat: 43.6570, lng: -79.3870 },
        { lat: 43.6580, lng: -79.3880 }
      ],
      rating: 4.3,
      rating_count: 445,
      reliability: 88,
      noise_level: 'medium',
      occupancy: 'high',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      name: 'Line 2 Bloor-Danforth',
      type: 'subway',
      route: [
        { lat: 43.6570, lng: -79.3870 },
        { lat: 43.6580, lng: -79.3880 },
        { lat: 43.6590, lng: -79.3890 }
      ],
      rating: 4.1,
      rating_count: 312,
      reliability: 82,
      noise_level: 'medium',
      occupancy: 'medium',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  demoLines.forEach(line => {
    transitLines.set(line.id, line);
  });

  // Demo rewards
  const demoRewards = [
    {
      id: 1,
      name: 'Free Coffee',
      description: 'Get a free coffee at participating locations',
      points_cost: 100,
      category: 'discount',
      is_premium: false,
      is_available: true,
      image_url: '☕',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Premium Avatar',
      description: 'Unlock a special premium avatar',
      points_cost: 500,
      category: 'avatar',
      is_premium: true,
      is_available: true,
      image_url: '👑',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Route Skin',
      description: 'Customize your transit route display',
      points_cost: 300,
      category: 'route-skin',
      is_premium: false,
      is_available: false,
      image_url: '🎨',
      created_at: new Date().toISOString()
    }
  ];

  demoRewards.forEach(reward => {
    rewards.set(reward.id, reward);
  });
};

// Initialize demo data
initializeDemoData();

// Simple query function
const query = async (text, params = []) => {
  // This is a mock implementation for development
  // In a real app, this would connect to PostgreSQL
  return {
    rows: [],
    rowCount: 0
  };
};

// Simple getClient function
const getClient = async () => {
  return {
    query: async (text, params = []) => {
      return {
        rows: [],
        rowCount: 0
      };
    },
    release: () => {}
  };
};

module.exports = {
  users,
  transitLines,
  rewards,
  trips,
  query,
  getClient
};
