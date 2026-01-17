'use server'

import { cache } from 'react'
import { getAuthUser, createSupabaseServerClient } from '@/../server/_core/supabase'
import * as db from '@/../server/db'
import type { User } from '@/../drizzle/schema'
import { ActionError } from '@/lib/action-client'

/**
 * Get the current authenticated user from the database
 * This is the primary auth action that replaces trpc.auth.me
 * Wrapped with React.cache() for per-request deduplication
 */
export const getMe = cache(async (): Promise<User | null> => {
    const supabaseUser = await getAuthUser()

    if (!supabaseUser) {
        return null
    }

    // Get or create database user
    const dbUser = await db.getOrCreateUserByAuthId(supabaseUser.id, {
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
    })

    return dbUser
})

/**
 * Get authenticated user or throw an error
 * Use this in protected actions
 * Wrapped with React.cache() for per-request deduplication
 */
export const getAuthenticatedUser = cache(async (): Promise<User> => {
    const user = await getMe()

    if (!user) {
        throw new ActionError('You must be logged in to perform this action', 'UNAUTHORIZED')
    }

    return user
})

/**
 * Get admin user or throw an error
 * Use this in admin-only actions
 */
export async function getAdminUser(): Promise<User> {
    const user = await getAuthenticatedUser()

    if (user.role !== 'admin') {
        throw new ActionError('You must be an admin to perform this action', 'FORBIDDEN')
    }

    return user
}

/**
 * Logout the current user
 */
export async function logout(): Promise<{ success: true }> {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
    return { success: true }
}
