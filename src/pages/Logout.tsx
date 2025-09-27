import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransit } from '../contexts/TransitContext'
import toast from 'react-hot-toast'
import { Bus, Train, Car, Check } from 'lucide-react'

export default function Logout() {
  const navigate = useNavigate()
  const { state, logout } = useTransit()
  const [loggingOut, setLoggingOut] = useState(true)
  
  useEffect(() => {
    const performLogout = async () => {
      if (state.user && state.user.id) {
        try {
          await logout()
          toast.success('Logged out successfully')
          setLoggingOut(false)
        } catch (error) {
          console.error('Logout error:', error)
          // Still consider the logout successful for UI purposes
          setLoggingOut(false)
        }
      } else {
        // If no user is logged in, just redirect
        setLoggingOut(false)
      }
    }
    
    performLogout()
    
    // Redirect after a delay
    const redirectTimer = setTimeout(() => {
      navigate('/login')
    }, 2000)
    
    return () => clearTimeout(redirectTimer)
  }, [navigate, logout, state.user])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4 text-black">
      <div className="max-w-md w-full fade-in-up text-center">
        <div className="flex justify-center items-center space-x-2 mb-6">
          <Bus className="h-8 w-8 text-primary-600 neon-glow" />
          <Train className="h-6 w-6 text-primary-500 neon-glow" />
          <Car className="h-6 w-6 text-primary-400 neon-glow" />
        </div>
        
        {loggingOut ? (
          <>
            <h1 className="text-3xl font-bold text-black mb-4">Logging out...</h1>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-black mb-2">Logged Out</h1>
            <p className="text-black mb-4">You've been successfully logged out of your account.</p>
            <p className="text-sm text-black">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  )
}