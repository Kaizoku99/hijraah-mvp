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
    const model = google('gemini-1.5-flash');

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
