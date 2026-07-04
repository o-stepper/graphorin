/**
 * Coverage for `openAICompatibleAdapter` — same SSE shape as
 * `llamaCppServerAdapter`. Includes reasoning_content streaming and
 * sensitivity-override audit log.
 */
import type { ProviderEvent } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { openAICompatibleAdapter } from '../../src/adapters/openai-compatible.js';
import { LocalProviderInsecureTransportError } from '../../src/errors/errors.js';

function makeSseStream(chunks: ReadonlyArray<object | '[DONE]'>): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) {
        const payload = c === '[DONE]' ? '[DONE]' : JSON.stringify(c);
        controller.enqueue(enc.encode(`data: ${payload}\n\n`));
      }
      controller.close();
    },
  });
}

function makeFetchImpl(args: {
  body?: ReadableStream<Uint8Array>;
  jsonOnce?: object;
  capture?: { url?: string; init?: RequestInit };
}): typeof fetch {
  return (async (input: unknown, init?: RequestInit): Promise<Response> => {
    if (args.capture !== undefined) {
      args.capture.url = String(input);
      args.capture.init = init ?? {};
    }
    if (args.jsonOnce !== undefined) {
      return new Response(JSON.stringify(args.jsonOnce), { status: 200 });
    }
    return new Response(args.body ?? new ReadableStream<Uint8Array>(), { status: 200 });
  }) as typeof fetch;
}

async function collect(stream: AsyncIterable<ProviderEvent>): Promise<ProviderEvent[]> {
  const out: ProviderEvent[] = [];
  for await (const ev of stream) out.push(ev);
  return out;
}

describe('openAICompatibleAdapter', () => {
  it('refuses to start on a public-cleartext baseUrl', () => {
    expect(() =>
      openAICompatibleAdapter({
        model: 'lmstudio',
        baseUrl: 'http://example.com:8000',
        fetchImpl: makeFetchImpl({}),
        logger: () => {},
      }),
    ).toThrow(LocalProviderInsecureTransportError);
  });

  it('streams text-delta + reasoning-delta and emits finish with usage', async () => {
    const provider = openAICompatibleAdapter({
      model: 'lmstudio',
      baseUrl: 'http://127.0.0.1:1234',
      fetchImpl: makeFetchImpl({
        body: makeSseStream([
          { choices: [{ delta: { reasoning_content: 'plan ' } }] },
          { choices: [{ delta: { content: 'Hel' } }] },
          { choices: [{ delta: { content: 'lo' } }] },
          {
            choices: [{ finish_reason: 'stop' }],
            usage: {
              prompt_tokens: 8,
              completion_tokens: 2,
              total_tokens: 10,
              reasoning_tokens: 5,
            },
          },
          '[DONE]',
        ]),
      }),
      logger: () => {},
    });
    const events = await collect(provider.stream({ messages: [{ role: 'user', content: 'hi' }] }));
    const reasoning = events.filter((e) => e.type === 'reasoning-delta');
    expect(reasoning).toHaveLength(1);
    const text = events
      .filter((e) => e.type === 'text-delta')
      .map((e) => (e as { delta: string }).delta)
      .join('');
    expect(text).toBe('Hello');
    const finish = events.at(-1);
    if (finish?.type !== 'finish') throw new Error('expected finish');
    expect(finish.usage).toEqual({
      promptTokens: 8,
      completionTokens: 2,
      totalTokens: 10,
      reasoningTokens: 5,
    });
  });

  it("maps the wire 'content_filter' finish reason to 'content-filter' (PS-12)", async () => {
    const provider = openAICompatibleAdapter({
      model: 'lmstudio',
      baseUrl: 'http://127.0.0.1:1234',
      fetchImpl: makeFetchImpl({
        body: makeSseStream([
          { choices: [{ delta: { content: 'partial' } }] },
          { choices: [{ finish_reason: 'content_filter' }] },
          '[DONE]',
        ]),
      }),
      logger: () => {},
    });
    const events = await collect(provider.stream({ messages: [{ role: 'user', content: 'hi' }] }));
    const finish = events.at(-1);
    if (finish?.type !== 'finish') throw new Error('expected finish');
    expect(finish.finishReason).toBe('content-filter'); // not the default 'stop'
  });

  it('forwards Authorization: Bearer header from apiKey', async () => {
    const capture: { url?: string; init?: RequestInit } = {};
    const provider = openAICompatibleAdapter({
      model: 'lmstudio',
      baseUrl: 'http://127.0.0.1:1234',
      apiKey: 'lm-key',
      fetchImpl: makeFetchImpl({
        body: makeSseStream([{ choices: [{ finish_reason: 'stop' }] }, '[DONE]']),
        capture,
      }),
      logger: () => {},
    });
    await collect(provider.stream({ messages: [{ role: 'user', content: 'hi' }] }));
    const headers = capture.init?.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer lm-key');
  });

  it('respects custom chatPath option', async () => {
    const capture: { url?: string; init?: RequestInit } = {};
    const provider = openAICompatibleAdapter({
      model: 'lmstudio',
      baseUrl: 'http://127.0.0.1:1234',
      chatPath: '/v2/chat',
      fetchImpl: makeFetchImpl({
        body: makeSseStream([{ choices: [{ finish_reason: 'stop' }] }, '[DONE]']),
        capture,
      }),
      logger: () => {},
    });
    await collect(provider.stream({ messages: [{ role: 'user', content: 'hi' }] }));
    expect(capture.url).toBe('http://127.0.0.1:1234/v2/chat');
  });

  it('emits an info log when caller overrides acceptsSensitivity vs the default', () => {
    const log: Array<{ level: string; message: string }> = [];
    openAICompatibleAdapter({
      model: 'lmstudio',
      baseUrl: 'http://127.0.0.1:1234',
      acceptsSensitivity: ['public'],
      fetchImpl: makeFetchImpl({}),
      logger: (level, message) => log.push({ level, message }),
    });
    expect(
      log.some((c) => c.level === 'info' && c.message.includes('sensitivity override accepted')),
    ).toBe(true);
  });

  it('generate() returns a one-shot response with parsed tool args', async () => {
    const provider = openAICompatibleAdapter({
      model: 'lmstudio',
      baseUrl: 'http://127.0.0.1:1234',
      fetchImpl: makeFetchImpl({
        jsonOnce: {
          choices: [
            {
              message: {
                content: 'final',
                tool_calls: [{ id: 'c1', function: { name: 'lookup', arguments: 'not-json' } }],
              },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
        },
      }),
      logger: () => {},
    });
    const result = await provider.generate({ messages: [{ role: 'user', content: 'hi' }] });
    expect(result.text).toBe('final');
    expect(result.toolCalls?.[0]?.args).toBe('not-json');
    expect(result.finishReason).toBe('stop');
  });

  // core-provider-09: without stream_options.include_usage, vanilla
  // OpenAI-shaped servers (vLLM, Together, OpenAI proper) never emit the
  // final usage chunk and streamed cost tracking silently zeroes.
  it('streaming requests send stream_options.include_usage by default', async () => {
    const capture: { url?: string; init?: RequestInit } = {};
    const provider = openAICompatibleAdapter({
      model: 'lmstudio',
      baseUrl: 'http://127.0.0.1:1234',
      fetchImpl: makeFetchImpl({ body: makeSseStream(['[DONE]']), capture }),
      logger: () => {},
    });
    await collect(provider.stream({ messages: [{ role: 'user', content: 'hi' }] }));
    const body = JSON.parse(String(capture.init?.body)) as Record<string, unknown>;
    expect(body.stream).toBe(true);
    expect(body.stream_options).toEqual({ include_usage: true });
  });

  it('generate() (non-streaming) does NOT send stream_options', async () => {
    const capture: { url?: string; init?: RequestInit } = {};
    const provider = openAICompatibleAdapter({
      model: 'lmstudio',
      baseUrl: 'http://127.0.0.1:1234',
      fetchImpl: makeFetchImpl({
        jsonOnce: { choices: [{ message: { content: 'x' }, finish_reason: 'stop' }] },
        capture,
      }),
      logger: () => {},
    });
    await provider.generate({ messages: [{ role: 'user', content: 'hi' }] });
    const body = JSON.parse(String(capture.init?.body)) as Record<string, unknown>;
    expect(body.stream).toBe(false);
    expect('stream_options' in body).toBe(false);
  });

  it('providerOptions can override stream_options for servers that reject the field', async () => {
    const capture: { url?: string; init?: RequestInit } = {};
    const provider = openAICompatibleAdapter({
      model: 'lmstudio',
      baseUrl: 'http://127.0.0.1:1234',
      fetchImpl: makeFetchImpl({ body: makeSseStream(['[DONE]']), capture }),
      logger: () => {},
    });
    await collect(
      provider.stream({
        messages: [{ role: 'user', content: 'hi' }],
        providerOptions: { stream_options: undefined },
      }),
    );
    const body = JSON.parse(String(capture.init?.body)) as Record<string, unknown>;
    // JSON.stringify drops the undefined override — the field is gone.
    expect('stream_options' in body).toBe(false);
  });

  // core-provider-10: the generic adapter previously pinned users to the
  // 8k/4k defaults with no way to widen them or disable response_format.
  it('forwards capability overrides (contextWindow, structuredOutput)', async () => {
    const capture: { url?: string; init?: RequestInit } = {};
    const provider = openAICompatibleAdapter({
      model: 'vllm-model',
      baseUrl: 'http://127.0.0.1:8000',
      capabilities: { contextWindow: 131_072, structuredOutput: false },
      fetchImpl: makeFetchImpl({
        jsonOnce: { choices: [{ message: { content: 'x' }, finish_reason: 'stop' }] },
        capture,
      }),
      logger: () => {},
    });
    expect(provider.capabilities.contextWindow).toBe(131_072);
    expect(provider.capabilities.structuredOutput).toBe(false);
    // structuredOutput: false keeps response_format off the wire even
    // for a structured outputType (the documented override).
    await provider.generate({
      messages: [{ role: 'user', content: 'hi' }],
      outputType: { kind: 'structured', jsonSchema: { type: 'object' } },
    });
    const body = JSON.parse(String(capture.init?.body)) as Record<string, unknown>;
    expect('response_format' in body).toBe(false);
  });

  it('forwards timeoutMs (a hung server rejects after the budget)', async () => {
    const hangingFetch = ((_input: unknown, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
        );
      })) as unknown as typeof fetch;
    const provider = openAICompatibleAdapter({
      model: 'lmstudio',
      baseUrl: 'http://127.0.0.1:1234',
      timeoutMs: 25,
      fetchImpl: hangingFetch,
      logger: () => {},
    });
    await expect(
      provider.generate({ messages: [{ role: 'user', content: 'hi' }] }),
    ).rejects.toThrow(/timed out after 25ms/);
  });
});
