import { NextRequest, NextResponse } from 'next/server';
import { env } from 'process';

// Type for the incoming webhook payload from Evolution API
// This is a simplified version focusing on "UPSERT" messages
interface WebhookPayload {
    type: string;
    instance: string;
    data: {
        key: {
            remoteJid: string; // The sender's ID (number@s.whatsapp.net)
            fromMe: boolean;
            id: string;
        };
        pushName: string; // Sender's display name
        message: {
            conversation?: string; // Text message content
            extendedTextMessage?: {
                text: string;
            };
        };
        messageType: string;
        messageTimestamp: number | string;
        owner: string;
        source: string;
    };
    sender: string; // The sender's number (e.g. 1234567890@s.whatsapp.net)
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const eventType = body.event || body.type;

        // Log the event for debugging (in production, use structured logging)
        console.log(`Received WhatsApp Webhook: ${eventType}`, JSON.stringify(body, null, 2));

        // Handle initial connection or other events if needed
        if (eventType !== 'messages.upsert') {
            return NextResponse.json({ status: 'ignored', reason: 'Not a message upsert' });
        }

        const payload = body.data;
        const messageData = payload.message;

        // Ignore messages sent by the bot itself
        if (payload.key.fromMe) {
            return NextResponse.json({ status: 'ignored', reason: 'Message from me' });
        }

        // Extract text content
        const text = messageData.conversation || messageData.extendedTextMessage?.text;

        if (!text) {
            return NextResponse.json({ status: 'ignored', reason: 'No text content' });
        }

        const senderNumber = payload.key.remoteJid.replace('@s.whatsapp.net', '');
        const senderName = payload.pushName || 'Unknown';

        // TODO: Process the message (e.g., store in DB, trigger AI response)
        // For now, we just acknowledge receipt
        console.log(`Message from ${senderName} (${senderNumber}): ${text}`);

        // Example: If message starts with "SUPPORT", we could trigger a ticket creation
        if (text.toUpperCase().startsWith('SUPPORT')) {
            // Create support ticket logic here
            console.log('Detected SUPPORT request');
        }

        return NextResponse.json({ status: 'processed', sender: senderNumber });
    } catch (error) {
        console.error('Error processing WhatsApp webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
