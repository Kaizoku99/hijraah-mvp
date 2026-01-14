import { createClient, User } from '@supabase/supabase-js';
import { env } from './env';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase env variables");
}

export const supabaseAdmin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

export async function createSupabaseServerClient() {
    const cookieStore = await cookies()

    return createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
            cookieOptions: {
                domain: process.env.NODE_ENV === 'production' ? '.hijraah.com' : undefined,
                path: '/',
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production',
            }
        }
    )
}

export async function getAuthUser(): Promise<User | null> {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        console.error('[getAuthUser] Error fetching user:', error.message)
    } else if (!user) {
        console.log('[getAuthUser] No user found in session')
    } else {
        console.log('[getAuthUser] User found:', user.id)
    }

    return user;
}
