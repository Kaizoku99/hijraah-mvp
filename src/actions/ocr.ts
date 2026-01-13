'use server'

import { z } from 'zod'
import { processDocumentOcrBase64, translateText, OcrResult, TranslationResult } from '@/../server/ocr'
import { getAuthenticatedUser } from './auth'
import { ActionError } from '@/lib/action-client'
import { checkUsageLimit, incrementUsage } from '@/../server/usage'
import { getSubscriptionStatus } from '@/../server/stripe'

// Schemas
const ProcessBase64Schema = z.object({
    base64Data: z.string(),
    mimeType: z.string(),
})

const TranslateSchema = z.object({
    text: z.string(),
    sourceLanguage: z.string().default('ar'),
    targetLanguage: z.string().default('en'),
})

export async function processOcrBase64(input: z.infer<typeof ProcessBase64Schema>) {
    const user = await getAuthenticatedUser()
    const validated = ProcessBase64Schema.parse(input)

    // Check usage limits
    const subscriptionStatus = await getSubscriptionStatus(user.id)
    const usageCheck = await checkUsageLimit(
        user.id,
        subscriptionStatus?.tier || 'free',
        'document'
    )

    if (!usageCheck.allowed) {
        throw new ActionError(
            "You've reached your monthly document scanning limit. Upgrade to Essential ($29/month) for unlimited scans.",
            'USAGE_LIMIT'
        )
    }

    try {
        const result = await processDocumentOcrBase64(validated.base64Data, validated.mimeType)

        // Track usage
        await incrementUsage(user.id, 'document')

        return result
    } catch (error) {
        console.error('OCR Action Error:', error)
        throw new ActionError('Failed to process document', 'INTERNAL_SERVER_ERROR')
    }
}

export async function translateAction(input: z.infer<typeof TranslateSchema>) {
    const user = await getAuthenticatedUser()
    const validated = TranslateSchema.parse(input)

    // Check usage limits (optional, but good practice if we want to limit translations)
    // For now assuming translation is part of the OCR feature usage or free

    try {
        const result = await translateText(
            validated.text,
            validated.sourceLanguage,
            validated.targetLanguage
        )
        return result
    } catch (error) {
        console.error('Translation Action Error:', error)
        throw new ActionError('Failed to translate text', 'INTERNAL_SERVER_ERROR')
    }
}
