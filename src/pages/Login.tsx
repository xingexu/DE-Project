import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Bus,
  Train,
  Car,
  ArrowRight
} from 'lucide-react'
import { useTransit } from '../contexts/TransitContext'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const { state, dispatch } = useTransit()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
  }>({})

  // Redirect if already logged in
  useEffect(() => {
    if (state.user && state.user.id) {
      navigate('/')
    }
  }, [state.user, navigate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const validateForm = () => {
    const errors: {
      email?: string;
      password?: string;
    } = {}
    
    // Simple email validation
    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid'
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Call API for login
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password
      })
      
      if (response.success) {
        // Store token
        localStorage.setItem('token', response.data.token)
        
        // Transform user data to match our app's structure
        const userData = {
          id: response.data.user.id.toString(),
          name: response.data.user.name,
          email: response.data.user.email,
          points: response.data.user.points || 0,
          avatar: response.data.user.avatar || '👤',
          isTracking: false,
          friends: [],
          parentTracking: false,
          level: response.data.user.level || 1,
          experience: response.data.user.experience || 0,
          weeklyPoints: response.data.user.weekly_points || 0,
          totalTrips: response.data.user.total_trips || 0,
          totalDistance: response.data.user.total_distance || 0,
          totalTime: response.data.user.total_time || 0,
          joinDate: response.data.user.created_at ? new Date(response.data.user.created_at) : new Date(),
          isPremium: response.data.user.is_premium || false,
          premiumExpiry: response.data.user.premium_expiry ? new Date(response.data.user.premium_expiry) : undefined,
          premiumFeatures: {
            extraXPGain: response.data.user.is_premium || false,
            specialRewards: response.data.user.is_premium || false,
            advancedTracking: response.data.user.is_premium || false,
            prioritySupport: response.data.user.is_premium || false,
          },
          locationSharing: response.data.user.location_sharing || false,
          friendRequests: response.data.user.friend_requests !== undefined ? response.data.user.friend_requests : true,
          chatEnabled: response.data.user.chat_enabled !== undefined ? response.data.user.chat_enabled : true,
          messageRequests: response.data.user.message_requests || false,
        }
        
        // Update context
        dispatch({ type: 'SET_USER', payload: userData })
        
        toast.success('Login successful!')
        navigate('/')
      } else {
        toast.error(response.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with an error
        if (error.response.status === 401) {
          toast.error('Invalid email or password')
        } else if (error.response.data && error.response.data.message) {
          toast.error(error.response.data.message)
        } else {
          toast.error('Login failed. Please try again.')
        }
      } else if (error.request) {
        // No response received
        toast.error('Server not responding. Please try again later.')
      } else {
        // Other errors
        toast.error('Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestLogin = () => {
    setIsLoading(true)

    setTimeout(() => {
      const guestUser = {
        id: 'guest',
        name: 'Guest User',
        email: 'guest@transit.com',
        points: 500,
        avatar: '👤',
        isTracking: false,
        friends: [],
        parentTracking: false,
        level: 2,
        experience: 150,
        weeklyPoints: 50,
        totalTrips: 12,
        totalDistance: 45.2,
        totalTime: 8.5,
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

      dispatch({ type: 'SET_USER', payload: guestUser })
      toast.success('Welcome as guest!')
      navigate('/')
      setIsLoading(false)
    }, 500)
  }

  const handleForgotPassword = () => {
    toast.success('Password reset feature coming soon!')
  }

  // Don't render if already logged in
  if (state.user && state.user.id) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4 text-black">
      <div className="max-w-md w-full fade-in-up">
        {/* Header */}
        <div className="text-center mb-8 stagger-1">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Bus className="h-8 w-8 text-primary-600 neon-glow" />
            <Train className="h-6 w-6 text-primary-500 neon-glow" />
            <Car className="h-6 w-6 text-primary-400 neon-glow" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Welcome Back</h1>
          <p className="text-black">Sign in to continue earning rewards</p>
        </div>

        {/* Login Form */}
        <div className="glass-enhanced p-8 text-black">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="stagger-2">
              <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 py-3 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-500 text-black placeholder-gray-500 hover:border-primary-400 hover-lift`}
                  placeholder="Enter your email"
                  required
                />
              </div>
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="stagger-3">
              <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border ${formErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-500 text-black placeholder-gray-500 hover:border-primary-400 hover-lift`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-700 hover:scale-110 transition-transform duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Guest Login */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="text-sm text-black hover:text-gray-700 transition-colors"
              >
                Continue as guest
              </button>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-black">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}