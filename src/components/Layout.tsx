import { Outlet, NavLink, Navigate } from 'react-router-dom'
import { 
  Home, 
  Map, 
  Gift, 
  Users, 
  User,
  Bus,
  Train,
  Car,
  Sparkles,
  Navigation
} from 'lucide-react'
import { useTransit } from '../contexts/TransitContext'
import { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'
import PageTransition from './PageTransition'

export default function Layout() {
  const { state, dispatch } = useTransit()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user data is loaded from localStorage
    const checkAuth = () => {
      const storedUser = localStorage.getItem('transitUser')
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser)
          if (user && user.id) {
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.error('Error parsing stored user:', error)
        }
      }
      // If no stored user or invalid data, stop loading
      setIsLoading(false)
    }

    // Load theme preference
    const loadTheme = () => {
      try {
        const savedTheme = localStorage.getItem('transitTheme') as 'light' | 'dark'
        if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
          dispatch({ type: 'SET_THEME', payload: savedTheme })
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error)
      }
    }

    // Small delay to ensure localStorage is accessible
    const timer = setTimeout(() => {
      checkAuth()
      loadTheme()
    }, 50)
    return () => clearTimeout(timer)
  }, [dispatch])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-slate-600 font-medium dark:text-slate-300">Loading your transit experience...</p>
        </div>
      </div>
    )
  }

  // Check if user is authenticated
  if (!state.user || !state.user.id || state.user.id === '') {
    return <Navigate to="/login" replace />
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/transit-lines', icon: Navigation, label: 'Lines' },
    { path: '/rewards', icon: Gift, label: 'Rewards' },
    { path: '/social', icon: Users, label: 'Social' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 bg-pattern dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="glass border-b border-white/30 dark:border-slate-700/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Bus className="h-8 w-8 text-blue-600" />
                  <Train className="h-6 w-6 text-indigo-500 absolute -top-1 -right-1" />
                  <Car className="h-5 w-5 text-purple-400 absolute -bottom-1 -right-1" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gradient">transportaution</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Your journey, your rewards</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="glass px-4 py-2 rounded-xl">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {state.user?.points || 0} taubits
                  </span>
                </div>
              </div>
              <div className="relative">
                <div className="text-3xl hover:scale-110 transition-transform cursor-pointer">
                  {state.user?.avatar || '👤'}
                </div>
                {state.user?.isPremium && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageTransition />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/30 dark:border-slate-700/30 px-4 py-3 z-50">
        <div className="flex justify-around max-w-md mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom padding for mobile */}
      <div className="h-24"></div>
    </div>
  )
} 