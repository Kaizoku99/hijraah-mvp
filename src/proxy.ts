import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
    // 1. Run next-intl middleware first to handle i18n routing
    let response = handleI18nRouting(request);

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

    // Protect routes
    if (!data?.claims) {
        const { pathname } = request.nextUrl
        // Check if path starts with a locale (e.g. /en/dashboard) 
        // We match against commonly protected paths
        const isProtected = pathname.includes('/dashboard') ||
            pathname.includes('/profile') ||
            pathname.includes('/documents') ||
            pathname.includes('/chat') ||
            pathname.includes('/calculator')

        if (isProtected) {
            // Extract locale to preserve it in redirect, default to 'en' if not found
            // This regex looks for /xx/ at the start
            const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
            const locale = localeMatch ? localeMatch[1] : 'en';

            const loginUrl = new URL(`/${locale}/login`, request.url)
            // Optional: Add strict redirect to avoid loops? 
            // Logic seems safe as /login is not in isProtected list provided we don't protect /login

            return NextResponse.redirect(loginUrl);
        }
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
        '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
    ],
}
