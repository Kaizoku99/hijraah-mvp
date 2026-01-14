import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const isProduction = process.env.NODE_ENV === 'production'

    // Track cookies that need to be set on the response
    const cookiesToSet: { name: string; value: string; options: any }[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookies) {
            // Capture cookies to set on the response later
            cookies.forEach(({ name, value, options }) => {
              console.log(`[Auth Callback] Capturing cookie: ${name}`)
              cookiesToSet.push({ name, value, options })
            })
          },
        },
        cookieOptions: {
          domain: isProduction ? '.hijraah.com' : undefined,
          path: '/',
          sameSite: 'lax' as const,
          secure: isProduction,
        }
      }
    )

    console.log('[Auth Callback] Exchanging code for session, Code:', code ? '***' : 'Missing')
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Auth Callback] Error exchanging code:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
    }

    if (data.session) {
      console.log('[Auth Callback] Session exchanged successfully. User:', data.session.user.id)
    }

    // Build redirect URL
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'

    let redirectUrl: string
    if (isLocalEnv) {
      redirectUrl = `${origin}${next}`
    } else if (forwardedHost) {
      redirectUrl = `https://${forwardedHost}${next}`
    } else {
      redirectUrl = `${origin}${next}`
    }

    // Create redirect response and attach cookies
    const response = NextResponse.redirect(redirectUrl)

    // Set all captured cookies on the redirect response
    cookiesToSet.forEach(({ name, value, options }) => {
      console.log(`[Auth Callback] Setting cookie on response: ${name}`, {
        domain: options?.domain || 'default',
        secure: options?.secure || false
      })
      response.cookies.set(name, value, {
        ...options,
        // Ensure domain is set for cross-subdomain sharing
        domain: isProduction ? '.hijraah.com' : options?.domain,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
      })
    })

    console.log(`[Auth Callback] Redirecting to: ${redirectUrl} with ${cookiesToSet.length} cookies`)
    return response
  }

  // No code provided - return error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
