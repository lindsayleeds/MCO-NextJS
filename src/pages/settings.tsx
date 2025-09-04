import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Settings as SettingsIcon, User, Database, Bell, Shield, Palette, Save } from 'lucide-react'
import { supabase } from '@/utils/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface SettingsData {
  // User preferences
  display_name: string
  email: string
  timezone: string
  date_format: string
  currency: string
  
  // Portfolio settings
  default_portfolio_view: string
  show_percentage_returns: boolean
  show_dividend_info: boolean
  
  // Notification settings
  email_notifications: boolean
  price_alerts: boolean
  
  // System settings
  theme: string
  auto_refresh: boolean
  data_retention_days: number
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>({
    display_name: '',
    email: '',
    timezone: 'UTC',
    date_format: 'MM/DD/YYYY',
    currency: 'USD',
    default_portfolio_view: 'table',
    show_percentage_returns: true,
    show_dividend_info: true,
    email_notifications: true,
    price_alerts: false,
    theme: 'system',
    auto_refresh: true,
    data_retention_days: 365
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('profile')

  // Load settings from Supabase
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')

        if (error) {
          console.error('Error loading settings:', error)
          return
        }

        // Convert settings array to object
        if (data && data.length > 0) {
          const settingsObj = data.reduce((acc, setting) => {
            acc[setting.key] = setting.value
            return acc
          }, {} as Record<string, string>)
          
          setSettings(prev => ({ ...prev, ...settingsObj }))
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleSaveSettings = async () => {
    setSaving(true)
    
    try {
      // Convert settings object to array format for Supabase
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value: String(value),
        description: getSettingDescription(key)
      }))

      // Delete existing settings and insert new ones (upsert)
      for (const setting of settingsArray) {
        const { error } = await supabase
          .from('settings')
          .upsert({
            key: setting.key,
            value: setting.value,
            description: setting.description,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'key'
          })

        if (error) {
          console.error('Error saving setting:', error)
          throw error
        }
      }

      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings. Please try again.')
    } finally {
      setSaving(false)
      setShowConfirmDialog(false)
    }
  }

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      display_name: 'User display name',
      email: 'User email address',
      timezone: 'User timezone preference',
      date_format: 'Date display format',
      currency: 'Default currency for calculations',
      default_portfolio_view: 'Default view for portfolio data',
      show_percentage_returns: 'Show percentage returns in views',
      show_dividend_info: 'Display dividend information',
      email_notifications: 'Enable email notifications',
      price_alerts: 'Enable price alert notifications',
      theme: 'UI theme preference',
      auto_refresh: 'Enable automatic data refresh',
      data_retention_days: 'Number of days to retain historical data'
    }
    return descriptions[key] || ''
  }

  const handleInputChange = (key: keyof SettingsData, value: string | boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'portfolio', label: 'Portfolio', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'advanced', label: 'Advanced', icon: Shield }
  ]

  if (loading) {
    return (
      <ProtectedRoute allowDemo={true}>
        <Layout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finance-blue-500"></div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowDemo={true}>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <SettingsIcon className="w-8 h-8 mr-3 text-finance-blue-600 dark:text-finance-blue-400" />
              Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure your portfolio management preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeSection === section.id
                          ? 'bg-finance-blue-100 text-finance-blue-700 dark:bg-finance-blue-900 dark:text-finance-blue-100'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {section.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3">
              <div className="bg-card rounded-lg border border-border p-6">
                
                {/* Profile Settings */}
                {activeSection === 'profile' && (
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">Profile Information</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Display Name
                        </label>
                        <Input
                          value={settings.display_name}
                          onChange={(e) => handleInputChange('display_name', e.target.value)}
                          placeholder="Enter your display name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Email Address
                        </label>
                        <Input
                          type="email"
                          value={settings.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Timezone
                        </label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => handleInputChange('timezone', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Portfolio Settings */}
                {activeSection === 'portfolio' && (
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">Portfolio Preferences</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Default Currency
                        </label>
                        <select
                          value={settings.currency}
                          onChange={(e) => handleInputChange('currency', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="CAD">CAD (C$)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Date Format
                        </label>
                        <select
                          value={settings.date_format}
                          onChange={(e) => handleInputChange('date_format', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={settings.show_percentage_returns}
                            onChange={(e) => handleInputChange('show_percentage_returns', e.target.checked)}
                            className="rounded border-border"
                          />
                          <span className="text-sm text-foreground">Show percentage returns</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={settings.show_dividend_info}
                            onChange={(e) => handleInputChange('show_dividend_info', e.target.checked)}
                            className="rounded border-border"
                          />
                          <span className="text-sm text-foreground">Show dividend information</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Settings */}
                {activeSection === 'notifications' && (
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">Notification Preferences</h2>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.email_notifications}
                          onChange={(e) => handleInputChange('email_notifications', e.target.checked)}
                          className="rounded border-border"
                        />
                        <span className="text-sm text-foreground">Enable email notifications</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.price_alerts}
                          onChange={(e) => handleInputChange('price_alerts', e.target.checked)}
                          className="rounded border-border"
                        />
                        <span className="text-sm text-foreground">Enable price alerts</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Appearance Settings */}
                {activeSection === 'appearance' && (
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">Appearance</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Theme
                        </label>
                        <select
                          value={settings.theme}
                          onChange={(e) => handleInputChange('theme', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                        >
                          <option value="system">System</option>
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced Settings */}
                {activeSection === 'advanced' && (
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">Advanced Settings</h2>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.auto_refresh}
                          onChange={(e) => handleInputChange('auto_refresh', e.target.checked)}
                          className="rounded border-border"
                        />
                        <span className="text-sm text-foreground">Enable automatic data refresh</span>
                      </label>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Data Retention (days)
                        </label>
                        <Input
                          type="number"
                          value={settings.data_retention_days}
                          onChange={(e) => handleInputChange('data_retention_days', parseInt(e.target.value) || 365)}
                          min="1"
                          max="3650"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Number of days to keep historical data (1-3650)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => window.location.reload()}
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Settings</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to save these settings? Some changes may require a page refresh to take effect.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  )
}