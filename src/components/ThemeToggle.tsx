import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTransit } from '../contexts/TransitContext'
import toast from 'react-hot-toast'

export default function ThemeToggle() {
  const { state, dispatch } = useTransit()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    applyTheme(state.theme)
  }, [state.theme])

  const applyTheme = (theme: 'light' | 'dark') => {
    const root = document.documentElement
    const body = document.body

    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    body.classList.remove('light', 'dark')

    // Apply the selected theme
    root.classList.add(theme)
    body.classList.add(theme)
  }

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', payload: newTheme })
    
    // Save to localStorage
    try {
      localStorage.setItem('transitTheme', newTheme)
    } catch (error) {
      console.error('Failed to save theme preference:', error)
    }

    const themeNames = {
      light: 'Light Mode',
      dark: 'Dark Mode'
    }
    
    toast.success(`Switched to ${themeNames[newTheme]}`)
  }

  const getCurrentThemeIcon = () => {
    switch (state.theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      default:
        return <Sun className="h-4 w-4" />
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="relative">
      <div className="theme-toggle">
        <button
          onClick={() => {
            const themes: ('light' | 'dark')[] = ['light', 'dark']
            const currentIndex = themes.indexOf(state.theme)
            const nextIndex = (currentIndex + 1) % themes.length
            handleThemeChange(themes[nextIndex])
          }}
          className="flex items-center space-x-2 p-2 rounded-lg transition-all duration-300 hover:bg-white/20 dark:hover:bg-slate-700/20"
          title={`Current: ${state.theme} mode`}
        >
          {getCurrentThemeIcon()}
        </button>
      </div>
    </div>
  )
} 