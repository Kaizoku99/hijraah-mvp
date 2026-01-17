/**
 * Multi-Model AI Router
 * Phase 4: Supplier Risk Mitigation
 * 
 * This module provides an abstraction layer for AI providers,
 * enabling automatic fallback, cost optimization, and provider switching.
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, LanguageModel } from 'ai';
import { env } from './env';

// ============================================
// TYPES
// ============================================

export type AIProvider = 'google' | 'anthropic' | 'openai';

export type QueryComplexity = 'simple' | 'moderate' | 'complex';

export interface AIRouterConfig {
  primaryProvider: AIProvider;
  fallbackProviders: AIProvider[];
  enableCostOptimization: boolean;
  enableCaching: boolean;
  cacheTTLSeconds: number;
  maxRetries: number;
  retryDelayMs: number;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRouterOptions {
  messages: AIMessage[];
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  complexity?: QueryComplexity;
  forceProvider?: AIProvider;
  enableFallback?: boolean;
}

export interface AIRouterResponse {
  text: string;
  provider: AIProvider;
  model: string;
  cached: boolean;
  latencyMs: number;
  estimatedCost?: number;
}

export interface ProviderHealth {
  provider: AIProvider;
  isAvailable: boolean;
  lastError?: string;
  errorCount: number;
  lastSuccessTime?: Date;
  averageLatencyMs: number;
}

// ============================================
// PROVIDER CONFIGURATION
// ============================================

const PROVIDER_MODELS: Record<AIProvider, {
  simple: string;
  moderate: string;
  complex: string;
  costPerInputToken: number;  // in USD per 1M tokens
  costPerOutputToken: number;
}> = {
  google: {
    simple: 'gemini-2.5-flash',
    moderate: 'gemini-2.5-flash',
    complex: 'gemini-2.5-pro',
    costPerInputToken: 0.075,  // Gemini Flash pricing
    costPerOutputToken: 0.30,
  },
  anthropic: {
    simple: 'claude-3-haiku-20240307',
    moderate: 'claude-3-5-sonnet-20241022',
    complex: 'claude-3-5-sonnet-20241022',
    costPerInputToken: 0.25,   // Claude Haiku for simple
    costPerOutputToken: 1.25,
  },
  openai: {
    simple: 'gpt-4o-mini',
    moderate: 'gpt-4o-mini',
    complex: 'gpt-4o',
    costPerInputToken: 0.15,   // GPT-4o mini pricing
    costPerOutputToken: 0.60,
  },
};

// ============================================
// DEFAULT CONFIGURATION
// ============================================

const DEFAULT_CONFIG: AIRouterConfig = {
  primaryProvider: 'google',
  fallbackProviders: ['anthropic', 'openai'],
  enableCostOptimization: true,
  enableCaching: true,
  cacheTTLSeconds: 3600,  // 1 hour
  maxRetries: 3,
  retryDelayMs: 1000,
};

// ============================================
// AI ROUTER CLASS
// ============================================

class AIRouter {
  private config: AIRouterConfig;
  private providerHealth: Map<AIProvider, ProviderHealth> = new Map();
  private responseCache: Map<string, { response: AIRouterResponse; expiry: number }> = new Map();
  private providers: Map<AIProvider, ReturnType<typeof createGoogleGenerativeAI>> = new Map();

  constructor(config: Partial<AIRouterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeProviders();
    this.initializeHealthTracking();
  }

  private initializeProviders() {
    // Initialize Google (Gemini)
    if (env.GOOGLE_GENERATIVE_AI_API_KEY) {
      this.providers.set('google', createGoogleGenerativeAI({
        apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
      }));
    }

    // Initialize Anthropic (Claude)
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      }) as any);
    }

    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      }) as any);
    }
  }

  private initializeHealthTracking() {
    const providers: AIProvider[] = ['google', 'anthropic', 'openai'];
    for (const provider of providers) {
      this.providerHealth.set(provider, {
        provider,
        isAvailable: this.providers.has(provider),
        errorCount: 0,
        averageLatencyMs: 0,
      });
    }
  }

  /**
   * Select the best provider based on complexity, cost, and health
   */
  private selectProvider(complexity: QueryComplexity, forceProvider?: AIProvider): AIProvider {
    // If forced, use that provider if available
    if (forceProvider && this.isProviderAvailable(forceProvider)) {
      return forceProvider;
    }

    // Cost optimization: use cheapest provider for simple queries
    if (this.config.enableCostOptimization && complexity === 'simple') {
      const cheapestProvider = this.getCheapestAvailableProvider();
      if (cheapestProvider) return cheapestProvider;
    }

    // Use primary provider if available
    if (this.isProviderAvailable(this.config.primaryProvider)) {
      return this.config.primaryProvider;
    }

    // Fall back to first available fallback provider
    for (const fallback of this.config.fallbackProviders) {
      if (this.isProviderAvailable(fallback)) {
        return fallback;
      }
    }

    // No providers available
    throw new Error('No AI providers available');
  }

  private isProviderAvailable(provider: AIProvider): boolean {
    const health = this.providerHealth.get(provider);
    if (!health) return false;

    // Check if API key is configured
    if (!this.providers.has(provider)) return false;

    // Check if provider has too many recent errors
    if (health.errorCount >= 5) {
      // Allow retry after 5 minutes
      const lastSuccess = health.lastSuccessTime?.getTime() || 0;
      if (Date.now() - lastSuccess < 5 * 60 * 1000) {
        return false;
      }
    }

    return health.isAvailable;
  }

  private getCheapestAvailableProvider(): AIProvider | null {
    const availableProviders = (['google', 'anthropic', 'openai'] as AIProvider[])
      .filter(p => this.isProviderAvailable(p));

    if (availableProviders.length === 0) return null;

    return availableProviders.reduce((cheapest, current) => {
      const cheapestCost = PROVIDER_MODELS[cheapest].costPerInputToken;
      const currentCost = PROVIDER_MODELS[current].costPerInputToken;
      return currentCost < cheapestCost ? current : cheapest;
    });
  }

  private getModel(provider: AIProvider, complexity: QueryComplexity): LanguageModel {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new Error(`Provider ${provider} not initialized`);
    }

    const modelName = PROVIDER_MODELS[provider][complexity];
    return providerInstance(modelName) as LanguageModel;
  }

  private getCacheKey(options: AIRouterOptions): string {
    const { messages, systemInstruction, temperature } = options;
    return JSON.stringify({ messages, systemInstruction, temperature });
  }

  private checkCache(key: string): AIRouterResponse | null {
    if (!this.config.enableCaching) return null;

    const cached = this.responseCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.responseCache.delete(key);
      return null;
    }

    return { ...cached.response, cached: true };
  }

  private setCache(key: string, response: AIRouterResponse): void {
    if (!this.config.enableCaching) return;

    this.responseCache.set(key, {
      response,
      expiry: Date.now() + this.config.cacheTTLSeconds * 1000,
    });

    // Clean up old cache entries (simple LRU)
    if (this.responseCache.size > 1000) {
      const oldestKey = this.responseCache.keys().next().value;
      if (oldestKey) this.responseCache.delete(oldestKey);
    }
  }

  private updateProviderHealth(
    provider: AIProvider,
    success: boolean,
    latencyMs: number,
    error?: string
  ): void {
    const health = this.providerHealth.get(provider);
    if (!health) return;

    if (success) {
      health.errorCount = 0;
      health.lastSuccessTime = new Date();
      health.isAvailable = true;
      // Update rolling average latency
      health.averageLatencyMs = health.averageLatencyMs === 0
        ? latencyMs
        : (health.averageLatencyMs * 0.8 + latencyMs * 0.2);
    } else {
      health.errorCount++;
      health.lastError = error;
      if (health.errorCount >= 5) {
        health.isAvailable = false;
      }
    }
  }

  private estimateCost(
    provider: AIProvider,
    inputTokens: number,
    outputTokens: number
  ): number {
    const config = PROVIDER_MODELS[provider];
    return (
      (inputTokens / 1_000_000) * config.costPerInputToken +
      (outputTokens / 1_000_000) * config.costPerOutputToken
    );
  }

  /**
   * Generate a response using the AI router
   */
  async generate(options: AIRouterOptions): Promise<AIRouterResponse> {
    const {
      messages,
      systemInstruction,
      temperature = 0.7,
      maxTokens = 2048,
      complexity = 'moderate',
      forceProvider,
      enableFallback = true,
    } = options;

    // Check cache first
    const cacheKey = this.getCacheKey(options);
    const cachedResponse = this.checkCache(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Select provider
    let selectedProvider = this.selectProvider(complexity, forceProvider);
    const providersToTry = enableFallback
      ? [selectedProvider, ...this.config.fallbackProviders.filter(p => p !== selectedProvider)]
      : [selectedProvider];

    let lastError: Error | null = null;

    for (const provider of providersToTry) {
      if (!this.isProviderAvailable(provider)) continue;

      for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
        const startTime = Date.now();

        try {
          const model = this.getModel(provider, complexity);
          const modelName = PROVIDER_MODELS[provider][complexity];

          const result = await generateText({
            model,
            messages: messages as any,
            system: systemInstruction,
            temperature,
            maxOutputTokens: maxTokens,
          });

          const latencyMs = Date.now() - startTime;

          // Estimate token counts (rough approximation)
          const inputTokens = messages.reduce((sum, m) => sum + m.content.length / 4, 0);
          const outputTokens = result.text.length / 4;

          this.updateProviderHealth(provider, true, latencyMs);

          const response: AIRouterResponse = {
            text: result.text,
            provider,
            model: modelName,
            cached: false,
            latencyMs,
            estimatedCost: this.estimateCost(provider, inputTokens, outputTokens),
          };

          // Cache successful response
          this.setCache(cacheKey, response);

          return response;
        } catch (error: any) {
          const latencyMs = Date.now() - startTime;
          lastError = error;

          console.error(`[AIRouter] ${provider} attempt ${attempt + 1} failed:`, error.message);
          this.updateProviderHealth(provider, false, latencyMs, error.message);

          // Check if error is retryable
          const isRetryable = this.isRetryableError(error);
          if (!isRetryable) break;

          // Wait before retry
          if (attempt < this.config.maxRetries - 1) {
            await new Promise(resolve =>
              setTimeout(resolve, this.config.retryDelayMs * (attempt + 1))
            );
          }
        }
      }
    }

    throw lastError || new Error('All AI providers failed');
  }

  private isRetryableError(error: any): boolean {
    const retryableStatuses = [429, 500, 502, 503, 504];
    const statusCode = error.statusCode || error.status;

    if (retryableStatuses.includes(statusCode)) return true;
    if (error.message?.includes('timeout')) return true;
    if (error.message?.includes('rate limit')) return true;

    return false;
  }

  /**
   * Get current health status of all providers
   */
  getHealth(): ProviderHealth[] {
    return Array.from(this.providerHealth.values());
  }

  /**
   * Update router configuration
   */
  updateConfig(config: Partial<AIRouterConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear the response cache
   */
  clearCache(): void {
    this.responseCache.clear();
  }

  /**
   * Reset provider health (useful for manual recovery)
   */
  resetProviderHealth(provider: AIProvider): void {
    const health = this.providerHealth.get(provider);
    if (health) {
      health.errorCount = 0;
      health.isAvailable = this.providers.has(provider);
      health.lastError = undefined;
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let routerInstance: AIRouter | null = null;

export function getAIRouter(): AIRouter {
  if (!routerInstance) {
    routerInstance = new AIRouter();
  }
  return routerInstance;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Simple function to generate text using the AI router
 */
export async function generateWithRouter(options: AIRouterOptions): Promise<string> {
  const router = getAIRouter();
  const response = await router.generate(options);
  return response.text;
}

/**
 * Determine query complexity based on message content
 */
export function detectQueryComplexity(messages: AIMessage[]): QueryComplexity {
  const totalLength = messages.reduce((sum, m) => sum + m.content.length, 0);
  const lastMessage = messages[messages.length - 1]?.content || '';

  // Check for complex indicators
  const complexIndicators = [
    'analyze',
    'compare',
    'explain in detail',
    'step by step',
    'comprehensive',
    'multiple scenarios',
    'calculate',
    'evaluate',
  ];

  const hasComplexIndicator = complexIndicators.some(
    indicator => lastMessage.toLowerCase().includes(indicator)
  );

  if (hasComplexIndicator || totalLength > 2000) {
    return 'complex';
  }

  if (totalLength > 500) {
    return 'moderate';
  }

  return 'simple';
}
