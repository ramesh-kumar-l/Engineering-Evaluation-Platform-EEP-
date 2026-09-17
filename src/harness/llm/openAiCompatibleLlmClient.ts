import {
  LlmClientError,
  type LlmClient,
  type LlmCompletionRequest,
  type LlmCompletionResult,
  type LlmMessage,
  type LlmToolCall,
} from './llmClient.types.js';

const DEFAULT_MAX_TOKENS = 4096;

export interface OpenAiCompatibleLlmClientOptions {
  readonly baseUrl: string;
  readonly model: string;
  /** Omit for a local server that requires no authentication. */
  readonly apiKey?: string;
  readonly maxTokens?: number;
}

interface OpenAiToolCall {
  readonly id: string;
  readonly type: 'function';
  readonly function: { readonly name: string; readonly arguments: string };
}

interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: OpenAiToolCall[];
  tool_call_id?: string;
}

function toOpenAiMessages(systemPrompt: string, messages: readonly LlmMessage[]): OpenAiMessage[] {
  const converted: OpenAiMessage[] = [{ role: 'system', content: systemPrompt }];

  for (const message of messages) {
    if (message.role === 'user') {
      converted.push({ role: 'user', content: message.content });
    } else if (message.role === 'assistant') {
      converted.push({
        role: 'assistant',
        content: message.content || null,
        tool_calls: message.toolCalls.length
          ? message.toolCalls.map((call) => ({
              id: call.id,
              type: 'function',
              function: { name: call.name, arguments: JSON.stringify(call.arguments) },
            }))
          : undefined,
      });
    } else {
      converted.push({ role: 'tool', content: message.content, tool_call_id: message.toolCallId });
    }
  }
  return converted;
}

function toOpenAiTools(tools: LlmCompletionRequest['tools']) {
  return tools.map((tool) => ({
    type: 'function' as const,
    function: { name: tool.name, description: tool.description, parameters: tool.inputSchema },
  }));
}

/**
 * OpenAI-style `/chat/completions` function-calling adapter (ADR-013, project-memory-bank/
 * 14-decisions.md) — one implementation covering three backends purely by configuration: ChatGPT
 * (`api.openai.com/v1`), Gemini (Google's own OpenAI-compatibility endpoint), and any local
 * OpenAI-compatible server such as Ollama or LM Studio. Known trade-off: inherits any gaps in a
 * given vendor's own compatibility shim rather than using that vendor's native wire format — a
 * documented limitation, not silently assumed away (ADR-009 discipline).
 */
export class OpenAiCompatibleLlmClient implements LlmClient {
  readonly providerLabel: string;
  readonly model: string;

  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly maxTokens: number;

  constructor(options: OpenAiCompatibleLlmClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.model = options.model;
    this.apiKey = options.apiKey;
    this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.providerLabel = `openai-compatible(${this.baseUrl})`;
  }

  async complete(request: LlmCompletionRequest): Promise<LlmCompletionResult> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: request.maxTokens ?? this.maxTokens,
          messages: toOpenAiMessages(request.systemPrompt, request.messages),
          tools: toOpenAiTools(request.tools),
        }),
      });
    } catch (error) {
      throw new LlmClientError(`Failed to reach ${this.baseUrl}`, error);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new LlmClientError(
        `${this.baseUrl} returned ${String(response.status)}: ${body.slice(0, 2000)}`,
      );
    }

    const parsed = (await response.json()) as {
      choices?: { message?: { content?: string | null; tool_calls?: OpenAiToolCall[] } }[];
    };
    const message = parsed.choices?.[0]?.message;
    if (!message) {
      throw new LlmClientError(`${this.baseUrl} returned no completion choices`);
    }

    const toolCalls: LlmToolCall[] = (message.tool_calls ?? []).map((call) => {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(call.function.arguments) as Record<string, unknown>;
      } catch {
        // Malformed tool-call JSON from the model becomes no arguments, not a client error — the
        // agent's own turn loop decides how to handle an unusable tool call.
      }
      return { id: call.id, name: call.function.name, arguments: parsedArgs };
    });

    return { role: 'assistant', content: message.content ?? '', toolCalls };
  }
}
