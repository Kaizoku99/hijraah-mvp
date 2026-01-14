'use server'


import { z } from 'zod'
import { revalidatePath, unstable_cache } from 'next/cache'
import { getAuthenticatedUser } from './auth'
import { updateWorkingMemory } from '@/lib/memory'
import { CACHE_TAGS, CACHE_DURATIONS, userTag, invalidateUserProfile } from '@/lib/cache'

import {
    getUserProfile,
    createUserProfile,
    updateUserProfile,
    updateUserLanguagePreference,
} from '@/../server/db'

// Profile schemas for validation
// Helper to convert empty strings to undefined for optional fields
const preprocessEmpty = <T extends z.ZodTypeAny>(schema: T) => z.preprocess((val) => (val === "" ? undefined : val), schema);

const ProfileCreateSchema = z.object({
    dateOfBirth: preprocessEmpty(z.string().optional()),
    nationality: preprocessEmpty(z.string().optional()),
    sourceCountry: preprocessEmpty(z.string().optional()),
    currentCountry: preprocessEmpty(z.string().optional()),
    maritalStatus: preprocessEmpty(z.enum(['single', 'married', 'divorced', 'widowed']).optional()),
    educationLevel: preprocessEmpty(z.enum(['high_school', 'bachelor', 'master', 'phd', 'other']).optional()),
    fieldOfStudy: preprocessEmpty(z.string().optional()),
    yearsOfExperience: z.number().optional(), // Already handled by frontend (parseInt or undefined)
    currentOccupation: preprocessEmpty(z.string().optional()),
    nocCode: preprocessEmpty(z.string().optional()),
    englishLevel: preprocessEmpty(z.enum(['none', 'basic', 'intermediate', 'advanced', 'native']).optional()),
    frenchLevel: preprocessEmpty(z.enum(['none', 'basic', 'intermediate', 'advanced', 'native']).optional()),
    ieltsScore: preprocessEmpty(z.string().optional()),
    tefScore: preprocessEmpty(z.string().optional()),
    targetDestination: preprocessEmpty(z.string().optional()),
    immigrationPathway: preprocessEmpty(z.enum(['express_entry', 'study_permit', 'family_sponsorship', 'other']).optional()),
})

const ProfileUpdateSchema = ProfileCreateSchema

const LanguageSchema = z.object({
    language: z.enum(['ar', 'en']),
})

export type ProfileInput = z.infer<typeof ProfileCreateSchema>

/**
 * Get the current user's profile
 */
const getCachedProfile = unstable_cache(
    async (userId: number) => {
        return getUserProfile(userId)
    },
    ['user-profile'],
    { tags: [CACHE_TAGS.PROFILE], revalidate: CACHE_DURATIONS.SHORT }
)

export async function getProfile() {
    const user = await getAuthenticatedUser()
    const profile = await getCachedProfile(user.id)
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

    // Add to AI Memory
    const memoryContent = `User created their profile:
    - Nationality: ${validated.nationality || 'N/A'}
    - Current Country: ${validated.currentCountry || 'N/A'}
    - Source Country: ${validated.sourceCountry || 'N/A'}
    - Marital Status: ${validated.maritalStatus || 'N/A'}
    - Education Level: ${validated.educationLevel || 'N/A'}
    - Field of Study: ${validated.fieldOfStudy || 'N/A'}
    - Years of Experience: ${validated.yearsOfExperience?.toString() || 'N/A'}
    - Current Occupation: ${validated.currentOccupation || 'N/A'}
    - NOC Code: ${validated.nocCode || 'N/A'}
    - English Level: ${validated.englishLevel || 'N/A'}
    - French Level: ${validated.frenchLevel || 'N/A'}
    - IELTS Score: ${validated.ieltsScore || 'N/A'}
    - TEF Score: ${validated.tefScore || 'N/A'}
    - Target Destination: ${validated.targetDestination || 'N/A'}
    - Immigration Pathway: ${validated.immigrationPathway || 'N/A'}`

    await updateWorkingMemory(user.id.toString(), memoryContent)

    invalidateUserProfile(user.id)
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

    // Add to AI Memory
    const memoryContent = `User updated their profile:
    - Nationality: ${validated.nationality || 'N/A'}
    - Current Country: ${validated.currentCountry || 'N/A'}
    - Source Country: ${validated.sourceCountry || 'N/A'}
    - Marital Status: ${validated.maritalStatus || 'N/A'}
    - Education Level: ${validated.educationLevel || 'N/A'}
    - Field of Study: ${validated.fieldOfStudy || 'N/A'}
    - Years of Experience: ${validated.yearsOfExperience?.toString() || 'N/A'}
    - Current Occupation: ${validated.currentOccupation || 'N/A'}
    - NOC Code: ${validated.nocCode || 'N/A'}
    - English Level: ${validated.englishLevel || 'N/A'}
    - French Level: ${validated.frenchLevel || 'N/A'}
    - IELTS Score: ${validated.ieltsScore || 'N/A'}
    - TEF Score: ${validated.tefScore || 'N/A'}
    - Target Destination: ${validated.targetDestination || 'N/A'}
    - Immigration Pathway: ${validated.immigrationPathway || 'N/A'}`

    await updateWorkingMemory(user.id.toString(), memoryContent)

    invalidateUserProfile(user.id)
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

    invalidateUserProfile(user.id)
    revalidatePath('/profile')

    return { success: true as const }
}
