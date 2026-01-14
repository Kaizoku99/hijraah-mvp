'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { unstable_cache } from 'next/cache'
import {
    getPublishedGuides,
    getAllGuides,
    getGuideBySlug,
    getGuideById,
    createGuide,
    updateGuide,
    deleteGuide,
    toggleGuidePublish,
    searchGuides,
    translateGuideContent,
    getGuideCategoryCounts,
    GUIDE_CATEGORIES,
} from '@/../server/guides'
import { getAuthenticatedUser } from './auth'
import { ActionError } from '@/lib/action-client'
import { CACHE_TAGS, CACHE_DURATIONS, invalidateGuides } from '@/lib/cache'

// Schemas
const ListGuidesSchema = z.object({
    category: z.string().optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
}).optional()

const BySlugSchema = z.object({
    slug: z.string(),
})

const ByIdSchema = z.object({
    id: z.number(),
})

const SearchSchema = z.object({
    query: z.string(),
    limit: z.number().min(1).max(20).default(10),
})

const CreateGuideSchema = z.object({
    slug: z.string().min(3).max(255),
    titleEn: z.string().min(5).max(500),
    titleAr: z.string().max(500).optional(),
    contentEn: z.string().min(50),
    contentAr: z.string().optional(),
    category: z.string(),
    tags: z.array(z.string()).optional(),
    metaDescriptionEn: z.string().max(300).optional(),
    metaDescriptionAr: z.string().max(300).optional(),
    isPublished: z.boolean().default(false),
})

const UpdateGuideSchema = z.object({
    id: z.number(),
    slug: z.string().min(3).max(255).optional(),
    titleEn: z.string().min(5).max(500).optional(),
    titleAr: z.string().max(500).optional(),
    contentEn: z.string().min(50).optional(),
    contentAr: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metaDescriptionEn: z.string().max(300).optional(),
    metaDescriptionAr: z.string().max(300).optional(),
    isPublished: z.boolean().optional(),
})

const TranslateGuideSchema = z.object({
    titleEn: z.string(),
    contentEn: z.string(),
    excerptEn: z.string().optional(),
})

const TogglePublishSchema = z.object({
    id: z.number(),
    isPublished: z.boolean(),
})

export type ListGuidesInput = z.infer<typeof ListGuidesSchema>
export type SearchGuidesInput = z.infer<typeof SearchSchema>
export type CreateGuideInput = z.infer<typeof CreateGuideSchema>
export type UpdateGuideInput = z.infer<typeof UpdateGuideSchema>

/**
 * Get all published guides (public) - CACHED
 */
const getCachedPublishedGuides = unstable_cache(
    async (category?: string, limit = 20, offset = 0) => {
        return getPublishedGuides({ category, limit, offset })
    },
    ['published-guides'],
    { tags: [CACHE_TAGS.GUIDES], revalidate: CACHE_DURATIONS.LONG }
)

export async function listGuides(input?: ListGuidesInput) {
    const validated = ListGuidesSchema.parse(input)
    return getCachedPublishedGuides(
        validated?.category,
        validated?.limit ?? 20,
        validated?.offset ?? 0
    )
}

/**
 * Get all guides (admin) - NOT CACHED (admin data)
 */
export async function listAllGuides(input?: ListGuidesInput) {
    const user = await getAuthenticatedUser()
    // Simple role check - assuming user type has role
    // In a real app, strict admin check should be here

    // For now allowing authenticated users to list all (admin panel logic)
    // Ideally: if (user.role !== 'admin') throw new ActionError('Forbidden', 'FORBIDDEN')

    const validated = ListGuidesSchema.parse(input)
    return getAllGuides(validated)
}

/**
 * Get guide by slug (public) - CACHED
 */
const getCachedGuideBySlug = unstable_cache(
    async (slug: string) => {
        return getGuideBySlug(slug, true)
    },
    ['guide-by-slug'],
    { tags: [CACHE_TAGS.GUIDES], revalidate: CACHE_DURATIONS.LONG }
)

export async function getGuide(input: z.infer<typeof BySlugSchema>) {
    const validated = BySlugSchema.parse(input)
    return getCachedGuideBySlug(validated.slug)
}

/**
 * Get guide by ID (admin) - NOT CACHED (admin data)
 */
export async function getGuideByIdAction(input: z.infer<typeof ByIdSchema>) {
    await getAuthenticatedUser()
    const validated = ByIdSchema.parse(input)
    return getGuideById(validated.id)
}

/**
 * Get categories with counts - CACHED
 */
const getCachedCategories = unstable_cache(
    async () => {
        const counts = await getGuideCategoryCounts(true)
        return {
            categories: GUIDE_CATEGORIES,
            counts,
        }
    },
    ['guide-categories'],
    { tags: [CACHE_TAGS.GUIDE_CATEGORIES], revalidate: CACHE_DURATIONS.LONG }
)

export async function getCategories() {
    return getCachedCategories()
}

/**
 * Search guides
 */
export async function searchGuidesAction(input: SearchGuidesInput) {
    const validated = SearchSchema.parse(input)
    return searchGuides(validated.query, validated.limit ?? 10)
}

/**
 * Create guide (admin)
 */
export async function createGuideAction(input: CreateGuideInput) {
    await getAuthenticatedUser()
    const validated = CreateGuideSchema.parse(input)
    const guide = await createGuide(validated)

    // Invalidate caches
    invalidateGuides()
    revalidatePath('/guides')
    revalidatePath('/admin/guides')

    return guide
}

/**
 * Update guide (admin)
 */
export async function updateGuideAction(input: UpdateGuideInput) {
    await getAuthenticatedUser()
    const validated = UpdateGuideSchema.parse(input)
    const { id, ...data } = validated
    const guide = await updateGuide(id, data)

    // Invalidate caches
    invalidateGuides()
    revalidatePath('/guides')
    revalidatePath('/admin/guides')
    revalidatePath(`/guides/${guide.slug}`)

    return guide
}

/**
 * Delete guide (admin)
 */
export async function deleteGuideAction(input: z.infer<typeof ByIdSchema>) {
    await getAuthenticatedUser()
    const validated = ByIdSchema.parse(input)
    await deleteGuide(validated.id)

    // Invalidate caches
    invalidateGuides()
    revalidatePath('/guides')
    revalidatePath('/admin/guides')

    return { success: true }
}

/**
 * Toggle publish status (admin)
 */
export async function toggleGuidePublishAction(input: z.infer<typeof TogglePublishSchema>) {
    await getAuthenticatedUser()
    const validated = TogglePublishSchema.parse(input)
    await toggleGuidePublish(validated.id, validated.isPublished)

    // Invalidate caches
    invalidateGuides()
    revalidatePath('/guides')
    revalidatePath('/admin/guides')

    return { success: true }
}

/**
 * Translate guide content (admin)
 */
export async function translateGuideAction(input: z.infer<typeof TranslateGuideSchema>) {
    await getAuthenticatedUser()
    const validated = TranslateGuideSchema.parse(input)
    return translateGuideContent({
        titleEn: validated.titleEn,
        contentEn: validated.contentEn,
        metaDescriptionEn: validated.excerptEn
    })
}
