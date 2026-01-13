'use server';

import { evolutionClient } from '@/lib/evolution-api';

export async function sendWhatsAppMessageAction(data: { number: string; text: string }) {
    try {
        const result = await evolutionClient.sendText({
            number: data.number,
            text: data.text,
        });
        return { success: true, data: result };
    } catch (error) {
        console.error('Failed to send WhatsApp message:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(errorMessage);
    }
}

export async function configureWhatsAppWebhookAction(data: { url: string }) {
    try {
        const result = await evolutionClient.setWebhook({
            url: data.url,
            events: ['MESSAGES_UPSERT'],
            enabled: true,
        });
        return { success: true, data: result };
    } catch (error) {
        console.error('Failed to configure WhatsApp webhook:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(errorMessage);
    }
}
