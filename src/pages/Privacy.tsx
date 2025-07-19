import { useState } from 'react'
import { 
  Shield, 
  Eye, 
  EyeOff, 
  MapPin, 
  Users, 
  Bell, 
  Lock, 
  Database,
  ArrowLeft,
  Check,
  X
} from 'lucide-react'
import { useTransit } from '../contexts/TransitContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Privacy() {
  const { state, dispatch } = useTransit()
  const navigate = useNavigate()
  
  // Privacy settings state
  const [locationSharing, setLocationSharing] = useState(state.user?.locationSharing || false)
  const [friendRequests, setFriendRequests] = useState(state.user?.friendRequests || true)
  const [chatEnabled, setChatEnabled] = useState(state.user?.chatEnabled || true)
  const [messageRequests, setMessageRequests] = useState(state.user?.messageRequests || false)
  const [dataCollection, setDataCollection] = useState(true)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(false)

  const handleSaveSettings = () => {
    // Update user settings in context
    dispatch({
      type: 'SET_USER',
      payload: {
        ...state.user,
        locationSharing,
        friendRequests,
        chatEnabled,
        messageRequests
      }
    })
    toast.success('Privacy settings saved!')
  }

  const handleExportData = () => {
    toast.success('Data export started! You\'ll receive an email when it\'s ready.')
  }

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.success('Account deletion request submitted. You\'ll receive a confirmation email.')
    }
  }

  const privacySettings = [
    {
      id: 'location',
      title: 'Location Sharing',
      description: 'Allow friends to see your current location and transit line',
      icon: MapPin,
      enabled: locationSharing,
      onChange: setLocationSharing,
      category: 'social'
    },
    {
      id: 'friendRequests',
      title: 'Friend Requests',
      description: 'Allow other users to send you friend requests',
      icon: Users,
      enabled: friendRequests,
      onChange: setFriendRequests,
      category: 'social'
    },
    {
      id: 'chat',
      title: 'Chat Messages',
      description: 'Allow friends to send you direct messages',
      icon: Bell,
      enabled: chatEnabled,
      onChange: setChatEnabled,
      category: 'social'
    },
    {
      id: 'messageRequests',
      title: 'Message Requests',
      description: 'Allow non-friends to send you message requests',
      icon: Users,
      enabled: messageRequests,
      onChange: setMessageRequests,
      category: 'social'
    },
    {
      id: 'dataCollection',
      title: 'Data Collection',
      description: 'Allow us to collect usage data to improve the app',
      icon: Database,
      enabled: dataCollection,
      onChange: setDataCollection,
      category: 'data'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Share anonymous usage data for analytics',
      icon: Database,
      enabled: analytics,
      onChange: setAnalytics,
      category: 'data'
    },
    {
      id: 'marketing',
      title: 'Marketing Communications',
      description: 'Receive promotional emails and notifications',
      icon: Bell,
      enabled: marketing,
      onChange: setMarketing,
      category: 'communications'
    }
  ]

  const categories = [
    { id: 'social', label: 'Social & Friends', icon: Users },
    { id: 'data', label: 'Data & Analytics', icon: Database },
    { id: 'communications', label: 'Communications', icon: Bell }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate('/profile')}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Privacy & Security</h1>
          <p className="text-slate-600 dark:text-slate-400">Control your data and privacy settings</p>
        </div>
      </div>

      {/* Privacy Overview */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Privacy Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 glass rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {privacySettings.filter(s => s.enabled).length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Active Permissions</div>
          </div>
          <div className="text-center p-4 glass rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {state.user?.friends?.length || 0}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Friends</div>
          </div>
          <div className="text-center p-4 glass rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {state.user?.totalTrips || 0}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Trips Tracked</div>
          </div>
        </div>
      </div>

      {/* Privacy Settings by Category */}
      {categories.map((category) => (
        <div key={category.id} className="card">
          <div className="flex items-center space-x-3 mb-4">
            <category.icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{category.label}</h3>
          </div>
          
          <div className="space-y-4">
            {privacySettings
              .filter(setting => setting.category === category.id)
              .map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-4 glass rounded-lg">
                  <div className="flex items-center space-x-3">
                    <setting.icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{setting.title}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{setting.description}</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setting.onChange(!setting.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      setting.enabled 
                        ? 'bg-blue-600' 
                        : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        setting.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* Data Management */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Data Management</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 glass rounded-lg">
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Export My Data</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Download all your data in a ZIP file</div>
              </div>
            </div>
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Export
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 glass rounded-lg">
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Delete Account</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Permanently delete your account and all data</div>
              </div>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  )
} 