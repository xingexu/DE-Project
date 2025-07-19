import { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'general' | 'rewards' | 'privacy' | 'technical'
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I earn points?',
    answer: 'You earn points by using transit services tracked through the app. Each trip earns you points based on distance and duration. Premium users earn 2x points!',
    category: 'rewards'
  },
  {
    id: '2',
    question: 'How do I redeem rewards?',
    answer: 'Go to the Rewards page and browse available items. Click "Redeem" on any reward you want. Make sure you have enough points!',
    category: 'rewards'
  },
  {
    id: '3',
    question: 'What is Premium and how do I get it?',
    answer: 'Premium gives you 2x XP gain, special rewards, advanced tracking features, and priority support. You can upgrade in your Profile settings.',
    category: 'rewards'
  },
  {
    id: '4',
    question: 'How do I track my transit journey?',
    answer: 'On the Home page, tap the "Tap In" button when you start your journey and "Tap Out" when you finish. The app will track your route automatically.',
    category: 'general'
  },
  {
    id: '5',
    question: 'Can I see my friends on the map?',
    answer: 'Yes! If your friends have location sharing enabled, you can see them on the Social page. You can control your own privacy settings in Profile.',
    category: 'privacy'
  },
  {
    id: '6',
    question: 'How do I change my avatar?',
    answer: 'Go to Profile → Collection → Avatars. You can choose from emoji avatars or upload your own photo. Some avatars require points to unlock.',
    category: 'general'
  },
  {
    id: '7',
    question: 'What happens to my data?',
    answer: 'Your data is stored locally on your device and optionally synced to our secure servers. You can control what data is shared in Privacy Settings.',
    category: 'privacy'
  },
  {
    id: '8',
    question: 'How do I contact support?',
    answer: 'Use the Beaverbot AI assistant in your Profile settings, or email us at support@transportaution.app. Premium users get priority support.',
    category: 'general'
  },
  {
    id: '9',
    question: 'Why isn\'t my location showing?',
    answer: 'Make sure you\'ve granted location permissions to the app. Go to your device settings and enable location access for transportaution.',
    category: 'technical'
  },
  {
    id: '10',
    question: 'How do I disable notifications?',
    answer: 'Go to Profile → Settings → Notifications. You can toggle different types of notifications on or off.',
    category: 'general'
  }
]

interface FAQProps {
  onClose: () => void
}

export default function FAQ({ onClose }: FAQProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'general' | 'rewards' | 'privacy' | 'technical'>('all')
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const categories = [
    { id: 'all', label: 'All Questions', count: faqData.length },
    { id: 'general', label: 'General', count: faqData.filter(item => item.category === 'general').length },
    { id: 'rewards', label: 'Rewards', count: faqData.filter(item => item.category === 'rewards').length },
    { id: 'privacy', label: 'Privacy', count: faqData.filter(item => item.category === 'privacy').length },
    { id: 'technical', label: 'Technical', count: faqData.filter(item => item.category === 'technical').length },
  ]

  const filteredFAQ = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory)

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <HelpCircle className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Frequently Asked Questions</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            ✕
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-600/50 hover:bg-white/90 dark:hover:bg-slate-800/90'
              }`}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {filteredFAQ.map((item) => (
            <div key={item.id} className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="font-medium text-slate-900 dark:text-slate-100">{item.question}</span>
                {expandedItems.includes(item.id) ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {expandedItems.includes(item.id) && (
                <div className="px-4 pb-3">
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Still need help?</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Can't find what you're looking for? Contact our support team or chat with Beaverbot!
          </p>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Contact Support
            </button>
            <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              Chat with Beaverbot
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 