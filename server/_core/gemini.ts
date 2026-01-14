import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { env } from './env';
import { generateText } from 'ai';

export const google = createGoogleGenerativeAI({
    apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY || 'no-key-provided',
});

// Manual definition compatible with what we expect from UI and DB
export type GeminiMessage = {
    role: 'user' | 'assistant' | 'system' | 'data' | 'tool';
    content: string;
    id?: string;
    name?: string;
};

export type GenerateChatResponseOptions = {
    messages: any[];
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
};

export async function generateChatResponse({
    messages,
    systemInstruction,
    temperature,
    maxOutputTokens
}: GenerateChatResponseOptions) {
    const model = google('gemini-2.5-flash');

    const result = await generateText({
        model,
        messages: messages as any,
        system: systemInstruction,
        temperature,
        // @ts-ignore - maxTokens is supported in runtime but types might vary across versions
        maxTokens: maxOutputTokens,
    });

    return result.text;
}

/**
 * Generate a concise, meaningful title for a chat conversation
 * @param userMessage - The first user message in the conversation
 * @param language - The language for the title ('ar' for Arabic, 'en' for English)
 * @returns A short, descriptive title (10-50 characters)
 */
export async function generateChatTitle(
    userMessage: string,
    language: 'ar' | 'en' = 'en'
): Promise<string> {
    const model = google('gemini-2.5-flash');

    const prompt = language === 'ar'
        ? `أنت خبير في إنشاء عناوين محادثات. أنشئ عنواناً وصفياً (10-50 حرفاً) يلخص موضوع هذه الرسالة:

"${userMessage}"

قواعد مهمة:
- استخرج الموضوع الأساسي من الرسالة
- العنوان يجب أن يكون 10 أحرف على الأقل
- لا تكرر الرسالة حرفياً
- ركز على "ماذا" وليس "كيف"

أمثلة:
- "مرحبا" → "ترحيب ومقدمة"
- "ما هي متطلبات Express Entry" → "متطلبات Express Entry"
- "كيف أحسب نقاطي" → "حساب نقاط CRS"

أعد العنوان فقط:`
        : `You are an expert at creating conversation titles. Generate a descriptive title (10-50 characters) that summarizes the TOPIC of this message:

"${userMessage}"

Important rules:
- Extract the main topic/subject from the message
- Title MUST be at least 10 characters
- Don't just repeat the message
- Focus on WHAT, not HOW

Examples:
- "hello" → "Introduction Chat"
- "what do you know about canada" → "Canada Immigration Info"
- "how to apply for express entry" → "Express Entry Guide"
- "hi there" → "Getting Started"

Return ONLY the title:`;

    try {
        const { text } = await generateText({
            model,
            prompt,
            temperature: 0.5, // Slightly higher for more creative titles
            maxOutputTokens: 100,
        });

        // Clean up the result
        let cleanedTitle = text
            .replace(/^["']|["']$/g, '') // Remove surrounding quotes
            .replace(/\n/g, ' ') // Remove newlines
            .replace(/^(Title:|العنوان:)\s*/i, '') // Remove "Title:" prefix
            .trim();

        // Validate minimum length - if too short, create a better fallback
        if (cleanedTitle.length < 10) {
            // Try to create a meaningful title from the message
            const words = userMessage.split(/\s+/).filter(w => w.length > 2);
            if (words.length >= 2) {
                cleanedTitle = words.slice(0, 4).join(' ');
                if (cleanedTitle.length < 10) {
                    cleanedTitle = language === 'ar' ? 'استفسار جديد' : 'New Inquiry';
                }
            } else {
                cleanedTitle = language === 'ar' ? 'محادثة جديدة' : 'New Conversation';
            }
        }

        // Ensure max 50 chars
        return cleanedTitle.substring(0, 50);
    } catch (error) {
        console.error('Failed to generate chat title:', error);
        // Fallback: extract key words from message
        const words = userMessage.split(/\s+/).filter(w => w.length > 2);
        if (words.length >= 2) {
            return words.slice(0, 4).join(' ').substring(0, 50);
        }
        return language === 'ar' ? 'محادثة جديدة' : 'New Conversation';
    }
}
