import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransit } from '../contexts/TransitContext'
import toast from 'react-hot-toast'

export default function Logout() {
  const navigate = useNavigate()
  const { dispatch } = useTransit()

  useEffect(() => {
    // Use the LOGOUT action to clear all data
    dispatch({ type: 'LOGOUT' })
    
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