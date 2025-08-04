import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Settings, 
  Moon, 
  Sun, 
  Menu, 
  X,
  LogOut,
  User
} from 'lucide-react'

const Layout = ({ children }) => {
  const { user, profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Check if we're in demo mode
  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                    process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url_here'

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: BarChart3,
      current: router.pathname === '/'
    },
    {
      name: 'Holdings',
      href: '/holdings',
      icon: TrendingUp,
      current: router.pathname.startsWith('/holdings')
    },
    {
      name: 'Analysis',
      href: '/analysis',
      icon: PieChart,
      current: router.pathname.startsWith('/analysis')
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      current: router.pathname.startsWith('/settings')
    }
  ]

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-finance-blue-600 dark:text-finance-blue-400">
                  Portfolio Manager
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                        item.current
                          ? 'border-finance-blue-500 text-finance-blue-600 dark:text-finance-blue-400'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* User Menu */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-medium text-foreground">
                      {isDemoMode ? 'Demo User' : (profile?.full_name || profile?.username || user?.email)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isDemoMode ? 'demo@portfolio.com' : user?.email}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSignOut}
                    className="flex items-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Mobile menu button */}
              <div className="sm:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Open mobile menu"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-border">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                      item.current
                        ? 'bg-finance-blue-50 dark:bg-finance-blue-950 border-finance-blue-500 text-finance-blue-700 dark:text-finance-blue-300'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted hover:border-muted-foreground'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
            
            {/* Mobile User Info */}
            <div className="pt-4 pb-3 border-t border-border">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-foreground">
                    {isDemoMode ? 'Demo User' : (profile?.full_name || profile?.username || user?.email)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isDemoMode ? 'demo@portfolio.com' : user?.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 px-4">
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

export default Layout