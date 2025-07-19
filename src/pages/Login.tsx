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

export default function Login() {
  const navigate = useNavigate()
  const { state, dispatch } = useTransit()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      // Mock user data with all required properties
      const mockUser = {
        id: '1',
        name: 'Kevin',
        points: 1250,
        avatar: '🚌',
        isTracking: false,
        friends: ['2'],
        parentTracking: true,
        level: 5,
        experience: 450,
        weeklyPoints: 150,
        totalTrips: 47,
        totalDistance: 156.8,
        totalTime: 23.5,
        joinDate: new Date('2024-01-15'),
        isPremium: false,
        premiumExpiry: undefined,
        premiumFeatures: {
          extraXPGain: false,
          specialRewards: false,
          advancedTracking: false,
          prioritySupport: false,
        },
      }

      dispatch({ type: 'SET_USER', payload: mockUser })
      toast.success('Login successful!')
      navigate('/')
      setIsLoading(false)
    }, 1500)
  }

  const handleGuestLogin = () => {
    setIsLoading(true)

    setTimeout(() => {
      const guestUser = {
        id: 'guest',
        name: 'Guest User',
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Bus className="h-8 w-8 text-primary-600" />
            <Train className="h-6 w-6 text-primary-500" />
            <Car className="h-6 w-6 text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to continue earning rewards</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full pl-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
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
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
                className="text-sm text-gray-600 hover:text-gray-700 transition-colors"
              >
                Continue as guest
              </button>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
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