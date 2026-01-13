'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser } from './auth'
import { ActionError } from '@/lib/action-client'
import {
    createDocumentChecklist,
    getUserDocumentChecklists,
    getDocumentChecklist,
    updateDocumentChecklist,
    deleteDocumentChecklist as dbDeleteChecklist,
    createDocument,
    getUserDocuments,
    getChecklistDocuments,
    getDocument,
    deleteDocument as dbDeleteDocument,
    generateDocumentChecklist as generateChecklist,
} from '@/../server/documents'
import { storagePut } from '@/../server/storage'
import { nanoid } from 'nanoid'
import { getSubscriptionStatus } from '@/../server/stripe'
import { checkUsageLimit, incrementUsage } from '@/../server/usage'

// Schemas
const GenerateChecklistSchema = z.object({
    sourceCountry: z.enum(['tunisia', 'jordan', 'lebanon', 'morocco', 'egypt', 'sudan', 'syria']),
    immigrationPathway: z.enum(['express_entry', 'study_permit', 'work_permit', 'family_sponsorship']),
})

const ChecklistIdSchema = z.object({
    checklistId: z.number(),
})

const UpdateChecklistSchema = z.object({
    checklistId: z.number(),
    items: z.any(), // ChecklistItem[]
})

const UploadDocumentSchema = z.object({
    checklistId: z.number().optional(),
    documentType: z.string(),
    fileName: z.string(),
    fileData: z.string(), // base64 encoded
    mimeType: z.string(),
})

const DocumentIdSchema = z.object({
    documentId: z.number(),
})

export type GenerateChecklistInput = z.infer<typeof GenerateChecklistSchema>
export type UploadDocumentInput = z.infer<typeof UploadDocumentSchema>

/**
 * Generate a document checklist
 */
export async function generateDocumentChecklist(input: GenerateChecklistInput) {
    const user = await getAuthenticatedUser()
    const validated = GenerateChecklistSchema.parse(input)

    // Check usage limits
    const subscriptionStatus = await getSubscriptionStatus(user.id)
    const usageCheck = await checkUsageLimit(
        user.id,
        subscriptionStatus?.tier || 'free',
        'document'
    )

    if (!usageCheck.allowed) {
        throw new ActionError(
            "You've used your free document checklist. Upgrade to Essential ($29/month) for unlimited checklists.",
            'USAGE_LIMIT'
        )
    }

    const items = generateChecklist(validated.sourceCountry, validated.immigrationPathway)

    const checklistId = await createDocumentChecklist({
        userId: user.id,
        sourceCountry: validated.sourceCountry,
        immigrationPathway: validated.immigrationPathway,
        items: items,
    })

    // Track usage
    await incrementUsage(user.id, 'document')

    revalidatePath('/documents')
    revalidatePath('/dashboard')

    return { checklistId, items }
}

/**
 * Get all checklists for the current user
 */
export async function getChecklists() {
    const user = await getAuthenticatedUser()
    return getUserDocumentChecklists(user.id)
}

/**
 * Get a specific checklist
 */
export async function getChecklist(input: z.infer<typeof ChecklistIdSchema>) {
    const user = await getAuthenticatedUser()
    const validated = ChecklistIdSchema.parse(input)

    const checklist = await getDocumentChecklist(validated.checklistId)

    if (!checklist || checklist.userId !== user.id) {
        throw new ActionError('Checklist not found', 'NOT_FOUND')
    }

    return checklist
}

/**
 * Update checklist items
 */
export async function updateChecklistItems(input: z.infer<typeof UpdateChecklistSchema>) {
    const user = await getAuthenticatedUser()
    const validated = UpdateChecklistSchema.parse(input)

    const checklist = await getDocumentChecklist(validated.checklistId)

    if (!checklist || checklist.userId !== user.id) {
        throw new ActionError('Checklist not found', 'NOT_FOUND')
    }

    await updateDocumentChecklist(validated.checklistId, { items: validated.items })

    revalidatePath('/documents')

    return { success: true as const }
}

/**
 * Delete a checklist
 */
export async function deleteChecklist(input: z.infer<typeof ChecklistIdSchema>) {
    const user = await getAuthenticatedUser()
    const validated = ChecklistIdSchema.parse(input)

    const checklist = await getDocumentChecklist(validated.checklistId)

    if (!checklist || checklist.userId !== user.id) {
        throw new ActionError('Checklist not found', 'NOT_FOUND')
    }

    await dbDeleteChecklist(validated.checklistId)

    revalidatePath('/documents')
    revalidatePath('/dashboard')

    return { success: true as const }
}

/**
 * Upload a document
 */
export async function uploadDocument(input: UploadDocumentInput) {
    const user = await getAuthenticatedUser()
    const validated = UploadDocumentSchema.parse(input)

    // Decode base64 file data
    const fileBuffer = Buffer.from(validated.fileData, 'base64')
    const fileSize = fileBuffer.length

    // Generate unique file key
    const fileExtension = validated.fileName.split('.').pop()
    const fileKey = `${user.id}/documents/${validated.documentType}-${nanoid()}.${fileExtension}`

    // Upload to S3
    const { url } = await storagePut(fileKey, fileBuffer, validated.mimeType)

    // Save document record
    const documentId = await createDocument({
        userId: user.id,
        checklistId: validated.checklistId,
        documentType: validated.documentType,
        fileName: validated.fileName,
        fileKey,
        fileUrl: url,
        mimeType: validated.mimeType,
        fileSize,
        status: 'uploaded',
    })

    revalidatePath('/documents')

    return { documentId, fileUrl: url }
}

/**
 * Get all documents for the current user
 */
export async function getDocuments() {
    const user = await getAuthenticatedUser()
    return getUserDocuments(user.id)
}

/**
 * Get documents for a specific checklist
 */
export async function getDocumentsForChecklist(input: z.infer<typeof ChecklistIdSchema>) {
    const validated = ChecklistIdSchema.parse(input)
    return getChecklistDocuments(validated.checklistId)
}

/**
 * Delete a document
 */
export async function deleteDocument(input: z.infer<typeof DocumentIdSchema>) {
    const user = await getAuthenticatedUser()
    const validated = DocumentIdSchema.parse(input)

    const document = await getDocument(validated.documentId)

    if (!document || document.userId !== user.id) {
        throw new ActionError('Document not found', 'NOT_FOUND')
    }

    await dbDeleteDocument(validated.documentId)

    revalidatePath('/documents')

    return { success: true as const }
}
