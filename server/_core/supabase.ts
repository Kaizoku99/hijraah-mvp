import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import type { Request as ExpressRequest } from 'express';
import { env } from './env';

// Type for Supabase auth user
export type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
  };
};

/**
 * Create a Supabase client for server-side operations
 * This client has full admin access and should only be used on the server
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Create a Supabase client for server-side operations with user context (Next.js App Router)
 * This respects RLS policies based on the user's JWT
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase client from a NextRequest (for API routes)
 */
export function createSupabaseClientFromRequest(req: NextRequest) {
  return createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          const cookieHeader = req.headers.get('cookie') || '';
          const cookies: { name: string; value: string }[] = [];

          cookieHeader.split(';').forEach(cookie => {
            const [name, ...rest] = cookie.trim().split('=');
            if (name) {
              cookies.push({ name, value: rest.join('=') });
            }
          });

          return cookies;
        },
        setAll() {
          // Can't set cookies on request - this is handled by response
        },
      },
    }
  );
}

/**
 * Get the current authenticated user from Next.js request
 * Returns null if not authenticated
 */
export async function getAuthUserFromRequest(req: NextRequest): Promise<SupabaseUser | null> {
  const supabase = createSupabaseClientFromRequest(req);

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}


/**
 * Create a Supabase client from Express request/response
 * Handles cookie management for Express
 */
export function createSupabaseClientFromExpress(req: ExpressRequest, res?: any) {
  // Parse cookies from Express request
  const cookieHeader = req.headers.cookie || '';
  const cookieList: { name: string; value: string }[] = [];

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      cookieList.push({ name, value: rest.join('=') });
    }
  });

  return createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieList;
        },
        setAll(cookiesToSet) {
          if (!res) return;

          cookiesToSet.forEach(({ name, value, options }) => {
            if (res.cookie) {
              res.cookie(name, value, options);
            }
          });
        },
      },
    }
  );
}

/**
 * Get the current authenticated user from Express request
 * Extracts cookies from Express request and verifies with Supabase
 */
export async function getAuthUserFromExpressRequest(req: ExpressRequest): Promise<SupabaseUser | null> {
  const supabase = createSupabaseClientFromExpress(req);

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get the current authenticated user (for Server Components/Server Actions)
 * Returns null if not authenticated
 */
export async function getAuthUser(): Promise<SupabaseUser | null> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Verify the session and get user
 */
export async function verifySession() {
  const supabase = await createSupabaseServerClient();

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return { user: null, session: null };
  }

  return { user: session.user, session };
}
