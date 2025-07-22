import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  User, 
  Settings, 
  Award, 
  TrendingUp, 
  MapPin,
  Clock,
  Star,
  Shield,
  Bell,
  HelpCircle,
  LogOut,
  Trophy,
  Crown,
  Medal,
  Camera,
  Upload,
  Palette
} from 'lucide-react'
import { useTransit } from '../contexts/TransitContext'
import FAQ from '../components/FAQ'
import NotificationSettings from '../components/NotificationSettings'
import Beaverbot from '../components/Beaverbot'
import toast from 'react-hot-toast'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  progress?: number
  total?: number
}

interface LeaderboardUser {
  id: string
  name: string
  avatar: string
  level: number
  points: number
  weeklyPoints: number
  totalTrips: number
  rank: number
}

const achievements: Achievement[] = [
  {
    id: '1',
    name: 'First Ride',
    description: 'Complete your first transit journey',
    icon: '🚌',
    unlocked: true
  },
  {
    id: '2',
    name: 'Eco Warrior',
    description: 'Use transit 10 days in a row',
    icon: '🌱',
    unlocked: false,
    progress: 7,
    total: 10
  },
  {
    id: '3',
    name: 'Explorer',
    description: 'Visit 5 different transit lines',
    icon: '🗺️',
    unlocked: true
  },
  {
    id: '4',
    name: 'Social Butterfly',
    description: 'Connect with 5 friends',
    icon: '🦋',
    unlocked: false,
    progress: 3,
    total: 5
  },
  {
    id: '5',
    name: 'Level 5 Master',
    description: 'Reach level 5',
    icon: '⭐',
    unlocked: true
  },
  {
    id: '6',
    name: 'Weekly Champion',
    description: 'Earn 200+ points in a week',
    icon: '🏆',
    unlocked: false,
    progress: 150,
    total: 200
  }
]

const mockLeaderboard: LeaderboardUser[] = [
  {
    id: '1',
    name: 'Kevin',
    avatar: '🚌',
    level: 5,
    points: 1250,
    weeklyPoints: 150,
    totalTrips: 47,
    rank: 1
  },
  {
    id: '2',
    name: 'Sarah Chen',
    avatar: '🚇',
    level: 4,
    points: 980,
    weeklyPoints: 120,
    totalTrips: 38,
    rank: 2
  },
  {
    id: '3',
    name: 'Mike Johnson',
    avatar: '🚋',
    level: 4,
    points: 920,
    weeklyPoints: 95,
    totalTrips: 35,
    rank: 3
  },
  {
    id: '4',
    name: 'Emma Davis',
    avatar: '🚌',
    level: 3,
    points: 750,
    weeklyPoints: 80,
    totalTrips: 28,
    rank: 4
  },
  {
    id: '5',
    name: 'Alex Kim',
    avatar: '🚇',
    level: 3,
    points: 680,
    weeklyPoints: 65,
    totalTrips: 25,
    rank: 5
  }
]

export default function Profile() {
  const { state, dispatch } = useTransit()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'profile' | 'achievements' | 'leaderboard' | 'settings' | 'collection'>('profile')
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [showPrivacySettings, setShowPrivacySettings] = useState(false)
  const [showBeaverbot, setShowBeaverbot] = useState(false)
  const [showFAQ, setShowFAQ] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [accountType, setAccountType] = useState<'child' | 'teen' | 'adult'>('adult')
  
  // Notification settings
  const [pushNotifications, setPushNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [tripReminders, setTripReminders] = useState(true)
  const [rewardAlerts, setRewardAlerts] = useState(true)
  const [friendUpdates, setFriendUpdates] = useState(true)
  const [systemUpdates, setSystemUpdates] = useState(false)
  
  const [messageRequests, setMessageRequests] = useState(false)
  const [chatEnabled, setChatEnabled] = useState(true)
  const [locationSharing, setLocationSharing] = useState(false)
  const [friendRequests, setFriendRequests] = useState(true)
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'bot', message: string, timestamp: Date}>>([
    {
      type: 'bot',
      message: "Hi there! I'm Beaverbot, your friendly transit assistant! 🦫 How can I help you today?",
      timestamp: new Date()
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleLogout = () => {
    toast.success('Logging out...')
    navigate('/logout')
  }

  const handleNotifications = () => {
    setShowNotificationSettings(true)
  }

  const handlePrivacySettings = () => {
    navigate('/privacy')
  }

  const handleFAQ = () => {
    setShowFAQ(true)
  }

  const handleHelpSupport = () => {
    setShowBeaverbot(true)
  }

  const handleAvatarChange = (newAvatar: string) => {
    dispatch({
      type: 'SET_USER',
      payload: {
        ...state.user,
        avatar: newAvatar
      }
    })
    setShowAvatarSelector(false)
    toast.success('Avatar updated successfully!')
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        dispatch({
          type: 'SET_USER',
          payload: {
            ...state.user,
            avatar: result
          }
        })
        toast.success('Profile photo updated successfully!')
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePhotoUploadClick = () => {
    fileInputRef.current?.click()
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

  const avatarOptions = ['🚌', '🚇', '🚋', '🚎', '🚐', '🚗', '🚕', '🚙', '🚍', '🚏', '🚲', '🚶', '🏃', '🛴', '🛵', '🚁', '🚢', '🚤', '⛵', '🚣', '🛥️', '🚡', '🚠', '🚟', '🚃', '🚄', '🚅', '🚆', '🚈', '🚉', '🚊', '🚝', '🚞', '🚂', '🚀', '🛸', '🚁', '🛩️', '🛫', '🛬', '🚕', '🚗', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛺', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🚁', '🛸', '🚀', '⛵', '🛥️', '🚤', '⛴️', '🛳️', '🚢', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛺', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🚁', '🛸', '🚀', '⛵', '🛥️', '🚤', '⛴️', '🛳️', '🚢']

  const stats = [
    { label: 'Total Taubits', value: user.points || 0, icon: Star, color: 'text-yellow-600' },
    { label: 'Trips This Week', value: user.totalTrips || 0, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Distance Traveled', value: `${formatNumber(user.totalDistance)} km`, icon: MapPin, color: 'text-blue-600' },
    { label: 'Time on Transit', value: `${formatNumber(user.totalTime)} hrs`, icon: Clock, color: 'text-purple-600' }
  ]

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'collection', label: 'Collection', icon: Palette },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />
      case 2: return <Medal className="h-5 w-5 text-gray-400" />
      case 3: return <Medal className="h-5 w-5 text-orange-500" />
      default: return <span className="text-sm font-medium text-gray-500">#{rank}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card-glass">
        <div className="text-center">
          <div className="relative inline-block">
            <div 
              className="mb-4 cursor-pointer hover:scale-110 transition-transform" 
              onClick={() => setShowAvatarSelector(true)}
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
            <button
              onClick={() => setShowAvatarSelector(true)}
              className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
            >
              <Camera className="h-4 w-4" />
            </button>
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

          {/* Recent Activity */}
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-4 glass rounded-xl hover:bg-white/90 transition-all duration-300">
                <div className="text-2xl">✅</div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">Completed trip on 501 Queen</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Earned 25 points • 2 hours ago</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 glass rounded-xl hover:bg-white/90 transition-all duration-300">
                <div className="text-2xl">🎉</div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">Unlocked "First Ride" achievement</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">1 day ago</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 glass rounded-xl hover:bg-white/90 transition-all duration-300">
                <div className="text-2xl">👥</div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">Joined "Morning Commute" group</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">3 days ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Achievements</h3>
            <div className="grid grid-cols-1 gap-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="glass rounded-xl p-4 hover:bg-white/90 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{achievement.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{achievement.description}</div>
                      {achievement.progress && achievement.total && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress}/{achievement.total}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`text-2xl ${achievement.unlocked ? 'text-yellow-500' : 'text-slate-300'}`}>
                      {achievement.unlocked ? '🏆' : '🔒'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Weekly Leaderboard</h3>
            <div className="space-y-3">
              {mockLeaderboard.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 glass rounded-xl hover:bg-white/90 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getRankIcon(user.rank)}
                      <div className="text-2xl">{user.avatar}</div>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{user.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Level {user.level || 1} • {user.totalTrips} trips</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-gradient">{user.points}</div>
                    <div className="text-sm text-green-600 dark:text-green-400">+{user.weeklyPoints} this week</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Collection Tab */}
      {activeTab === 'collection' && (
        <div className="space-y-6">
          {/* Route Skins */}
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Route Skins</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Customize your transit route display with these amazing skins!</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.rewards.filter(reward => reward.type === 'route-skin').map((skin) => (
                <div key={skin.id} className={`p-4 glass rounded-xl transition-all duration-300 hover:scale-105 ${
                  skin.available 
                    ? 'hover:bg-white/90' 
                    : 'opacity-60'
                }`}>
                  <div className="text-4xl mb-3 text-center">{skin.image}</div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-center mb-2">{skin.name}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-3">{skin.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {skin.pointsCost} points
                    </span>
                    {skin.premiumOnly && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  {skin.premiumOnly && (
                    <div className="mt-2 text-xs text-purple-600 font-medium text-center">
                      ✨ Premium Exclusive
                    </div>
                  )}
                  {!skin.available && (
                    <div className="mt-2 text-xs text-slate-500 text-center">
                      🔒 Locked
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Avatar Collection */}
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Avatar Collection</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Unlock unique avatars to personalize your profile!</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.rewards.filter(reward => reward.type === 'avatar').map((avatar) => (
                <div key={avatar.id} className={`p-4 glass rounded-xl transition-all duration-300 hover:scale-105 ${
                  avatar.available 
                    ? 'hover:bg-white/90' 
                    : 'opacity-60'
                }`}>
                  <div className="text-4xl mb-3 text-center">{avatar.image}</div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-center mb-2">{avatar.name}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-3">{avatar.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {avatar.pointsCost} points
                    </span>
                    {avatar.premiumOnly && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  {avatar.premiumOnly && (
                    <div className="mt-2 text-xs text-purple-600 font-medium text-center">
                      ✨ Premium Exclusive
                    </div>
                  )}
                  {!avatar.available && (
                    <div className="mt-2 text-xs text-slate-500 text-center">
                      🔒 Locked
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Collection Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Collection Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 glass rounded-xl hover:scale-105 transition-transform">
                <div className="text-2xl font-bold text-gradient">
                  {state.rewards.filter(r => r.type === 'route-skin' && r.available).length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Route Skins</div>
              </div>
              <div className="text-center p-4 glass rounded-xl hover:scale-105 transition-transform">
                <div className="text-2xl font-bold text-gradient">
                  {state.rewards.filter(r => r.type === 'avatar' && r.available).length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Avatars</div>
              </div>
              <div className="text-center p-4 glass rounded-xl hover:scale-105 transition-transform">
                <div className="text-2xl font-bold text-gradient">
                  {state.rewards.filter(r => r.premiumOnly && r.available).length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Premium Items</div>
              </div>
              <div className="text-center p-4 glass rounded-xl hover:scale-105 transition-transform">
                <div className="text-2xl font-bold text-gradient">
                  {state.rewards.filter(r => !r.available).length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Locked Items</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Account Settings</h3>
            <div className="space-y-4">
              <button 
                onClick={handleNotifications}
                className="w-full flex items-center justify-between p-4 glass rounded-xl hover:bg-white/90 transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-slate-600" />
                  <div className="text-left">
                    <div className="font-medium text-slate-900 dark:text-slate-100">Notifications</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Manage your notification preferences</div>
                  </div>
                </div>
                <div className="text-slate-400">→</div>
              </button>
              
              <button 
                onClick={handlePrivacySettings}
                className="w-full flex items-center justify-between p-4 glass rounded-xl hover:bg-white/90 transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-slate-600" />
                  <div className="text-left">
                    <div className="font-medium text-slate-900 dark:text-slate-100">Privacy Settings</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Control your privacy settings</div>
                  </div>
                </div>
                <div className="text-slate-400">→</div>
              </button>
              
              <button 
                onClick={handleFAQ}
                className="w-full flex items-center justify-between p-4 glass rounded-xl hover:bg-white/90 transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  <HelpCircle className="h-5 w-5 text-slate-600" />
                  <div className="text-left">
                    <div className="font-medium text-slate-900 dark:text-slate-100">FAQ</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Find answers to common questions</div>
                  </div>
                </div>
                <div className="text-slate-400">→</div>
              </button>
              
              <button 
                onClick={handleHelpSupport}
                className="w-full flex items-center justify-between p-4 glass rounded-xl hover:bg-white/90 transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  <HelpCircle className="h-5 w-5 text-slate-600" />
                  <div className="text-left">
                    <div className="font-medium text-slate-900 dark:text-slate-100">Help & Support</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Get help and contact support</div>
                  </div>
                </div>
                <div className="text-slate-400">→</div>
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 glass rounded-xl hover:bg-white/90 transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <LogOut className="h-5 w-5 text-red-600" />
                  <div className="text-left">
                    <div className="font-medium text-red-900 dark:text-red-100">Sign out of your account</div>
                    <div className="text-sm text-red-600 dark:text-red-400">Sign out of your account</div>
                  </div>
                </div>
                <div className="text-red-400">→</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {showFAQ && (
        <FAQ onClose={() => setShowFAQ(false)} />
      )}

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <NotificationSettings onClose={() => setShowNotificationSettings(false)} />
      )}

      {/* Beaverbot Modal */}
      {showBeaverbot && (
        <Beaverbot onClose={() => setShowBeaverbot(false)} />
      )}
      
      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Choose Your Avatar</h3>
              <p className="text-gray-600 dark:text-gray-400">Select a new profile picture</p>
            </div>
            
            {/* Photo Upload Section */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-center">
                <Upload className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Upload Photo</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Upload your own photo (max 5MB)</p>
                <button
                  onClick={handlePhotoUploadClick}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Choose File
                </button>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Or choose an emoji:</h4>
              <div className="grid grid-cols-6 gap-3 mb-6">
                {avatarOptions.map((avatar, index) => (
                  <button
                    key={index}
                    onClick={() => handleAvatarChange(avatar)}
                    className={`p-3 text-2xl rounded-lg border-2 transition-all hover:scale-110 ${
                      user.avatar === avatar
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-110'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAvatarSelector(false)}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />
    </div>
  )
} 