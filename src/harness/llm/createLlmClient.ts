import { AnthropicLlmClient } from './anthropicLlmClient.js';
import type { LlmClient } from './llmClient.types.js';
import { OpenAiCompatibleLlmClient } from './openAiCompatibleLlmClient.js';

export type LlmProviderConfig =
  | {
      readonly provider: 'anthropic';
      readonly apiKey: string;
      readonly model: string;
      readonly baseUrl?: string;
      readonly maxTokens?: number;
    }
  | {
      readonly provider: 'openai-compatible';
      readonly baseUrl: string;
      readonly model: string;
      readonly apiKey?: string;
      readonly maxTokens?: number;
    };

/**
 * Builds the right `LlmClient` for an explicit, caller-supplied config. No provider is hardcoded
 * as a default (mirrors ADR-010's "never hardcode, always configurable" convention) — the caller
 * (see `src/experiments/llmProviderConfigFromEnv.ts`) always resolves this from explicit
 * configuration, never a built-in fallback vendor. See ADR-013 in
 * project-memory-bank/14-decisions.md for why these two provider kinds cover all four target
 * backends (Claude, ChatGPT, Gemini, local LLM).
 */
export function createLlmClient(config: LlmProviderConfig): LlmClient {
  switch (config.provider) {
    case 'anthropic':
      return new AnthropicLlmClient(config);
    case 'openai-compatible':
      return new OpenAiCompatibleLlmClient(config);
  }
}
