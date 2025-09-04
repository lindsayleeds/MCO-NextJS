import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetEmailSent, setResetEmailSent] = useState(false)
  
  const { signIn, resetPasswordForEmail } = useAuth()
  const router = useRouter()

  // Handle error messages from URL parameters
  useEffect(() => {
    if (router.isReady && router.query.error) {
      const errorType = router.query.error as string
      switch (errorType) {
        case 'invalid_recovery_link':
          setError('Invalid or expired password reset link. Please request a new one.')
          break
        case 'recovery_failed':
          setError('Password reset failed. Please try again.')
          break
        case 'no_session':
          setError('Session expired. Please sign in again.')
          break
        default:
          setError('An error occurred. Please try again.')
      }
      // Clean up the URL by removing the error parameter
      router.replace('/login', undefined, { shallow: true })
    }
  }, [router.isReady, router.query.error, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        setError(error.message || 'Failed to sign in')
      } else if (data?.session || data?.user) {
        // Success - either session or user exists
        router.push('/')
      } else {
        // Unexpected case - no error but no user/session
        setError('Login failed. Please try again.')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    // For demo purposes, simulate login without Supabase
    setError('')
    setLoading(true)
    
    setTimeout(() => {
      setLoading(false)
      setError('Demo mode: Supabase not configured. Please set up your database credentials.')
    }, 1000)
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const { error } = await resetPasswordForEmail(email)
      if (error) {
        setError(error.message || 'Failed to send reset email')
      } else {
        setResetEmailSent(true)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-finance-blue-600" />
              <h1 className="text-2xl font-bold text-finance-blue-600">Portfolio Manager</h1>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Or{' '}
            <Link 
              href="/signup" 
              className="font-medium text-finance-blue-600 hover:text-finance-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-destructive/15 border border-destructive/20 p-3">
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}
          
          {resetEmailSent && (
            <div className="rounded-md bg-green-50 border border-green-200 p-3">
              <div className="text-sm text-green-800">
                Password reset email sent! Check your inbox and click the link to reset your password.
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 bg-background border border-border placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-finance-blue-500 focus:border-finance-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 bg-background border border-border placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-finance-blue-500 focus:border-finance-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-finance-blue-600 hover:bg-finance-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-finance-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="group relative w-full flex justify-center py-2 px-4 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-finance-blue-500 transition-colors"
            >
              Try Demo Mode
            </button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="text-sm text-finance-blue-600 hover:text-finance-blue-500 disabled:opacity-50"
            >
              Forgot your password?
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}