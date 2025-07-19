import React, { useEffect, useState, useRef } from 'react'
import { TransitLine } from '../contexts/TransitContext'

interface GoogleMapProps {
  transitLines: TransitLine[]
  onLineClick?: (line: TransitLine) => void
  selectedLineId?: string | null
  userLocation?: { lat: number; lng: number }
  trackedLines?: string[]
}

interface BusMarker {
  id: string
  position: { lat: number; lng: number }
  lineId: string
  lineName: string
  type: string
  direction: 'north' | 'south' | 'east' | 'west'
  speed: number
  lastUpdate: Date
}

export default function GoogleMap({ transitLines, onLineClick, selectedLineId, userLocation, trackedLines = [] }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [busMarkers, setBusMarkers] = useState<BusMarker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)

  // Load Google Maps API dynamically
  useEffect(() => {
    const loadGoogleMaps = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      
      if (!apiKey || apiKey === 'YOUR_ACTUAL_API_KEY') {
        setError('Google Maps API key not configured. Please add your API key to the .env file.')
        setIsLoading(false)
        return
      }

      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true)
        return
      }

      // Load Google Maps API
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = true
        script.defer = true
        
        script.onload = () => {
          setIsGoogleMapsLoaded(true)
          resolve()
        }
        
        script.onerror = () => {
          setError('Failed to load Google Maps API. Please check your API key.')
          reject(new Error('Failed to load Google Maps API'))
        }
        
        document.head.appendChild(script)
      })
    }

    loadGoogleMaps()
  }, [])

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || !isGoogleMapsLoaded) return

    const initMap = async () => {
      try {
        // Check if Google Maps is loaded
        if (!window.google || !window.google.maps) {
          setError('Google Maps not loaded. Please check your API key configuration.')
          setIsLoading(false)
          return
        }

        const defaultCenter = userLocation || { lat: 43.6532, lng: -79.3832 } // Toronto downtown

        const mapElement = mapRef.current
        if (!mapElement) {
          setError('Map container not found')
          setIsLoading(false)
          return
        }

        const mapInstance = new window.google.maps.Map(mapElement, {
          center: defaultCenter,
          zoom: 12,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'transit.line',
              elementType: 'geometry',
              stylers: [{ color: '#3f51b5' }]
            },
            {
              featureType: 'transit.station',
              elementType: 'geometry',
              stylers: [{ color: '#ff5722' }]
            }
          ]
        })

        setMap(mapInstance)
        setIsLoading(false)

        // Add user location marker if available
        if (userLocation) {
          new google.maps.Marker({
            position: userLocation,
            map: mapInstance,
            title: 'Your Location',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(24, 24),
              anchor: new google.maps.Point(12, 12)
            }
          })
        }

      } catch (err) {
        setError('Failed to initialize Google Maps. Please check your API key.')
        setIsLoading(false)
        console.error('Google Maps initialization error:', err)
      }
    }

    initMap()
  }, [userLocation, isGoogleMapsLoaded])

  // Generate bus markers for transit lines
  useEffect(() => {
    if (!map) return

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    setMarkers([])

    const newMarkers: google.maps.Marker[] = []
    const newBusMarkers: BusMarker[] = []

    transitLines.forEach((line, index) => {
      // Create multiple buses per line
      const busCount = Math.floor(Math.random() * 3) + 1 // 1-3 buses per line
      
      for (let i = 0; i < busCount; i++) {
        const busMarker = createBusMarker(line, i, busCount)
        newBusMarkers.push(busMarker)

        const isTracked = trackedLines.includes(line.id)
        const isSelected = selectedLineId === line.id

        const marker = new google.maps.Marker({
          position: busMarker.position,
          map: map,
          title: `${line.name} - Bus ${i + 1}`,
          icon: {
            url: getBusIcon(line.type, isTracked, isSelected),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16)
          }
        })

        // Add click listener
        marker.addListener('click', () => {
          if (onLineClick) {
            onLineClick(line)
          }
        })

        // Add hover effect
        marker.addListener('mouseover', () => {
          marker.setZIndex(1000)
        })

        marker.addListener('mouseout', () => {
          marker.setZIndex(1)
        })

        newMarkers.push(marker)
      }
    })

    setMarkers(newMarkers)
    setBusMarkers(newBusMarkers)
  }, [map, transitLines, onLineClick, trackedLines, selectedLineId])

  // Animate bus markers
  useEffect(() => {
    if (!map || busMarkers.length === 0) return

    const interval = setInterval(() => {
      setBusMarkers(prevMarkers => 
        prevMarkers.map(marker => {
          // Simulate bus movement along route
          const line = transitLines.find(l => l.id === marker.lineId)
          if (!line) return marker

          const route = line.route
          if (route.length < 2) return marker

          // Find current position in route
          const currentIndex = findClosestRoutePoint(marker.position, route)
          const nextIndex = (currentIndex + 1) % route.length

          const currentPoint = route[currentIndex]
          const nextPoint = route[nextIndex]

          // Calculate new position (simplified movement)
          const progress = (Date.now() % 10000) / 10000 // 10 second cycle
          const newLat = currentPoint.lat + (nextPoint.lat - currentPoint.lat) * progress
          const newLng = currentPoint.lng + (nextPoint.lng - currentPoint.lng) * progress

          return {
            ...marker,
            position: { lat: newLat, lng: newLng },
            lastUpdate: new Date()
          }
        })
      )

      // Update marker positions
      markers.forEach((marker, index) => {
        if (busMarkers[index]) {
          marker.setPosition(busMarkers[index].position)
        }
      })
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [map, busMarkers, markers, transitLines])

  const createBusMarker = (line: TransitLine, busIndex: number, totalBuses: number): BusMarker => {
    const route = line.route
    const startIndex = Math.floor((busIndex / totalBuses) * route.length)
    const startPoint = route[startIndex] || route[0] || { lat: 43.6532, lng: -79.3832 }

    return {
      id: `${line.id}-bus-${busIndex}`,
      position: startPoint,
      lineId: line.id,
      lineName: line.name,
      type: line.type,
      direction: 'north',
      speed: Math.random() * 30 + 20, // 20-50 km/h
      lastUpdate: new Date()
    }
  }

  const findClosestRoutePoint = (position: { lat: number; lng: number }, route: Array<{ lat: number; lng: number }>) => {
    let closestIndex = 0
    let minDistance = Infinity

    route.forEach((point, index) => {
      const distance = Math.sqrt(
        Math.pow(position.lat - point.lat, 2) + 
        Math.pow(position.lng - point.lng, 2)
      )
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = index
      }
    })

    return closestIndex
  }

  const getBusIcon = (type: string, isTracked: boolean = false, isSelected: boolean = false): string => {
    let fillColor = '#FF9800' // default orange
    
    switch (type) {
      case 'bus':
        fillColor = isTracked ? '#FFD700' : '#FF5722' // gold if tracked, red if not
        break
      case 'subway':
        fillColor = isTracked ? '#FFD700' : '#3F51B5' // gold if tracked, blue if not
        break
      case 'streetcar':
        fillColor = isTracked ? '#FFD700' : '#4CAF50' // gold if tracked, green if not
        break
    }

    // Add a border for selected items
    const strokeColor = isSelected ? '#FF0000' : 'white'
    const strokeWidth = isSelected ? '3' : '2'

    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="8" width="24" height="16" rx="2" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        <rect x="6" y="12" width="20" height="8" fill="white"/>
        <circle cx="10" cy="22" r="2" fill="#333"/>
        <circle cx="22" cy="22" r="2" fill="#333"/>
        <rect x="8" y="4" width="16" height="4" fill="${fillColor}"/>
        ${isTracked ? '<circle cx="16" cy="16" r="3" fill="white" opacity="0.8"/>' : ''}
      </svg>
    `)
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center max-w-md mx-4">
          <div className="text-red-500 text-lg font-semibold mb-2">Map Not Available</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <div className="text-sm text-gray-500 space-y-2">
            <p>To enable Google Maps:</p>
            <ol className="text-left list-decimal list-inside space-y-1">
              <li>Get a Google Maps API key from <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
              <li>Enable the Maps JavaScript API</li>
              <li>Add your API key to the .env file</li>
              <li>Restart the development server</li>
            </ol>
            <p className="mt-4 text-xs">Note: The app will still work without Google Maps, but with limited map functionality.</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <div className="text-gray-600">Loading map...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <button
          onClick={() => map?.setZoom((map.getZoom() || 12) + 1)}
          className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          title="Zoom In"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          onClick={() => map?.setZoom((map.getZoom() || 12) - 1)}
          className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          title="Zoom Out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={() => {
            if (userLocation && map) {
              map.setCenter(userLocation)
              map.setZoom(15)
            }
          }}
          className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          title="My Location"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Bus Info Panel */}
      {selectedLineId && (
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-md max-w-sm">
          <h3 className="font-semibold text-gray-900 mb-2">Live Bus Information</h3>
          <div className="space-y-2">
            {busMarkers
              .filter(marker => marker.lineId === selectedLineId)
              .map(marker => (
                <div key={marker.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{marker.lineName} Bus</span>
                  <span className="text-green-600">{marker.speed.toFixed(0)} km/h</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
} 