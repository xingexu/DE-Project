import React, { useState } from 'react'
import { Crown, Star, Zap, Shield, Gift, Users, Clock, CheckCircle } from 'lucide-react'
import { useTransit } from '../contexts/TransitContext'
import toast from 'react-hot-toast'

export default function Premium() {
  const { state, dispatch } = useTransit()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [accountName, setAccountName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('🚌')

  const premiumFeatures = [
    {
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      title: '2x XP Gain',
      description: 'Earn double experience points from all activities'
    },
    {
      icon: <Crown className="h-6 w-6 text-purple-500" />,
      title: 'Exclusive Rewards',
      description: 'Access to premium-only rewards and special offers'
    },
    {
      icon: <Shield className="h-6 w-6 text-blue-500" />,
      title: 'Advanced Tracking',
      description: 'Enhanced tracking features and real-time updates'
    },
    {
      icon: <Users className="h-6 w-6 text-green-500" />,
      title: 'Priority Support',
      description: 'Get priority customer support and faster responses'
    }
  ]

  const avatars = ['🚌', '🚇', '🚋', '🚗', '🚲', '🚶', '🏃', '🛴']

  const handleUpgradeToPremium = () => {
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + 1) // 1 month premium
    
    dispatch({
      type: 'UPGRADE_TO_PREMIUM',
      payload: { expiryDate }
    })
    
    toast.success('Welcome to Premium! 🎉 Enjoy your enhanced features!')
    setShowUpgrade(false)
  }

  const handleCreateAccount = () => {
    if (!accountName.trim()) {
      toast.error('Please enter a name')
      return
    }

    const newUser = {
      id: Date.now().toString(),
      name: accountName,
      avatar: selectedAvatar,
      points: 100, // Starting bonus
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
      isPremium: false,
      premiumExpiry: undefined,
      premiumFeatures: {
        extraXPGain: false,
        specialRewards: false,
        advancedTracking: false,
        prioritySupport: false,
      },
    }

    dispatch({
      type: 'CREATE_ACCOUNT',
      payload: newUser
    })

    toast.success(`Welcome ${accountName}! 🎉 Your account has been created!`)
    setShowAccount(false)
    setAccountName('')
    setSelectedAvatar('🚌')
  }

  const handleCancelPremium = () => {
    dispatch({ type: 'CANCEL_PREMIUM' })
    toast.success('Premium subscription cancelled. You can upgrade again anytime!')
  }

  return (
    <div className="space-y-6">
      {/* Premium Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {state.user.isPremium ? (
              <Crown className="h-8 w-8 text-yellow-500" />
            ) : (
              <Star className="h-8 w-8 text-gray-400" />
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {state.user.isPremium ? 'Premium Member' : 'Free Account'}
              </h2>
              <p className="text-sm text-gray-600">
                {state.user.isPremium 
                  ? `Premium until ${state.user.premiumExpiry?.toLocaleDateString()}`
                  : 'Upgrade to unlock premium features'
                }
              </p>
            </div>
          </div>
          
          {!state.user.isPremium && (
            <button
              onClick={() => setShowUpgrade(true)}
              className="btn-primary"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </button>
          )}
        </div>

        {/* Premium Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {premiumFeatures.map((feature, index) => (
            <div key={index} className={`p-4 rounded-lg border ${
              state.user.isPremium 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center space-x-3">
                {feature.icon}
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
                {state.user.isPremium && (
                  <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Account Actions */}
        <div className="flex space-x-3 mt-6">
          {!state.user.id && (
            <button
              onClick={() => setShowAccount(true)}
              className="btn-secondary"
            >
              <Users className="h-4 w-4 mr-2" />
              Create Account
            </button>
          )}
          
          {state.user.isPremium && (
            <button
              onClick={handleCancelPremium}
              className="btn-secondary"
            >
              <Clock className="h-4 w-4 mr-2" />
              Cancel Premium
            </button>
          )}
        </div>
      </div>

      {/* Premium Rewards */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Premium Rewards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.rewards.filter(reward => reward.premiumOnly).map((reward) => (
            <div key={reward.id} className={`p-4 rounded-lg border ${
              state.user.isPremium 
                ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg' 
                : 'bg-gray-50 border-gray-200 opacity-50'
            }`}>
              <div className="text-3xl mb-2">{reward.image}</div>
              <h4 className="font-semibold text-gray-900">{reward.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {reward.pointsCost} points
                </span>
                {!state.user.isPremium && (
                  <Crown className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              {state.user.isPremium && (
                <div className="mt-2 text-xs text-purple-600 font-medium">
                  ✨ Premium Exclusive
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upgrade to Premium</h3>
              <p className="text-gray-600">Unlock exclusive features and earn 50% more XP!</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span className="text-sm">2x XP Gain</span>
              </div>
              <div className="flex items-center space-x-3">
                <Gift className="h-5 w-5 text-purple-500" />
                <span className="text-sm">Exclusive Premium Rewards</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-blue-500" />
                <span className="text-sm">Advanced Tracking Features</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-green-500" />
                <span className="text-sm">Priority Customer Support</span>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">$2.99/month</div>
                <div className="text-sm text-yellow-700">Cancel anytime</div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowUpgrade(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgradeToPremium}
                className="flex-1 btn-primary"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Your Account</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose Avatar</label>
                <div className="grid grid-cols-4 gap-2">
                  {avatars.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`p-3 text-2xl rounded-lg border-2 transition-colors ${
                        selectedAvatar === avatar
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAccount(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAccount}
                className="flex-1 btn-primary"
              >
                <Users className="h-4 w-4 mr-2" />
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 