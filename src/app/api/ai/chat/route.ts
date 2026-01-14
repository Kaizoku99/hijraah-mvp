/**
 * AI Chat API Route Handler
 * Uses Vercel AI SDK v6 with Google Gemini for streaming responses
 */

import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { after } from 'next/server';
import { google, generateChatTitle } from '@/../server/_core/gemini';
import { getAuthenticatedUser } from '@/actions/auth';
import { ragQuery, buildRagContext } from '@/../server/rag';
import { getWorkingMemory, addMemoryToChat, updateWorkingMemory } from '@/lib/memory';
import {
    createConversation,
    getConversation,
    createMessage,
    getConversationMessages,
    updateConversationTitle,
    getUserProfile,
} from '@/../server/db';
import { getSubscriptionStatus } from '@/../server/stripe';
import { checkUsageLimit, incrementUsage } from '@/../server/usage';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

import { calculateCRSTool, validateDocumentTool, generateComparisonTool } from '../tools';

export async function POST(req: Request) {
    try {
        const { messages, conversationId, language = 'en' }: {
            messages: UIMessage[];
            conversationId?: number | null;
            language?: 'ar' | 'en';
        } = await req.json();

        // Authenticate user
        const user = await getAuthenticatedUser();

        // Check usage limits
        const subscriptionStatus = await getSubscriptionStatus(user.id);
        const usageCheck = await checkUsageLimit(
            user.id,
            subscriptionStatus?.tier || 'free',
            'chat'
        );

        if (!usageCheck.allowed) {
            return new Response(
                JSON.stringify({
                    error: "You've reached your monthly chat limit. Upgrade to Essential ($29/month) for unlimited messages.",
                }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get or create conversation
        let activeConversationId = conversationId;
        if (!activeConversationId) {
            // Create a new conversation if none provided
            const lastUserMessage = messages.filter(m => m.role === 'user').pop();
            const textPart = lastUserMessage?.parts.find(p => p.type === 'text');
            const title = (textPart && 'text' in textPart ? textPart.text : '')?.substring(0, 50) || 'New Conversation';
            activeConversationId = await createConversation({
                userId: user.id,
                title,
                language,
            });
        }

        // Verify conversation belongs to user
        const conversation = await getConversation(activeConversationId);
        if (!conversation) {
            return new Response(
                JSON.stringify({ error: 'Conversation not found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }
        if (conversation.userId !== user.id) {
            return new Response(
                JSON.stringify({ error: 'Access denied' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get the last user message for RAG and memory
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        const lastTextPart = lastUserMessage?.parts.find(p => p.type === 'text');
        const userQuery = lastTextPart && 'text' in lastTextPart ? lastTextPart.text : '';

        // Save user message to database
        if (userQuery) {
            await createMessage({
                conversationId: activeConversationId,
                role: 'user',
                content: userQuery,
            });
        }

        // Fetch RAG context
        let ragContext = '';
        try {
            const ragResults = await ragQuery(userQuery, {
                chunkLimit: 3,
                entityLimit: 3,
                language: language,
                includeRelatedEntities: false,
            });
            ragContext = buildRagContext(
                { chunks: ragResults.chunks, entities: ragResults.entities },
                language
            );
        } catch (error) {
            console.error('RAG query failed, continuing without context:', error);
        }

        // Fetch Working Memory (persistent AI scratchpad)
        let memoryContext = '';
        try {
            const workingMem = await getWorkingMemory(user.id.toString());
            if (workingMem) {
                memoryContext = `\n\nUser Context & Working Memory:\n${workingMem}`;
            }
        } catch (error) {
            console.error('Working memory fetch failed:', error);
        }

        // Fetch User Profile for explicit context
        let profileContext = '';
        try {
            const userProfile = await getUserProfile(user.id);
            if (userProfile) {
                profileContext = `\n\nUser Profile Information (Verified):\n` +
                    `- Name: ${user.name || 'Unknown'}\n` +
                    `- Nationality: ${userProfile.nationality || 'Unknown'}\n` +
                    `- Current Country: ${userProfile.currentCountry || 'Unknown'}\n` +
                    `- Source Country: ${userProfile.sourceCountry || 'Unknown'}\n` +
                    `- Education Level: ${userProfile.educationLevel || 'Unknown'}\n` +
                    `- Field of Study: ${userProfile.fieldOfStudy || 'Unknown'}\n` +
                    `- Work Experience: ${userProfile.yearsOfExperience || '0'} years\n` +
                    `- Current Occupation: ${userProfile.currentOccupation || 'Unknown'}\n` +
                    `- Target Destination: ${userProfile.targetDestination || 'Canada'}\n` +
                    `- Immigration Pathway: ${userProfile.immigrationPathway || 'Unknown'}\n`;
            }
        } catch (error) {
            console.error('Profile fetch failed:', error);
        }

        // Build system instruction
        const baseSystemInstruction = language === 'ar'
            ? `أنت "هجرة" - مساعد ذكي متخصص في الهجرة إلى كندا. أجب باللغة العربية.
        
        في نهاية إجابتك، اقترح دائماً 3 أسئلة متابعة قصيرة ذات صلة بصيغة مصفوفة JSON داخل وسوم <suggestions>، مثال:
        <suggestions>["كيفية التقديم؟", "ما هي التكلفة؟", "المستندات المطلوبة"]</suggestions>`
            : `You are "Hijraah" - a specialized AI immigration assistant helping people immigrate to Canada.
        
        At the end of your response, ALWAYS suggest 3 short, relevant follow-up questions formatted as a JSON array inside <suggestions> tags, e.g.:
        <suggestions>["How to apply?", "What is the cost?", "Required documents"]</suggestions>`;

        let systemInstruction = baseSystemInstruction;

        if (ragContext) {
            systemInstruction += `\n\n${ragContext}`;
        } else {
            const fallbackWarning = language === 'ar'
                ? "\n\nتنبيه: لم يتم العثور على معلومات محددة في قاعدة البيانات لهذا السؤال. أجب بناءً على معرفتك العامة، ولكن اذكر بوضوح أن هذه المعلومات قد لا تكون محدثة تماماً ويجب التحقق منها من المصادر الرسمية."
                : "\n\nNOTE: No specific information found in the knowledge base for this question. Provide an answer based on your general knowledge, but explicitly warn the user that this information might not be fully up-to-date and they should verify with official sources.";
            systemInstruction += fallbackWarning;
        }

        systemInstruction += profileContext + memoryContext;

        // Stream the response using Gemini
        const model = google('gemini-2.5-flash');

        const result = streamText({
            model,
            system: systemInstruction,
            messages: await convertToModelMessages(messages),
            temperature: 0.7,
            tools: {
                calculateCRS: calculateCRSTool,
                validateDocument: validateDocumentTool,
                compareItems: generateComparisonTool
            },
            onFinish: async ({ text }) => {
                // Save AI response to database
                try {
                    await createMessage({
                        conversationId: activeConversationId!,
                        role: 'assistant',
                        content: text,
                    });

                    // Track usage
                    await incrementUsage(user.id, 'chat');

                    // Generate AI-powered title for new conversations
                    // Check for empty, null, undefined, or default titles
                    const needsTitle = !conversation.title ||
                        conversation.title === 'New Conversation' ||
                        conversation.title === 'New Chat' ||
                        conversation.title === 'محادثة جديدة' ||
                        conversation.title.length < 3;

                    if (needsTitle && userQuery) {
                        // Generate title async using after() to prevent serverless termination
                        after(async () => {
                            try {
                                const generatedTitle = await generateChatTitle(userQuery, language);
                                await updateConversationTitle(
                                    activeConversationId!,
                                    generatedTitle
                                );
                                console.log(`[Chat] Generated title: "${generatedTitle}" for conversation ${activeConversationId}`);
                            } catch (err) {
                                console.error('Title generation failed:', err);
                            }
                        });
                    }

                    // Add conversation to memory (async, don't block)
                    // Add conversation to memory (async, don't block)
                    after(async () => {
                        try {
                            await addMemoryToChat(
                                user.id.toString(),
                                activeConversationId!.toString(),
                                [
                                    { role: 'user', content: userQuery },
                                    { role: 'assistant', content: text },
                                ]
                            );
                        } catch (err) {
                            console.error('Memory add failed:', err);
                        }
                    });
                } catch (error) {
                    console.error('Error saving message:', error);
                }
            },
        });

        return result.toUIMessageStreamResponse();
    } catch (error: any) {
        console.error('Chat API error:', error);

        // Handle authentication errors
        if (error.message?.includes('Not authenticated') || error.code === 'UNAUTHORIZED') {
            return new Response(
                JSON.stringify({ error: 'Not authenticated' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
