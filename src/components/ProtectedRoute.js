import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children, requiredRole = null, allowDemo = false }) => {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (loading) return

    // Check if we're in demo mode (Supabase not configured)
    const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url_here'

    // If demo mode is allowed and we're in demo mode, authorize
    if (allowDemo && isDemoMode) {
      setIsAuthorized(true)
      return
    }

    // Not authenticated - redirect to login
    if (!user) {
      router.push('/login')
      return
    }

    // If role is required, check user has the required role
    if (requiredRole && profile) {
      // For now, we'll implement basic role checking
      // This would need to be extended based on your role system
      const hasRequiredRole = profile.role === requiredRole || profile.role === 'admin'
      
      if (!hasRequiredRole) {
        router.push('/unauthorized')
        return
      }
    }

    setIsAuthorized(true)
  }, [user, profile, loading, router, requiredRole, allowDemo])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-finance-blue-500"></div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (!isAuthorized) {
    return null
  }

  return children
}

export default ProtectedRoute