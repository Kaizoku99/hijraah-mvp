import { createBrowserClient } from '@supabase/ssr'

// These are public keys, safe to expose in client-side code
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('[Supabase Client] Initializing with URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT SET')
console.log('[Supabase Client] Anon key present:', !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set. Auth features will not work.')
}

// Cookie domain for cross-subdomain sharing (www.hijraah.com <-> hijraah.com)
const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('hijraah.com')

export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    cookieOptions: {
      domain: isProduction ? '.hijraah.com' : undefined,
      path: '/',
      sameSite: 'lax' as const,
      secure: isProduction,
    }
  }
)

console.log('[Supabase Client] Client created successfully')
