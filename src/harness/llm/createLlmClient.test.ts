import { describe, expect, it } from 'vitest';
import { AnthropicLlmClient } from './anthropicLlmClient.js';
import { createLlmClient } from './createLlmClient.js';
import { OpenAiCompatibleLlmClient } from './openAiCompatibleLlmClient.js';

describe('createLlmClient', () => {
  it('builds an AnthropicLlmClient for provider "anthropic"', () => {
    const client = createLlmClient({ provider: 'anthropic', apiKey: 'k', model: 'claude-x' });
    expect(client).toBeInstanceOf(AnthropicLlmClient);
    expect(client.providerLabel).toBe('anthropic');
  });

  it('builds an OpenAiCompatibleLlmClient for provider "openai-compatible"', () => {
    const client = createLlmClient({
      provider: 'openai-compatible',
      baseUrl: 'http://localhost:11434/v1',
      model: 'local-model',
    });
    expect(client).toBeInstanceOf(OpenAiCompatibleLlmClient);
    expect(client.providerLabel).toContain('localhost:11434');
  });
});
