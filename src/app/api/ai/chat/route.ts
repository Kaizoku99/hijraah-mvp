import { NextRequest } from 'next/server'
import { streamChatResponse, Language, ChatMessage } from '@/server/_core/ai'
import { getAuthUserFromRequest } from '@/server/_core/supabase'
import * as db from '@/server/db'
import {
  createMessage,
  getConversation,
  getConversationMessages,
  updateConversationTitle
} from '@/server/db'
import { cookies } from 'next/headers'

import fs from 'fs';
import path from 'path';

function logDebug(message: string, data?: any) {
  const logPath = path.join(process.cwd(), 'server-debug.log');
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}\n`;
  fs.appendFileSync(logPath, logEntry);
}

// Type for incoming messages from client
interface IncomingMessage {
  role: 'user' | 'assistant' | 'system'
  content?: string
  parts?: Array<{ type: string; text?: string }>
}

// Helper to extract text content from message
function extractMessageContent(msg: IncomingMessage): string {
  if (typeof msg.content === 'string') {
    return msg.content
  }
  if (msg.parts && Array.isArray(msg.parts)) {
    return msg.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof p.text === 'string')
      .map((p) => p.text)
      .join('')
  }
  return ''
}

export async function POST(req: NextRequest) {
  try {
    // Get auth user from cookies
    const cookieStore = await cookies()
    const supabaseUser = await getAuthUserFromRequest(req)

    if (!supabaseUser) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get database user
    const dbUser = await db.getOrCreateUserByAuthId(supabaseUser.id, {
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
    })

    if (!dbUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { messages, conversationId }: { messages: IncomingMessage[]; conversationId?: number } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // If conversationId provided, verify ownership and get language
    let userLanguage: Language = 'en'
    if (conversationId) {
      logDebug("Processing request for conversationId:", conversationId);
      const conversation = await getConversation(conversationId)
      if (!conversation || conversation.userId !== dbUser.id) {
        logDebug("Conversation not found or access denied", { convId: conversationId, userId: dbUser.id });
        return new Response(JSON.stringify({ error: 'Conversation not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      userLanguage = conversation.language as Language
      logDebug("Found conversation, language:", userLanguage);
    } else {
      logDebug("No conversationId provided in request body");
    }

    // Convert to our chat message format
    const chatMessages: ChatMessage[] = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: extractMessageContent(msg),
    }))

    // Find the last user message for storing and title generation
    const lastUserMessage = [...chatMessages].reverse().find(m => m.role === 'user')

    // Store user message
    if (lastUserMessage && conversationId) {
      await createMessage({
        conversationId,
        role: 'user',
        content: lastUserMessage.content,
      })
    }

    // Stream the response
    const result = streamChatResponse({
      messages: chatMessages,
      language: userLanguage,
    })

    // Return UI Message Stream with onFinish callback for persistence
    return result.toUIMessageStreamResponse({
      headers: {
        'x-vercel-ai-ui-message-stream': 'v1',
      },
      onFinish: async ({ responseMessage }) => {
        try {
          console.log("[AI Chat] onFinish triggered");
          // Extract text from response message parts
          const text = responseMessage?.parts
            ?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
            .map((part) => part.text)
            .join('') || '';

          console.log("[AI Chat] onFinish - text length:", text?.length);

          if (conversationId && text) {
            console.log("[AI Chat] Saving assistant message for conversation:", conversationId);
            await createMessage({
              conversationId,
              role: "assistant",
              content: text,
            });
            console.log("[AI Chat] Assistant message saved successfully");

            // Update conversation title if it's the first exchange
            const conversation = await getConversation(conversationId);
            console.log("[AI Chat] Title check - current title:", conversation?.title);

            if (conversation && !conversation.title && lastUserMessage) {
              console.log("[AI Chat] Generating title...");
              try {
                const titlePrompt = conversation.language === "ar"
                  ? `قم بتلخيص الرسالة التالية في عنوان قصير جداً (3-5 كلمات) للمحادثة: "${lastUserMessage.content}"`
                  : `Summarize the following message into a very short conversation title (3-5 words): "${lastUserMessage.content}"`;

                // Use generateText directly to avoid heavy system prompt interference
                const { generateText, models } = await import('@/server/_core/ai');

                // Use a very simple, direct system prompt designated for this specific task
                const system = conversation.language === "ar"
                  ? "You are a helpful assistant. Summarize the user's message into a very short Arabic title (3-5 words). Do not explain, just return the title."
                  : "You are a helpful assistant. Summarize the user's message into a very short English title (3-5 words). Do not explain, just return the title.";

                const generationResult = await generateText({
                  model: models.chat,
                  system,
                  messages: [{ role: 'user', content: titlePrompt }],
                  maxOutputTokens: 20,
                  temperature: 0.3
                });

                const cleanTitle = generationResult.text.replace(/["']/g, "").trim();
                console.log("[AI Chat] AI generated title:", cleanTitle, "Length:", cleanTitle.length);

                if (cleanTitle && cleanTitle.length > 0) {
                  await updateConversationTitle(conversationId, cleanTitle);
                } else {
                  console.warn("[AI Chat] AI Title empty, using fallback");
                  const fallbackTitle = lastUserMessage.content.substring(0, 50);
                  await updateConversationTitle(conversationId, fallbackTitle);
                }
              } catch (titleError) {
                console.error("[AI Chat] Title generation failed, falling back to substring:", titleError);
                const fallbackTitle = lastUserMessage.content.substring(0, 50);
                await updateConversationTitle(conversationId, fallbackTitle);
              }
            }
          } else {
            console.warn("[AI Chat] Validation failed - conversationId:", conversationId, "text present:", !!text);
          }
        } catch (err) {
          console.error("[AI Chat] Critical Error in onFinish:", err);
        }
      },
    });
  } catch (error: any) {
    console.error('Chat API Error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
