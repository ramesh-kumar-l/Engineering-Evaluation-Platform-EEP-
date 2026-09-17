import { afterEach, describe, expect, it, vi } from 'vitest';
import { LlmClientError } from './llmClient.types.js';
import { OpenAiCompatibleLlmClient } from './openAiCompatibleLlmClient.js';

interface CapturedRequestBody {
  readonly model: string;
  readonly messages: { role: string; content: string | null }[];
}

describe('OpenAiCompatibleLlmClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts to <baseUrl>/chat/completions with a bearer token and parses tool_calls', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: null,
                tool_calls: [
                  { id: 'call-1', type: 'function', function: { name: 'read_file', arguments: '{"path":"a.js"}' } },
                ],
              },
            },
          ],
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new OpenAiCompatibleLlmClient({
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test',
      model: 'gpt-x',
    });
    const result = await client.complete({
      systemPrompt: 'You are an agent.',
      messages: [{ role: 'user', content: 'Fix the bug.' }],
      tools: [{ name: 'read_file', description: 'Read a file', inputSchema: { type: 'object' } }],
    });

    expect(result.content).toBe('');
    expect(result.toolCalls).toEqual([{ id: 'call-1', name: 'read_file', arguments: { path: 'a.js' } }]);

    const [url, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string>; body: string }];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(init.headers.authorization).toBe('Bearer sk-test');
    const body = JSON.parse(init.body) as CapturedRequestBody;
    expect(body.model).toBe('gpt-x');
    expect(body.messages[0]).toEqual({ role: 'system', content: 'You are an agent.' });
  });

  it('omits the Authorization header when no apiKey is given (local server)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: 'done' } }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new OpenAiCompatibleLlmClient({ baseUrl: 'http://localhost:11434/v1', model: 'local-model' });
    const result = await client.complete({ systemPrompt: 's', messages: [], tools: [] });

    expect(result.content).toBe('done');
    expect(result.toolCalls).toEqual([]);
    const [, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(init.headers.authorization).toBeUndefined();
  });

  it('treats malformed tool-call argument JSON as empty arguments rather than throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: null,
                  tool_calls: [{ id: 'c1', type: 'function', function: { name: 't', arguments: 'not-json' } }],
                },
              },
            ],
          }),
      }),
    );

    const client = new OpenAiCompatibleLlmClient({ baseUrl: 'http://localhost:1234/v1', model: 'm' });
    const result = await client.complete({ systemPrompt: 's', messages: [], tools: [] });

    expect(result.toolCalls).toEqual([{ id: 'c1', name: 't', arguments: {} }]);
  });

  it('throws LlmClientError on a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('server error') }),
    );
    const client = new OpenAiCompatibleLlmClient({ baseUrl: 'http://localhost:1234/v1', model: 'm' });
    await expect(client.complete({ systemPrompt: 's', messages: [], tools: [] })).rejects.toThrow(
      LlmClientError,
    );
  });

  it('throws LlmClientError when the response has no choices', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }));
    const client = new OpenAiCompatibleLlmClient({ baseUrl: 'http://localhost:1234/v1', model: 'm' });
    await expect(client.complete({ systemPrompt: 's', messages: [], tools: [] })).rejects.toThrow(
      LlmClientError,
    );
  });
});
