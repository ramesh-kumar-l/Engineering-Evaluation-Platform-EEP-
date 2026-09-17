import {
  LlmClientError,
  type LlmClient,
  type LlmCompletionRequest,
  type LlmCompletionResult,
  type LlmMessage,
  type LlmToolCall,
} from './llmClient.types.js';

const DEFAULT_BASE_URL = 'https://api.anthropic.com/v1';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MAX_TOKENS = 4096;

export interface AnthropicLlmClientOptions {
  readonly apiKey: string;
  readonly model: string;
  readonly baseUrl?: string;
  readonly maxTokens?: number;
}

interface AnthropicContentBlock {
  readonly type: string;
  readonly text?: string;
  readonly id?: string;
  readonly name?: string;
  readonly input?: unknown;
  readonly tool_use_id?: string;
  readonly content?: string;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: AnthropicContentBlock[];
}

/**
 * Converts EEP's neutral `LlmMessage[]` into Anthropic's Messages API shape. Anthropic requires
 * strictly alternating user/assistant turns; a multi-tool-call agent turn produces several
 * consecutive `tool` messages (one per call), so adjacent same-role turns are merged into one
 * rather than sent separately.
 */
function toAnthropicMessages(messages: readonly LlmMessage[]): AnthropicMessage[] {
  const mapped: AnthropicMessage[] = messages.map((message) => {
    if (message.role === 'user') {
      return { role: 'user', content: [{ type: 'text', text: message.content }] };
    }
    if (message.role === 'assistant') {
      const blocks: AnthropicContentBlock[] = [];
      if (message.content) blocks.push({ type: 'text', text: message.content });
      for (const call of message.toolCalls) {
        blocks.push({ type: 'tool_use', id: call.id, name: call.name, input: call.arguments });
      }
      return { role: 'assistant', content: blocks };
    }
    return {
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: message.toolCallId, content: message.content }],
    };
  });

  const merged: AnthropicMessage[] = [];
  for (const message of mapped) {
    const previous = merged[merged.length - 1];
    if (previous && previous.role === message.role) {
      previous.content.push(...message.content);
    } else {
      merged.push({ role: message.role, content: [...message.content] });
    }
  }
  return merged;
}

function toAnthropicTools(tools: LlmCompletionRequest['tools']) {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
  }));
}

/**
 * Anthropic Messages API adapter (ADR-013, project-memory-bank/14-decisions.md) — covers Claude.
 * Uses Node's global `fetch`; no Anthropic SDK dependency.
 */
export class AnthropicLlmClient implements LlmClient {
  readonly providerLabel = 'anthropic';
  readonly model: string;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly maxTokens: number;

  constructor(options: AnthropicLlmClientOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  async complete(request: LlmCompletionRequest): Promise<LlmCompletionResult> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: request.maxTokens ?? this.maxTokens,
          system: request.systemPrompt,
          messages: toAnthropicMessages(request.messages),
          tools: toAnthropicTools(request.tools),
        }),
      });
    } catch (error) {
      throw new LlmClientError('Failed to reach the Anthropic API', error);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new LlmClientError(
        `Anthropic API returned ${String(response.status)}: ${body.slice(0, 2000)}`,
      );
    }

    const parsed = (await response.json()) as { content?: AnthropicContentBlock[] };
    const blocks = parsed.content ?? [];

    const textParts = blocks.filter((b) => b.type === 'text').map((b) => b.text ?? '');
    const toolCalls: LlmToolCall[] = blocks
      .filter((b) => b.type === 'tool_use')
      .map((b) => ({
        id: b.id ?? '',
        name: b.name ?? '',
        arguments: (b.input as Record<string, unknown>) ?? {},
      }));

    return { role: 'assistant', content: textParts.join('\n'), toolCalls };
  }
}
