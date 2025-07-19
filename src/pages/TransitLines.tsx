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
  X,
  Bus,
  Train,
  Car
} from 'lucide-react'
import { useTransit } from '../contexts/TransitContext'
import SelectTransition from '../components/SelectTransition'
import toast from 'react-hot-toast'

interface TransitLine {
  id: string
  name: string
  type: 'bus' | 'subway' | 'streetcar'
  rating: number
  reliability: number
  noiseLevel: string
  occupancy: string
  frequency: string
  status: 'on-time' | 'delayed' | 'crowded' | 'normal'
  nextArrival: string
  stops: string[]
}

export default function TransitLines() {
  const { state, dispatch } = useTransit()
  const [selectedLine, setSelectedLine] = useState<string | null>(null)
  const [showRating, setShowRating] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [filterType, setFilterType] = useState<'all' | 'bus' | 'subway' | 'streetcar'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLineData, setSelectedLineData] = useState<TransitLine | null>(null)
  const [infoLineData, setInfoLineData] = useState<TransitLine | null>(null)
  
  // Rating state
  const [currentRating, setCurrentRating] = useState(0)
  const [noiseLevel, setNoiseLevel] = useState('medium')
  const [occupancy, setOccupancy] = useState('medium')
  const [ratingLineId, setRatingLineId] = useState<string | null>(null)

  const mockTransitLines: TransitLine[] = [
    {
      id: '1',
      name: '501 Queen',
      type: 'streetcar',
      rating: 4.2,
      reliability: 85,
      noiseLevel: 'Low',
      occupancy: 'Medium',
      frequency: 'Every 5-8 min',
      status: 'on-time',
      nextArrival: '2 min',
      stops: ['Queen & Spadina', 'Queen & Bathurst', 'Queen & Ossington']
    },
    {
      id: '2',
      name: '510 Spadina',
      type: 'streetcar',
      rating: 4.5,
      reliability: 92,
      noiseLevel: 'Low',
      occupancy: 'High',
      frequency: 'Every 3-5 min',
      status: 'crowded',
      nextArrival: '1 min',
      stops: ['Spadina & Bloor', 'Spadina & College', 'Spadina & Queen']
    },
    {
      id: '3',
      name: '1 Yonge-University',
      type: 'subway',
      rating: 4.8,
      reliability: 95,
      noiseLevel: 'Medium',
      occupancy: 'High',
      frequency: 'Every 2-3 min',
      status: 'on-time',
      nextArrival: '3 min',
      stops: ['Finch', 'North York Centre', 'Sheppard-Yonge']
    },
    {
      id: '4',
      name: '2 Bloor-Danforth',
      type: 'subway',
      rating: 4.3,
      reliability: 88,
      noiseLevel: 'Medium',
      occupancy: 'Medium',
      frequency: 'Every 3-4 min',
      status: 'delayed',
      nextArrival: '5 min',
      stops: ['Kipling', 'Islington', 'Royal York']
    },
    {
      id: '5',
      name: '29 Dufferin',
      type: 'bus',
      rating: 3.9,
      reliability: 78,
      noiseLevel: 'Medium',
      occupancy: 'Low',
      frequency: 'Every 8-12 min',
      status: 'normal',
      nextArrival: '4 min',
      stops: ['Dufferin & Bloor', 'Dufferin & College', 'Dufferin & Queen']
    },
    {
      id: '6',
      name: '504 King',
      type: 'streetcar',
      rating: 4.1,
      reliability: 82,
      noiseLevel: 'Low',
      occupancy: 'Medium',
      frequency: 'Every 6-10 min',
      status: 'on-time',
      nextArrival: '2 min',
      stops: ['King & Spadina', 'King & Bathurst', 'King & Dufferin']
    }
  ]

  const handleLineClick = (line: TransitLine) => {
    setSelectedLineData(line)
    setShowInfo(true)
  }

  const handleRateLine = (line: TransitLine) => {
    setRatingLineId(line.id)
    setCurrentRating(0)
    setNoiseLevel('medium')
    setOccupancy('medium')
    setShowRating(true)
  }

  const handleSubmitRating = () => {
    if (ratingLineId) {
      toast.success('Rating submitted! Thank you for your feedback.')
      setShowRating(false)
      setRatingLineId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-time': return 'text-green-600 dark:text-green-400'
      case 'delayed': return 'text-red-600 dark:text-red-400'
      case 'crowded': return 'text-orange-600 dark:text-orange-400'
      default: return 'text-blue-600 dark:text-blue-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-time': return '✅'
      case 'delayed': return '⏰'
      case 'crowded': return '👥'
      default: return '🚌'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bus': return '🚌'
      case 'subway': return '🚇'
      case 'streetcar': return '🚋'
      default: return '🚌'
    }
  }

  const filteredLines = mockTransitLines.filter(line => {
    const matchesType = filterType === 'all' || line.type === filterType
    const matchesSearch = line.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-glass">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Transit Lines</h2>
          <p className="text-slate-700 dark:text-slate-400 mb-4">Find and explore transit routes</p>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-600" />
              <input
                type="text"
                placeholder="Search transit lines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-400 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none transition-all duration-300 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-slate-600/50 hover:bg-white/90 dark:hover:bg-slate-800/90'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('bus')}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  filterType === 'bus'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-slate-600/50 hover:bg-white/90 dark:hover:bg-slate-800/90'
                }`}
              >
                <Bus className="h-4 w-4 inline mr-1" />
                Bus
              </button>
              <button
                onClick={() => setFilterType('subway')}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  filterType === 'subway'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-slate-600/50 hover:bg-white/90 dark:hover:bg-slate-800/90'
                }`}
              >
                <Train className="h-4 w-4 inline mr-1" />
                Subway
              </button>
              <button
                onClick={() => setFilterType('streetcar')}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  filterType === 'streetcar'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-slate-600/50 hover:bg-white/90 dark:hover:bg-slate-800/90'
                }`}
              >
                <Car className="h-4 w-4 inline mr-1" />
                Streetcar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transit Lines List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Available Lines ({filteredLines.length})
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-slate-800/90'
              }`}
            >
              <Navigation className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-slate-800/90'
              }`}
            >
              <div className="grid grid-cols-2 gap-0.5 h-4 w-4">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredLines.map((line) => (
              <div 
                key={line.id} 
                className="glass rounded-xl p-4 hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all duration-300 cursor-pointer"
                onClick={() => handleLineClick(line)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{getTypeIcon(line.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{line.name}</h4>
                        <span className={`text-sm font-medium ${getStatusColor(line.status)}`}>
                          {getStatusIcon(line.status)} {line.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-700 dark:text-slate-400">
                        <span>⭐ {line.rating}</span>
                        <span>📊 {line.reliability}% reliable</span>
                        <span>🔊 {line.noiseLevel} noise</span>
                        <span>👥 {line.occupancy} occupancy</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {line.nextArrival}
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-400">
                      Next arrival
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-600/50">
                  <div className="text-sm text-slate-700 dark:text-slate-400">
                    {line.frequency}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLineClick(line)
                      }}
                      className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-all duration-300 flex items-center space-x-1"
                    >
                      <Info className="h-3 w-3" />
                      <span>Info</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRateLine(line)
                      }}
                      className="px-3 py-1 rounded-lg text-sm font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-all duration-300"
                    >
                      Rate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLines.map((line) => (
              <div 
                key={line.id} 
                className="glass rounded-xl p-4 hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all duration-300 cursor-pointer text-center"
                onClick={() => handleLineClick(line)}
              >
                <div className="text-4xl mb-3">{getTypeIcon(line.type)}</div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{line.name}</h4>
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-400 mb-4">
                  <div>⭐ {line.rating} • {line.reliability}% reliable</div>
                  <div>🔊 {line.noiseLevel} • 👥 {line.occupancy}</div>
                  <div className={`font-medium ${getStatusColor(line.status)}`}>
                    {getStatusIcon(line.status)} {line.status}
                  </div>
                </div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-3">
                  {line.nextArrival}
                </div>
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLineClick(line)
                    }}
                    className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-all duration-300 flex items-center space-x-1"
                  >
                    <Info className="h-3 w-3" />
                    <span>Info</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRateLine(line)
                    }}
                    className="px-3 py-1 rounded-lg text-sm font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-all duration-300"
                  >
                    Rate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRating && ratingLineId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Rate Transit Line</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-2">Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setCurrentRating(star)}
                      className={`text-2xl ${star <= currentRating ? 'text-yellow-500' : 'text-slate-400'}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-2">Noise Level</label>
                <SelectTransition isOpen={true} className="w-full">
                  <select
                    value={noiseLevel}
                    onChange={(e) => setNoiseLevel(e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </SelectTransition>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-2">Occupancy</label>
                <SelectTransition isOpen={true} className="w-full">
                  <select
                    value={occupancy}
                    onChange={(e) => setOccupancy(e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </SelectTransition>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowRating(false)}
                className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfo && selectedLineData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {selectedLineData.name} Details
              </h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-slate-600 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{getTypeIcon(selectedLineData.type)}</div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{selectedLineData.name}</div>
                  <div className="text-sm text-slate-700 dark:text-slate-400 capitalize">{selectedLineData.type}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 glass rounded-lg">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{selectedLineData.rating}</div>
                  <div className="text-sm text-slate-700 dark:text-slate-400">Rating</div>
                </div>
                <div className="text-center p-3 glass rounded-lg">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{selectedLineData.reliability}%</div>
                  <div className="text-sm text-slate-700 dark:text-slate-400">Reliability</div>
                </div>
                <div className="text-center p-3 glass rounded-lg">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{selectedLineData.frequency}</div>
                  <div className="text-sm text-slate-700 dark:text-slate-400">Frequency</div>
                </div>
                <div className="text-center p-3 glass rounded-lg">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{selectedLineData.nextArrival}</div>
                  <div className="text-sm text-slate-700 dark:text-slate-400">Next Arrival</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Key Stops</h4>
                <div className="space-y-1">
                  {selectedLineData.stops.map((stop, index) => (
                    <div key={index} className="text-sm text-slate-700 dark:text-slate-400 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      {stop}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    handleRateLine(selectedLineData)
                    setShowInfo(false)
                  }}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-all duration-300"
                >
                  Rate Line
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 