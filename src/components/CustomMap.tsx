import React, { useEffect, useState, useRef } from 'react'
import { TransitLine } from '../contexts/TransitContext'

interface CustomMapProps {
  transitLines: TransitLine[]
  onLineClick?: (line: TransitLine) => void
  selectedLineId?: string | null
  userLocation?: { lat: number; lng: number }
}

type Vehicle = {
  id: string
  position: { x: number; y: number }
  color: string
  icon: string
  route: Array<{ x: number; y: number }>
  currentRouteIndex: number
  progress: number
  direction: number
  lineId: string
}

// Optimized station data to fit all lines in viewport - only horizontal and vertical lines, closer together
const optimizedStations = {
  '501 Queen': [
    { name: 'Neville Park', x: 100, y: 80 },
    { name: 'Queen & Coxwell', x: 200, y: 80 },
    { name: 'Queen & Woodbine', x: 300, y: 80 },
    { name: 'Queen & Main', x: 400, y: 80 },
    { name: 'Queen & Broadview', x: 500, y: 80 },
    { name: 'Queen & Parliament', x: 600, y: 80 },
    { name: 'Queen & Yonge', x: 700, y: 80 },
    { name: 'Queen & University', x: 800, y: 80 },
    { name: 'Queen & Spadina', x: 900, y: 80 }
  ],
  '510 Spadina': [
    { name: 'Spadina & Bloor', x: 750, y: 120 },
    { name: 'Spadina & College', x: 750, y: 140 },
    { name: 'Spadina & Dundas', x: 750, y: 160 },
    { name: 'Spadina & Queen', x: 750, y: 180 },
    { name: 'Spadina & King', x: 750, y: 200 },
    { name: 'Spadina & Front', x: 750, y: 220 }
  ],
  '29 Dufferin': [
    { name: 'Dufferin & Steeles', x: 150, y: 80 },
    { name: 'Dufferin & Finch', x: 150, y: 120 },
    { name: 'Dufferin & Sheppard', x: 150, y: 140 },
    { name: 'Dufferin & Lawrence', x: 150, y: 160 },
    { name: 'Dufferin & Eglinton', x: 150, y: 180 },
    { name: 'Dufferin & Bloor', x: 150, y: 200 },
    { name: 'Dufferin & Queen', x: 150, y: 220 }
  ],
  '504 King': [
    { name: 'King & Roncesvalles', x: 100, y: 240 },
    { name: 'King & Dufferin', x: 200, y: 240 },
    { name: 'King & Bathurst', x: 400, y: 240 },
    { name: 'King & Spadina', x: 500, y: 240 },
    { name: 'King & University', x: 600, y: 240 },
    { name: 'King & Yonge', x: 700, y: 240 },
    { name: 'King & Jarvis', x: 800, y: 240 },
    { name: 'King & Parliament', x: 900, y: 240 }
  ],
  'Line 1 Yonge-University': [
    { name: 'Vaughan Metro Centre', x: 500, y: 40 },
    { name: 'York University', x: 500, y: 60 },
    { name: 'Downsview Park', x: 500, y: 80 },
    { name: 'Sheppard West', x: 500, y: 100 },
    { name: 'Yorkdale', x: 500, y: 120 },
    { name: 'Eglinton West', x: 500, y: 140 },
    { name: 'St Clair West', x: 500, y: 160 },
    { name: 'Dupont', x: 500, y: 180 },
    { name: 'Spadina', x: 500, y: 200 },
    { name: 'St George', x: 500, y: 220 },
    { name: 'Museum', x: 500, y: 240 },
    { name: 'Queen\'s Park', x: 500, y: 260 },
    { name: 'St Patrick', x: 500, y: 280 },
    { name: 'Osgoode', x: 500, y: 300 },
    { name: 'St Andrew', x: 500, y: 320 },
    { name: 'King', x: 500, y: 340 },
    { name: 'Queen', x: 500, y: 360 },
    { name: 'Dundas', x: 500, y: 380 },
    { name: 'College', x: 500, y: 400 },
    { name: 'Wellesley', x: 500, y: 420 },
    { name: 'Bloor-Yonge', x: 500, y: 440 },
    { name: 'Sherbourne', x: 500, y: 460 },
    { name: 'Rosedale', x: 500, y: 480 },
    { name: 'Summerhill', x: 500, y: 500 },
    { name: 'St Clair', x: 500, y: 520 },
    { name: 'Davisville', x: 500, y: 540 },
    { name: 'Eglinton', x: 500, y: 560 },
    { name: 'Lawrence', x: 500, y: 580 },
    { name: 'York Mills', x: 500, y: 600 },
    { name: 'Sheppard-Yonge', x: 500, y: 620 },
    { name: 'North York Centre', x: 500, y: 640 },
    { name: 'Finch', x: 500, y: 660 }
  ],
  'Line 2 Bloor-Danforth': [
    { name: 'Kipling', x: 100, y: 440 },
    { name: 'Islington', x: 150, y: 440 },
    { name: 'Royal York', x: 200, y: 440 },
    { name: 'Old Mill', x: 250, y: 440 },
    { name: 'Jane', x: 300, y: 440 },
    { name: 'Runnymede', x: 350, y: 440 },
    { name: 'High Park', x: 400, y: 440 },
    { name: 'Keele', x: 450, y: 440 },
    { name: 'Dundas West', x: 500, y: 440 },
    { name: 'Lansdowne', x: 550, y: 440 },
    { name: 'Dufferin', x: 600, y: 440 },
    { name: 'Ossington', x: 650, y: 440 },
    { name: 'Christie', x: 700, y: 440 },
    { name: 'Bathurst', x: 750, y: 440 },
    { name: 'Spadina', x: 800, y: 440 },
    { name: 'St George', x: 850, y: 440 },
    { name: 'Bloor-Yonge', x: 900, y: 440 },
    { name: 'Sherbourne', x: 950, y: 440 },
    { name: 'Castle Frank', x: 1000, y: 440 },
    { name: 'Broadview', x: 1050, y: 440 },
    { name: 'Chester', x: 1100, y: 440 },
    { name: 'Pape', x: 1150, y: 440 },
    { name: 'Donlands', x: 1200, y: 440 },
    { name: 'Greenwood', x: 1250, y: 440 },
    { name: 'Coxwell', x: 1300, y: 440 },
    { name: 'Woodbine', x: 1350, y: 440 },
    { name: 'Main Street', x: 1400, y: 440 },
    { name: 'Victoria Park', x: 1450, y: 440 },
    { name: 'Warden', x: 1500, y: 440 }
  ],
  '503 Kingston Rd': [
    { name: 'Kingston & Victoria Park', x: 900, y: 120 },
    { name: 'Kingston & Warden', x: 950, y: 120 },
    { name: 'Kingston & Birchmount', x: 1000, y: 120 },
    { name: 'Kingston & Midland', x: 1050, y: 120 },
    { name: 'Kingston & Brimley', x: 1100, y: 120 },
    { name: 'Kingston & McCowan', x: 1150, y: 120 }
  ],
  '506 Carlton': [
    { name: 'Carlton & Parliament', x: 600, y: 200 },
    { name: 'Carlton & Sherbourne', x: 650, y: 200 },
    { name: 'Carlton & Jarvis', x: 700, y: 200 },
    { name: 'Carlton & Church', x: 750, y: 200 },
    { name: 'Carlton & Yonge', x: 800, y: 200 },
    { name: 'Carlton & Bay', x: 850, y: 200 },
    { name: 'Carlton & Spadina', x: 900, y: 200 }
  ]
}

// Beautiful colors for each individual line
const lineColors = {
  '501 Queen': '#E74C3C', // Vibrant Red
  '510 Spadina': '#27AE60', // Emerald Green
  '29 Dufferin': '#3498DB', // Bright Blue
  '504 King': '#F39C12', // Orange
  'Line 1 Yonge-University': '#9B59B6', // Purple
  'Line 2 Bloor-Danforth': '#1ABC9C', // Turquoise
  '503 Kingston Rd': '#E91E63', // Pink
  '506 Carlton': '#F1C40F' // Yellow
}

export default function CustomMap({ transitLines, onLineClick, selectedLineId, userLocation }: CustomMapProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedLine, setSelectedLine] = useState<string | null>(null)
  const [hoveredLine, setHoveredLine] = useState<string | null>(null)
  const [hoveredVehicle, setHoveredVehicle] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)

  // Initialize vehicles for all transit lines with proper positioning
  useEffect(() => {
    const initialVehicles: Vehicle[] = transitLines.map((line, index) => {
      const stations = optimizedStations[line.name as keyof typeof optimizedStations] || []
      const route = stations.map(station => ({ x: station.x, y: station.y }))
      
      // Ensure vehicle starts at the first station of its route
      const startPosition = route[0] || { x: 0, y: 0 }
      
      return {
        id: `vehicle-${line.id}`,
        position: startPosition,
        color: getLineColor(line.name),
        icon: getVehicleIcon(line.type),
        route: route,
        currentRouteIndex: 0,
        progress: 0,
        direction: 1,
        lineId: line.id
      }
    })
    setVehicles(initialVehicles)
  }, [transitLines])

  // Animate vehicles
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => {
          const { route, currentRouteIndex, progress, direction } = vehicle
          
          if (route.length < 2) return vehicle
          
          let newProgress = progress + (0.004 * direction)
          let newRouteIndex = currentRouteIndex
          let newDirection = direction

          if (newProgress >= 1) {
            newProgress = 0
            newRouteIndex = currentRouteIndex + 1
            
            if (newRouteIndex >= route.length - 1) {
              newRouteIndex = route.length - 1
              newDirection = -1
            }
          } else if (newProgress <= 0) {
            newProgress = 0
            newRouteIndex = Math.max(0, currentRouteIndex - 1)
            
            if (newRouteIndex <= 0) {
              newRouteIndex = 0
              newDirection = 1
            }
          }

          const currentPoint = route[newRouteIndex]
          const nextPoint = route[Math.min(newRouteIndex + 1, route.length - 1)]
          
          const newX = currentPoint.x + (nextPoint.x - currentPoint.x) * newProgress
          const newY = currentPoint.y + (nextPoint.y - currentPoint.y) * newProgress

          return {
            ...vehicle,
            position: { x: newX, y: newY },
            currentRouteIndex: newRouteIndex,
            progress: newProgress,
            direction: newDirection
          }
        })
      )
    }, 50)

    return () => clearInterval(interval)
  }, [])

  const handleLineClick = (lineId: string) => {
    setSelectedLine(lineId)
    const line = transitLines.find(l => l.id === lineId)
    if (line) {
      onLineClick?.(line)
    }
  }

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'bus': return '🚌'
      case 'subway': return '🚇'
      case 'streetcar': return '🚋'
      default: return '🚌'
    }
  }

  const getLineColor = (lineName: string) => {
    return lineColors[lineName as keyof typeof lineColors] || '#F39C12'
  }

  const getLineGradient = (lineName: string) => {
    const color = getLineColor(lineName)
    return `url(#gradient-${lineName.replace(/\s+/g, '-')})`
  }

  const getLineNumber = (lineName: string) => {
    if (lineName.includes('Line 1')) return '1'
    if (lineName.includes('Line 2')) return '2'
    if (lineName.includes('Line 4')) return '4'
    return ''
  }

  // Zoom and pan handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.min(Math.max(prev * delta, 0.5), 3))
  }

  // Map dimensions
  const width = 1200
  const height = 800

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl border border-gray-200 overflow-hidden relative shadow-lg">
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-12 h-12 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-xl shadow-lg hover:bg-gray-50 flex items-center justify-center text-xl font-bold transition-all duration-200 hover:scale-110"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-12 h-12 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-xl shadow-lg hover:bg-gray-50 flex items-center justify-center text-xl font-bold transition-all duration-200 hover:scale-110"
        >
          −
        </button>
        <button
          onClick={handleReset}
          className="w-12 h-12 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-xl shadow-lg hover:bg-gray-50 flex items-center justify-center text-lg transition-all duration-200 hover:scale-110"
        >
          ↺
        </button>
      </div>

      <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`} 
        width="100%" 
        height="100%" 
        className="block cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: '0 0'
        }}
      >
        {/* Definitions for beautiful gradients */}
        <defs>
          {transitLines.map(line => {
            const color = getLineColor(line.name)
            const gradientId = `gradient-${line.name.replace(/\s+/g, '-')}`
            return (
              <linearGradient key={gradientId} id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color} />
                <stop offset="50%" stopColor={color} opacity="0.8" />
                <stop offset="100%" stopColor={color} />
              </linearGradient>
            )
          })}
          
          {/* Drop shadow filter */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.2"/>
          </filter>
          
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Background gradient */}
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
        </defs>
        
        {/* Beautiful background */}
        <rect width={width} height={height} fill="url(#bgGradient)" />
        
        {/* Draw beautiful transit lines */}
        {transitLines.map(line => {
          const stations = optimizedStations[line.name as keyof typeof optimizedStations] || []
          const lineNumber = getLineNumber(line.name)
          const isSelected = selectedLineId === line.id
          const isHovered = hoveredLine === line.id
          const lineColor = getLineColor(line.name)
          
          return (
            <g key={line.id}>
              {/* Draw line path with shadow */}
              {stations.length > 1 && (
                <path
                  d={generateStraightPath(stations)}
                  stroke={lineColor}
                  strokeWidth={isSelected ? 14 : isHovered ? 12 : 10}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isSelected ? 1 : isHovered ? 0.9 : 0.8}
                  className="cursor-pointer transition-all duration-300"
                  onClick={() => handleLineClick(line.id)}
                  onMouseEnter={() => setHoveredLine(line.id)}
                  onMouseLeave={() => setHoveredLine(null)}
                  filter="url(#shadow)"
                />
              )}
              
              {/* Draw stations with beautiful styling */}
              {stations.map((station, index) => {
                const isInterchange = station.name.includes('Bloor-Yonge') || 
                                    station.name.includes('St George') || 
                                    station.name.includes('Spadina') ||
                                    station.name.includes('Sheppard-Yonge')
                
                return (
                  <g key={`${line.id}-${index}`}>
                    {/* Station marker with glow */}
                    <circle 
                      cx={station.x} 
                      cy={station.y} 
                      r={isInterchange ? 16 : 12} 
                      fill="white" 
                      stroke={lineColor} 
                      strokeWidth={isInterchange ? "5" : "4"}
                      className="cursor-pointer hover:r-20 transition-all duration-200"
                      onClick={() => handleLineClick(line.id)}
                      filter="url(#glow)"
                    />
                    
                    {/* Interchange station indicator */}
                    {isInterchange && (
                      <circle 
                        cx={station.x} 
                        cy={station.y} 
                        r="8" 
                        fill={lineColor}
                        filter="url(#glow)"
                      />
                    )}
                    
                    {/* Line number for subway lines */}
                    {lineNumber && index === 0 && (
                      <circle 
                        cx={station.x - 35} 
                        cy={station.y - 35} 
                        r="22" 
                        fill={lineColor} 
                        stroke="white" 
                        strokeWidth="4"
                        filter="url(#shadow)"
                      />
                    )}
                    {lineNumber && index === 0 && (
                      <text 
                        x={station.x - 35} 
                        y={station.y - 28} 
                        fontSize="18" 
                        textAnchor="middle" 
                        fill="white" 
                        fontFamily="sans-serif"
                        fontWeight="bold"
                      >
                        {lineNumber}
                      </text>
                    )}
                    
                    {/* Station name with better styling */}
                    <text 
                      x={station.x + 30} 
                      y={station.y + 5} 
                      fontSize="13" 
                      fill="#2D3748" 
                      fontFamily="sans-serif"
                      fontWeight="500"
                      className="pointer-events-none"
                    >
                      {station.name}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })}
        
        {/* Draw vehicles with beautiful styling - only if they have valid routes */}
        {vehicles.filter(vehicle => vehicle.route.length > 0).map((vehicle) => {
          const isHovered = hoveredVehicle === vehicle.id
          const isSelected = selectedLineId === vehicle.lineId
          
          return (
            <g key={vehicle.id}>
              {/* Vehicle glow */}
              {(isHovered || isSelected) && (
                <circle 
                  cx={vehicle.position.x} 
                  cy={vehicle.position.y} 
                  r={isHovered || isSelected ? 25 : 20} 
                  fill={vehicle.color} 
                  opacity="0.3"
                  className="animate-pulse"
                  filter="url(#glow)"
                />
              )}
              
              {/* Vehicle marker with shadow */}
              <circle 
                cx={vehicle.position.x} 
                cy={vehicle.position.y} 
                r={isHovered || isSelected ? 16 : 12} 
                fill={vehicle.color} 
                stroke="white" 
                strokeWidth="4"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleLineClick(vehicle.lineId)}
                onMouseEnter={() => setHoveredVehicle(vehicle.id)}
                onMouseLeave={() => setHoveredVehicle(null)}
                filter="url(#shadow)"
              />
              
              {/* Vehicle icon */}
              <text 
                x={vehicle.position.x} 
                y={vehicle.position.y + 5} 
                fontSize="16" 
                textAnchor="middle" 
                fill="white" 
                fontFamily="sans-serif"
                className="pointer-events-none"
              >
                {vehicle.icon}
              </text>
              
              {/* Beautiful tooltip */}
              {isHovered && (
                <g>
                  <rect 
                    x={vehicle.position.x + 25} 
                    y={vehicle.position.y - 30} 
                    width="160" 
                    height="60" 
                    fill="rgba(0,0,0,0.9)" 
                    rx="12"
                    stroke={vehicle.color}
                    strokeWidth="3"
                    filter="url(#shadow)"
                  />
                  <text 
                    x={vehicle.position.x + 105} 
                    y={vehicle.position.y - 8} 
                    fontSize="13" 
                    textAnchor="middle" 
                    fill="white" 
                    fontFamily="sans-serif"
                    fontWeight="bold"
                  >
                    {transitLines.find(l => l.id === vehicle.lineId)?.name}
                  </text>
                </g>
              )}
            </g>
          )
        })}
        
        {/* User location with beautiful styling */}
        {userLocation && (
          <g>
            <circle 
              cx={900} 
              cy={570} 
              r="16" 
              fill="#F39C12" 
              stroke="white" 
              strokeWidth="4"
              filter="url(#glow)"
              className="animate-pulse"
            />
            <text 
              x={900} 
              y={600} 
              fontSize="14" 
              textAnchor="middle" 
              fill="#F39C12" 
              fontFamily="sans-serif"
              fontWeight="bold"
            >
              You
            </text>
          </g>
        )}
        
        {/* Beautiful map title */}
        <text 
          x={width / 2} 
          y={40} 
          fontSize="28" 
          textAnchor="middle" 
          fill="#1A202C" 
          fontFamily="sans-serif"
          fontWeight="bold"
          filter="url(#shadow)"
        >
          Toronto Transit System
        </text>

        {/* Enhanced beautiful legend */}
        <g>
          <rect x={width - 180} y={height - 220} width="160" height="200" fill="rgba(255,255,255,0.95)" stroke="#e2e8f0" strokeWidth="2" rx="16" filter="url(#shadow)" />
          <text x={width - 100} y={height - 200} fontSize="16" textAnchor="middle" fill="#2D3748" fontFamily="sans-serif" fontWeight="bold">Legend</text>
          
          {transitLines.slice(0, 7).map((line, index) => (
            <g key={line.id}>
              <circle cx={width - 170} cy={height - 180 + (index * 25)} r="10" fill={getLineColor(line.name)} filter="url(#shadow)" />
              <text x={width - 150} y={height - 175 + (index * 25)} fontSize="11" fill="#4A5568" fontFamily="sans-serif" fontWeight="500">
                {line.name.length > 18 ? line.name.substring(0, 18) + '...' : line.name}
              </text>
            </g>
          ))}
          
          <circle cx={width - 170} cy={height - 25} r="10" fill="#F39C12" filter="url(#shadow)" />
          <text x={width - 150} y={height - 20} fontSize="11" fill="#4A5568" fontFamily="sans-serif" fontWeight="500">You</text>
        </g>

        {/* Beautiful interactive instructions */}
        <g>
          <rect x={20} y={height - 100} width="220" height="80" fill="rgba(255,255,255,0.95)" stroke="#e2e8f0" strokeWidth="2" rx="16" filter="url(#shadow)" />
          <text x={130} y={height - 85} fontSize="14" textAnchor="middle" fill="#2D3748" fontFamily="sans-serif" fontWeight="bold">Interactive Map</text>
          <text x={130} y={height - 65} fontSize="11" textAnchor="middle" fill="#718096" fontFamily="sans-serif">• Click vehicles to track</text>
          <text x={130} y={height - 50} fontSize="11" textAnchor="middle" fill="#718096" fontFamily="sans-serif">• Scroll to zoom, drag to pan</text>
        </g>
      </svg>
    </div>
  )
}

// Generate straight 2D path with minimal strategic bends
function generateStraightPath(stations: Array<{ x: number; y: number }>) {
  if (stations.length < 2) return ''
  
  let path = `M ${stations[0].x} ${stations[0].y}`
  
  // For very long lines, only add 1-2 strategic bends
  if (stations.length > 20) {
    // Add one bend at 1/3 and one at 2/3 of the route
    const bend1Index = Math.floor(stations.length * 0.33)
    const bend2Index = Math.floor(stations.length * 0.66)
    
    for (let i = 1; i < stations.length; i++) {
      const prev = stations[i - 1]
      const curr = stations[i]
      
      if (i === bend1Index || i === bend2Index) {
        // Add strategic bend
        if (Math.abs(curr.x - prev.x) < 10) { // Vertical line
          const bendY = prev.y + (curr.y - prev.y) * 0.5
          const bendX = prev.x + (prev.x > 600 ? -25 : 25) // Single inward bend
          path += ` L ${prev.x} ${bendY} L ${bendX} ${bendY} L ${curr.x} ${curr.y}`
        } else if (Math.abs(curr.y - prev.y) < 10) { // Horizontal line
          const bendX = prev.x + (curr.x - prev.x) * 0.5
          const bendY = prev.y + (prev.y > 300 ? -15 : 15) // Single inward bend
          path += ` L ${bendX} ${prev.y} L ${bendX} ${bendY} L ${curr.x} ${curr.y}`
        } else {
          path += ` L ${curr.x} ${curr.y}`
        }
      } else {
        path += ` L ${curr.x} ${curr.y}`
      }
    }
  } else {
    // For shorter lines, just go straight
    for (let i = 1; i < stations.length; i++) {
      path += ` L ${stations[i].x} ${stations[i].y}`
    }
  }
  
  return path
} 