'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { sendWhatsAppMessageAction, configureWhatsAppWebhookAction } from '@/actions/whatsapp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Send, Settings, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function WhatsAppTester() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [message, setMessage] = useState('Hello from Hijraah MVP! This is a test message.');
    const [webhookUrl, setWebhookUrl] = useState('');

    const sendMutation = useMutation({
        mutationFn: sendWhatsAppMessageAction,
        onSuccess: (data) => {
            toast.success('Message sent successfully!');
            console.log('Send result:', data);
        },
        onError: (error) => {
            toast.error('Failed to send message: ' + error.message);
        },
    });

    const webhookMutation = useMutation({
        mutationFn: configureWhatsAppWebhookAction,
        onSuccess: (data) => {
            toast.success('Webhook configured successfully!');
            console.log('Webhook result:', data);
        },
        onError: (error) => {
            toast.error('Failed to configure webhook: ' + error.message);
        },
    });

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber || !message) {
            toast.error('Please enter a phone number and message');
            return;
        }
        sendMutation.mutate({ number: phoneNumber, text: message });
    };

    const handleConfigureWebhook = () => {
        if (!webhookUrl) {
            // Try to construct default URL if not provided
            const defaultUrl = `${window.location.origin}/api/webhooks/whatsapp`;
            if (confirm(`Use default webhook URL: ${defaultUrl}?`)) {
                webhookMutation.mutate({ url: defaultUrl });
            }
            return;
        }
        webhookMutation.mutate({ url: webhookUrl });
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        Send Test Message
                    </CardTitle>
                    <CardDescription>
                        Send a WhatsApp message to any number to verify the Evolution API integration.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSend} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Phone Number (with country code)</Label>
                            <Input
                                id="phoneNumber"
                                placeholder="e.g. 15551234567"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Do not include symbols like +, just numbers (e.g. 15551234567).
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                placeholder="Type your message here..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                            />
                        </div>

                        <Button type="submit" disabled={sendMutation.isPending}>
                            {sendMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            Send Message
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Webhook Configuration
                    </CardTitle>
                    <CardDescription>
                        Configure the Evolution API to send events to this application.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="webhookUrl">Webhook URL</Label>
                        <Input
                            id="webhookUrl"
                            placeholder="https://your-domain.com/api/webhooks/whatsapp"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Leave empty to auto-detect current origin.
                        </p>
                    </div>

                    <Button
                        onClick={handleConfigureWebhook}
                        variant="secondary"
                        disabled={webhookMutation.isPending}
                    >
                        {webhookMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Configure Webhook
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
