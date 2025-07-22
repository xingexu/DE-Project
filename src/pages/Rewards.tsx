import { useState } from 'react'
import { 
  Gift, 
  Star, 
  ShoppingBag, 
  Crown,
  TrendingUp,
  Zap
} from 'lucide-react'
import { useTransit } from '../contexts/TransitContext'
import SelectTransition from '../components/SelectTransition'
import toast from 'react-hot-toast'

export default function Rewards() {
  const { state, dispatch } = useTransit()
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'discount' | 'avatar' | 'route-skin'>('all')

  const handleRedeemReward = (rewardId: string) => {
    const reward = state.rewards.find(r => r.id === rewardId)
    if (reward && state.user.points >= reward.pointsCost) {
      dispatch({ type: 'REDEEM_REWARD', payload: rewardId })
      toast.success(`Redeemed ${reward.name}!`)
    } else {
      toast.error('Not enough points!')
    }
  }

  const filteredRewards = selectedCategory === 'all' 
    ? state.rewards 
    : state.rewards.filter(r => r.type === selectedCategory)

  const categories = [
    { id: 'all', label: 'All', icon: Gift },
    { id: 'discount', label: 'Discounts', icon: ShoppingBag },
    { id: 'avatar', label: 'Avatars', icon: Crown },
    { id: 'route-skin', label: 'Skins', icon: Star },
  ]

  return (
    <div className="space-y-6">
      {/* Points Overview */}
      <div className="card transit-card">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary-600 mb-2">
            {state.user.points}
          </div>
          <div className="text-gray-600 dark:text-gray-400 mb-4">Total Taubits</div>
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600 dark:text-green-400">+150 this week</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="h-4 w-4 text-yellow-600" />
              <span className="text-yellow-600 dark:text-yellow-400">Level 5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Reward Categories</h3>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category, index) => (
            <SelectTransition key={category.id} isOpen={true} className="w-full">
              <button
                onClick={() => setSelectedCategory(category.id as any)}
                className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors w-full ${
                  selectedCategory === category.id
                    ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <category.icon className="h-5 w-5" />
                <span className="font-medium">{category.label}</span>
              </button>
            </SelectTransition>
          ))}
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Available Rewards</h3>
        
        <div className="grid grid-cols-1 gap-4">
          {filteredRewards.map((reward) => (
            <div key={reward.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{reward.image}</div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{reward.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{reward.description}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {reward.pointsCost} taubits
                  </div>
                  <button
                    onClick={() => handleRedeemReward(reward.id)}
                    disabled={state.user.points < reward.pointsCost || !reward.available}
                    className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      state.user.points >= reward.pointsCost && reward.available
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {reward.available ? 'Redeem' : 'Redeemed'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Rewards */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Featured Rewards</h3>
        
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">🎉</div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Weekly Bonus</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Complete 5 trips this week</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">+200 pts</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Progress: 3/5</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">🌱</div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Eco Warrior</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Use transit 10 days in a row</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">+500 pts</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Progress: 7/10</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 