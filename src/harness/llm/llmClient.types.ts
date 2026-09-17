/** JSON-Schema-shaped description of one tool's input, e.g. `{ type: 'object', properties: {...}, required: [...] }`. */
export type LlmToolInputSchema = Record<string, unknown>;

export interface LlmToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: LlmToolInputSchema;
}

export interface LlmToolCall {
  readonly id: string;
  readonly name: string;
  readonly arguments: Record<string, unknown>;
}

export interface LlmUserMessage {
  readonly role: 'user';
  readonly content: string;
}

export interface LlmAssistantMessage {
  readonly role: 'assistant';
  readonly content: string;
  readonly toolCalls: readonly LlmToolCall[];
}

export interface LlmToolResultMessage {
  readonly role: 'tool';
  readonly toolCallId: string;
  readonly toolName: string;
  readonly content: string;
}

/**
 * EEP's own, vendor-neutral conversation shape — never a re-export of an Anthropic/OpenAI SDK
 * type. Each `LlmClient` adapter translates to/from this at its own boundary (ADR-013 in
 * project-memory-bank/14-decisions.md), so the solving agent's turn loop never depends on any
 * one vendor's wire format.
 */
export type LlmMessage = LlmUserMessage | LlmAssistantMessage | LlmToolResultMessage;

export interface LlmCompletionRequest {
  readonly systemPrompt: string;
  readonly messages: readonly LlmMessage[];
  readonly tools: readonly LlmToolDefinition[];
  readonly maxTokens?: number;
}

export type LlmCompletionResult = LlmAssistantMessage;

/**
 * Thrown by an `LlmClient` when a completion could not be obtained at all — network, auth, or
 * malformed-response failures. Never thrown for the model simply choosing not to call a tool;
 * that is a normal completion result with an empty `toolCalls` array.
 */
export class LlmClientError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'LlmClientError';
  }
}

/**
 * One backend capable of a single tool-augmented chat-completion turn. See ADR-013 in
 * project-memory-bank/14-decisions.md for why exactly two implementations — one Anthropic-native,
 * one OpenAI-compatible — cover all four target backends (Claude, ChatGPT, Gemini, local LLM).
 * `providerLabel`/`model` exist so `LlmSolvingAgent` can build a fully-identifying `Agent.name`
 * (e.g. `llm-solving-agent:anthropic:claude-sonnet-5`) — project-memory-bank/10-reproducibility.md
 * requires "model, model version" as run metadata, and this is the only channel currently
 * available for that (see ADR-013's documented limitation: `Run.metadata.modelName`/
 * `modelVersion` themselves are not yet populated, since that needs a `runHarness.ts` change
 * outside this round's scope).
 */
export interface LlmClient {
  readonly providerLabel: string;
  readonly model: string;
  complete(request: LlmCompletionRequest): Promise<LlmCompletionResult>;
}
