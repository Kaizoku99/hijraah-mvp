import { Router, type Request, type Response, type NextFunction } from 'express';
import { createSupabaseServerClient, createSupabaseClientFromExpress, getAuthUser, type SupabaseUser } from './supabase';
import * as db from '../db';
import { env } from './env';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        authId: string;
        email: string | null;
        name: string | null;
        role: 'user' | 'admin';
        subscriptionTier: 'free' | 'essential' | 'premium' | 'vip';
      };
      supabaseUser?: SupabaseUser;
    }
  }
}

export const authRouter = Router();

/**
 * Auth middleware - validates Supabase session and attaches user to request
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const supabaseUser = await getAuthUserFromExpressRequest(req);

    if (!supabaseUser) {
      return next(); // Continue without user (for public routes)
    }

    req.supabaseUser = supabaseUser;

    // Get or create database user
    const dbUser = await db.getOrCreateUserByAuthId(supabaseUser.id, {
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
    });

    if (dbUser) {
      req.user = {
        id: dbUser.id,
        authId: dbUser.authId,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        subscriptionTier: dbUser.subscriptionTier,
      };
    }

    next();
  } catch (error) {
    console.error('[Auth] Middleware error:', error);
    next();
  }
}

/**
 * Require authentication middleware
 * Use this for protected routes
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * Require admin role middleware
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ============== Auth Routes ==============

/**
 * GET /api/auth/user - Get current user
 */
authRouter.get('/user', async (req: Request, res: Response) => {
  try {
    const supabaseUser = await getAuthUserFromExpressRequest(req);

    if (!supabaseUser) {
      return res.json({ user: null });
    }

    const dbUser = await db.getUserByAuthId(supabaseUser.id);

    if (!dbUser) {
      return res.json({ user: null });
    }

    // Get user profile
    const profile = await db.getUserProfile(dbUser.id);

    res.json({
      user: {
        id: dbUser.id,
        authId: dbUser.authId,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        subscriptionTier: dbUser.subscriptionTier,
        subscriptionStatus: dbUser.subscriptionStatus,
        preferredLanguage: dbUser.preferredLanguage,
        profile: profile || null,
      },
    });
  } catch (error) {
    console.error('[Auth] Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * POST /api/auth/signout - Sign out user
 */
authRouter.post('/signout', async (req: Request, res: Response) => {
  try {
    const supabase = createSupabaseClientFromExpress(req, res);
    await supabase.auth.signOut();

    res.json({ success: true });
  } catch (error) {
    console.error('[Auth] Sign out error:', error);
    res.status(500).json({ error: 'Failed to sign out' });
  }
});

/**
 * GET /api/auth/callback - OAuth callback handler
 * This handles the redirect from Supabase OAuth
 */
authRouter.get('/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const next = (req.query.next as string) || '/';

  if (!code) {
    return res.redirect(`/?error=no_code`);
  }

  try {
    const supabase = createSupabaseClientFromExpress(req, res);

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[Auth] OAuth callback error:', error);
      return res.redirect(`/?error=auth_failed`);
    }

    if (data.user) {
      // Create or update user in database
      await db.getOrCreateUserByAuthId(data.user.id, {
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
      });
    }

    res.redirect(next);
  } catch (error) {
    console.error('[Auth] OAuth callback exception:', error);
    res.redirect(`/?error=auth_failed`);
  }
});

/**
 * GET /api/auth/session - Get current session status
 */
authRouter.get('/session', async (req: Request, res: Response) => {
  try {
    const supabase = createSupabaseClientFromExpress(req, res);
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return res.json({ session: null });
    }

    res.json({
      session: {
        accessToken: session.access_token,
        expiresAt: session.expires_at,
        user: {
          id: session.user.id,
          email: session.user.email,
        },
      },
    });
  } catch (error) {
    console.error('[Auth] Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

export function registerAuthRoutes(app: Router) {
  app.use('/api/auth', authRouter);
}
