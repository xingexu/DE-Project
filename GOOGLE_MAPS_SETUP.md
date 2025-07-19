# Google Maps Integration Setup

This app includes a fully functional Google Maps integration for displaying real Toronto transit lines. Here's how to set it up:

## Getting a Google Maps API Key

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create a New Project**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Give it a name like "Transit Rewards App"
   - Click "Create"

3. **Enable Maps JavaScript API**
   - In the left sidebar, go to "APIs & Services" > "Library"
   - Search for "Maps JavaScript API"
   - Click on it and click "Enable"

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

5. **Restrict the API Key (Recommended)**
   - Click on the API key you just created
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain (e.g., `localhost:5173/*` for development)
   - Under "API restrictions", select "Restrict key"
   - Select "Maps JavaScript API"
   - Click "Save"

## Configure the App

### Option 1: Environment Variable (Recommended)

1. **Create Environment File**
   - Create a file named `.env` in the project root
   - Add your API key: `VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here`

2. **Restart the Development Server**
   - Stop the current server (Ctrl+C)
   - Run `npm run dev` again

### Option 2: Direct Code Edit

1. **Update the API Key**
   - Open `src/components/GoogleMap.tsx`
   - Find the line: `const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'`
   - Replace `'YOUR_GOOGLE_MAPS_API_KEY'` with your actual API key

2. **Test the Integration**
   - Run the app: `npm run dev`
   - Navigate to the Map page
   - You should see the interactive Google Maps with transit lines

## Features

### Real Toronto Transit Data
- **12 Transit Lines**: Including TTC buses, streetcars, and subways
- **Real Coordinates**: All locations are based on actual Toronto transit routes
- **Interactive Markers**: Click on any transit vehicle for details
- **Route Visualization**: See the actual routes each line follows

### Map Features
- **User Location**: Shows your current location (if permission granted)
- **Line Filtering**: Filter by bus, subway, or streetcar
- **Search**: Find specific transit lines
- **Real-time Status**: Shows reliability and status of each line
- **Detailed Info**: Click markers for ratings, noise levels, and occupancy

### Fallback Mode
If no API key is provided, the app will show a beautiful fallback map with:
- Interactive transit vehicle icons
- Hover effects and tooltips
- User location display
- Route visualization

## Transit Lines Included

1. **501 Queen** - Streetcar (Queen Street)
2. **510 Spadina** - Streetcar (Spadina Avenue)
3. **29 Dufferin** - Bus (Dufferin Street)
4. **504 King** - Streetcar (King Street)
5. **Line 1 Yonge-University** - Subway (Yonge-University Line)
6. **Line 2 Bloor-Danforth** - Subway (Bloor-Danforth Line)
7. **503 Kingston Rd** - Streetcar (Kingston Road)
8. **32 Eglinton West** - Bus (Eglinton Avenue)
9. **Line 4 Sheppard** - Subway (Sheppard Line)
10. **506 Carlton** - Streetcar (Carlton Street)
11. **25 Don Mills** - Bus (Don Mills Road)
12. **512 St Clair** - Streetcar (St. Clair Avenue)

## Cost Considerations

- **Free Tier**: Google Maps JavaScript API includes $200 of free usage per month
- **Typical Usage**: For a transit app, you'll likely stay within the free tier
- **Monitoring**: Check your usage in Google Cloud Console under "Billing"

## Troubleshooting

### Map Not Loading
- Check that your API key is correct
- Ensure the Maps JavaScript API is enabled
- Check browser console for error messages
- Make sure your `.env` file is in the project root (if using environment variables)

### API Key Restrictions
- If you restricted the API key, make sure your domain is included
- For development, add `localhost:5173/*` to allowed referrers

### Fallback Mode
- If you see the fallback map, it means no API key is configured
- The fallback map is fully functional and looks great!

### Environment Variable Issues
- Make sure the `.env` file is in the project root directory
- Restart the development server after creating the `.env` file
- Check that the variable name is exactly `VITE_GOOGLE_MAPS_API_KEY`

## Next Steps

Once you have the Google Maps integration working, you can:

1. **Add Real-time Data**: Integrate with TTC's real-time API
2. **Add More Lines**: Include additional transit lines
3. **Add Directions**: Implement route planning between locations
4. **Add Transit Stops**: Show all transit stops on the map
5. **Add Traffic Data**: Show real-time traffic conditions

The app is now ready with a fully functional, realistic transit map that makes sense and provides a great user experience! 