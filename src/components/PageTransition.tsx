import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function PageTransition() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    // Always trigger transition, even for same location
    setIsTransitioning(true)
    const timer = setTimeout(() => {
      setDisplayLocation(location)
      setIsTransitioning(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [location])

  return (
    <div
      className={`transition-all duration-800 ease-in-out ${
        isTransitioning 
          ? 'opacity-0 translate-y-2' 
          : 'opacity-100 translate-y-0'
      }`}
    >
      <Outlet />
    </div>
  )
} 