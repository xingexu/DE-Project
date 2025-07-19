# Transit Rewards App

A gamified public transportation app that incentivizes users to take public transit through points, rewards, and social features.

## Features

### 🎯 Core Features
- **Tap In/Tap Out System**: Track your transit journeys and earn points
- **Points System**: Earn points for distance traveled and redeem for rewards
- **Real-time Tracking**: Live bus locations and route updates
- **Reliability Tracking**: Monitor transit line reliability and ratings

### 🗺️ Interactive Maps
- **Google Maps Integration**: Real-time transit tracking with Google Maps API
- **Fallback Mode**: Beautiful alternative view when API is not configured
- **Toronto Transit Data**: Real coordinates and routes for TTC lines
- **User Location**: Shows your current location on the map
- **Interactive Markers**: Click on transit vehicles for detailed information

### 🎁 Rewards System
- **Fast Food Discounts**: Redeem points for restaurant discounts
- **Avatar Decorations**: Unlock custom avatars and skins
- **Route Skins**: Colorful route tracking displays
- **Achievement System**: Unlock badges for milestones

### 👥 Social Features
- **Friend Tracking**: See where your friends are on transit
- **Group Creation**: Create groups for regular commutes
- **Poke System**: Send friendly reminders to friends
- **Parent Tracking**: Share location with parents for safety

### 📊 Rating & Feedback
- **Live Rating System**: Rate your transit experience
- **Noise Level Tracking**: Report noise levels on transit
- **Occupancy Monitoring**: Track how crowded transit is
- **Safety Features**: Monitored feedback system

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context + useReducer
- **Routing**: React Router DOM
- **Notifications**: React Hot Toast
- **Maps**: Google Maps JavaScript API
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd transit-rewards-app
```

2. Install dependencies:
```bash
npm install
```

3. **Optional**: Set up Google Maps API (see [Google Maps Setup Guide](GOOGLE_MAPS_SETUP.md))
   - Create a `.env` file in the project root
   - Add your API key: `VITE_GOOGLE_MAPS_API_KEY=your_api_key_here`

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## App Structure

```
src/
├── components/
│   ├── Layout.tsx          # Main layout with navigation
│   ├── GoogleMap.tsx       # Interactive map component
│   └── ErrorBoundary.tsx   # Error handling component
├── contexts/
│   └── TransitContext.tsx  # Global state management
├── pages/
│   ├── Home.tsx           # Tap in/out and quick actions
│   ├── Map.tsx            # Real-time transit tracking
│   ├── Rewards.tsx        # Points and rewards system
│   ├── Social.tsx         # Friends and groups
│   └── Profile.tsx        # User profile and settings
├── App.tsx                # Main app component
├── main.tsx              # Entry point
└── index.css             # Global styles
```

## Map Features

### Google Maps Integration
- **Real-time Tracking**: Live transit vehicle locations
- **Interactive Markers**: Click for detailed information
- **Route Visualization**: See actual transit routes
- **User Location**: Shows your current position
- **Filtering**: Filter by bus, subway, or streetcar
- **Search**: Find specific transit lines

### Fallback Mode
When Google Maps API is not configured, the app shows:
- **Interactive Cards**: Clickable transit line information
- **Real Data**: All Toronto transit lines with real coordinates
- **User Location**: Shows your current location
- **Responsive Design**: Works on all screen sizes

### Transit Lines Included
- **12 TTC Lines**: Including buses, streetcars, and subways
- **Real Coordinates**: Based on actual Toronto transit routes
- **Live Data**: Reliability ratings and status updates
- **Detailed Info**: Ratings, noise levels, and occupancy

## Key Features Explained

### Points System
- Users earn points based on distance traveled
- Points are awarded after tapping out
- Points can be redeemed for various rewards

### Social Features
- **Friend Tracking**: See real-time location of friends on transit
- **Groups**: Create groups for regular commutes (e.g., "Morning Commute")
- **Poke System**: Send notifications to friends to hurry up
- **Parent Tracking**: Optional location sharing for safety

### Rating System
- Rate transit lines on a 5-star scale
- Report noise levels (low/medium/high)
- Track occupancy levels
- All feedback is monitored for safety

### Reliability Features
- Real-time bus tracking
- Live updates for arrival times
- Reliability percentages for each line
- Historical performance data

## Business Model

### Revenue Streams
- **Advertising**: Small ads within the app
- **Premium Features**: Ad-free experience for $1-2/month
- **Partnerships**: Revenue sharing with fast food chains

### Target Market
- **Primary**: Urban commuters in Canadian cities
- **Secondary**: Students and young professionals
- **Tertiary**: Families with children using transit

### Competitive Advantages
- **Canada-wide**: Works across all Canadian transit systems
- **Gamification**: Unique points and rewards system
- **Social Integration**: Built-in social features
- **Safety Focus**: Parent tracking and monitored feedback

## Future Enhancements

- **Real-time Maps**: Integration with actual transit APIs
- **Payment Integration**: Direct fare payment through app
- **Advanced Analytics**: Detailed transit usage statistics
- **Multi-language Support**: French and other languages
- **Accessibility Features**: Screen reader support and voice commands

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@transitrewards.com or create an issue in the repository.
