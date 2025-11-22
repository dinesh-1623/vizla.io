/**
 * OpenAI Client Wrapper
 * Provides a reusable OpenAI client with retry logic, timeout handling, and cost tracking.
 * 
 * IMPORTANT: This must only be used server-side (Supabase Edge Functions or API routes).
 * Never import this in client-side React components.
 */

import OpenAI from 'openai';
import type { ChatCompletion, ChatCompletionCreateParams } from 'openai/resources/chat/completions';
import { APIError } from 'openai';

/**
 * Token usage and cost tracking result
 */
export interface TokenUsage {
  /** Total tokens used (prompt + completion) */
  totalTokens: number;
  /** Prompt tokens */
  promptTokens: number;
  /** Completion tokens */
  completionTokens: number;
  /** Estimated cost in USD */
  estimatedCostUsd: number;
}

/**
 * Model pricing per 1M tokens (as of 2024)
 * Updated for gpt-4o-mini and gpt-4o
 */
const MODEL_PRICING = {
  'gpt-4o-mini': {
    prompt: 0.15, // $0.15 per 1M input tokens
    completion: 0.6, // $0.60 per 1M output tokens
  },
  'gpt-4o': {
    prompt: 2.5, // $2.50 per 1M input tokens
    completion: 10.0, // $10.00 per 1M output tokens
  },
} as const;

/**
 * Get OpenAI API key from environment
 * Supports both Node.js (process.env) and Deno/Edge Functions (Deno.env)
 */
function getOpenAIApiKey(): string {
  // Try Deno environment first (for Supabase Edge Functions)
  if (typeof Deno !== 'undefined' && Deno.env.get('OPENAI_API_KEY')) {
    const key = Deno.env.get('OPENAI_API_KEY');
    if (!key) {
      throw new Error('OPENAI_API_KEY environment variable is not set (Deno environment)');
    }
    return key;
  }

  // Fall back to Node.js environment (process.env)
  const key = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      'OPENAI_API_KEY environment variable is not set. ' +
      'Set OPENAI_API_KEY in your Supabase Edge Function secrets or server environment.'
    );
  }
  return key;
}

/**
 * Calculate estimated cost for a completion
 */
function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
  if (!pricing) {
    // Default to gpt-4o-mini pricing for unknown models
    return (promptTokens * 0.15 + completionTokens * 0.6) / 1_000_000;
  }

  const inputCost = (promptTokens * pricing.prompt) / 1_000_000;
  const outputCost = (completionTokens * pricing.completion) / 1_000_000;
  return inputCost + outputCost;
}

/**
 * Extract token usage from OpenAI response
 */
function extractTokenUsage(completion: ChatCompletion): TokenUsage {
  const usage = completion.usage;
  const promptTokens = usage?.prompt_tokens || 0;
  const completionTokens = usage?.completion_tokens || 0;
  const totalTokens = usage?.total_tokens || 0;

  // Get model name (handle cases where model might be "gpt-4o-2024-08-06" format)
  const modelName = completion.model.startsWith('gpt-4o-mini')
    ? 'gpt-4o-mini'
    : completion.model.startsWith('gpt-4o')
    ? 'gpt-4o'
    : completion.model;

  const estimatedCostUsd = calculateCost(modelName, promptTokens, completionTokens);

  return {
    totalTokens,
    promptTokens,
    completionTokens,
    estimatedCostUsd,
  };
}

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * OpenAI client singleton
 */
let openAIClient: OpenAI | null = null;

/**
 * Get or create OpenAI client instance
 */
function getClient(): OpenAI {
  if (!openAIClient) {
    const apiKey = getOpenAIApiKey();
    openAIClient = new OpenAI({
      apiKey,
      timeout: 30000, // 30 second timeout
      maxRetries: 0, // We'll handle retries ourselves
    });
  }
  return openAIClient;
}

/**
 * Options for chat completion with retry logic
 */
export interface ChatCompletionOptions extends Omit<ChatCompletionCreateParams, 'model' | 'messages'> {
  /** Maximum number of retries (default: 2) */
  maxRetries?: number;
  /** Initial backoff delay in ms (default: 500) */
  initialBackoffMs?: number;
  /** Maximum backoff delay in ms (default: 5000) */
  maxBackoffMs?: number;
}

/**
 * Create a chat completion with retry logic and error handling
 * 
 * @param model - OpenAI model to use (e.g., 'gpt-4o-mini', 'gpt-4o')
 * @param messages - Chat messages
 * @param options - Additional options including retry configuration
 * @returns Completion result with token usage tracking
 */
export async function createChatCompletion(
  model: 'gpt-4o-mini' | 'gpt-4o' | string,
  messages: ChatCompletionCreateParams['messages'],
  options: ChatCompletionOptions = {}
): Promise<{
  completion: ChatCompletion;
  tokenUsage: TokenUsage;
}> {
  const {
    maxRetries = 2,
    initialBackoffMs = 500,
    maxBackoffMs = 5000,
    ...openAIOptions
  } = options;

  const client = getClient();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages,
        ...openAIOptions,
      });

      const tokenUsage = extractTokenUsage(completion);

      return {
        completion,
        tokenUsage,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain errors
      if (error instanceof APIError) {
        // Don't retry on client errors (4xx)
        if (error.status && error.status >= 400 && error.status < 500) {
          throw new Error(`OpenAI API client error: ${error.message}`, { cause: error });
        }

        // Don't retry on rate limits if we've already tried
        if (error.status === 429 && attempt >= maxRetries) {
          throw new Error(`OpenAI API rate limit exceeded after ${maxRetries} retries`, {
            cause: error,
          });
        }
      }

      // If this was the last attempt, throw
      if (attempt >= maxRetries) {
        throw new Error(`OpenAI API call failed after ${maxRetries} retries: ${lastError.message}`, {
          cause: lastError,
        });
      }

      // Exponential backoff: wait before retrying
      const backoffMs = Math.min(initialBackoffMs * Math.pow(2, attempt), maxBackoffMs);
      console.warn(
        `OpenAI API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${backoffMs}ms...`,
        lastError.message
      );
      await sleep(backoffMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('OpenAI API call failed unexpectedly');
}

/**
 * Reset the client (useful for testing or re-initialization)
 */
export function resetClient(): void {
  openAIClient = null;
}

/**
 * Export client instance for advanced use cases
 * (Use with caution - prefer createChatCompletion)
 */
export function getOpenAIClient(): OpenAI {
  return getClient();
}

