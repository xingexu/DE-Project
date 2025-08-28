import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'

// Types
export interface User {
  id: string
  name: string
  email: string
  password: string
  points: number
  avatar: string
  isTracking: boolean
  currentLocation?: { lat: number; lng: number }
  friends: string[]
  parentTracking: boolean
  level: number
  experience: number
  weeklyPoints: number
  totalTrips: number
  totalDistance: number
  totalTime: number
  joinDate: Date
  // Premium features
  isPremium: boolean
  premiumExpiry?: Date
  premiumFeatures: {
    extraXPGain: boolean
    specialRewards: boolean
    advancedTracking: boolean
    prioritySupport: boolean
  }
  // Privacy settings
  locationSharing?: boolean
  friendRequests?: boolean
  chatEnabled?: boolean
  messageRequests?: boolean
}

export interface TransitLine {
  id: string
  name: string
  type: 'bus' | 'subway' | 'streetcar'
  rating: number
  ratingCount?: number
  noiseLevel: 'low' | 'medium' | 'high'
  occupancy: 'low' | 'medium' | 'high'
  reliability: number
  currentLocation: { lat: number; lng: number }
  route: Array<{ lat: number; lng: number }>
}

export interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  type: 'discount' | 'avatar' | 'route-skin'
  image: string
  available: boolean
  premiumOnly?: boolean
}

export interface TransitState {
  user: User
  transitLines: TransitLine[]
  rewards: Reward[]
  isTracking: boolean
  trackingStartTime?: Date
  currentDistance: number
  theme: 'light' | 'dark'
}

// Actions
type TransitAction =
  | { type: 'START_TRACKING' }
  | { type: 'STOP_TRACKING'; payload: { distance: number; time: number } }
  | { type: 'UPDATE_LOCATION'; payload: { lat: number; lng: number } }
  | { type: 'ADD_POINTS'; payload: number }
  | { type: 'REDEEM_REWARD'; payload: string }
  | { type: 'UPDATE_TRANSIT_LINES'; payload: TransitLine[] }
  | { type: 'RATE_LINE'; payload: { lineId: string; rating: number; noiseLevel: string; occupancy: string } }
  | { type: 'UPDATE_LINE_RATING'; payload: { lineId: string; rating: number; ratingCount: number; reliability: number; noiseLevel: string; occupancy: string } }
  | { type: 'SET_USER'; payload: { 
      id: string; 
      name: string; 
      email: string;
      password: string;
      avatar: string; 
      points: number; 
      isTracking: boolean; 
      friends: string[]; 
      parentTracking: boolean;
      level: number;
      experience: number;
      weeklyPoints: number;
      totalTrips: number;
      totalDistance: number;
      totalTime: number;
      joinDate: Date;
      isPremium: boolean;
      premiumExpiry?: Date;
      premiumFeatures: {
        extraXPGain: boolean;
        specialRewards: boolean;
        advancedTracking: boolean;
        prioritySupport: boolean;
      };
      locationSharing?: boolean;
      friendRequests?: boolean;
      chatEnabled?: boolean;
      messageRequests?: boolean;
    } }
  | { type: 'LOGIN'; payload: { email: string; password: string } }
  | { type: 'LOGOUT' }
  | { type: 'ADD_EXPERIENCE'; payload: number }
  | { type: 'UPDATE_WEEKLY_STATS'; payload: { points: number; trips: number; distance: number; time: number } }
  | { type: 'UPGRADE_TO_PREMIUM'; payload: { expiryDate: Date } }
  | { type: 'CANCEL_PREMIUM' }
  | { type: 'CREATE_ACCOUNT'; payload: { 
      id: string; 
      name: string;
      email: string;
      password: string;
      avatar: string;
      points: number;
      isTracking: boolean;
      friends: string[];
      parentTracking: boolean;
      level: number;
      experience: number;
      weeklyPoints: number;
      totalTrips: number;
      totalDistance: number;
      totalTime: number;
      joinDate: Date;
      isPremium: boolean;
      premiumExpiry?: Date;
      premiumFeatures: {
        extraXPGain: boolean;
        specialRewards: boolean;
        advancedTracking: boolean;
        prioritySupport: boolean;
      };
      locationSharing?: boolean;
      friendRequests?: boolean;
      chatEnabled?: boolean;
      messageRequests?: boolean;
    } }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }

// Helper functions for leveling system
const calculateLevel = (experience: number): number => {
  const exp = experience || 0
  return Math.floor(exp / 100) + 1
}

const calculateExperienceToNext = (experience: number): number => {
  const exp = experience || 0
  const currentLevel = calculateLevel(exp)
  const experienceForCurrentLevel = (currentLevel - 1) * 100
  const experienceForNextLevel = currentLevel * 100
  return Math.max(0, experienceForNextLevel - exp)
}

const calculateProgressPercentage = (experience: number): number => {
  const exp = experience || 0
  const currentLevel = calculateLevel(exp)
  const experienceForCurrentLevel = (currentLevel - 1) * 100
  const experienceInCurrentLevel = exp - experienceForCurrentLevel
  return Math.max(0, Math.min(100, (experienceInCurrentLevel / 100) * 100))
}

// Helper functions for localStorage
const saveUserToStorage = (user: User) => {
  try {
    localStorage.setItem('transitUser', JSON.stringify(user))
  } catch (error) {
    console.error('Failed to save user to localStorage:', error)
  }
}

// Helper functions for authentication
const saveCredentialsToStorage = (email: string, password: string) => {
  try {
    localStorage.setItem('transitCredentials', JSON.stringify({ email, password }))
  } catch (error) {
    console.error('Failed to save credentials to localStorage:', error)
  }
}

const loadCredentialsFromStorage = (): { email: string; password: string } | null => {
  try {
    const credentials = localStorage.getItem('transitCredentials')
    if (credentials) {
      return JSON.parse(credentials)
    }
  } catch (error) {
    console.error('Failed to load credentials from localStorage:', error)
  }
  return null
}

const clearCredentialsFromStorage = () => {
  try {
    localStorage.removeItem('transitCredentials')
  } catch (error) {
    console.error('Failed to clear credentials from localStorage:', error)
  }
}

// Helper function to calculate taubits based on distance and time
const calculateTaubits = (distance: number, time: number): number => {
  // Each kilometer = 10 taubits, each minute = 10 taubits
  const distancePoints = Math.floor(distance * 10)
  const timePoints = Math.floor(time * 10)
  return distancePoints + timePoints
}

const loadUserFromStorage = (): User | null => {
  try {
    const userData = localStorage.getItem('transitUser')
    if (userData) {
      const user = JSON.parse(userData)
      
      // Convert joinDate back to Date object
      if (user.joinDate) {
        user.joinDate = new Date(user.joinDate)
      } else {
        user.joinDate = new Date()
      }
      
      // Ensure all required properties have default values
      return {
        id: user.id || '',
        name: user.name || 'User',
        email: user.email || '',
        password: user.password || '',
        points: user.points || 0,
        avatar: user.avatar || '👤',
        isTracking: user.isTracking || false,
        currentLocation: user.currentLocation || undefined,
        friends: user.friends || [],
        parentTracking: user.parentTracking || false,
        level: user.level || 1,
        experience: user.experience || 0,
        weeklyPoints: user.weeklyPoints || 0,
        totalTrips: user.totalTrips || 0,
        totalDistance: user.totalDistance || 0,
        totalTime: user.totalTime || 0,
        joinDate: user.joinDate || new Date(),
        isPremium: user.isPremium || false,
        premiumExpiry: user.premiumExpiry ? new Date(user.premiumExpiry) : undefined,
        premiumFeatures: {
          extraXPGain: user.premiumFeatures?.extraXPGain || false,
          specialRewards: user.premiumFeatures?.specialRewards || false,
          advancedTracking: user.premiumFeatures?.advancedTracking || false,
          prioritySupport: user.premiumFeatures?.prioritySupport || false,
        },
        locationSharing: user.locationSharing || false,
        friendRequests: user.friendRequests !== undefined ? user.friendRequests : true,
        chatEnabled: user.chatEnabled !== undefined ? user.chatEnabled : true,
        messageRequests: user.messageRequests || false,
      }
    }
  } catch (error) {
    console.error('Failed to load user from localStorage:', error)
  }
  return null
}

const clearUserFromStorage = () => {
  try {
    localStorage.removeItem('transitUser')
  } catch (error) {
    console.error('Failed to clear user from localStorage:', error)
  }
}

// Initial state
const getInitialState = (): TransitState => {
  // Try to load user from localStorage
  const storedUser = loadUserFromStorage()
  
  // Try to load theme from localStorage
  let theme: 'light' | 'dark' = 'light'
  try {
    const storedTheme = localStorage.getItem('transitTheme') as 'light' | 'dark'
    if (storedTheme && ['light', 'dark'].includes(storedTheme)) {
      theme = storedTheme
    }
  } catch (error) {
    console.error('Failed to load theme from localStorage:', error)
  }

  return {
    user: storedUser || {
      id: '',
      name: 'User',
      email: '',
      password: '',
      points: 0,
      avatar: '👤',
      isTracking: false,
      currentLocation: undefined,
      friends: [],
      parentTracking: false,
      level: 1,
      experience: 0,
      weeklyPoints: 0,
      totalTrips: 0,
      totalDistance: 0,
      totalTime: 0,
      joinDate: new Date(),
      isPremium: false,
      premiumExpiry: undefined,
      premiumFeatures: {
        extraXPGain: false,
        specialRewards: false,
        advancedTracking: false,
        prioritySupport: false,
      },
    },
    transitLines: [
      {
        id: '1',
        name: '501 Queen',
        type: 'streetcar',
        rating: 4.2,
        ratingCount: 156,
        noiseLevel: 'low',
        occupancy: 'medium',
        reliability: 85,
        currentLocation: { lat: 43.6532, lng: -79.3832 },
        route: [
          { lat: 43.6532, lng: -79.3832 },
          { lat: 43.6540, lng: -79.3840 },
          { lat: 43.6550, lng: -79.3850 }
        ]
      },
      {
        id: '2',
        name: '510 Spadina',
        type: 'streetcar',
        rating: 4.5,
        ratingCount: 203,
        noiseLevel: 'low',
        occupancy: 'high',
        reliability: 92,
        currentLocation: { lat: 43.6540, lng: -79.3840 },
        route: [
          { lat: 43.6540, lng: -79.3840 },
          { lat: 43.6550, lng: -79.3850 },
          { lat: 43.6560, lng: -79.3860 }
        ]
      },
      {
        id: '3',
        name: '1 Yonge-University',
        type: 'subway',
        rating: 4.8,
        ratingCount: 342,
        noiseLevel: 'medium',
        occupancy: 'high',
        reliability: 95,
        currentLocation: { lat: 43.6550, lng: -79.3850 },
        route: [
          { lat: 43.6550, lng: -79.3850 },
          { lat: 43.6560, lng: -79.3860 },
          { lat: 43.6570, lng: -79.3870 }
        ]
      }
    ],
    rewards: [
      {
        id: '1',
        name: 'Free Coffee',
        description: 'Get a free coffee at participating locations',
        pointsCost: 100,
        type: 'discount',
        image: '☕',
        available: true
      },
      {
        id: '2',
        name: 'Premium Avatar',
        description: 'Unlock a special premium avatar',
        pointsCost: 500,
        type: 'avatar',
        image: '👑',
        available: true,
        premiumOnly: true
      },
      {
        id: '3',
        name: 'Route Skin',
        description: 'Customize your transit route display',
        pointsCost: 300,
        type: 'route-skin',
        image: '🎨',
        available: false
      }
    ],
    isTracking: false,
    currentDistance: 0,
    theme: theme
  }
}

// Reducer
function transitReducer(state: TransitState, action: TransitAction): TransitState {
  switch (action.type) {
    case 'START_TRACKING':
      return {
        ...state,
        isTracking: true,
        trackingStartTime: new Date(),
        user: { ...state.user, isTracking: true },
      }
    case 'STOP_TRACKING':
      const { distance, time } = action.payload
      const taubitsEarned = calculateTaubits(distance, time)
      
      return {
        ...state,
        isTracking: false,
        trackingStartTime: undefined,
        user: { 
          ...state.user, 
          isTracking: false,
          totalTrips: state.user.totalTrips + 1,
          totalDistance: state.user.totalDistance + distance,
          totalTime: state.user.totalTime + time,
        },
        currentDistance: 0,
      }
    case 'UPDATE_LOCATION':
      return {
        ...state,
        user: { ...state.user, currentLocation: action.payload },
      }
    case 'ADD_POINTS':
      // Calculate XP with premium bonus
      const baseExperience = Math.floor(action.payload * 0.1) // 10% of points earned becomes experience
      const premiumMultiplier = state.user.isPremium ? 2 : 1 // 2x bonus for premium users
      const newExperience = Math.floor(baseExperience * premiumMultiplier)
      const currentExperience = state.user.experience || 0
      const newLevel = calculateLevel(currentExperience + newExperience)
      const currentLevel = state.user.level || 1
      const levelUp = newLevel > currentLevel
      
      return {
        ...state,
        user: { 
          ...state.user, 
          points: state.user.points + action.payload,
          experience: currentExperience + newExperience,
          level: newLevel,
          weeklyPoints: state.user.weeklyPoints + action.payload,
        },
      }
    case 'REDEEM_REWARD':
      const reward = state.rewards.find(r => r.id === action.payload)
      if (reward && state.user.points >= reward.pointsCost) {
        return {
          ...state,
          user: { ...state.user, points: state.user.points - reward.pointsCost },
          rewards: state.rewards.map(r =>
            r.id === action.payload ? { ...r, available: false } : r
          ),
        }
      }
      return state
    case 'UPDATE_TRANSIT_LINES':
      return {
        ...state,
        transitLines: action.payload,
      }
    case 'RATE_LINE':
      return {
        ...state,
        transitLines: state.transitLines.map(line =>
          line.id === action.payload.lineId
            ? {
                ...line,
                rating: action.payload.rating,
                noiseLevel: action.payload.noiseLevel as 'low' | 'medium' | 'high',
                occupancy: action.payload.occupancy as 'low' | 'medium' | 'high',
              }
            : line
        ),
      }
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
      }
    case 'LOGIN':
      // Find user by email and password
      const storedUsers = JSON.parse(localStorage.getItem('transitUsers') || '[]')
      const user = storedUsers.find((u: User) => 
        u.email === action.payload.email && u.password === action.payload.password
      )
      
      if (user) {
        // Save credentials for auto-login
        saveCredentialsToStorage(action.payload.email, action.payload.password)
        return {
          ...state,
          user: user,
        }
      }
      return state
    case 'LOGOUT':
      clearCredentialsFromStorage()
      return {
        ...state,
        user: {
          id: '',
          name: 'User',
          email: '',
          password: '',
          points: 0,
          avatar: '👤',
          isTracking: false,
          currentLocation: undefined,
          friends: [],
          parentTracking: false,
          level: 1,
          experience: 0,
          weeklyPoints: 0,
          totalTrips: 0,
          totalDistance: 0,
          totalTime: 0,
          joinDate: new Date(),
          isPremium: false,
          premiumExpiry: undefined,
          premiumFeatures: {
            extraXPGain: false,
            specialRewards: false,
            advancedTracking: false,
            prioritySupport: false,
          },
        },
      }
    case 'ADD_EXPERIENCE':
      return {
        ...state,
        user: { ...state.user, experience: (state.user.experience || 0) + action.payload },
      }
    case 'UPDATE_WEEKLY_STATS':
      return {
        ...state,
        user: {
          ...state.user,
          weeklyPoints: action.payload.points,
          totalTrips: action.payload.trips,
          totalDistance: action.payload.distance,
          totalTime: action.payload.time,
        },
      }
    case 'UPGRADE_TO_PREMIUM':
      return {
        ...state,
        user: {
          ...state.user,
          isPremium: true,
          premiumExpiry: action.payload.expiryDate,
        },
      }
    case 'CANCEL_PREMIUM':
      return {
        ...state,
        user: {
          ...state.user,
          isPremium: false,
          premiumExpiry: undefined,
        },
      }
    case 'CREATE_ACCOUNT':
      // Save user to localStorage for future logins
      const existingUsers = JSON.parse(localStorage.getItem('transitUsers') || '[]')
      const updatedUsers = [...existingUsers, action.payload]
      localStorage.setItem('transitUsers', JSON.stringify(updatedUsers))
      
      // Save credentials for auto-login
      saveCredentialsToStorage(action.payload.email, action.payload.password)
      
      return {
        ...state,
        user: action.payload,
      }
    case 'UPDATE_LINE_RATING':
      return {
        ...state,
        transitLines: state.transitLines.map(line =>
          line.id === action.payload.lineId
            ? {
                ...line,
                rating: action.payload.rating,
                ratingCount: action.payload.ratingCount,
                reliability: action.payload.reliability,
                noiseLevel: action.payload.noiseLevel as 'low' | 'medium' | 'high',
                occupancy: action.payload.occupancy as 'low' | 'medium' | 'high',
              }
            : line
        ),
      }
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
      }
    default:
      return state
  }
}

// Context
interface TransitContextType {
  state: TransitState
  dispatch: React.Dispatch<TransitAction>
}

const TransitContext = createContext<TransitContextType | undefined>(undefined)

// Provider
export function TransitProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(transitReducer, getInitialState())

  // Save user data whenever it changes
  useEffect(() => {
    if (state.user && state.user.id) {
      saveUserToStorage(state.user)
    } else {
      // Clear storage if no user
      clearUserFromStorage()
    }
  }, [state.user])

  // Auto-login on app start
  useEffect(() => {
    const credentials = loadCredentialsFromStorage()
    if (credentials && !state.user.id) {
      dispatch({ type: 'LOGIN', payload: credentials })
    }
  }, [])

  return (
    <TransitContext.Provider value={{ state, dispatch }}>
      {children}
    </TransitContext.Provider>
  )
}

// Hook
export function useTransit() {
  const context = useContext(TransitContext)
  if (context === undefined) {
    throw new Error('useTransit must be used within a TransitProvider')
  }
  return context
} 