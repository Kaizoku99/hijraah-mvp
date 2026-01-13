'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser } from './auth'
import { ActionError } from '@/lib/action-client'
import {
    createConversation,
    getUserConversations,
    getConversation,
    updateConversationTitle,
    deleteConversation as dbDeleteConversation,
    createMessage,
    getConversationMessages,
} from '@/../server/db'
import { getSubscriptionStatus } from '@/../server/stripe'
import { checkUsageLimit, incrementUsage } from '@/../server/usage'
import { generateChatResponse, GeminiMessage } from '@/../server/_core/gemini'
import { ragQuery, buildRagContext } from '@/../server/rag'

// Schemas
const CreateConversationSchema = z.object({
    title: z.string().optional(),
    language: z.enum(['ar', 'en']).default('ar'),
})

const SendMessageSchema = z.object({
    conversationId: z.number(),
    content: z.string(),
})

const ConversationIdSchema = z.object({
    conversationId: z.number(),
})

export type CreateConversationInput = z.infer<typeof CreateConversationSchema>
export type SendMessageInput = z.infer<typeof SendMessageSchema>

/**
 * List all conversations for the current user
 */
export async function listConversations() {
    const user = await getAuthenticatedUser()
    return getUserConversations(user.id)
}

/**
 * Get a specific conversation with messages
 */
export async function getConversationWithMessages(input: z.infer<typeof ConversationIdSchema>) {
    const user = await getAuthenticatedUser()
    const validated = ConversationIdSchema.parse(input)

    const conversation = await getConversation(validated.conversationId)

    if (!conversation) {
        throw new ActionError('Conversation not found', 'NOT_FOUND')
    }

    if (conversation.userId !== user.id) {
        throw new ActionError('Access denied', 'FORBIDDEN')
    }

    const messages = await getConversationMessages(validated.conversationId)

    return {
        conversation,
        messages,
    }
}

/**
 * Create a new conversation
 */
export async function createNewConversation(input: CreateConversationInput) {
    const user = await getAuthenticatedUser()
    const validated = CreateConversationSchema.parse(input)

    const conversationId = await createConversation({
        userId: user.id,
        title: validated.title,
        language: validated.language,
    })

    revalidatePath('/chat')

    return { conversationId }
}

/**
 * Send a message and get AI response
 */
export async function sendMessage(input: SendMessageInput) {
    const user = await getAuthenticatedUser()
    const validated = SendMessageSchema.parse(input)

    // Check usage limits
    const subscriptionStatus = await getSubscriptionStatus(user.id)
    const usageCheck = await checkUsageLimit(
        user.id,
        subscriptionStatus?.tier || 'free',
        'chat'
    )

    if (!usageCheck.allowed) {
        throw new ActionError(
            "You've reached your monthly chat limit. Upgrade to Essential ($29/month) for unlimited messages.",
            'USAGE_LIMIT'
        )
    }

    // Verify conversation belongs to user
    const conversation = await getConversation(validated.conversationId)
    if (!conversation) {
        throw new ActionError('Conversation not found', 'NOT_FOUND')
    }
    if (conversation.userId !== user.id) {
        throw new ActionError('Access denied', 'FORBIDDEN')
    }

    // Save user message
    await createMessage({
        conversationId: validated.conversationId,
        role: 'user',
        content: validated.content,
    })

    // Get conversation history
    const history = await getConversationMessages(validated.conversationId)

    // Fetch RAG context
    let ragContext = ''
    try {
        const ragResults = await ragQuery(validated.content, {
            chunkLimit: 3,
            entityLimit: 3,
            language: conversation.language || 'en',
            includeRelatedEntities: false,
        })
        ragContext = buildRagContext(
            { chunks: ragResults.chunks, entities: ragResults.entities },
            (conversation.language as 'en' | 'ar') || 'en'
        )
    } catch (error) {
        console.error('RAG query failed, continuing without context:', error)
    }

    // Convert to Gemini format
    const geminiMessages: GeminiMessage[] = history
        .filter((msg) => msg.role !== 'system')
        .map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
            id: msg.id.toString(),
        }))

    // System instruction
    const baseSystemInstruction = conversation.language === 'ar'
        ? `أنت "هجرة" - مساعد ذكي متخصص في الهجرة إلى كندا. أجب باللغة العربية.`
        : `You are "Hijraah" - a specialized AI immigration assistant helping people immigrate to Canada.`

    const systemInstruction = ragContext
        ? `${baseSystemInstruction}\n\n${ragContext}`
        : baseSystemInstruction

    // Generate AI response
    const aiResponse = await generateChatResponse({
        messages: geminiMessages,
        systemInstruction,
        temperature: 0.7,
    })

    // Save AI response
    await createMessage({
        conversationId: validated.conversationId,
        role: 'assistant',
        content: aiResponse,
    })

    // Track usage
    await incrementUsage(user.id, 'chat')

    // Update conversation timestamp
    await updateConversationTitle(
        validated.conversationId,
        conversation.title || validated.content.substring(0, 50)
    )

    revalidatePath('/chat')

    return { content: aiResponse }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(input: z.infer<typeof ConversationIdSchema>) {
    const user = await getAuthenticatedUser()
    const validated = ConversationIdSchema.parse(input)

    const conversation = await getConversation(validated.conversationId)
    if (!conversation) {
        throw new ActionError('Conversation not found', 'NOT_FOUND')
    }
    if (conversation.userId !== user.id) {
        throw new ActionError('Access denied', 'FORBIDDEN')
    }

    await dbDeleteConversation(validated.conversationId)

    revalidatePath('/chat')

    return { success: true as const }
}
