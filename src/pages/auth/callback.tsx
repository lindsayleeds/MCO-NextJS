import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/utils/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { type, access_token, refresh_token } = router.query

      // Always check for recovery type first, regardless of user state
      if (type === 'recovery' && access_token && refresh_token) {
        try {
          // Set the session using the tokens from the URL
          const { error } = await supabase.auth.setSession({
            access_token: access_token as string,
            refresh_token: refresh_token as string,
          })

          if (error) {
            console.error('Error setting session:', error)
            router.push('/login?error=invalid_recovery_link')
            return
          }

          // Directly redirect to reset password - don't wait for auth state
          router.push('/reset-password')
          return
        } catch (error) {
          console.error('Error during recovery:', error)
          router.push('/login?error=recovery_failed')
          return
        }
      }
      
      // Only check user state if not a recovery flow
      if (user) {
        // Regular authentication, redirect to dashboard
        router.push('/')
      } else {
        // No valid session, redirect to login
        router.push('/login')
      }
    }

    if (router.isReady) {
      handleAuthCallback()
    }
  }, [router.isReady, router.query, user, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finance-blue-600 mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Processing authentication...</p>
      </div>
    </div>
  )
}