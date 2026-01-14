import { DrizzleProvider } from '@ai-sdk-tools/memory/drizzle'
import { getDb } from '../../server/db'
import { workingMemory, memoryMessages } from '../../drizzle/schema'

// Singleton instance
let memoryProvider: DrizzleProvider<typeof workingMemory, typeof memoryMessages> | null = null

/**
 * Get the memory provider for AI SDK memory integration.
 * Uses DrizzleProvider with Supabase PostgreSQL backend.
 */
export async function getMemoryProvider() {
    if (!memoryProvider) {
        const db = await getDb()
        if (!db) {
            throw new Error('Database connection not available')
        }
        memoryProvider = new DrizzleProvider(db, {
            workingMemoryTable: workingMemory,
            messagesTable: memoryMessages,
        })
    }
    return memoryProvider
}

/**
 * Memory configuration for use with AI SDK agents.
 * Enables working memory (user-scoped) and conversation history.
 */
export async function getMemoryConfig(userId: string) {
    return {
        provider: await getMemoryProvider(),
        workingMemory: {
            enabled: true,
            scope: 'user' as const, // User-level memory persists across conversations
        },
        history: {
            enabled: true,
            limit: 20, // Keep last 20 messages for context
        },
    }
}

/**
 * Helper to add memory context to a streaming response.
 * For use in chat routes without the Agent abstraction.
 */
export async function addMemoryToChat(
    userId: string,
    chatId: string,
    messages: { role: string; content: string }[]
) {
    const provider = await getMemoryProvider()

    // Store messages in memory
    for (const msg of messages) {
        await provider.saveMessage({
            chatId,
            userId,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            timestamp: new Date(),
        })
    }
}

/**
 * Get working memory content for a user.
 */
export async function getWorkingMemory(userId: string): Promise<string | null> {
    const provider = await getMemoryProvider()
    const result = await provider.getWorkingMemory({ scope: 'user', userId })
    return result?.content || null
}

/**
 * Update working memory for a user.
 */
export async function updateWorkingMemory(userId: string, content: string): Promise<void> {
    const provider = await getMemoryProvider()
    await provider.updateWorkingMemory({ scope: 'user', userId, content })
}

/**
 * Get conversation history for a chat.
 */
export async function getConversationHistory(chatId: string, limit: number = 20) {
    const provider = await getMemoryProvider()
    return await provider.getMessages({ chatId, limit })
}
