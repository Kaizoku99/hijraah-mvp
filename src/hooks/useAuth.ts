'use client'

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getMe } from "@/actions/auth"
import { supabase } from "@/lib/supabase"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { User as SupabaseUser, Session } from "@supabase/supabase-js"

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean
  redirectPath?: string
}

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } =
    options ?? {}
  const queryClient = useQueryClient()

  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Get database user from Server Action
  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!supabaseUser, // Only fetch when Supabase user exists
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setSupabaseUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setSupabaseUser(session?.user ?? null)

        if (event === 'SIGNED_IN') {
          // Invalidate cache to fetch fresh user data
          await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        } else if (event === 'SIGNED_OUT') {
          queryClient.setQueryData(['auth', 'me'], null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [queryClient])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) throw error
  }, [])

  const signInWithGithub = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) throw error
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    console.log('[useAuth] Attempting signInWithPassword for:', email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    console.log('[useAuth] signInWithPassword result:', { data, error })
    if (error) {
      console.error('[useAuth] signInWithPassword error:', error)
      throw error
    }
    console.log('[useAuth] signInWithPassword success, user:', data.user?.id)
  }, [])

  // Sign up with email - sends OTP code to email for verification
  const signUpWithEmail = useCallback(async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Don't use emailRedirectTo - this enables OTP code verification instead of magic link
        data: {
          full_name: name || email.split('@')[0],
        },
      },
    })
    if (error) throw error
    // Return true if user needs to verify (no session = needs OTP verification)
    return { needsVerification: !data.session }
  }, [])

  // Verify OTP code sent to email during signup
  const verifyOtp = useCallback(async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    })
    if (error) throw error
    return data
  }, [])

  // Resend OTP code for signup verification
  const resendOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })
    if (error) throw error
  }, [])

  const signInWithMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) throw error
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    queryClient.setQueryData(['auth', 'me'], null)
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
  }, [queryClient])

  const state = useMemo(() => {
    const user = meQuery.data ?? null
    if (typeof window !== 'undefined') {
      localStorage.setItem("hijraah-user-info", JSON.stringify(user))
    }

    return {
      user,
      supabaseUser,
      session,
      loading: loading || meQuery.isLoading,
      error: meQuery.error ?? null,
      isAuthenticated: Boolean(supabaseUser),
    }
  }, [meQuery.data, meQuery.error, meQuery.isLoading, supabaseUser, session, loading])

  // Redirect if not authenticated
  useEffect(() => {
    if (!redirectOnUnauthenticated) return
    if (loading) return
    if (supabaseUser) return
    if (typeof window === "undefined") return
    if (window.location.pathname === redirectPath) return

    window.location.href = redirectPath
  }, [redirectOnUnauthenticated, redirectPath, loading, supabaseUser])

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    signUpWithEmail,
    signInWithMagicLink,
    verifyOtp,
    resendOtp,
    isLoading: state.loading,
  }
}
