# Transit Rewards Backend

A Node.js/Express backend server with PostgreSQL database for the Transit Rewards application.

## Features

- 🔐 **User Authentication** - JWT-based authentication with bcrypt password hashing
- 🚌 **Transit Management** - Track trips, calculate taubits, manage transit lines
- 💰 **Rewards System** - Point-based rewards and premium features
- 🗄️ **PostgreSQL Database** - Robust data storage with proper relationships
- 🛡️ **Security** - Helmet, rate limiting, CORS, input validation
- 📊 **Real-time Tracking** - Trip tracking with GPS coordinates
- 🎯 **Taubit Calculation** - Each km = 10 taubits, each minute = 10 taubits

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## Installation

1. **Clone the repository and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up PostgreSQL database:**
   ```bash
   # Create database
   createdb transit_rewards
   
   # Or using psql
   psql -U postgres
   CREATE DATABASE transit_rewards;
   \q
   ```

5. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

6. **Seed the database (optional):**
   ```bash
   npm run db:seed
   ```

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=transit_rewards
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Google Maps API (for transit data)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/stats` - Get user statistics

### Transit
- `POST /api/transit/trip/start` - Start a trip
- `POST /api/transit/trip/end` - End a trip
- `GET /api/transit/trips` - Get trip history
- `GET /api/transit/lines` - Get transit lines
- `POST /api/transit/lines/:id/rate` - Rate a transit line

## Database Schema

### Users Table
- User authentication and profile information
- Points, level, and experience tracking
- Premium status and preferences

### Trips Table
- Trip tracking with start/end times
- Distance, duration, and taubit calculations
- GPS coordinates for location tracking

### Transit Lines Table
- Transit line information and routes
- Ratings, reliability, and user feedback
- JSONB storage for flexible route data

### Rewards Table
- Available rewards and their point costs
- Premium-only rewards and categories

## Taubit Calculation

The system calculates taubits based on:
- **Distance**: Each kilometer = 10 taubits
- **Time**: Each minute = 10 taubits

Example: A 5km trip taking 30 minutes = 50 + 300 = 350 taubits

## Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Secure authentication with configurable expiry
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Input Validation**: Joi schema validation for all inputs
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet**: Security headers and protection

## Development

### Database Commands
```bash
# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Run tests
npm test
```

### File Structure
```
backend/
├── src/
│   ├── config/          # Database and app configuration
│   ├── middleware/      # Authentication and validation
│   ├── models/          # Database models and queries
│   ├── routes/          # API route handlers
│   └── server.js        # Main server file
├── package.json
├── env.example
└── README.md
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testNamePattern="User Model"
```

## Deployment

### Docker (Recommended)
```bash
# Build image
docker build -t transit-rewards-backend .

# Run container
docker run -p 5000:5000 --env-file .env transit-rewards-backend
```

### Manual Deployment
1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Use PM2 or similar process manager
5. Set up reverse proxy (nginx)

## Monitoring

- **Health Check**: `GET /health`
- **Request Logging**: All requests logged with timestamps
- **Error Tracking**: Comprehensive error handling and logging
- **Database Monitoring**: Connection pool status and query performance

## Support

For issues and questions:
1. Check the logs for error details
2. Verify database connection and credentials
3. Ensure all environment variables are set
4. Check API endpoint documentation

## License

MIT License - see LICENSE file for details

