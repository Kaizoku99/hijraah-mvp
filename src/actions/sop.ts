'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser } from './auth'
import { ActionError } from '@/lib/action-client'
import {
    createSopGeneration,
    getUserSopGenerations,
    getSopGeneration,
    updateSopGeneration,
    deleteSopGeneration as dbDeleteSop,
} from '@/../server/sop'
import { analyzeSopQuality } from '@/../server/sop-quality'
import { generateChatResponse } from '@/../server/_core/gemini'
import { getSubscriptionStatus } from '@/../server/stripe'
import { checkUsageLimit, incrementUsage } from '@/../server/usage'

// Schemas
const GenerateSopSchema = z.object({
    targetProgram: z.string(),
    targetInstitution: z.string().optional(),
    background: z.string(),
    education: z.string(),
    workExperience: z.string(),
    motivation: z.string(),
    careerGoals: z.string(),
    whyCanada: z.string(),
    whyThisProgram: z.string(),
    uniqueStrengths: z.string(),
    challenges: z.string().optional(),
    additionalInfo: z.string().optional(),
    language: z.enum(['en', 'ar']),
})

const SopIdSchema = z.object({
    sopId: z.number(),
})

const RefineSopSchema = z.object({
    sopId: z.number(),
    feedback: z.string(),
    focusAreas: z.array(z.string()).optional(),
})

export type GenerateSopInput = z.infer<typeof GenerateSopSchema>
export type RefineSopInput = z.infer<typeof RefineSopSchema>

/**
 * Generate SOP based on questionnaire
 */
export async function generateSop(input: GenerateSopInput) {
    const user = await getAuthenticatedUser()
    const validated = GenerateSopSchema.parse(input)

    // Check usage limits
    const subscriptionStatus = await getSubscriptionStatus(user.id)
    const usageCheck = await checkUsageLimit(
        user.id,
        subscriptionStatus?.tier || 'free',
        'sop'
    )

    if (!usageCheck.allowed) {
        throw new ActionError(
            "SOP generation requires Premium ($59/month) or higher. Upgrade to unlock AI-powered Statement of Purpose writing.",
            'USAGE_LIMIT'
        )
    }

    const { language, ...questionnaireData } = validated

    // Generate SOP using Gemini
    const prompt = `You are an expert immigration consultant. Generate a professional Statement of Purpose (SOP) for a Canada immigration/study application based on:

Target Program: ${validated.targetProgram}
${validated.targetInstitution ? `Target Institution: ${validated.targetInstitution}` : ''}

Background: ${validated.background}
Education: ${validated.education}
Work Experience: ${validated.workExperience}
Motivation: ${validated.motivation}
Career Goals: ${validated.careerGoals}
Why Canada: ${validated.whyCanada}
Why This Program: ${validated.whyThisProgram}
Unique Strengths: ${validated.uniqueStrengths}
${validated.challenges ? `Challenges: ${validated.challenges}` : ''}
${validated.additionalInfo ? `Additional Info: ${validated.additionalInfo}` : ''}

Generate a well-structured, professional SOP (800-1000 words).
${language === 'ar' ? 'Generate in Arabic.' : 'Generate in English.'}`

    const response = await generateChatResponse({
        messages: [{ role: 'user', parts: prompt }],
        systemInstruction: 'You are an expert immigration consultant who writes compelling Statements of Purpose.',
        maxOutputTokens: 4096,
    })

    // Save to database
    const sopId = await createSopGeneration({
        userId: user.id,
        background: validated.background,
        education: validated.education,
        workExperience: validated.workExperience,
        motivations: validated.motivation,
        goals: validated.careerGoals,
        whyCanada: validated.whyCanada,
        additionalInfo: validated.additionalInfo,
        generatedSop: response,
        language,
        version: 1,
        status: 'generated',
    })

    // Track usage
    await incrementUsage(user.id, 'sop')

    revalidatePath('/sop')

    return { sopId, content: response }
}

/**
 * Get SOP by ID
 */
export async function getSop(input: z.infer<typeof SopIdSchema>) {
    const user = await getAuthenticatedUser()
    const validated = SopIdSchema.parse(input)

    const sop = await getSopGeneration(validated.sopId)

    if (!sop || sop.userId !== user.id) {
        throw new ActionError('SOP not found', 'NOT_FOUND')
    }

    return {
        ...sop,
        content: sop.generatedSop,
    }
}

/**
 * List user's SOPs
 */
export async function listSops() {
    const user = await getAuthenticatedUser()
    const sops = await getUserSopGenerations(user.id)

    return sops.map((sop) => ({
        ...sop,
        content: sop.generatedSop,
    }))
}

/**
 * Refine/improve existing SOP
 */
export async function refineSop(input: RefineSopInput) {
    const user = await getAuthenticatedUser()
    const validated = RefineSopSchema.parse(input)

    const sop = await getSopGeneration(validated.sopId)

    if (!sop || sop.userId !== user.id) {
        throw new ActionError('SOP not found', 'NOT_FOUND')
    }

    const prompt = `Improve this Statement of Purpose:

${sop.generatedSop}

User Feedback: ${validated.feedback}
${validated.focusAreas?.length ? `Focus areas: ${validated.focusAreas.join(', ')}` : ''}

Refine and improve based on the feedback. Maintain structure and key information.`

    const response = await generateChatResponse({
        messages: [{ role: 'user', parts: prompt }],
        systemInstruction: 'You are an expert immigration consultant who refines Statements of Purpose.',
        maxOutputTokens: 4096,
    })

    const newVersion = (sop.version || 1) + 1

    await updateSopGeneration(validated.sopId, {
        generatedSop: response,
        version: newVersion,
        status: 'revised',
    })

    revalidatePath('/sop')

    return { content: response, version: newVersion }
}

/**
 * Analyze SOP quality
 */
export async function analyzeSopQualityAction(input: z.infer<typeof SopIdSchema>) {
    const user = await getAuthenticatedUser()
    const validated = SopIdSchema.parse(input)

    const sop = await getSopGeneration(validated.sopId)

    if (!sop || sop.userId !== user.id) {
        throw new ActionError('SOP not found', 'NOT_FOUND')
    }

    const qualityScore = await analyzeSopQuality(sop.generatedSop || '')
    return qualityScore
}

/**
 * Delete SOP
 */
export async function deleteSop(input: z.infer<typeof SopIdSchema>) {
    const user = await getAuthenticatedUser()
    const validated = SopIdSchema.parse(input)

    const sop = await getSopGeneration(validated.sopId)

    if (!sop || sop.userId !== user.id) {
        throw new ActionError('SOP not found', 'NOT_FOUND')
    }

    await dbDeleteSop(validated.sopId)

    revalidatePath('/sop')

    return { success: true as const }
}
