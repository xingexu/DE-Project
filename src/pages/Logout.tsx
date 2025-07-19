import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransit } from '../contexts/TransitContext'
import toast from 'react-hot-toast'

export default function Logout() {
  const navigate = useNavigate()
  const { dispatch } = useTransit()

  useEffect(() => {
    // Clear user data with all required fields
    dispatch({ 
      type: 'SET_USER',
      payload: {
        id: '',
        name: '',
        avatar: '',
        points: 0,
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
      }
    })
    
    // Clear localStorage
    localStorage.removeItem('transitUser')
    
    toast.success('Logged out successfully!')
    navigate('/login')
  }, [dispatch, navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Logging out...</p>
      </div>
    </div>
  )
} 