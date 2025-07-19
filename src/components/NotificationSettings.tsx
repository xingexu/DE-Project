import { useState } from 'react'
import { Bell, X, Check } from 'lucide-react'

interface NotificationSettingsProps {
  onClose: () => void
}

export default function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const [pushNotifications, setPushNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [tripReminders, setTripReminders] = useState(true)
  const [rewardAlerts, setRewardAlerts] = useState(true)
  const [friendUpdates, setFriendUpdates] = useState(true)
  const [systemUpdates, setSystemUpdates] = useState(false)

  const notificationSettings = [
    {
      id: 'push',
      title: 'Push Notifications',
      description: 'Receive notifications on your device',
      enabled: pushNotifications,
      onChange: setPushNotifications,
      category: 'general'
    },
    {
      id: 'email',
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      enabled: emailNotifications,
      onChange: setEmailNotifications,
      category: 'general'
    },
    {
      id: 'sms',
      title: 'SMS Notifications',
      description: 'Receive notifications via text message',
      enabled: smsNotifications,
      onChange: setSmsNotifications,
      category: 'general'
    },
    {
      id: 'tripReminders',
      title: 'Trip Reminders',
      description: 'Get reminded about your scheduled trips',
      enabled: tripReminders,
      onChange: setTripReminders,
      category: 'transit'
    },
    {
      id: 'rewardAlerts',
      title: 'Reward Alerts',
      description: 'Get notified about new rewards and points earned',
      enabled: rewardAlerts,
      onChange: setRewardAlerts,
      category: 'transit'
    },
    {
      id: 'friendUpdates',
      title: 'Friend Updates',
      description: 'Get notified when friends join or update their status',
      enabled: friendUpdates,
      onChange: setFriendUpdates,
      category: 'social'
    },
    {
      id: 'systemUpdates',
      title: 'System Updates',
      description: 'Receive notifications about app updates and maintenance',
      enabled: systemUpdates,
      onChange: setSystemUpdates,
      category: 'system'
    }
  ]

  const categories = [
    { id: 'general', label: 'General Notifications', icon: Bell },
    { id: 'transit', label: 'Transit & Rewards', icon: Bell },
    { id: 'social', label: 'Social & Friends', icon: Bell },
    { id: 'system', label: 'System Updates', icon: Bell }
  ]

  const handleSaveSettings = () => {
    // Save notification settings
    localStorage.setItem('notificationSettings', JSON.stringify({
      pushNotifications,
      emailNotifications,
      smsNotifications,
      tripReminders,
      rewardAlerts,
      friendUpdates,
      systemUpdates
    }))
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Notification Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notification Settings by Category */}
        {categories.map((category) => (
          <div key={category.id} className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{category.label}</h3>
            
            <div className="space-y-4">
              {notificationSettings
                .filter(setting => setting.category === category.id)
                .map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 glass rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
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

        {/* Save Button */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-600">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
} 