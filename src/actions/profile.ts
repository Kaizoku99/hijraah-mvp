'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser } from './auth'
import {
    getUserProfile,
    createUserProfile,
    updateUserProfile,
    updateUserLanguagePreference,
} from '@/../server/db'

// Profile schemas for validation
const ProfileCreateSchema = z.object({
    dateOfBirth: z.string().optional(),
    nationality: z.string().optional(),
    sourceCountry: z.string().optional(),
    currentCountry: z.string().optional(),
    destinationCountry: z.string().optional(),
    education: z.string().optional(),
    workExperience: z.string().optional(),
    languageScores: z.record(z.string(), z.number()).optional(),
    spouseInfo: z.record(z.string(), z.unknown()).optional(),
})

const ProfileUpdateSchema = ProfileCreateSchema

const LanguageSchema = z.object({
    language: z.enum(['ar', 'en']),
})

export type ProfileInput = z.infer<typeof ProfileCreateSchema>

/**
 * Get the current user's profile
 */
export async function getProfile() {
    const user = await getAuthenticatedUser()
    const profile = await getUserProfile(user.id)
    return profile || null
}

/**
 * Create a new user profile
 */
export async function createProfile(input: ProfileInput) {
    const user = await getAuthenticatedUser()

    const validated = ProfileCreateSchema.parse(input)
    const { dateOfBirth, ...rest } = validated

    await createUserProfile({
        userId: user.id,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        ...rest,
    })

    revalidatePath('/profile')
    revalidatePath('/dashboard')

    return { success: true as const }
}

/**
 * Update the current user's profile
 */
export async function updateProfile(input: ProfileInput) {
    const user = await getAuthenticatedUser()

    const validated = ProfileUpdateSchema.parse(input)
    const { dateOfBirth, ...rest } = validated

    await updateUserProfile(user.id, {
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        ...rest,
    })

    revalidatePath('/profile')
    revalidatePath('/dashboard')

    return { success: true as const }
}

/**
 * Update user language preference
 */
export async function updateLanguage(input: z.infer<typeof LanguageSchema>) {
    const user = await getAuthenticatedUser()

    const validated = LanguageSchema.parse(input)
    await updateUserLanguagePreference(user.id, validated.language)

    revalidatePath('/profile')

    return { success: true as const }
}
