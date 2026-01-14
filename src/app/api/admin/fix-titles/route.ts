/**
 * Admin API Route: Fix Chat Titles
 * One-time batch update to generate AI titles for all "New Chat" conversations
 */

import { getDb } from '@/../server/db';
import { conversations, messages } from '@/../drizzle/schema';
import { generateChatTitle } from '@/../server/_core/gemini';
import { eq, or, isNull, asc } from 'drizzle-orm';

export const maxDuration = 120; // Allow up to 2 minutes for batch processing

export async function GET() {
    try {
        const db = await getDb();
        if (!db) {
            return Response.json({ error: 'Database not available' }, { status: 500 });
        }

        // Find all conversations with default/empty/bad titles
        // We use sql to include LIKE patterns and length checks
        const { sql, like } = await import('drizzle-orm');

        const conversationsToFix = await db
            .select()
            .from(conversations)
            .where(
                or(
                    eq(conversations.title, 'New Chat'),
                    eq(conversations.title, 'New Conversation'),
                    eq(conversations.title, 'محادثة جديدة'),
                    isNull(conversations.title),
                    like(conversations.title, 'New %'),
                    // Catch very short titles (likely bad/truncated generations)
                    sql`LENGTH(${conversations.title}) < 15`,
                    // Common truncated patterns
                    eq(conversations.title, 'Tired'),
                    eq(conversations.title, 'Calculate My'),
                    like(conversations.title, 'Should I%')
                )
            );

        const results = {
            total: conversationsToFix.length,
            updated: 0,
            failed: 0,
            skipped: 0,
            details: [] as { id: number; oldTitle: string | null; newTitle?: string; error?: string }[],
        };

        // Process each conversation
        for (const conv of conversationsToFix) {
            try {
                // Get the first user message for this conversation
                const firstMessage = await db
                    .select()
                    .from(messages)
                    .where(eq(messages.conversationId, conv.id))
                    .orderBy(asc(messages.createdAt))
                    .limit(1);

                const userMessage = firstMessage.find(m => m.role === 'user');

                if (!userMessage || !userMessage.content) {
                    results.skipped++;
                    results.details.push({
                        id: conv.id,
                        oldTitle: conv.title,
                        error: 'No user message found',
                    });
                    continue;
                }

                // Generate a new title using AI
                const newTitle = await generateChatTitle(
                    userMessage.content,
                    (conv.language as 'ar' | 'en') || 'en'
                );

                // Update the conversation title
                await db
                    .update(conversations)
                    .set({ title: newTitle, updatedAt: new Date() })
                    .where(eq(conversations.id, conv.id));

                results.updated++;
                results.details.push({
                    id: conv.id,
                    oldTitle: conv.title,
                    newTitle,
                });
            } catch (err) {
                results.failed++;
                results.details.push({
                    id: conv.id,
                    oldTitle: conv.title,
                    error: err instanceof Error ? err.message : 'Unknown error',
                });
            }
        }

        return Response.json({
            success: true,
            message: `Processed ${results.total} conversations`,
            results,
        });
    } catch (error) {
        console.error('Fix titles error:', error);
        return Response.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
