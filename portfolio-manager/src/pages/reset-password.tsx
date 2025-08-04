import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { updatePassword, user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Wait for auth loading to complete before checking user
    if (!loading && !user) {
      console.log('No user session found, redirecting to login')
      router.push('/login?error=no_session')
    }
  }, [user, loading, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setUpdating(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setUpdating(false)
      return
    }

    try {
      const { error } = await updatePassword(password)
      
      if (error) {
        setError(error.message || 'Failed to update password')
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    } catch (err) {
      console.error('Password update error:', err)
      setError('An unexpected error occurred')
    } finally {
      setUpdating(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finance-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <div className="flex justify-center">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-8 h-8 text-finance-blue-600" />
                <h1 className="text-2xl font-bold text-finance-blue-600">Portfolio Manager</h1>
              </div>
            </div>
            <div className="mt-6 rounded-md bg-green-50 border border-green-200 p-4">
              <div className="text-green-800">
                <h3 className="text-lg font-medium">Password Updated Successfully!</h3>
                <p className="mt-2 text-sm">Your password has been changed. Redirecting to dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-destructive/15 border border-destructive/20 p-3">
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 bg-background border border-border placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-finance-blue-500 focus:border-finance-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter new password"
                  minLength={6}
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
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 bg-background border border-border placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-finance-blue-500 focus:border-finance-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm new password"
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
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
              disabled={updating}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-finance-blue-600 hover:bg-finance-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-finance-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating Password...
                </div>
              ) : (
                'Update Password'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link 
              href="/login" 
              className="text-sm text-finance-blue-600 hover:text-finance-blue-500"
            >
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}