
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    console.log('[Proxy] Processing request:', request.nextUrl.pathname)
    const allCookies = request.cookies.getAll()
    console.log('[Proxy] Cookies found:', allCookies.map(c => c.name).join(', '))
    console.log('[Proxy] Supabase URL configured:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Yes' : 'NO!')
    console.log('[Proxy] Supabase Anon Key configured:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Yes' : 'NO!')

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const isProduction = process.env.NODE_ENV === 'production'

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
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

    // Use getClaims() instead of getUser() per Supabase docs:
    // "Never trust getSession() inside server code. Use getClaims() because it 
    // validates the JWT signature against the project's published public keys every time."
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const { data, error } = await supabase.auth.getClaims()

    if (error) {
        console.error('[Proxy] Error fetching claims:', error.message)
    } else if (data?.claims) {
        console.log('[Proxy] User authenticated:', data.claims.sub)
    } else {
        console.log('[Proxy] No user session found')
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
