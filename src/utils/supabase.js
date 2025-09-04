const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if we have valid Supabase credentials (not placeholder values)
const isValidUrl = supabaseUrl && supabaseUrl !== 'your_supabase_url_here' && supabaseUrl.startsWith('https://')
const isValidKey = supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key_here'

let supabase

if (!isValidUrl || !isValidKey) {
  console.warn('⚠️ Supabase credentials not configured. Using mock client.')
  
  // Create a mock client that won't break the app
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      updateUser: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      setSession: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
        })
      }),
      insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
          })
        })
      })
    })
  }
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

module.exports = { supabase }
module.exports.default = supabase