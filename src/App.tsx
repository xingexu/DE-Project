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
import Map from './pages/Map'
import { TransitProvider } from './contexts/TransitContext'
import { useEffect, lazy, Suspense } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import { ApiLoading } from './components/ApiError'

// For future code splitting
// const Map = lazy(() => import('./pages/Map'))

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
        } else {
          // Default to light theme if no saved theme
          root.classList.add('light')
          body.classList.add('light')
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
          <Route path="map" element={
            <Suspense fallback={<ApiLoading message="Loading map..." className="min-h-[400px]" />}>
              <Map />
            </Suspense>
          } />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
          },
          success: {
            style: {
              border: '1px solid #10B981',
            },
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            style: {
              border: '1px solid #EF4444',
            },
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </TransitProvider>
  )
}

export default App