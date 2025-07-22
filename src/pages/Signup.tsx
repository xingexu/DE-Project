import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, Bus, Train, Car, ArrowRight, Crown, Star } from 'lucide-react'
import { useTransit } from '../contexts/TransitContext'
import toast from 'react-hot-toast'

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

  useEffect(() => {
    if (state.user && state.user.id) {
      navigate('/')
    }
  }, [state.user, navigate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setIsLoading(true)
    setTimeout(() => {
      const newUser = {
        id: Date.now().toString(),
        name: formData.name,
        points: accountType === 'premium' ? 2000 : 1000, // Bonus points for new users
        avatar: selectedAvatar,
        isTracking: false,
        friends: [],
        parentTracking: false,
        level: 1,
        experience: 0,
        weeklyPoints: 0,
        totalTrips: 0,
        totalDistance: 0,
        totalTime: 0,
        joinDate: new Date(),
        isPremium: accountType === 'premium',
        premiumExpiry: accountType === 'premium' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined, // 30 days for premium
        premiumFeatures: {
          extraXPGain: accountType === 'premium',
          specialRewards: accountType === 'premium',
          advancedTracking: accountType === 'premium',
          prioritySupport: accountType === 'premium',
        },
      }
      dispatch({ type: 'SET_USER', payload: newUser })
      toast.success(accountType === 'premium' ? 'Premium account created! Welcome to Transit Rewards!' : 'Account created! Welcome to Transit Rewards!')
      navigate('/')
      setIsLoading(false)
    }, 1200)
  }

  // Don't render if already logged in
  if (state.user && state.user.id) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4 text-black">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Bus className="h-8 w-8 text-primary-600" />
            <Train className="h-6 w-6 text-primary-500" />
            <Car className="h-6 w-6 text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Create Your Account</h1>
          <p className="text-black">Sign up to unlock all features and start earning rewards!</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8 text-black">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-black mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-black placeholder-gray-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-black placeholder-gray-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
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
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-black placeholder-gray-500"
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
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-black placeholder-gray-500"
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
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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