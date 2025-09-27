import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, Bus, Train, Car, ArrowRight, Crown, Star } from 'lucide-react'
import { useTransit } from '../contexts/TransitContext'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'

const avatars = ['🚌', '🚇', '🚋', '🚎', '🚐', '🚗', '🚕', '🚙', '🚍', '🚏']

export default function Signup() {
  const navigate = useNavigate()
  const { state, dispatch } = useTransit()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [selectedAvatar, setSelectedAvatar] = useState('🚌')
  const [accountType, setAccountType] = useState<'free' | 'premium'>('free')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({})

  useEffect(() => {
    if (state.user && state.user.id) {
      navigate('/')
    }
  }, [state.user, navigate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
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
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {}
    
    // Name validation
    if (!formData.name) {
      errors.name = 'Name is required'
    }
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid'
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
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
      // Prepare user data for API
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        avatar: selectedAvatar,
        isPremium: accountType === 'premium'
      }
      
      // Call API for registration
      const response = await authAPI.register(userData)
      
      if (response.success) {
        // Store token
        localStorage.setItem('token', response.data.token)
        
        // Transform user data to match our app's structure
        const newUser = {
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
        dispatch({ type: 'SET_USER', payload: newUser })
        
        toast.success(accountType === 'premium' ? 
          'Premium account created! Welcome to Transit Rewards!' : 
          'Account created! Welcome to Transit Rewards!'
        )
        navigate('/')
      } else {
        toast.error(response.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with an error
        if (error.response.status === 409) {
          toast.error('Email already in use. Please try a different email.')
          setFormErrors(prev => ({
            ...prev,
            email: 'Email already in use'
          }))
        } else if (error.response.data && error.response.data.message) {
          toast.error(error.response.data.message)
        } else {
          toast.error('Registration failed. Please try again.')
        }
      } else if (error.request) {
        // No response received
        toast.error('Server not responding. Please try again later.')
      } else {
        // Other errors
        toast.error('Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render if already logged in
  if (state.user && state.user.id) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4 text-black">
      <div className="max-w-md w-full fade-in-up">
        <div className="text-center mb-8 stagger-1">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Bus className="h-8 w-8 text-primary-600 neon-glow" />
            <Train className="h-6 w-6 text-primary-500 neon-glow" />
            <Car className="h-6 w-6 text-primary-400 neon-glow" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Create Your Account</h1>
          <p className="text-black">Sign up to unlock all features and start earning rewards!</p>
        </div>
        <div className="glass-enhanced p-8 text-black">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div className="stagger-2">
              <label htmlFor="name" className="block text-sm font-medium text-black mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full pl-10 py-3 border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-500 text-black placeholder-gray-500 hover:border-primary-400 hover-lift`}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            {/* Email Field */}
            <div className="stagger-3">
              <label htmlFor="email" className="block text-sm font-medium text-black mb-2">Email Address</label>
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
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border ${formErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-black placeholder-gray-500`}
                  placeholder="Create a password"
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
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>
            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-black placeholder-gray-500`}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
              )}
            </div>
            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-medium text-black mb-3">Choose Your Avatar</label>
              <div className="grid grid-cols-6 gap-3">
                {avatars.map((avatar, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`p-3 rounded-lg border-2 transition-all ${selectedAvatar === avatar ? 'border-primary-500 bg-primary-50 scale-110' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}
                  >
                    <span className="text-2xl">{avatar}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Account Type Selection */}
            <div>
              <label className="block text-sm font-medium text-black mb-3">Choose Account Type</label>
              <div className="grid grid-cols-1 gap-3">
                {/* Free Account Option */}
                <button
                  type="button"
                  onClick={() => setAccountType('free')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    accountType === 'free'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Star className="h-6 w-6 text-gray-500" />
                      <div>
                        <div className="font-semibold text-black">Free Account</div>
                        <div className="text-sm text-black">Basic features • 1000 bonus points</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-500">$0/month</div>
                  </div>
                </button>
                
                {/* Premium Account Option */}
                <button
                  type="button"
                  onClick={() => setAccountType('premium')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    accountType === 'premium'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-yellow-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Crown className="h-6 w-6 text-yellow-500" />
                      <div>
                        <div className="font-semibold text-black">Premium Account</div>
                        <div className="text-sm text-black">50% extra XP • Exclusive rewards • 2000 bonus points</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-yellow-600">$2.99/month</div>
                  </div>
                </button>
              </div>
              
              {/* Premium Features List */}
              {accountType === 'premium' && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-sm text-yellow-800">
                    <div className="font-medium mb-2">Premium Features:</div>
                    <ul className="space-y-1 text-xs">
                      <li>• 50% extra experience points from all activities</li>
                      <li>• Access to exclusive premium rewards</li>
                      <li>• Advanced tracking features</li>
                      <li>• Priority customer support</li>
                      <li>• 30-day free trial included</li>
                    </ul>
                  </div>
                </div>
              )}
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
                  <span>Create {accountType === 'premium' ? 'Premium' : ''} Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-black">
              Already have an account?{' '}
              <button
                type="button"
                className="text-primary-600 hover:text-primary-700"
                onClick={() => navigate('/login')}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}