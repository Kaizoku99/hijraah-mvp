'use server'

import { z } from 'zod'
import {
    getPublishedGuides,
    getGuideBySlug,
    searchGuides,
    getGuideCategoryCounts,
    GUIDE_CATEGORIES,
} from '@/../server/guides'

// Schemas
const ListGuidesSchema = z.object({
    category: z.string().optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
}).optional()

const BySlugSchema = z.object({
    slug: z.string(),
})

const SearchSchema = z.object({
    query: z.string(),
    limit: z.number().min(1).max(20).default(10),
})

export type ListGuidesInput = z.infer<typeof ListGuidesSchema>
export type SearchGuidesInput = z.infer<typeof SearchSchema>

/**
 * Get all published guides (public)
 */
export async function listGuides(input?: ListGuidesInput) {
    const validated = ListGuidesSchema.parse(input)
    return getPublishedGuides(validated)
}

/**
 * Get guide by slug (public)
 */
export async function getGuide(input: z.infer<typeof BySlugSchema>) {
    const validated = BySlugSchema.parse(input)
    return getGuideBySlug(validated.slug, true)
}

/**
 * Get categories with counts
 */
export async function getCategories() {
    const counts = await getGuideCategoryCounts(true)
    return {
        categories: GUIDE_CATEGORIES,
        counts,
    }
}

/**
 * Search guides
 */
export async function searchGuidesAction(input: SearchGuidesInput) {
    const validated = SearchSchema.parse(input)
    return searchGuides(validated.query, validated.limit ?? 10)
}
