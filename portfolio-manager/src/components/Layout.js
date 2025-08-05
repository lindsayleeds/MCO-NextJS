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
  User,
  ChevronDown
} from 'lucide-react'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from './ui/navigation-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Button } from './ui/button'

const Layout = ({ children }) => {
  const { user, profile, signOut } = useAuth()
  const { toggleTheme, setLightTheme, setDarkTheme } = useTheme()
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
      name: 'Positions',
      href: '/positions',
      icon: TrendingUp,
      current: router.pathname.startsWith('/positions')
    },
    {
      name: 'Snapshots',
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
              <div className="hidden sm:ml-8 sm:flex">
                <NavigationMenu>
                  <NavigationMenuList>
                    {navigation.map((item) => {
                      const Icon = item.icon
                      return (
                        <NavigationMenuItem key={item.name}>
                          <NavigationMenuLink asChild>
                            <Link 
                              href={item.href}
                              className={`${navigationMenuTriggerStyle()} ${
                                item.current
                                  ? 'bg-accent text-accent-foreground'
                                  : ''
                              }`}
                            >
                              <Icon className="w-4 h-4 mr-2" />
                              {item.name}
                            </Link>
                          </NavigationMenuLink>
                        </NavigationMenuItem>
                      )
                    })}
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={setLightTheme}>
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={setDarkTheme}>
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleTheme}>
                    <Settings className="mr-2 h-4 w-4" />
                    Toggle
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline-block text-sm">
                      {isDemoMode ? 'Demo User' : (profile?.full_name || profile?.username || user?.email)}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem disabled>
                    <User className="mr-2 h-4 w-4" />
                    {isDemoMode ? 'demo@portfolio.com' : user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <div className="sm:hidden">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Open mobile menu"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </Button>
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
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign out
                </Button>
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