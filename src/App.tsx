import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Home from './pages/Home'
import TransitLines from './pages/TransitLines'
import Rewards from './pages/Rewards'
import Social from './pages/Social'
import Profile from './pages/Profile'
import Privacy from './pages/Privacy'
import Login from './pages/Login'
import Logout from './pages/Logout'
import Signup from './pages/Signup'
import { TransitProvider } from './contexts/TransitContext'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    // Apply initial theme on app load
    const applyInitialTheme = () => {
      try {
        const savedTheme = localStorage.getItem('transitTheme') as 'light' | 'dark'
        const root = document.documentElement
        const body = document.body

        // Remove existing theme classes
        root.classList.remove('light', 'dark')
        body.classList.remove('light', 'dark')

        if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
          root.classList.add(savedTheme)
          body.classList.add(savedTheme)
        }
      } catch (error) {
        console.error('Failed to apply initial theme:', error)
      }
    }

    applyInitialTheme()
  }, [])

  return (
    <TransitProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="transit-lines" element={<TransitLines />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="social" element={<Social />} />
          <Route path="profile" element={<Profile />} />
          <Route path="privacy" element={<Privacy />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
      <Toaster position="top-center" />
    </TransitProvider>
  )
}

export default App 