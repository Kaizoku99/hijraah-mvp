import { env } from 'process';

export interface EvolutionConfig {
    baseUrl: string;
    apiKey: string;
    instanceName: string;
}

export interface SendMessageOptions {
    number: string;
    text: string;
    delay?: number;
    linkPreview?: boolean;
}

export interface WebhookConfig {
    url: string;
    events: string[];
    enabled: boolean;
}

export class EvolutionClient {
    private config: EvolutionConfig;

    constructor() {
        const baseUrl = env.EVOLUTION_API_URL;
        const apiKey = env.EVOLUTION_API_KEY;
        const instanceName = env.EVOLUTION_INSTANCE_NAME;

        if (!baseUrl || !apiKey || !instanceName) {
            console.warn('Evolution API environment variables are not fully configured.');
        }

        this.config = {
            baseUrl: baseUrl?.replace(/\/$/, '') || '',
            apiKey: apiKey || '',
            instanceName: instanceName || '',
        };
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        if (!this.config.baseUrl || !this.config.apiKey) {
            throw new Error('Evolution API not configured');
        }

        const url = `${this.config.baseUrl}/${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'apikey': this.config.apiKey,
            ...options.headers,
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Evolution API Error ${response.status}: ${errorBody}`);
        }

        return response.json();
    }

    async sendText({ number, text, delay = 1000, linkPreview = true }: SendMessageOptions) {
        // Ensure number is formatted correctly (digits only)
        const formattedNumber = number.replace(/\D/g, '');

        return this.request<{ key: { id: string } }>(`message/sendText/${this.config.instanceName}`, {
            method: 'POST',
            body: JSON.stringify({
                number: formattedNumber,
                text,
                delay,
                linkPreview,
                mentionsEveryOne: false,
            }),
        });
    }

    async setWebhook({ url, events, enabled = true }: WebhookConfig) {
        return this.request(`webhook/set/${this.config.instanceName}`, {
            method: 'POST',
            body: JSON.stringify({
                webhook: {
                    url,
                    events,
                    enabled,
                    webhookByEvents: true,
                    webhookBase64: false,
                }
            }),
        });
    }
}

export const evolutionClient = new EvolutionClient();
