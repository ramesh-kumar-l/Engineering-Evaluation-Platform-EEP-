import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnthropicLlmClient } from './anthropicLlmClient.js';
import { LlmClientError } from './llmClient.types.js';

interface CapturedRequestBody {
  readonly model: string;
  readonly system: string;
  readonly messages: { role: string; content: unknown[] }[];
}

describe('AnthropicLlmClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the system prompt and tools, and parses text + tool_use blocks from the reply', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [
            { type: 'text', text: 'Looking at the file.' },
            { type: 'tool_use', id: 'call-1', name: 'read_file', input: { path: 'a.js' } },
          ],
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new AnthropicLlmClient({ apiKey: 'test-key', model: 'claude-x' });
    const result = await client.complete({
      systemPrompt: 'You are an agent.',
      messages: [{ role: 'user', content: 'Fix the bug.' }],
      tools: [{ name: 'read_file', description: 'Read a file', inputSchema: { type: 'object' } }],
    });

    expect(result.content).toBe('Looking at the file.');
    expect(result.toolCalls).toEqual([{ id: 'call-1', name: 'read_file', arguments: { path: 'a.js' } }]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string>; body: string }];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.headers['x-api-key']).toBe('test-key');
    const body = JSON.parse(init.body) as CapturedRequestBody;
    expect(body.model).toBe('claude-x');
    expect(body.system).toBe('You are an agent.');
  });

  it('merges consecutive tool-result turns into one user message, per Anthropic\'s alternating-role requirement', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ content: [] }) });
    vi.stubGlobal('fetch', fetchMock);

    const client = new AnthropicLlmClient({ apiKey: 'k', model: 'm' });
    await client.complete({
      systemPrompt: 's',
      messages: [
        { role: 'user', content: 'start' },
        {
          role: 'assistant',
          content: '',
          toolCalls: [
            { id: 'c1', name: 't1', arguments: {} },
            { id: 'c2', name: 't2', arguments: {} },
          ],
        },
        { role: 'tool', toolCallId: 'c1', toolName: 't1', content: 'result1' },
        { role: 'tool', toolCallId: 'c2', toolName: 't2', content: 'result2' },
      ],
      tools: [],
    });

    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    const body = JSON.parse(init.body) as CapturedRequestBody;
    expect(body.messages).toHaveLength(3);
    expect(body.messages[2]?.role).toBe('user');
    expect(body.messages[2]?.content).toHaveLength(2);
  });

  it('throws LlmClientError on a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, text: () => Promise.resolve('unauthorized') }),
    );
    const client = new AnthropicLlmClient({ apiKey: 'bad', model: 'm' });
    await expect(client.complete({ systemPrompt: 's', messages: [], tools: [] })).rejects.toThrow(
      LlmClientError,
    );
  });

  it('throws LlmClientError when fetch itself rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const client = new AnthropicLlmClient({ apiKey: 'k', model: 'm' });
    await expect(client.complete({ systemPrompt: 's', messages: [], tools: [] })).rejects.toThrow(
      LlmClientError,
    );
  });
});
