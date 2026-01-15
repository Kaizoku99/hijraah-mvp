'use server'

import { z } from 'zod'
import { revalidatePath, unstable_cache } from 'next/cache'
import { getAuthenticatedUser } from './auth'
import { ActionError } from '@/lib/action-client'
import { CACHE_TAGS, CACHE_DURATIONS, invalidateUserCrs } from '@/lib/cache' // Reusing CRS invalidation or need new tag? For now reusing logic pattern.
import {
    createAustraliaAssessment,
    getUserAustraliaAssessments,
    getLatestAustraliaAssessment,
} from '@/../server/db'
import { getSubscriptionStatus } from '@/../server/stripe'
import { checkUsageLimit, incrementUsage } from '@/../server/usage'

// Schema
const CalculateAustraliaPointsSchema = z.object({
    age: z.number().min(18).max(50), // 45+ gives 0 points but can be inputted
    englishLevel: z.enum(['competent', 'proficient', 'superior']),
    overseasExperience: z.enum(['less_than_3', '3_to_5', '5_to_8', '8_plus']),
    australianExperience: z.enum(['less_than_1', '1_to_3', '3_to_5', '5_to_8', '8_plus']),
    educationLevel: z.enum(['diploma', 'bachelor', 'master', 'phd', 'recognized_qualification', 'other']),
    specialistEducation: z.boolean(),
    australianStudy: z.boolean(),
    professionalYear: z.boolean(),
    credentialledCommunityLanguage: z.boolean(),
    regionalStudy: z.boolean(),
    partnerSkills: z.enum(['single', 'partner_skilled', 'partner_english', 'partner_pr', 'partner_no_points']),
    nomination: z.enum(['none', 'state_190', 'regional_491']),
    saveAssessment: z.boolean().optional(),
})

export type CalculateAustraliaPointsInput = z.infer<typeof CalculateAustraliaPointsSchema>

export interface AustraliaPointsResult {
    totalScore: number
    breakdown: {
        age: number
        english: number
        experience: number
        education: number
        specialistEducation: number
        australianStudy: number
        professionalYear: number
        communityLanguage: number
        regionalStudy: number
        partner: number
        nomination: number
    }
}

/**
 * Calculate Australia Points Score
 */
export async function calculateAustraliaPoints(input: CalculateAustraliaPointsInput) {
    const user = await getAuthenticatedUser()
    const validated = CalculateAustraliaPointsSchema.parse(input)

    // Check usage limits (grouping with CRS for now or separate? Let's use CRS limit key or 'assessment')
    // Reusing 'crs' key for simplicity as it's an assessment tool
    const subscriptionStatus = await getSubscriptionStatus(user.id)
    const usageCheck = await checkUsageLimit(
        user.id,
        subscriptionStatus?.tier || 'free',
        'crs'
    )

    if (!usageCheck.allowed) {
        throw new ActionError(
            "You've used all your assessment calculations. Upgrade to Essential ($29/month) for unlimited assessments.",
            'USAGE_LIMIT'
        )
    }

    const { saveAssessment, ...data } = validated

    // Calculation Logic
    let breakdown = {
        age: 0,
        english: 0,
        experience: 0,
        education: 0,
        specialistEducation: 0,
        australianStudy: 0,
        professionalYear: 0,
        communityLanguage: 0,
        regionalStudy: 0,
        partner: 0,
        nomination: 0,
    }

    // 1. Age
    if (data.age >= 18 && data.age <= 24) breakdown.age = 25
    else if (data.age >= 25 && data.age <= 32) breakdown.age = 30
    else if (data.age >= 33 && data.age <= 39) breakdown.age = 25
    else if (data.age >= 40 && data.age < 45) breakdown.age = 15
    // 45+ is 0

    // 2. English
    if (data.englishLevel === 'proficient') breakdown.english = 10
    else if (data.englishLevel === 'superior') breakdown.english = 20

    // 3. Experience
    // Overseas
    let overseasPoints = 0
    if (data.overseasExperience === '3_to_5') overseasPoints = 5
    else if (data.overseasExperience === '5_to_8') overseasPoints = 10
    else if (data.overseasExperience === '8_plus') overseasPoints = 15

    // Australian
    let australianPoints = 0
    if (data.australianExperience === '1_to_3') australianPoints = 5
    else if (data.australianExperience === '3_to_5') australianPoints = 10
    else if (data.australianExperience === '5_to_8') australianPoints = 15
    else if (data.australianExperience === '8_plus') australianPoints = 20

    // Combined Cap is 20
    breakdown.experience = Math.min(overseasPoints + australianPoints, 20)

    // 4. Education
    if (data.educationLevel === 'phd') breakdown.education = 20
    else if (data.educationLevel === 'bachelor' || data.educationLevel === 'master') breakdown.education = 15
    else if (data.educationLevel === 'diploma' || data.educationLevel === 'recognized_qualification') breakdown.education = 10

    // 5. Specialist Education
    if (data.specialistEducation) breakdown.specialistEducation = 10

    // 6. Australian Study
    if (data.australianStudy) breakdown.australianStudy = 5

    // 7. Professional Year
    if (data.professionalYear) breakdown.professionalYear = 5

    // 8. Community Language
    if (data.credentialledCommunityLanguage) breakdown.communityLanguage = 5

    // 9. Regional Study
    if (data.regionalStudy) breakdown.regionalStudy = 5

    // 10. Partner Skills
    if (data.partnerSkills === 'single' || data.partnerSkills === 'partner_skilled' || data.partnerSkills === 'partner_pr') {
        breakdown.partner = 10
    } else if (data.partnerSkills === 'partner_english') {
        breakdown.partner = 5
    }
    // 'partner_no_points' results in 0
    // Logic check: "Single (No partner) | 10". If user has NO partner, they select 'none'? 
    // Usually form asks "Do you have a partner?". If no, 10 points. If yes, then partner skills apply.
    // Ideally the input should clarify single vs partner with no skills.
    // Let's assume the frontend handles this mapping. 
    // If partnerSkills enum allows 'none' that implies single OR partner with no points.
    // Single = 10. Partner with nothing = 0.
    // I should fix the schema to separate marital status or clarify the enum.
    // Let's assume passed 'none' means "Single or Partner with max points" -> BAD ASSUMPTION.
    // CORRECTION: SkillSelect gives 10 points for being SINGLE.
    // If married, 10 points if partner has skills + english. 5 if english only. 0 otherwise.
    // Let's UPDATE SCHEMA to have `isSingle` or mapped correctly.
    // Let's stick to the Plan: 
    // "Single (No partner) | 10"
    // "Partner with Competent English + Skills Assessment | 10"
    // "Partner with Competent English only | 5"
    // "Partner is Australian Citizen/PR | 10"
    // If I map "none" to "No points eligible partner" = 0.
    // I need a way to know if they are single.
    // Let's change schema to include `maritalStatus`. 
    // Or just make the enum: `single`, `partner_skilled`, `partner_english`, `partner_pr`, `partner_no_points`.

    // RE-EVALUATING ENUM:
    // partnerSkills: z.enum(['single', 'partner_skilled', 'partner_english', 'partner_pr', 'partner_no_points'])

    // Re-writing the logic block below with this new enum.

    // 11. Nomination
    if (data.nomination === 'state_190') breakdown.nomination = 5
    else if (data.nomination === 'regional_491') breakdown.nomination = 15

    const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0)

    const result: AustraliaPointsResult = {
        totalScore,
        breakdown
    }

    // Track usage
    await incrementUsage(user.id, 'crs')

    // Save assessment if requested
    if (saveAssessment) {
        await createAustraliaAssessment({
            userId: user.id,
            ageScore: breakdown.age,
            englishScore: breakdown.english,
            overseasExperienceScore: overseasPoints, // saving raw category score
            australianExperienceScore: australianPoints, // saving raw category score
            educationScore: breakdown.education,
            specialistEducationScore: breakdown.specialistEducation,
            australianStudyScore: breakdown.australianStudy,
            professionalYearScore: breakdown.professionalYear,
            communityLanguageScore: breakdown.communityLanguage,
            regionalStudyScore: breakdown.regionalStudy,
            partnerScore: breakdown.partner,
            nominationScore: breakdown.nomination,
            totalScore: result.totalScore,
            breakdown: result.breakdown,
        })

        // Invalidate caches
        revalidatePath('/calculator')
        revalidatePath('/dashboard')
    }

    return result
}

/**
 * Get user's assessment history
 */
export async function getAustraliaPointsHistory() {
    const user = await getAuthenticatedUser()
    return getUserAustraliaAssessments(user.id)
}

/**
 * Get latest assessment
 */
export async function getLatestAustraliaPoints() {
    const user = await getAuthenticatedUser()
    return getLatestAustraliaAssessment(user.id)
}
