/**
 * Caching utilities for Next.js using unstable_cache
 * 
 * Provides centralized cache configuration with tag-based invalidation
 */

import { unstable_cache } from 'next/cache'
import { revalidateTag } from 'next/cache'

// ============================================================================
// Cache Tags - centralized for easy management
// ============================================================================

export const CACHE_TAGS = {
    // Public content (long cache)
    GUIDES: 'guides',
    GUIDE_CATEGORIES: 'guide-categories',

    // User-specific data (short cache) - prefixed with user ID
    PROFILE: 'profile',
    CRS_HISTORY: 'crs-history',
    CRS_LATEST: 'crs-latest',
    CHECKLISTS: 'checklists',
    DOCUMENTS: 'documents',
    SOP: 'sop',
    CHAT: 'chat',
} as const

// ============================================================================
// Cache Durations (in seconds)
// ============================================================================

export const CACHE_DURATIONS = {
    /** 1 hour - for rarely changing public content */
    LONG: 3600,
    /** 5 minutes - for user-specific data */
    SHORT: 300,
    /** 1 minute - for frequently accessed but slow data */
    VERY_SHORT: 60,
} as const

// ============================================================================
// User-specific cache tag helpers
// ============================================================================

/**
 * Create a user-specific cache tag
 * @example userTag('profile', 123) => 'profile-123'
 */
export function userTag(tag: string, userId: number | string): string {
    return `${tag}-${userId}`
}

// ============================================================================
// Cache invalidation helpers
// ============================================================================

/**
 * Invalidate all guide-related caches
 */
export function invalidateGuides(): void {
    revalidateTag(CACHE_TAGS.GUIDES, 'max')
    revalidateTag(CACHE_TAGS.GUIDE_CATEGORIES, 'max')
}

/**
 * Invalidate user profile cache
 */
export function invalidateUserProfile(userId: number | string): void {
    revalidateTag(userTag(CACHE_TAGS.PROFILE, userId), 'max')
}

/**
 * Invalidate user CRS caches
 */
export function invalidateUserCrs(userId: number | string): void {
    revalidateTag(userTag(CACHE_TAGS.CRS_HISTORY, userId), 'max')
    revalidateTag(userTag(CACHE_TAGS.CRS_LATEST, userId), 'max')
}

/**
 * Invalidate user document caches
 */
export function invalidateUserDocuments(userId: number | string): void {
    revalidateTag(userTag(CACHE_TAGS.CHECKLISTS, userId), 'max')
    revalidateTag(userTag(CACHE_TAGS.DOCUMENTS, userId), 'max')
}

/**
 * Invalidate user SOP caches
 */
export function invalidateUserSop(userId: number | string): void {
    revalidateTag(userTag(CACHE_TAGS.SOP, userId), 'max')
}

/**
 * Invalidate user Chat caches
 */
export function invalidateUserChat(userId: number | string): void {
    revalidateTag(userTag(CACHE_TAGS.CHAT, userId), 'max')
}

// ============================================================================
// Typed cache wrapper
// ============================================================================

type CacheOptions = {
    tags?: string[]
    revalidate?: number
}

/**
 * Create a cached version of an async function
 * Type-safe wrapper around unstable_cache
 */
export function createCachedFunction<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    keyParts: string[],
    options: CacheOptions = {}
): (...args: TArgs) => Promise<TResult> {
    const { tags = [], revalidate = CACHE_DURATIONS.SHORT } = options

    return unstable_cache(
        fn,
        keyParts,
        { tags, revalidate }
    ) as (...args: TArgs) => Promise<TResult>
}
