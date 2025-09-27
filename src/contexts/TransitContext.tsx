import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { authAPI, transitAPI } from '../services/api'

// Types
export interface User {
  id: string
  name: string
  email: string
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
  isLoading: boolean
  error: string | null
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
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGIN_REQUEST' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'ADD_EXPERIENCE'; payload: number }
  | { type: 'UPDATE_WEEKLY_STATS'; payload: { points: number; trips: number; distance: number; time: number } }
  | { type: 'UPGRADE_TO_PREMIUM'; payload: { expiryDate: Date } }
  | { type: 'CANCEL_PREMIUM' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'FETCH_USER_PROFILE_SUCCESS'; payload: User }
  | { type: 'FETCH_TRANSIT_LINES_SUCCESS'; payload: TransitLine[] }

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

// Helper function to calculate taubits based on distance and time
const calculateTaubits = (distance: number, time: number): number => {
  // Each kilometer = 10 taubits, each minute = 10 taubits
  const distancePoints = Math.floor(distance * 10)
  const timePoints = Math.floor(time * 10)
  return distancePoints + timePoints
}

// Helper function to parse a backend user to our frontend User format
const parseBackendUser = (backendUser: any): User => {
  return {
    id: backendUser.id.toString(),
    name: backendUser.name,
    email: backendUser.email,
    points: backendUser.points || 0,
    avatar: backendUser.avatar || '👤',
    isTracking: false,
    friends: [],
    parentTracking: false,
    level: backendUser.level || 1,
    experience: backendUser.experience || 0,
    weeklyPoints: backendUser.weekly_points || 0,
    totalTrips: backendUser.total_trips || 0,
    totalDistance: backendUser.total_distance || 0,
    totalTime: backendUser.total_time || 0,
    joinDate: backendUser.created_at ? new Date(backendUser.created_at) : new Date(),
    isPremium: backendUser.is_premium || false,
    premiumExpiry: backendUser.premium_expiry ? new Date(backendUser.premium_expiry) : undefined,
    premiumFeatures: {
      extraXPGain: backendUser.is_premium || false,
      specialRewards: backendUser.is_premium || false,
      advancedTracking: backendUser.is_premium || false,
      prioritySupport: backendUser.is_premium || false,
    },
    locationSharing: backendUser.location_sharing || false,
    friendRequests: backendUser.friend_requests !== undefined ? backendUser.friend_requests : true,
    chatEnabled: backendUser.chat_enabled !== undefined ? backendUser.chat_enabled : true,
    messageRequests: backendUser.message_requests || false,
  }
}

// Parse transit lines from backend format
const parseBackendTransitLines = (backendLines: any[]): TransitLine[] => {
  return backendLines.map(line => ({
    id: line.id.toString(),
    name: line.name,
    type: line.type as 'bus' | 'subway' | 'streetcar',
    rating: line.rating || 0,
    ratingCount: line.rating_count,
    noiseLevel: line.noise_level as 'low' | 'medium' | 'high',
    occupancy: line.occupancy as 'low' | 'medium' | 'high',
    reliability: line.reliability || 80,
    currentLocation: line.route && line.route.length > 0 
      ? line.route[0] 
      : { lat: 43.6532, lng: -79.3832 }, // Default location if none available
    route: line.route || []
  }))
}

// Initial state
const getInitialState = (): TransitState => {
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
    user: {
      id: '',
      name: 'User',
      email: '',
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
      locationSharing: false,
      friendRequests: true,
      chatEnabled: true,
      messageRequests: false,
    },
    transitLines: [],
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
    theme: theme,
    isLoading: false,
    error: null
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
    case 'LOGIN_REQUEST':
      return {
        ...state,
        isLoading: true,
        error: null,
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        user: action.payload,
        error: null,
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      }
    case 'LOGOUT':
      // Clear token
      localStorage.removeItem('token')
      
      return {
        ...state,
        user: {
          id: '',
          name: 'User',
          email: '',
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
          locationSharing: false,
          friendRequests: true,
          chatEnabled: true,
          messageRequests: false,
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
          premiumFeatures: {
            extraXPGain: true,
            specialRewards: true,
            advancedTracking: true,
            prioritySupport: true,
          }
        },
      }
    case 'CANCEL_PREMIUM':
      return {
        ...state,
        user: {
          ...state.user,
          isPremium: false,
          premiumExpiry: undefined,
          premiumFeatures: {
            extraXPGain: false,
            specialRewards: false,
            advancedTracking: false,
            prioritySupport: false,
          }
        },
      }
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
    case 'FETCH_USER_PROFILE_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isLoading: false,
      }
    case 'FETCH_TRANSIT_LINES_SUCCESS':
      return {
        ...state,
        transitLines: action.payload,
        isLoading: false,
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
    default:
      return state
  }
}

// Context
interface TransitContextType {
  state: TransitState
  dispatch: React.Dispatch<TransitAction>
  loadUserProfile: () => Promise<void>
  loadTransitLines: () => Promise<void>
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  signup: (userData: any) => Promise<void>
  updateProfile: (profileData: any) => Promise<void>
  recordTrip: (tripData: any) => Promise<void>
  rateLine: (lineId: string, ratingData: any) => Promise<void>
}

const TransitContext = createContext<TransitContextType | undefined>(undefined)

// Provider
export function TransitProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(transitReducer, getInitialState())

  // Apply theme
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    body.classList.remove('light', 'dark')
    
    // Add current theme
    root.classList.add(state.theme)
    body.classList.add(state.theme)
    
    // Save theme preference
    localStorage.setItem('transitTheme', state.theme)
  }, [state.theme])

  // Auto-load user profile if token exists, or auto-login demo user
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && !state.user.id) {
      loadUserProfile()
    } else if (!state.user.id) {
      // Auto-login demo user for development
      login({ email: 'demo@transit.com', password: 'password' })
        .then(() => {
          // Load transit lines after successful login
          loadTransitLines()
        })
        .catch((error) => {
          console.error('Auto-login failed:', error)
          // Fallback to demo data if login fails
          const demoUser = {
            id: 'demo-user',
            name: 'Demo User',
            email: 'demo@transit.com',
            points: 1250,
            avatar: '🚌',
            isTracking: false,
            currentLocation: undefined,
            friends: [],
            parentTracking: false,
            level: 3,
            experience: 250,
            weeklyPoints: 150,
            totalTrips: 25,
            totalDistance: 125.5,
            totalTime: 45.2,
            joinDate: new Date(),
            isPremium: false,
            premiumExpiry: undefined,
            premiumFeatures: {
              extraXPGain: false,
              specialRewards: false,
              advancedTracking: false,
              prioritySupport: false,
            },
            locationSharing: false,
            friendRequests: true,
            chatEnabled: true,
            messageRequests: false,
          }
          dispatch({ type: 'SET_USER', payload: demoUser })
        })
    }
  }, [])
  
  // API functions
  const loadUserProfile = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const response = await authAPI.getCurrentUser()
      
      if (response.success) {
        const userData = parseBackendUser(response.data)
        dispatch({ type: 'FETCH_USER_PROFILE_SUCCESS', payload: userData })
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message || 'Failed to load user profile' })
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load user profile' })
      
      // If unauthorized, logout
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token')
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }
  
  const loadTransitLines = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const response = await transitAPI.getLines()
      
      if (response.success) {
        const transitLines = parseBackendTransitLines(response.data)
        dispatch({ type: 'FETCH_TRANSIT_LINES_SUCCESS', payload: transitLines })
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message || 'Failed to load transit lines' })
      }
    } catch (error) {
      console.error('Error loading transit lines:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load transit lines' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }
  
  const login = async (credentials: { email: string; password: string }) => {
    dispatch({ type: 'LOGIN_REQUEST' })
    
    try {
      const response = await authAPI.login(credentials)
      
      if (response.success) {
        // Store token
        localStorage.setItem('token', response.data.token)
        
        // Transform user data
        const userData = parseBackendUser(response.data.user)
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: userData })
        return response
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.message || 'Login failed' })
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message || 'Login failed' })
      throw error
    }
  }
  
  const logout = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      await authAPI.logout()
      dispatch({ type: 'LOGOUT' })
    } catch (error) {
      console.error('Logout error:', error)
      // Still logout locally even if API call fails
      dispatch({ type: 'LOGOUT' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }
  
  const signup = async (userData: any) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const response = await authAPI.register(userData)
      
      if (response.success) {
        // Store token
        localStorage.setItem('token', response.data.token)
        
        // Transform user data
        const newUser = parseBackendUser(response.data.user)
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: newUser })
        return response
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message || 'Signup failed' })
        throw new Error(response.message || 'Signup failed')
      }
    } catch (error) {
      console.error('Signup error:', error)
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Signup failed' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }
  
  const updateProfile = async (profileData: any) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const response = await authAPI.updateProfile(profileData)
      
      if (response.success) {
        const userData = parseBackendUser(response.data)
        dispatch({ type: 'FETCH_USER_PROFILE_SUCCESS', payload: userData })
        return response
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message || 'Failed to update profile' })
        throw new Error(response.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Update profile error:', error)
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to update profile' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }
  
  const recordTrip = async (tripData: any) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const response = await transitAPI.recordTrip(tripData)
      
      if (response.success) {
        // Update user stats with data from backend
        const userData = parseBackendUser(response.data.user)
        dispatch({ type: 'FETCH_USER_PROFILE_SUCCESS', payload: userData })
        
        // If user leveled up, show notification
        if (response.data.levelUp) {
          // Could dispatch an event to show level-up notification
        }
        
        return response
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message || 'Failed to record trip' })
        throw new Error(response.message || 'Failed to record trip')
      }
    } catch (error) {
      console.error('Record trip error:', error)
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to record trip' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }
  
  const rateLine = async (lineId: string, ratingData: any) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const response = await transitAPI.rateLine(lineId, ratingData)
      
      if (response.success) {
        // Update transit line with new rating
        dispatch({
          type: 'UPDATE_LINE_RATING',
          payload: {
            lineId,
            rating: response.data.transitLine.rating,
            ratingCount: response.data.transitLine.ratingCount,
            reliability: response.data.transitLine.reliability || 80,
            noiseLevel: response.data.transitLine.noiseLevel,
            occupancy: response.data.transitLine.occupancy
          }
        })
        
        // Add points to user
        if (response.data.pointsEarned) {
          dispatch({ type: 'ADD_POINTS', payload: response.data.pointsEarned })
        }
        
        return response
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message || 'Failed to rate transit line' })
        throw new Error(response.message || 'Failed to rate transit line')
      }
    } catch (error) {
      console.error('Rate line error:', error)
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to rate transit line' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  return (
    <TransitContext.Provider value={{ 
      state, 
      dispatch, 
      loadUserProfile, 
      loadTransitLines, 
      login, 
      logout, 
      signup, 
      updateProfile, 
      recordTrip, 
      rateLine 
    }}>
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