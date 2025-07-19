import { useState, useEffect } from 'react'
import { 
  MapPin, 
  Clock, 
  Star, 
  Users, 
  MessageSquare,
  Navigation,
  RefreshCw,
  Filter,
  Search,
  Info,
  LocateIcon,
  X
} from 'lucide-react'
import { useTransit } from '../contexts/TransitContext'
import GoogleMap from '../components/GoogleMap'
import toast from 'react-hot-toast'

export default function Map() {
  const { state, dispatch } = useTransit()
  const [selectedLine, setSelectedLine] = useState<string | null>(null)
  const [trackedLines, setTrackedLines] = useState<string[]>([])
  const [showRating, setShowRating] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [mapView, setMapView] = useState<'map' | 'list'>('map')
  const [filterType, setFilterType] = useState<'all' | 'bus' | 'subway' | 'streetcar'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedLineData, setSelectedLineData] = useState<any>(null)
  const [infoLineData, setInfoLineData] = useState<any>(null)
  
  // Rating state
  const [currentRating, setCurrentRating] = useState(0)
  const [noiseLevel, setNoiseLevel] = useState('medium')
  const [occupancy, setOccupancy] = useState('medium')
  const [ratingLineId, setRatingLineId] = useState<string | null>(null)

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.log('Error getting location:', error)
          // Default to Toronto downtown if location access denied
          setUserLocation({ lat: 43.6532, lng: -79.3832 })
        }
      )
    } else {
      // Default to Toronto downtown if geolocation not supported
      setUserLocation({ lat: 43.6532, lng: -79.3832 })
    }
  }, [])

  const handleRateLine = (lineId: string, rating: number, noiseLevel: string, occupancy: string) => {
    // Find the line to update
    const lineToUpdate = state.transitLines.find(line => line.id === lineId)
    if (!lineToUpdate) return

    // Calculate new rating (average of existing and new rating)
    const currentRatingCount = lineToUpdate.ratingCount || 0
    const currentTotalRating = (lineToUpdate.rating || 0) * currentRatingCount
    const newTotalRating = currentTotalRating + rating
    const newRatingCount = currentRatingCount + 1
    const newAverageRating = newTotalRating / newRatingCount

    // Calculate new reliability based on rating
    let newReliability = lineToUpdate.reliability
    if (rating >= 4) {
      newReliability = Math.min(100, newReliability + 2) // Positive rating increases reliability
    } else if (rating <= 2) {
      newReliability = Math.max(60, newReliability - 3) // Negative rating decreases reliability
    } else {
      newReliability = Math.max(60, Math.min(100, newReliability + (rating - 3) * 0.5)) // Neutral rating has small effect
    }

    // Update noise level and occupancy based on user feedback
    const updatedNoiseLevel = noiseLevel
    const updatedOccupancy = occupancy

    dispatch({ 
      type: 'UPDATE_LINE_RATING', 
      payload: { 
        lineId, 
        rating: newAverageRating,
        ratingCount: newRatingCount,
        reliability: newReliability,
        noiseLevel: updatedNoiseLevel,
        occupancy: updatedOccupancy
      } 
    })
    
    toast.success(`Rating submitted! ${rating >= 4 ? 'Thank you for the positive feedback!' : rating <= 2 ? 'We\'re sorry to hear that. We\'ll work to improve.' : 'Thanks for your feedback!'}`)
    setShowRating(false)
    
    // Reset rating form
    setCurrentRating(0)
    setNoiseLevel('medium')
    setOccupancy('medium')
    setRatingLineId(null)
  }

  const handleRefresh = () => {
    toast.success('Map refreshed!')
  }

  const handleTrackLine = (line: any) => {
    if (trackedLines.includes(line.id)) {
      // Untrack the line
      setTrackedLines(prev => prev.filter(id => id !== line.id))
      toast.success(`Stopped tracking ${line.name}`)
    } else {
      // Track the line
      setTrackedLines(prev => [...prev, line.id])
      toast.success(`Now tracking ${line.name}!`)
      // Show tracking modal
      setSelectedLineData(line)
    }
  }

  const handleShowInfo = (line: any) => {
    setInfoLineData(line)
    setShowInfo(true)
  }

  const handleFilterChange = (type: 'all' | 'bus' | 'subway' | 'streetcar') => {
    setFilterType(type)
    toast.success(`Filtered to ${type === 'all' ? 'all' : type} lines`)
  }

  const filteredLines = state.transitLines.filter(line => {
    const matchesFilter = filterType === 'all' || line.type === filterType
    const matchesSearch = line.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getLineIcon = (type: string) => {
    switch (type) {
      case 'bus': return '🚌'
      case 'subway': return '🚇'
      case 'streetcar': return '🚋'
      default: return '🚌'
    }
  }

  const getStatusColor = (reliability: number) => {
    if (reliability >= 90) return 'text-green-600'
    if (reliability >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusText = (reliability: number) => {
    if (reliability >= 90) return 'On Time'
    if (reliability >= 80) return 'Slight Delay'
    return 'Service Issue'
  }

  const isLineTracked = (lineId: string) => {
    return trackedLines.includes(lineId)
  }

  // Get realistic line information
  const getLineInfo = (line: any) => {
    const info = {
      description: '',
      routeDetails: '',
      schedule: '',
      features: [] as string[],
      tips: [] as string[],
      stops: [] as string[],
      blurb: '' // Add blurb field
    }

    switch (line.type) {
      case 'bus':
        if (line.name.includes('Queen')) {
          info.description = `${line.name} is a high-frequency bus route serving the Queen Street corridor in Toronto. It operates with modern low-floor buses equipped with bike racks and accessibility features, connecting the eastern and western parts of the city.`
          info.routeDetails = `Runs from Neville Park in the east to Long Branch in the west, serving major destinations including the Beaches, downtown Toronto, and the western suburbs.`
          info.blurb = `🚌 The iconic ${line.name} bus is your gateway to Toronto's most vibrant neighborhoods! This legendary route takes you from the sandy shores of the Beaches in the east to the trendy cafes of Long Branch in the west. Along the way, you'll pass through the heart of downtown Toronto, where you can hop off to explore the Eaton Centre, Queen West's trendy shops, or grab a bite at one of the many restaurants. The route is famous for its reliability and frequent service, making it a favorite among locals and tourists alike. Don't miss the stunning lake views as you cruise along Queen Street!`
          info.stops = ['Neville Park', 'Woodbine Beach', 'Queen & Coxwell', 'Queen & Broadview', 'Queen & Parliament', 'Queen & Yonge', 'Queen & University', 'Queen & Spadina', 'Queen & Bathurst', 'Queen & Dufferin', 'Long Branch']
        } else if (line.name.includes('King')) {
          info.description = `${line.name} is a major east-west bus route serving the King Street corridor. It operates with articulated buses to handle high passenger volumes, providing essential service to downtown Toronto and surrounding areas.`
          info.routeDetails = `Connects Neville Park in the east to Dundas West in the west, serving the financial district, entertainment district, and residential neighborhoods.`
          info.blurb = `🚌 The ${line.name} bus is your express ticket to Toronto's entertainment and business districts! This high-capacity route uses articulated buses to handle the crowds heading to the Financial District, where you'll find the towering skyscrapers of Bay Street. The route also serves the vibrant Entertainment District, home to theaters, restaurants, and nightlife venues. Whether you're heading to a business meeting, catching a show, or exploring the city's cultural scene, the King bus gets you there in style. The route is known for its efficiency during rush hours and its accessibility features.`
          info.stops = ['Neville Park', 'King & Coxwell', 'King & Broadview', 'King & Parliament', 'King & Yonge', 'King & Bay', 'King & University', 'King & Spadina', 'King & Bathurst', 'King & Dufferin', 'Dundas West']
        } else if (line.name.includes('Dufferin')) {
          info.description = `${line.name} is a north-south bus route serving the Dufferin Street corridor. It operates with standard buses and provides essential service connecting northern and southern parts of the city.`
          info.routeDetails = `Runs from Dufferin & Steeles in the north to Exhibition Place in the south, serving residential areas, shopping districts, and the Exhibition grounds.`
          info.blurb = `🚌 The ${line.name} bus is your north-south connector through some of Toronto's most diverse neighborhoods! This essential route takes you from the northern suburbs all the way down to the iconic Exhibition Place, home to the Canadian National Exhibition and other major events. Along the way, you'll pass through vibrant communities, shopping districts, and cultural hubs. The route is particularly popular during major events at Exhibition Place, when it provides crucial service to thousands of visitors. The Dufferin bus is known for its reliability and frequent service, making it a backbone of Toronto's transit network.`
          info.stops = ['Dufferin & Steeles', 'Dufferin & Finch', 'Dufferin & Sheppard', 'Dufferin & Lawrence', 'Dufferin & Eglinton', 'Dufferin & St. Clair', 'Dufferin & Bloor', 'Dufferin & Queen', 'Dufferin & King', 'Exhibition Place']
        } else {
          info.description = `${line.name} is a high-frequency bus route serving major corridors in Toronto. It operates with modern low-floor buses equipped with bike racks and accessibility features.`
          info.routeDetails = `Runs from downtown to suburbs, providing essential service to residential and commercial areas.`
          info.blurb = `🚌 The ${line.name} bus is your reliable companion for exploring Toronto's diverse neighborhoods! This modern route features low-floor buses with bike racks and accessibility features, making it easy for everyone to travel. Whether you're commuting to work, heading to school, or just exploring the city, this bus provides frequent and reliable service. The route connects residential areas with commercial districts, making it perfect for daily errands, shopping trips, or leisure outings. With its modern amenities and friendly drivers, the ${line.name} bus offers a comfortable and convenient way to get around Toronto.`
          info.stops = ['Downtown', 'Midtown', 'Uptown', 'Suburbs']
        }
        info.schedule = 'Service runs every 3-5 minutes during peak hours, 7-10 minutes off-peak'
        info.features = ['Wheelchair accessible', 'Bike racks available', 'Real-time tracking', 'Air conditioning']
        info.tips = ['Tap your PRESTO card before boarding', 'Check real-time arrivals on the TTC app', 'Buses run 24/7 with reduced night service']
        break
      case 'subway':
        if (line.name.includes('Yonge')) {
          info.description = `${line.name} is the backbone of Toronto's rapid transit network, providing fast and reliable service along the Yonge Street corridor. Trains run underground through downtown and elevated sections in the north.`
          info.routeDetails = `Connects Finch Station in the north to Vaughan Metropolitan Centre in the northwest, serving major destinations including York University, North York Centre, and downtown Toronto.`
          info.blurb = `🚇 The ${line.name} is the crown jewel of Toronto's transit system! As the city's busiest subway line, it carries millions of passengers each year through the heart of Toronto. The line takes you from the bustling downtown core, where you can explore the Eaton Centre, Toronto City Hall, and the Financial District, all the way up to York University and beyond to Vaughan. The subway features modern trains with air conditioning, digital displays, and accessibility features. During rush hour, trains arrive every 2-3 minutes, making it the fastest way to navigate the city. Don't miss the stunning views from the elevated sections in the north!`
          info.stops = ['Finch', 'North York Centre', 'Sheppard-Yonge', 'Eglinton', 'Davisville', 'St. Clair', 'Bloor-Yonge', 'College', 'Queen', 'King', 'Union', 'St. Andrew', 'Osgoode', 'St. Patrick', 'Queen\'s Park', 'Museum', 'St. George', 'Spadina', 'Dupont', 'St. Clair West', 'Eglinton West', 'Glencairn', 'Lawrence West', 'Yorkdale', 'Wilson', 'Sheppard West', 'Downsview Park', 'Finch West', 'York University', 'Pioneer Village', 'Highway 407', 'Vaughan Metropolitan Centre']
        } else if (line.name.includes('Bloor')) {
          info.description = `${line.name} is a major east-west subway line providing rapid transit service across Toronto. Trains run underground through downtown and elevated sections in the east and west.`
          info.routeDetails = `Connects Kipling Station in the west to Kennedy Station in the east, serving major destinations including the airport area, downtown Toronto, and Scarborough.`
          info.blurb = `🚇 The ${line.name} is Toronto's east-west lifeline, connecting the city from one end to the other! This vital subway line takes you from the western suburbs near Pearson Airport all the way to the eastern reaches of Scarborough. The line serves some of Toronto's most diverse neighborhoods, including the trendy West End, the vibrant downtown core, and the multicultural communities of the east. The subway features modern trains with comfortable seating, digital displays, and accessibility features. With trains arriving every 3-4 minutes during peak hours, it's the most efficient way to travel across the city. The elevated sections offer spectacular views of the city skyline!`
          info.stops = ['Kipling', 'Islington', 'Royal York', 'Old Mill', 'Jane', 'Runnymede', 'High Park', 'Keele', 'Dundas West', 'Lansdowne', 'Dufferin', 'Ossington', 'Christie', 'Bathurst', 'Spadina', 'St. George', 'Bay', 'Bloor-Yonge', 'Sherbourne', 'Castle Frank', 'Broadview', 'Chester', 'Pape', 'Donlands', 'Greenwood', 'Coxwell', 'Woodbine', 'Main Street', 'Victoria Park', 'Warden', 'Kennedy']
        } else if (line.name.includes('Sheppard')) {
          info.description = `${line.name} is a short but important subway line serving the Sheppard Avenue corridor. It operates with modern trains and provides essential service to North York.`
          info.routeDetails = `Connects Sheppard-Yonge Station in the west to Don Mills Station in the east, serving the North York Centre area and residential neighborhoods.`
          info.blurb = `🚇 The ${line.name} may be short, but it packs a punch! This modern subway line serves the bustling North York Centre area, connecting residents to major shopping destinations, office buildings, and cultural venues. The line features state-of-the-art trains with advanced safety systems, comfortable seating, and accessibility features. The Sheppard line is particularly popular with commuters heading to the North York Centre office towers and shoppers visiting the nearby malls. Despite its short length, the line provides crucial service to one of Toronto's most dynamic areas. The modern stations feature beautiful architecture and public art installations.`
          info.stops = ['Sheppard-Yonge', 'Bayview', 'Bessarion', 'Leslie', 'Don Mills']
        } else {
          info.description = `${line.name} is part of Toronto's rapid transit network, providing fast and reliable service across the city. Trains run underground and elevated sections.`
          info.routeDetails = `Connects major destinations across the city, providing essential rapid transit service.`
          info.blurb = `🚇 The ${line.name} is your fast track to exploring Toronto's diverse neighborhoods! This modern subway line features comfortable trains with air conditioning, digital displays, and accessibility features. Whether you're commuting to work, heading to school, or exploring the city's attractions, the subway provides the fastest and most reliable way to get around. The line connects major destinations across Toronto, making it easy to reach shopping districts, cultural venues, and business centers. With frequent service and modern amenities, the ${line.name} offers a comfortable and efficient travel experience.`
          info.stops = ['Station 1', 'Station 2', 'Station 3', 'Station 4', 'Station 5']
        }
        info.schedule = 'Trains arrive every 2-3 minutes during peak hours, 4-6 minutes off-peak'
        info.features = ['Air conditioning', 'WiFi at stations', 'Real-time updates', 'Accessible stations']
        info.tips = ['Stand behind the yellow line', 'Let passengers exit before boarding', 'Check for service updates']
        break
      case 'streetcar':
        if (line.name.includes('Queen')) {
          info.description = `${line.name} is a modern streetcar line using low-floor vehicles with multiple doors for quick boarding. It operates on dedicated lanes in many areas and serves the historic Queen Street corridor.`
          info.routeDetails = `Serves the Queen Street corridor from Neville Park in the east to Long Branch in the west, passing through the Beaches, downtown Toronto, and western neighborhoods.`
          info.blurb = `🚋 The ${line.name} streetcar is Toronto's most iconic transit route! This historic line has been serving the city since the 19th century and continues to be a beloved part of Toronto's transit network. The modern low-floor streetcars feature multiple doors for quick boarding, comfortable seating, and accessibility features. The route takes you through some of Toronto's most vibrant neighborhoods, from the trendy Queen West district with its boutique shops and cafes, to the historic Beaches area with its charming Victorian homes. The streetcar runs on dedicated lanes in many areas, ensuring reliable service even during busy traffic. Don't miss the stunning lake views as you travel along Queen Street!`
          info.stops = ['Neville Park', 'Woodbine Beach', 'Queen & Coxwell', 'Queen & Broadview', 'Queen & Parliament', 'Queen & Jarvis', 'Queen & Church', 'Queen & Yonge', 'Queen & Bay', 'Queen & University', 'Queen & Spadina', 'Queen & Bathurst', 'Queen & Dufferin', 'Long Branch']
        } else if (line.name.includes('King')) {
          info.description = `${line.name} is a major streetcar line serving the King Street corridor with modern low-floor vehicles. It operates on dedicated lanes and provides essential service to downtown Toronto.`
          info.routeDetails = `Runs along King Street from Neville Park in the east to Dundas West in the west, serving the financial district, entertainment district, and residential areas.`
          info.blurb = `🚋 The ${line.name} streetcar is your elegant ride through Toronto's most prestigious districts! This modern streetcar line features sleek low-floor vehicles with multiple doors and accessibility features. The route serves the bustling Financial District, where you can hop off to explore the towering office buildings and upscale restaurants. The streetcar also connects to the vibrant Entertainment District, home to theaters, concert venues, and nightlife. The King streetcar operates on dedicated lanes, ensuring reliable service even during peak traffic hours. With its modern amenities and historic charm, the King streetcar offers a unique way to experience Toronto's downtown core.`
          info.stops = ['Neville Park', 'King & Coxwell', 'King & Broadview', 'King & Parliament', 'King & Jarvis', 'King & Church', 'King & Yonge', 'King & Bay', 'King & University', 'King & Spadina', 'King & Bathurst', 'King & Dufferin', 'Dundas West']
        } else if (line.name.includes('Spadina')) {
          info.description = `${line.name} is a modern streetcar line serving the Spadina Avenue corridor. It operates with low-floor vehicles and dedicated lanes, providing fast and reliable service.`
          info.routeDetails = `Runs along Spadina Avenue from Front Street in the south to Bloor Street in the north, serving the University of Toronto, Chinatown, and downtown areas.`
          info.blurb = `🚋 The ${line.name} streetcar is your cultural express through some of Toronto's most diverse neighborhoods! This modern streetcar line features low-floor vehicles with accessibility features and dedicated lanes for reliable service. The route takes you through the historic Chinatown district, where you can explore authentic restaurants, markets, and cultural venues. The streetcar also serves the University of Toronto campus, making it popular with students and faculty. The Spadina streetcar connects to major transit hubs and shopping districts, making it easy to reach destinations throughout the city. With its modern design and cultural significance, the Spadina streetcar offers a unique way to experience Toronto's diversity.`
          info.stops = ['Front & Spadina', 'Queen & Spadina', 'Dundas & Spadina', 'College & Spadina', 'Spadina & Bloor']
        } else if (line.name.includes('Carlton')) {
          info.description = `${line.name} is a streetcar line serving the Carlton Street corridor. It operates with modern low-floor vehicles and provides essential service to midtown Toronto.`
          info.routeDetails = `Runs along Carlton Street from Parliament Street in the east to Bathurst Street in the west, serving residential areas and connecting to major transit hubs.`
          info.blurb = `🚋 The ${line.name} streetcar is your comfortable ride through Toronto's charming midtown neighborhoods! This modern streetcar line features low-floor vehicles with accessibility features and comfortable seating. The route serves residential areas with tree-lined streets and historic homes, making it a pleasant way to travel through the city. The Carlton streetcar connects to major transit hubs, making it easy to transfer to other routes. The line is particularly popular with residents heading to work, school, or shopping destinations. With its reliable service and comfortable amenities, the Carlton streetcar provides a relaxing way to explore Toronto's midtown area.`
          info.stops = ['Parliament & Carlton', 'Sherbourne & Carlton', 'Jarvis & Carlton', 'Church & Carlton', 'Yonge & Carlton', 'Bay & Carlton', 'University & Carlton', 'Spadina & Carlton', 'Bathurst & Carlton']
        } else if (line.name.includes('St Clair')) {
          info.description = `${line.name} is a modern streetcar line serving the St. Clair Avenue corridor. It operates with low-floor vehicles and dedicated lanes, providing fast and reliable service.`
          info.routeDetails = `Runs along St. Clair Avenue from Yonge Street in the east to Gunns Road in the west, serving residential areas and major shopping districts.`
          info.blurb = `🚋 The ${line.name} streetcar is your scenic ride through Toronto's elegant neighborhoods! This modern streetcar line features low-floor vehicles with accessibility features and dedicated lanes for reliable service. The route takes you through some of Toronto's most beautiful residential areas, with tree-lined streets and historic architecture. The St. Clair streetcar serves major shopping districts and cultural venues, making it popular with shoppers and visitors. The line is known for its reliability and comfortable amenities, making it a pleasant way to travel through the city. With its modern design and scenic route, the St. Clair streetcar offers a delightful way to explore Toronto's west end.`
          info.stops = ['Yonge & St. Clair', 'Avenue & St. Clair', 'Bathurst & St. Clair', 'Dufferin & St. Clair', 'Oakwood & St. Clair', 'Caledonia & St. Clair', 'Keele & St. Clair', 'Gunns & St. Clair']
        } else {
          info.description = `${line.name} is a modern streetcar line using low-floor vehicles with multiple doors for quick boarding. It operates on dedicated lanes in many areas.`
          info.routeDetails = `Serves major downtown routes, providing essential streetcar service to residential and commercial areas.`
          info.blurb = `🚋 The ${line.name} streetcar is your modern way to experience Toronto's historic transit system! This contemporary streetcar line features sleek low-floor vehicles with multiple doors for quick boarding and accessibility features. The route serves major downtown corridors, connecting residential areas with commercial districts and cultural venues. The streetcar operates on dedicated lanes in many areas, ensuring reliable service even during busy traffic hours. With its modern amenities and historic charm, the ${line.name} streetcar offers a unique blend of old-world elegance and contemporary convenience. Whether you're commuting to work or exploring the city, this streetcar provides a comfortable and efficient way to travel.`
          info.stops = ['Stop 1', 'Stop 2', 'Stop 3', 'Stop 4', 'Stop 5']
        }
        info.schedule = 'Streetcar service every 4-6 minutes during peak hours, 8-12 minutes off-peak'
        info.features = ['Low-floor boarding', 'Multiple doors', 'Dedicated lanes', 'Real-time tracking']
        info.tips = ['Enter through any door', 'Have your fare ready', 'Watch for traffic signals']
        break
    }
    return info
  }

  // Get line-specific details
  const getLineDetails = (line: any) => {
    const details = {
      firstService: '5:30 AM',
      lastService: '1:30 AM',
      frequency: '',
      capacity: '',
      avgSpeed: '',
      stops: 0
    }

    switch (line.type) {
      case 'bus':
        details.frequency = '3-5 min peak, 7-10 min off-peak'
        details.capacity = '50-70 passengers'
        details.avgSpeed = '25-35 km/h'
        details.stops = line.route?.length || 15
        break
      case 'subway':
        details.frequency = '2-3 min peak, 4-6 min off-peak'
        details.capacity = '800-1200 passengers'
        details.avgSpeed = '40-50 km/h'
        details.stops = line.route?.length || 25
        break
      case 'streetcar':
        details.frequency = '4-6 min peak, 8-12 min off-peak'
        details.capacity = '200-300 passengers'
        details.avgSpeed = '20-30 km/h'
        details.stops = line.route?.length || 20
        break
    }
    return details
  }

  return (
    <div className="space-y-6">
      {/* Map Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Live Transit Map</h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setMapView(mapView === 'map' ? 'list' : 'map')}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
            >
              {mapView === 'map' ? <Users className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              <span className="text-sm">{mapView === 'map' ? 'List' : 'Map'}</span>
            </button>
            <button 
              onClick={handleRefresh}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm">Refresh</span>
            </button>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="flex space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transit lines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-1">
            {(['all', 'bus', 'subway', 'streetcar'] as const).map((type) => (
              <button
                key={type}
                onClick={() => handleFilterChange(type)}
                className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                  filterType === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Google Map Component */}
        {mapView === 'map' && (
          <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
            <GoogleMap
              transitLines={filteredLines}
              onLineClick={handleTrackLine}
              selectedLineId={selectedLine}
              userLocation={userLocation || undefined}
              trackedLines={trackedLines}
            />
          </div>
        )}

        {/* Map Legend */}
        <div className="flex justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600">Bus</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Subway</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">Streetcar</span>
          </div>
          <div className="flex items-center space-x-2">
            <LocateIcon className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">Your Location</span>
          </div>
          {trackedLines.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded animate-pulse"></div>
              <span className="text-gray-600">Tracked</span>
            </div>
          )}
        </div>
      </div>

      {/* All Transit Lines List - Always Visible */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">All Transit Lines</h3>
          <div className="text-sm text-gray-600">
            {filteredLines.length} of {state.transitLines.length} lines
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLines.map((line) => (
            <div key={line.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow bg-white ${
              isLineTracked(line.id) ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getLineIcon(line.type)}</div>
                  <div>
                    <div className="font-medium text-gray-900">{line.name}</div>
                    <div className="text-sm text-gray-600 flex items-center">
                      <Star className="h-3 w-3 mr-1 text-yellow-500" />
                      {line.rating} • <span className={getStatusColor(line.reliability)}>{line.reliability}% reliable</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-medium ${getStatusColor(line.reliability)}`}>
                    {getStatusText(line.reliability)}
                  </div>
                  <div className="text-xs text-gray-500">2 min away</div>
                  {isLineTracked(line.id) && (
                    <div className="text-xs text-yellow-600 font-medium">Tracked</div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium text-gray-900">{line.noiseLevel}</div>
                  <div className="text-gray-600">Noise</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium text-gray-900">{line.occupancy}</div>
                  <div className="text-gray-600">Occupancy</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium text-gray-900">{line.reliability}%</div>
                  <div className="text-gray-600">Reliability</div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleTrackLine(line)}
                  className={`flex-1 text-xs py-2 rounded-lg transition-colors ${
                    isLineTracked(line.id)
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'btn-secondary'
                  }`}
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  {isLineTracked(line.id) ? 'Untrack' : 'Track'}
                </button>
                <button 
                  onClick={() => {
                    setShowRating(true)
                    setRatingLineId(line.id)
                  }}
                  className="flex-1 btn-secondary text-xs py-2"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Rate
                </button>
                <button 
                  onClick={() => handleShowInfo(line)}
                  className="flex-1 btn-secondary text-xs py-2"
                >
                  <Info className="h-3 w-3 mr-1" />
                  Info
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rating Modal */}
      {showRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Your Experience</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setCurrentRating(rating)}
                      className={`text-2xl hover:scale-110 transition-transform ${
                        currentRating >= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                {currentRating > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    You rated: {currentRating} star{currentRating !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Noise Level</label>
                <select 
                  value={noiseLevel} 
                  onChange={(e) => setNoiseLevel(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Occupancy</label>
                <select 
                  value={occupancy} 
                  onChange={(e) => setOccupancy(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRating(false)
                  setCurrentRating(0)
                  setNoiseLevel('medium')
                  setOccupancy('medium')
                  setRatingLineId(null)
                }}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (currentRating > 0 && ratingLineId) {
                    handleRateLine(ratingLineId, currentRating, noiseLevel, occupancy)
                  } else {
                    toast.error('Please select a rating')
                  }
                }}
                disabled={currentRating === 0}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  currentRating > 0 
                    ? 'bg-primary-600 text-white hover:bg-primary-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {selectedLineData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{getLineIcon(selectedLineData.type)}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tracking {selectedLineData.name}</h3>
                  <p className="text-sm text-gray-600">Live location and route</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLineData(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Mini Map */}
              <div className="lg:col-span-2">
                <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
                  <GoogleMap
                    transitLines={[selectedLineData]}
                    onLineClick={handleTrackLine}
                    selectedLineId={selectedLine}
                    userLocation={userLocation || undefined}
                    trackedLines={trackedLines}
                  />
                </div>
              </div>

              {/* Tracking Info */}
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Live Updates</h4>
                  <div className="text-sm text-blue-800 space-y-2">
                    <div className="flex justify-between">
                      <span>Next arrival:</span>
                      <span className="font-medium">2 min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current speed:</span>
                      <span className="font-medium">35 km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Passenger count:</span>
                      <span className="font-medium">Medium</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Temperature:</span>
                      <span className="font-medium">22°C</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Route Info</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>• Total stops: {selectedLineData.route?.length || 0}</p>
                    <p>• Service type: {selectedLineData.type}</p>
                    <p>• Reliability: {selectedLineData.reliability}%</p>
                    <p>• Rating: {selectedLineData.rating}/5</p>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Tracking Status</h4>
                  <div className="text-sm text-yellow-800">
                    <p>✅ Line is being tracked</p>
                    <p>📍 Location updates every 30 seconds</p>
                    <p>🔔 Notifications enabled</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleTrackLine(selectedLineData)}
                    className="flex-1 btn-secondary text-sm"
                  >
                    <Navigation className="h-4 w-4 mr-1" />
                    Untrack Line
                  </button>
                  <button 
                    onClick={() => {
                      setShowInfo(true)
                      setInfoLineData(selectedLineData)
                      setSelectedLineData(null)
                    }}
                    className="flex-1 btn-secondary text-sm"
                  >
                    <Info className="h-4 w-4 mr-1" />
                    More Info
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfo && infoLineData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{getLineIcon(infoLineData.type)}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{infoLineData.name}</h3>
                  <p className="text-sm text-gray-600">{infoLineData.type} line</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInfo(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Line Blurb */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-semibold text-blue-900 mb-3">About This Route</h4>
                <p className="text-blue-800 leading-relaxed">{getLineInfo(infoLineData).blurb}</p>
              </div>

              {/* Line Description */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Service Overview</h4>
                <p className="text-sm text-blue-800">{getLineInfo(infoLineData).description}</p>
              </div>

              {/* Route Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Route Details</h4>
                    <p className="text-sm text-gray-700">{getLineInfo(infoLineData).routeDetails}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Schedule</h4>
                    <p className="text-sm text-gray-700">{getLineInfo(infoLineData).schedule}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Service Details</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>• First service: {getLineDetails(infoLineData).firstService}</p>
                      <p>• Last service: {getLineDetails(infoLineData).lastService}</p>
                      <p>• Frequency: {getLineDetails(infoLineData).frequency}</p>
                      <p>• Capacity: {getLineDetails(infoLineData).capacity}</p>
                      <p>• Average speed: {getLineDetails(infoLineData).avgSpeed}</p>
                      <p>• Total stops: {getLineDetails(infoLineData).stops}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features and Tips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Features</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    {getLineInfo(infoLineData).features.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Travel Tips</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {getLineInfo(infoLineData).tips.map((tip, index) => (
                      <li key={index}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Current Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="text-center p-2 bg-white rounded">
                    <div className="font-medium text-gray-900">{infoLineData.noiseLevel}</div>
                    <div className="text-gray-600">Noise Level</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <div className="font-medium text-gray-900">{infoLineData.occupancy}</div>
                    <div className="text-gray-600">Occupancy</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <div className={`font-medium ${getStatusColor(infoLineData.reliability)}`}>
                      {getStatusText(infoLineData.reliability)}
                    </div>
                    <div className="text-gray-600">Status</div>
                  </div>
                </div>
              </div>

              {/* Route Stops */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Major Stops</h4>
                <div className="text-sm text-purple-800">
                  <p className="mb-2">This {infoLineData.type} serves the following major stops:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {getLineInfo(infoLineData).stops.map((stop, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>{stop}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2 mt-6">
              <button 
                onClick={() => {
                  handleTrackLine(infoLineData)
                  setShowInfo(false)
                }}
                className={`flex-1 text-sm rounded-lg transition-colors ${
                  isLineTracked(infoLineData.id)
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'btn-primary'
                }`}
              >
                <Navigation className="h-4 w-4 mr-1" />
                {isLineTracked(infoLineData.id) ? 'Untrack Line' : 'Track Line'}
              </button>
              <button 
                onClick={() => setShowRating(true)}
                className="flex-1 btn-secondary text-sm"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Rate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 