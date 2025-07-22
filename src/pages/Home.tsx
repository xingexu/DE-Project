import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  MapPin, 
  Gift, 
  Users, 
  TrendingUp, 
  Star, 
  Play, 
  Square, 
  Zap,
  Crown,
  Sparkles,
  Navigation
} from 'lucide-react'
import { useTransit } from '../contexts/TransitContext'
import toast from 'react-hot-toast'

export default function Home() {
  const { state, dispatch } = useTransit()
  const [isTapping, setIsTapping] = useState(false)
  const navigate = useNavigate()

  // Safe user data with defaults
  const user = state.user || {
    name: 'User',
    points: 0,
    level: 1,
    experience: 0,
    weeklyPoints: 0
  }

  const handleTapIn = () => {
    if (state.isTracking) {
      toast.error('Already tracking! Tap out first.')
      return
    }
    
    setIsTapping(true)
    setTimeout(() => {
      dispatch({ type: 'START_TRACKING' })
      toast.success('Tap in successful! Tracking your journey...')
      setIsTapping(false)
    }, 1000)
  }

  const handleTapOut = () => {
    if (!state.isTracking) {
      toast.error('Not currently tracking! Tap in first.')
      return
    }

    setIsTapping(true)
    setTimeout(() => {
      const pointsEarned = Math.floor(Math.random() * 50) + 10
      dispatch({ type: 'STOP_TRACKING' })
      dispatch({ type: 'ADD_POINTS', payload: pointsEarned })
      toast.success(`Tap out successful! Earned ${pointsEarned} points!`)
      setIsTapping(false)
    }, 1000)
  }

  const nearbyLines = state.transitLines?.slice(0, 3) || []

  const handleLineClick = (line: any) => {
    toast.success(`Selected ${line.name} - ${line.type} line`)
  }

  const handleViewAllLines = () => {
    navigate('/transit-lines')
  }

  // Calculate level progress with safe defaults
  const calculateProgressPercentage = (experience: number): number => {
    const currentLevel = user.level || 1
    const experienceForCurrentLevel = (currentLevel - 1) * 100
    const experienceInCurrentLevel = (experience || 0) - experienceForCurrentLevel
    return Math.max(0, Math.min(100, (experienceInCurrentLevel / 100) * 100))
  }

  const calculateExperienceToNext = (experience: number): number => {
    const currentLevel = user.level || 1
    const experienceForNextLevel = currentLevel * 100
    return Math.max(0, experienceForNextLevel - (experience || 0))
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="card-glass">
        <div className="text-center">
          <div className="mb-4">
            <div className="text-4xl mb-2 float">
              {user.avatar || '👤'}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Welcome back,{' '}
              <span className={`${
                user.isPremium 
                  ? 'premium-name premium-glow' 
                  : 'text-gradient'
              }`}>
                {user.name}
              </span>
              !
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Ready to earn taubits and explore the city?
            </p>
          </div>
          
          {/* Tap In/Out Button */}
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={handleTapIn}
              disabled={state.isTracking || isTapping}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                state.isTracking || isTapping
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'btn-success'
              }`}
            >
              <Play className="h-5 w-5" />
              <span>Tap In</span>
            </button>
            
            <button
              onClick={handleTapOut}
              disabled={!state.isTracking || isTapping}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                !state.isTracking || isTapping
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'btn-danger'
              }`}
            >
              <Square className="h-5 w-5" />
              <span>Tap Out</span>
            </button>
          </div>

          {state.isTracking && (
            <div className="glass px-4 py-3 rounded-xl border border-green-200/50">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <Zap className="h-4 w-4 animate-pulse" />
                <span className="font-medium">Currently tracking your journey...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center hover:scale-105 transition-transform">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <div className="text-2xl font-bold text-gradient">
              {user.points || 0}
            </div>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Taubits</div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">+{user.weeklyPoints || 0} this week</div>
        </div>
        
        <div className="card text-center hover:scale-105 transition-transform">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <div className="text-2xl font-bold text-gradient">
              {user.level || 1}
            </div>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Level</div>
          <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{(user.experience || 0) % 100}/100 XP</div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Level Progress</h3>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-slate-600 dark:text-slate-400">Level {user.level || 1}</div>
            {user.isPremium && (
              <div className="flex items-center space-x-1 px-3 py-1 xp-badge-glow rounded-full text-xs font-medium text-white">
                <Zap className="h-3 w-3" />
                <span>2x XP</span>
              </div>
            )}
          </div>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3 mb-3">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${calculateProgressPercentage(user.experience || 0)}%` }}
          />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 text-center">
          {calculateExperienceToNext(user.experience || 0)} XP to next level
        </div>
      </div>

      {/* Nearby Transit Lines */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
            <Navigation className="h-5 w-5 mr-2 text-blue-600" />
            Nearby Transit Lines
          </h3>
          <button 
            onClick={handleViewAllLines}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </button>
        </div>
        
        <div className="space-y-3">
          {nearbyLines.map((line) => (
            <div 
              key={line.id} 
              onClick={() => handleLineClick(line)}
              className="flex items-center justify-between p-4 glass rounded-xl hover:bg-white/90 cursor-pointer transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {line.type === 'bus' ? '🚌' : line.type === 'subway' ? '🚇' : '🚋'}
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{line.name}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                    <Star className="h-3 w-3 mr-1 text-yellow-500" />
                    {line.rating} • {line.reliability}% reliable
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {line.noiseLevel} noise
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {line.occupancy} occupancy
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/transit-lines')}
            className="flex flex-col items-center p-4 glass rounded-xl hover:bg-white/90 transition-all duration-300 hover:scale-105 group"
          >
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl mb-3 group-hover:scale-110 transition-transform">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Transit Lines</span>
          </button>
          
          <button 
            onClick={() => navigate('/rewards')}
            className="flex flex-col items-center p-4 glass rounded-xl hover:bg-white/90 transition-all duration-300 hover:scale-105 group"
          >
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl mb-3 group-hover:scale-110 transition-transform">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Rewards</span>
          </button>
          
          <button 
            onClick={() => navigate('/social')}
            className="flex flex-col items-center p-4 glass rounded-xl hover:bg-white/90 transition-all duration-300 hover:scale-105 group"
          >
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mb-3 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Social</span>
          </button>
          
          <button 
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center p-4 glass rounded-xl hover:bg-white/90 transition-all duration-300 hover:scale-105 group"
          >
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl mb-3 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Stats</span>
          </button>
        </div>
      </div>
    </div>
  )
} 