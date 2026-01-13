'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser } from './auth'
import { ActionError } from '@/lib/action-client'
import { calculateCRS, CrsInput } from '@/../server/crs-calculator'
import {
    createCrsAssessment,
    getUserCrsAssessments,
    getLatestCrsAssessment,
} from '@/../server/db'
import { getSubscriptionStatus } from '@/../server/stripe'
import { checkUsageLimit, incrementUsage } from '@/../server/usage'

// Schema
const CalculateCrsSchema = z.object({
    age: z.number().min(18).max(60),
    educationLevel: z.enum(['none', 'high_school', 'one_year', 'two_year', 'bachelor', 'two_or_more', 'master', 'phd']),
    firstLanguageTest: z.object({
        speaking: z.number().min(0).max(10),
        listening: z.number().min(0).max(10),
        reading: z.number().min(0).max(10),
        writing: z.number().min(0).max(10),
    }),
    secondLanguageTest: z.object({
        speaking: z.number().min(0).max(10),
        listening: z.number().min(0).max(10),
        reading: z.number().min(0).max(10),
        writing: z.number().min(0).max(10),
    }).optional(),
    canadianWorkExperience: z.number().min(0).max(10),
    hasSpouse: z.boolean(),
    spouseEducation: z.enum(['none', 'high_school', 'one_year', 'two_year', 'bachelor', 'two_or_more', 'master', 'phd']).optional(),
    spouseLanguageTest: z.object({
        speaking: z.number().min(0).max(10),
        listening: z.number().min(0).max(10),
        reading: z.number().min(0).max(10),
        writing: z.number().min(0).max(10),
    }).optional(),
    spouseCanadianWorkExperience: z.number().min(0).max(10).optional(),
    foreignWorkExperience: z.number().min(0).max(20),
    hasCertificateOfQualification: z.boolean(),
    hasCanadianSiblings: z.boolean(),
    hasFrenchLanguageSkills: z.boolean(),
    hasProvincialNomination: z.boolean(),
    hasValidJobOffer: z.boolean(),
    jobOfferNOC: z.enum(['00', '0', 'A', 'B', 'none']),
    hasCanadianEducation: z.boolean(),
    canadianEducationLevel: z.enum(['one_two_year', 'three_year_plus', 'master_phd']).optional(),
    saveAssessment: z.boolean().optional(),
})

export type CalculateCrsInput = z.infer<typeof CalculateCrsSchema>

/**
 * Calculate CRS score
 */
export async function calculateCrsScore(input: CalculateCrsInput) {
    const user = await getAuthenticatedUser()
    const validated = CalculateCrsSchema.parse(input)

    // Check usage limits
    const subscriptionStatus = await getSubscriptionStatus(user.id)
    const usageCheck = await checkUsageLimit(
        user.id,
        subscriptionStatus?.tier || 'free',
        'crs'
    )

    if (!usageCheck.allowed) {
        throw new ActionError(
            "You've used all your CRS calculations. Upgrade to Essential ($29/month) for unlimited calculations.",
            'USAGE_LIMIT'
        )
    }

    const { saveAssessment, ...crsInput } = validated

    // Calculate CRS score
    const result = calculateCRS(crsInput as CrsInput)

    // Track usage
    await incrementUsage(user.id, 'crs')

    // Save assessment if requested
    if (saveAssessment) {
        await createCrsAssessment({
            userId: user.id,
            totalScore: result.totalScore,
            coreScore: result.breakdown.coreHumanCapital,
            spouseScore: result.breakdown.spouseFactors,
            skillTransferabilityScore: result.breakdown.skillTransferability,
            additionalScore: result.breakdown.additionalPoints,
            recommendations: result.recommendations,
            age: crsInput.age,
            educationLevel: crsInput.educationLevel,
            firstLanguageScore: crsInput.firstLanguageTest,
            secondLanguageScore: crsInput.secondLanguageTest,
            canadianWorkExperience: crsInput.canadianWorkExperience,
            foreignWorkExperience: crsInput.foreignWorkExperience,
            hasSpouse: crsInput.hasSpouse,
            spouseEducation: crsInput.spouseEducation,
            spouseLanguageScore: crsInput.spouseLanguageTest,
            spouseCanadianWorkExperience: crsInput.spouseCanadianWorkExperience,
            hasSiblingInCanada: crsInput.hasCanadianSiblings,
            hasFrenchLanguageSkills: crsInput.hasFrenchLanguageSkills,
            hasProvincialNomination: crsInput.hasProvincialNomination,
            hasJobOffer: crsInput.hasValidJobOffer,
            hasCanadianStudyExperience: crsInput.hasCanadianEducation,
        })

        revalidatePath('/calculator')
        revalidatePath('/dashboard')
    }

    return result
}

/**
 * Get user's CRS assessment history
 */
export async function getCrsHistory() {
    const user = await getAuthenticatedUser()
    return getUserCrsAssessments(user.id)
}

/**
 * Get latest CRS assessment
 */
export async function getLatestCrs() {
    const user = await getAuthenticatedUser()
    return getLatestCrsAssessment(user.id)
}
