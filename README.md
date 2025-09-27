# TransporTauTion - Transit Rewards App

A modern web application that gamifies public transit use with rewards, social features, and real-time tracking.

## Features

- **User Authentication**: Secure signup, login and profile management
- **Transit Tracking**: Record and track your transit journeys
- **Points System**: Earn points for using public transit
- **Rewards**: Redeem your points for various rewards
- **Social Features**: Connect with friends and compare stats
- **Premium Membership**: Unlock additional features and benefits
- **Real-time Data**: View transit lines with real-time information

## Tech Stack

### Frontend
- React with TypeScript
- Vite for fast development
- TailwindCSS for styling
- React Router for navigation
- Context API for state management

### Backend
- Node.js with Express
- PostgreSQL for data storage
- JWT for authentication
- RESTful API architecture

## Getting Started

### Prerequisites
- Node.js v18 or higher
- PostgreSQL database
- Git

### Quick Start

Use the included start script to quickly set up and run both the frontend and backend:

```bash
# Make the script executable if it's not already
chmod +x start.sh

# Run the application
./start.sh
```

### Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```
Edit the `.env` file to match your PostgreSQL credentials.

4. Run the setup script:
```bash
npm run setup
```

5. Start the backend server:
```bash
npm run dev
```

#### Frontend Setup

1. Navigate to the project root directory.

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile

### Transit
- `GET /api/transit/lines` - Get all transit lines
- `GET /api/transit/lines/:id` - Get transit line details
- `GET /api/transit/nearby` - Get nearby transit lines
- `POST /api/transit/lines/:id/rate` - Rate a transit line
- `POST /api/transit/trips` - Record a trip
- `GET /api/transit/trips` - Get user trips
- `GET /api/transit/summary` - Get user transit summary

### Rewards
- `GET /api/rewards` - Get all available rewards
- `GET /api/rewards/:id` - Get reward details
- `POST /api/rewards/:id/redeem` - Redeem a reward
- `GET /api/rewards/user/redeemed` - Get user's redeemed rewards

## Testing

To test the authentication flow:
```bash
cd backend
npm run test:auth
```

## License

This project is licensed under the MIT License.
