'use server'

import { z } from 'zod'
import { processDocumentOcrBase64, translateText, OcrResult, TranslationResult } from '@/../server/ocr'
import { getAuthenticatedUser } from './auth'
import { ActionError } from '@/lib/action-client'
import { checkUsageLimit, incrementUsage } from '@/../server/usage'
import { getSubscriptionStatus } from '@/../server/stripe'
import { classifyDocument, findMatchingChecklistItem, DocumentClassification } from '@/../server/documentClassifier'
import { markChecklistItemVerified, getUserDocumentChecklists } from '@/../server/documents'

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
    console.log('[OCR Action] Starting processOcrBase64');
    const user = await getAuthenticatedUser()
    console.log(`[OCR Action] User authenticated: ${user.id} (${user.email})`);

    const validated = ProcessBase64Schema.parse(input)
    console.log(`[OCR Action] Input validated. Data size: ${validated.base64Data.length} chars, Mime: ${validated.mimeType}`);

    // Check usage limits
    const subscriptionStatus = await getSubscriptionStatus(user.id)
    const usageCheck = await checkUsageLimit(
        user.id,
        subscriptionStatus?.tier || 'free',
        'document'
    )
    console.log(`[OCR Action] Usage check result: allowed=${usageCheck.allowed}, limit=${usageCheck.limit}, remaining=${usageCheck.remaining}`);

    if (!usageCheck.allowed) {
        console.error(`[OCR Action] Usage limit reached for user ${user.id}`);
        throw new ActionError(
            "You've reached your monthly document scanning limit. Upgrade to Essential ($29/month) for unlimited scans.",
            'USAGE_LIMIT'
        )
    }

    try {
        console.log('[OCR Action] Calling processDocumentOcrBase64...');
        const result = await processDocumentOcrBase64(validated.base64Data, validated.mimeType)
        console.log('[OCR Action] processDocumentOcrBase64 successful');

        // Track usage
        await incrementUsage(user.id, 'document')
        console.log(`[OCR Action] Usage incremented for user ${user.id}`);

        // Classify document and auto-update checklist
        let classification: DocumentClassification | null = null;
        try {
            console.log('[OCR Action] Classifying document...');

            // Get user's name for identity verification
            const { getUserById } = await import('@/../server/db');
            const dbUser = await getUserById(user.id);
            const userProfileName = dbUser?.name || null;
            console.log(`[OCR Action] User profile name: ${userProfileName || '(not set)'}`);

            // Get user's checklist items
            const checklists = await getUserDocumentChecklists(user.id);
            const checklistItemIds = checklists.flatMap((c) =>
                (c.items as any[]).map((item) => item.id)
            );

            classification = await classifyDocument(result.extractedText, checklistItemIds, userProfileName);
            console.log(`[OCR Action] Classification result: type=${classification.documentType}, confidence=${classification.confidence}, valid=${classification.validationResult.isValid}, nameMatch=${classification.identityVerification.nameMatches}`);

            // If valid, update checklist
            if (classification.validationResult.isValid && classification.confidence > 0.7) {
                const matchingItem = findMatchingChecklistItem(classification.documentType, checklistItemIds);
                if (matchingItem) {
                    await markChecklistItemVerified(user.id, matchingItem);
                    console.log(`[OCR Action] Checklist item '${matchingItem}' marked as verified`);
                }
            }
        } catch (classifyError) {
            console.error('[OCR Action] Classification error (non-fatal):', classifyError);
            // Don't fail the whole request if classification fails
        }

        return {
            ...result,
            classification,
        }
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
