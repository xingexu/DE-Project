import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Settings, Award, TrendingUp, MapPin, Clock, Star } from 'lucide-react'
import { useTransit } from '../contexts/TransitContext'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import { ApiLoading } from '../components/ApiError'
import { safeApiCall } from '../utils/errorHandling'

export default function ProfileShort() {
  const { state, dispatch, loadUserProfile } = useTransit()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    // Load user profile if there's a token but no user data
    if (localStorage.getItem('token') && !state.user.id) {
      loadUserProfile()
    }
  }, [])
  
  const handleLogout = () => {
    toast.success('Logging out...')
    navigate('/logout')
  }
  
  const handleAvatarChange = async (newAvatar: string) => {
    setIsLoading(true)
    
    try {
      const response = await authAPI.updateProfile({ avatar: newAvatar })
      
      if (response.success) {
        toast.success('Avatar updated successfully!')
      } else {
        toast.error(response.message || 'Failed to update avatar')
      }
    } catch (error) {
      console.error('Failed to update avatar:', error)
      toast.error('Failed to update avatar')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Calculate level progress with safe defaults
  const calculateProgressPercentage = (experience: number): number => {
    const currentLevel = state.user?.level || 1
    const experienceForCurrentLevel = (currentLevel - 1) * 100
    const experienceInCurrentLevel = (experience || 0) - experienceForCurrentLevel
    return Math.max(0, Math.min(100, (experienceInCurrentLevel / 100) * 100))
  }
  
  const calculateExperienceToNext = (experience: number): number => {
    const currentLevel = state.user?.level || 1
    const experienceForNextLevel = currentLevel * 100
    return Math.max(0, experienceForNextLevel - (experience || 0))
  }
  
  // Safe number formatting with defaults
  const formatNumber = (value: number | undefined, decimals: number = 1): string => {
    if (value === undefined || value === null || isNaN(value)) return '0'
    return value.toFixed(decimals)
  }
  
  // Safe user data with defaults
  const user = state.user || {
    name: 'User',
    avatar: '👤',
    level: 1,
    experience: 0,
    weeklyPoints: 0,
    points: 0,
    totalTrips: 0,
    totalDistance: 0,
    totalTime: 0
  }
  
  const stats = [
    { label: 'Total Taubits', value: user.points || 0, icon: Star, color: 'text-yellow-600' },
    { label: 'Trips This Week', value: user.totalTrips || 0, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Distance Traveled', value: `${formatNumber(user.totalDistance)} km`, icon: MapPin, color: 'text-blue-600' },
    { label: 'Time on Transit', value: `${formatNumber(user.totalTime)} hrs`, icon: Clock, color: 'text-purple-600' }
  ]
  
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]
  
  if (state.isLoading) {
    return <ApiLoading message="Loading profile data..." className="min-h-[400px]" />
  }
  
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card-glass">
        <div className="text-center">
          <div className="relative inline-block">
            <div 
              className="mb-4 cursor-pointer hover:scale-110 transition-transform" 
            >
              {user.avatar && user.avatar.startsWith('data:image') ? (
                <img 
                  src={user.avatar} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-white/50 shadow-xl premium-glow"
                />
              ) : (
                <div className="text-6xl float premium-glow">{user.avatar}</div>
              )}
            </div>
          </div>
          <h2 className="text-2xl font-bold premium-name mb-2">{user.name}</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Transit Enthusiast</p>
          
          {/* Level Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Star className="h-4 w-4 text-yellow-500 premium-glow" />
              <span className="text-yellow-600 dark:text-yellow-400 font-semibold premium-name">Level {user.level || 1}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${calculateProgressPercentage(user.experience)}%` }}
              />
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {(user.experience || 0) % 100}/100 XP • {calculateExperienceToNext(user.experience || 0)} XP to next level
            </div>
          </div>
          
          <div className="flex justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400">+{user.weeklyPoints} this week</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`nav-item ${activeTab === tab.id ? 'nav-item-active' : ''}`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Your Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center p-4 glass rounded-xl hover:scale-105 transition-transform">
                  <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-xl font-bold text-gradient">{stat.value}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Account Settings</h3>
          <div className="space-y-4">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 glass rounded-xl hover:bg-white/90 transition-all duration-300">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-red-600" />
                <div className="text-left">
                  <div className="font-medium text-red-900 dark:text-red-100">Sign out</div>
                  <div className="text-sm text-red-600 dark:text-red-400">Sign out of your account</div>
                </div>
              </div>
              <div className="text-red-400">→</div>
            </button>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
      />
    </div>
  )
}
