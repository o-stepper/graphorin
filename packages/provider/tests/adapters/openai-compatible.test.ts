/**
 * Coverage for `openAICompatibleAdapter` - same SSE shape as
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

  it('OLLAMA-AD-02: an aborted stream reports finishReason aborted, not stop', async () => {
    const provider = openAICompatibleAdapter({
      model: 'lmstudio',
      baseUrl: 'http://127.0.0.1:1234',
      // A stream with no finish_reason chunk; the aborted signal ends it.
      fetchImpl: makeFetchImpl({
        body: makeSseStream([{ choices: [{ delta: { content: 'partial' } }] }]),
      }),
      logger: () => {},
    });
    const controller = new AbortController();
    controller.abort();
    const events = await collect(
      provider.stream({ messages: [{ role: 'user', content: 'hi' }], signal: controller.signal }),
    );
    const finish = events.at(-1);
    if (finish?.type !== 'finish') throw new Error('expected finish');
    expect(finish.finishReason).toBe('aborted');
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
    // JSON.stringify drops the undefined override - the field is gone.
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

describe('prompt-cache usage on the OpenAI wire (core-provider-02)', () => {
  it('maps prompt_tokens_details.cached_tokens onto Usage.cachedReadTokens', async () => {
    const provider = openAICompatibleAdapter({
      model: 'gpt-test',
      baseUrl: 'http://127.0.0.1:1234',
      fetchImpl: makeFetchImpl({
        body: makeSseStream([
          { choices: [{ delta: { content: 'hi' } }] },
          {
            choices: [{ finish_reason: 'stop' }],
            usage: {
              prompt_tokens: 120,
              completion_tokens: 4,
              total_tokens: 124,
              prompt_tokens_details: { cached_tokens: 100 },
            },
          },
          '[DONE]',
        ]),
      }),
      logger: () => {},
    });
    const events = await collect(provider.stream({ messages: [{ role: 'user', content: 'hi' }] }));
    const finish = events.at(-1);
    if (finish?.type !== 'finish') throw new Error('expected finish');
    // prompt_tokens already INCLUDES the cached subset on this wire.
    expect(finish.usage.promptTokens).toBe(120);
    expect(finish.usage.cachedReadTokens).toBe(100);
    expect(finish.usage.cacheWriteTokens).toBeUndefined();
  });

  it('absent details leave the pre-cache Usage shape untouched', async () => {
    const provider = openAICompatibleAdapter({
      model: 'gpt-test',
      baseUrl: 'http://127.0.0.1:1234',
      fetchImpl: makeFetchImpl({
        body: makeSseStream([
          { choices: [{ delta: { content: 'hi' } }] },
          {
            choices: [{ finish_reason: 'stop' }],
            usage: { prompt_tokens: 8, completion_tokens: 2, total_tokens: 10 },
          },
          '[DONE]',
        ]),
      }),
      logger: () => {},
    });
    const events = await collect(provider.stream({ messages: [{ role: 'user', content: 'hi' }] }));
    const finish = events.at(-1);
    if (finish?.type !== 'finish') throw new Error('expected finish');
    expect(finish.usage).toEqual({ promptTokens: 8, completionTokens: 2, totalTokens: 10 });
  });
});

describe('C2 - adapter-level worked-example folding (OpenAI wire)', () => {
  it('folds examples into function.description on the raw adapter path', async () => {
    const capture: { init?: RequestInit } = {};
    const provider = openAICompatibleAdapter({
      model: 'gpt-test',
      baseUrl: 'http://127.0.0.1:1234',
      fetchImpl: makeFetchImpl({
        body: makeSseStream([
          { choices: [{ delta: { content: 'ok' } }] },
          { choices: [{ finish_reason: 'stop' }] },
          '[DONE]',
        ]),
        capture,
      }),
      logger: () => {},
    });
    await collect(
      provider.stream({
        messages: [{ role: 'user', content: 'hi' }],
        tools: [
          {
            name: 'weather',
            description: 'look up the weather',
            inputSchema: { type: 'object' },
            examples: [{ input: { city: 'kyiv' }, output: 'sunny' }],
          },
        ],
      }),
    );
    const body = JSON.parse(String(capture.init?.body ?? '{}')) as {
      tools?: Array<{ function?: { description?: string } }>;
    };
    expect(body.tools?.[0]?.function?.description).toContain('Examples:');
    expect(body.tools?.[0]?.function?.description).toContain('"city":"kyiv"');
  });
});

describe('deep-retest-0.13.6 P2-1 - /v1-aware default chatPath', () => {
  async function urlFor(baseUrl: string, chatPath?: string): Promise<string> {
    const capture: { url?: string; init?: RequestInit } = {};
    const provider = openAICompatibleAdapter({
      model: 'qwen2.5-7b-instruct',
      baseUrl,
      ...(chatPath !== undefined ? { chatPath } : {}),
      fetchImpl: makeFetchImpl({
        jsonOnce: { choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] },
        capture,
      }),
      logger: () => {},
    });
    await provider.generate({ messages: [{ role: 'user', content: 'hi' }] });
    return capture.url ?? '';
  }

  it('the providers-guide example baseUrl (.../v1) reaches /v1/chat/completions exactly once', async () => {
    // The exact snippet from documentation/guide/providers.md - a
    // copy/paste user must land on the endpoint, not /v1/v1/... + 404.
    expect(await urlFor('http://127.0.0.1:1234/v1')).toBe(
      'http://127.0.0.1:1234/v1/chat/completions',
    );
  });

  it('an origin baseUrl keeps the classic default', async () => {
    expect(await urlFor('http://127.0.0.1:1234')).toBe('http://127.0.0.1:1234/v1/chat/completions');
  });

  it('a trailing slash after /v1 normalizes the same way', async () => {
    expect(await urlFor('http://127.0.0.1:1234/v1/')).toBe(
      'http://127.0.0.1:1234/v1/chat/completions',
    );
  });

  it('a vendor prefix ending in /v1 (groq-style /openai/v1) is preserved once', async () => {
    expect(await urlFor('https://api.groq.com/openai/v1')).toBe(
      'https://api.groq.com/openai/v1/chat/completions',
    );
  });

  it('an explicit chatPath wins verbatim even when baseUrl ends with /v1', async () => {
    expect(await urlFor('http://127.0.0.1:1234/v1', '/v1/chat/completions')).toBe(
      'http://127.0.0.1:1234/v1/v1/chat/completions',
    );
  });

  it('a host segment merely ending in v1 (no slash) does not trigger the rule', async () => {
    expect(await urlFor('http://127.0.0.1:1234/apiv1')).toBe(
      'http://127.0.0.1:1234/apiv1/v1/chat/completions',
    );
  });
});

describe('deep-retest-0.13.6 P2-2 - completion-token wire parameter', () => {
  const OK_JSON = JSON.stringify({
    choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  });
  const REJECT_MAX_TOKENS = JSON.stringify({
    error: {
      message:
        "Unsupported parameter: 'max_tokens' is not supported with this model. " +
        "Use 'max_completion_tokens' instead.",
      type: 'invalid_request_error',
      param: 'max_tokens',
      code: 'unsupported_parameter',
    },
  });

  function makeSequencedFetch(
    responses: ReadonlyArray<() => Response>,
    calls: Array<{ url: string; body: Record<string, unknown> }>,
  ): typeof fetch {
    return (async (input: unknown, init?: RequestInit): Promise<Response> => {
      calls.push({
        url: String(input),
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      });
      const next = responses[Math.min(calls.length - 1, responses.length - 1)];
      if (next === undefined) throw new Error('sequenced fetch exhausted');
      return next();
    }) as typeof fetch;
  }

  it('sends max_tokens by default', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const provider = openAICompatibleAdapter({
      model: 'qwen2.5-7b-instruct',
      baseUrl: 'http://127.0.0.1:1234/v1',
      fetchImpl: makeSequencedFetch([() => new Response(OK_JSON, { status: 200 })], calls),
      logger: () => {},
    });
    await provider.generate({ messages: [{ role: 'user', content: 'hi' }], maxTokens: 64 });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.body.max_tokens).toBe(64);
    expect('max_completion_tokens' in (calls[0]?.body ?? {})).toBe(false);
  });

  it('tokenLimitParam pins max_completion_tokens up front', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const provider = openAICompatibleAdapter({
      model: 'gpt-5.6-luna',
      baseUrl: 'http://127.0.0.1:1234/v1',
      tokenLimitParam: 'max_completion_tokens',
      fetchImpl: makeSequencedFetch([() => new Response(OK_JSON, { status: 200 })], calls),
      logger: () => {},
    });
    await provider.generate({ messages: [{ role: 'user', content: 'hi' }], maxTokens: 64 });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.body.max_completion_tokens).toBe(64);
    expect('max_tokens' in (calls[0]?.body ?? {})).toBe(false);
  });

  it('generate(): a 400 naming max_completion_tokens is retried once remapped, then learned', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const warns: string[] = [];
    const provider = openAICompatibleAdapter({
      model: 'gpt-5.6-luna',
      baseUrl: 'http://127.0.0.1:1234/v1',
      fetchImpl: makeSequencedFetch(
        [
          () => new Response(REJECT_MAX_TOKENS, { status: 400 }),
          () => new Response(OK_JSON, { status: 200 }),
          () => new Response(OK_JSON, { status: 200 }),
        ],
        calls,
      ),
      logger: (level, message) => {
        if (level === 'warn') warns.push(message);
      },
    });
    const first = await provider.generate({
      messages: [{ role: 'user', content: 'hi' }],
      maxTokens: 64,
    });
    expect(first.text).toBe('ok');
    expect(calls).toHaveLength(2);
    expect(calls[0]?.body.max_tokens).toBe(64);
    expect(calls[1]?.body.max_completion_tokens).toBe(64);
    expect('max_tokens' in (calls[1]?.body ?? {})).toBe(false);
    expect(warns.some((w) => w.includes('max_completion_tokens'))).toBe(true);

    // The instance remembers: the next call goes straight to the
    // remapped parameter with a single request.
    await provider.generate({ messages: [{ role: 'user', content: 'hi' }], maxTokens: 32 });
    expect(calls).toHaveLength(3);
    expect(calls[2]?.body.max_completion_tokens).toBe(32);
    expect('max_tokens' in (calls[2]?.body ?? {})).toBe(false);
  });

  it('stream(): the same 400 remaps before the first event', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const provider = openAICompatibleAdapter({
      model: 'gpt-5.6-luna',
      baseUrl: 'http://127.0.0.1:1234/v1',
      fetchImpl: makeSequencedFetch(
        [
          () => new Response(REJECT_MAX_TOKENS, { status: 400 }),
          () =>
            new Response(
              makeSseStream([
                { choices: [{ delta: { content: 'ok' } }] },
                { choices: [{ finish_reason: 'stop' }] },
                '[DONE]',
              ]),
              { status: 200 },
            ),
        ],
        calls,
      ),
      logger: () => {},
    });
    const events = await collect(
      provider.stream({ messages: [{ role: 'user', content: 'hi' }], maxTokens: 64 }),
    );
    expect(calls).toHaveLength(2);
    expect(calls[1]?.body.max_completion_tokens).toBe(64);
    expect(events.some((e) => e.type === 'text-delta')).toBe(true);
    expect(events.at(-1)?.type).toBe('finish');
  });

  it('an explicitly pinned max_tokens never auto-remaps - the 400 propagates', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const provider = openAICompatibleAdapter({
      model: 'gpt-5.6-luna',
      baseUrl: 'http://127.0.0.1:1234/v1',
      tokenLimitParam: 'max_tokens',
      fetchImpl: makeSequencedFetch(
        [() => new Response(REJECT_MAX_TOKENS, { status: 400 })],
        calls,
      ),
      logger: () => {},
    });
    await expect(
      provider.generate({ messages: [{ role: 'user', content: 'hi' }], maxTokens: 64 }),
    ).rejects.toThrow(/max_completion_tokens/);
    expect(calls).toHaveLength(1);
  });

  it('a request without maxTokens does not retry on that 400', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const provider = openAICompatibleAdapter({
      model: 'gpt-5.6-luna',
      baseUrl: 'http://127.0.0.1:1234/v1',
      fetchImpl: makeSequencedFetch(
        [() => new Response(REJECT_MAX_TOKENS, { status: 400 })],
        calls,
      ),
      logger: () => {},
    });
    await expect(
      provider.generate({ messages: [{ role: 'user', content: 'hi' }] }),
    ).rejects.toThrow();
    expect(calls).toHaveLength(1);
  });
});

describe('deep-retest-0.13.9 P1 - unsupported-parameter recovery', () => {
  const OK_JSON = JSON.stringify({
    choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  });
  const REJECT_TEMPERATURE = JSON.stringify({
    error: {
      message:
        "Unsupported value: 'temperature' does not support 0 with this model. " +
        'Only the default (1) value is supported.',
      type: 'invalid_request_error',
      param: 'temperature',
      code: 'unsupported_value',
    },
  });
  const REJECT_TOOLS_REASONING = JSON.stringify({
    error: {
      message:
        'Function tools with reasoning_effort are not supported for gpt-5.6-luna in ' +
        "/v1/chat/completions. To use function tools, use /v1/responses or set reasoning_effort to 'none'.",
      type: 'invalid_request_error',
      param: null,
      code: 'unsupported_parameter',
    },
  });
  const TOOLS = [
    {
      name: 'add_numbers',
      description: 'Add two numbers',
      inputSchema: { type: 'object', properties: { a: { type: 'number' } } },
    },
  ];

  function makeSequencedFetch(
    responses: ReadonlyArray<() => Response>,
    calls: Array<{ url: string; body: Record<string, unknown> }>,
  ): typeof fetch {
    return (async (input: unknown, init?: RequestInit): Promise<Response> => {
      calls.push({
        url: String(input),
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      });
      const next = responses[Math.min(calls.length - 1, responses.length - 1)];
      if (next === undefined) throw new Error('sequenced fetch exhausted');
      return next();
    }) as typeof fetch;
  }

  it('generate(): a 400 rejecting temperature is retried once without it, then learned', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const warns: string[] = [];
    const provider = openAICompatibleAdapter({
      model: 'gpt-5.6-luna',
      baseUrl: 'http://127.0.0.1:1234/v1',
      fetchImpl: makeSequencedFetch(
        [
          () => new Response(REJECT_TEMPERATURE, { status: 400 }),
          () => new Response(OK_JSON, { status: 200 }),
          () => new Response(OK_JSON, { status: 200 }),
        ],
        calls,
      ),
      logger: (level, message) => {
        if (level === 'warn') warns.push(message);
      },
    });
    const first = await provider.generate({
      messages: [{ role: 'user', content: 'hi' }],
      temperature: 0,
    });
    expect(first.text).toBe('ok');
    expect(calls).toHaveLength(2);
    expect(calls[0]?.body.temperature).toBe(0);
    expect('temperature' in (calls[1]?.body ?? {})).toBe(false);
    expect(warns.some((w) => w.includes("'temperature'"))).toBe(true);

    // The instance remembers: later requests skip the doomed attempt.
    await provider.generate({ messages: [{ role: 'user', content: 'hi' }], temperature: 0 });
    expect(calls).toHaveLength(3);
    expect('temperature' in (calls[2]?.body ?? {})).toBe(false);
  });

  it('stream(): the alternate "Unsupported parameter" spelling also recovers', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const provider = openAICompatibleAdapter({
      model: 'o1',
      baseUrl: 'http://127.0.0.1:1234/v1',
      fetchImpl: makeSequencedFetch(
        [
          () =>
            new Response(
              JSON.stringify({
                error: {
                  message: "Unsupported parameter: 'temperature' is not supported with this model.",
                  type: 'invalid_request_error',
                },
              }),
              { status: 400 },
            ),
          () =>
            new Response(
              makeSseStream([
                { choices: [{ delta: { content: 'ok' } }] },
                { choices: [{ finish_reason: 'stop' }] },
                '[DONE]',
              ]),
              { status: 200 },
            ),
        ],
        calls,
      ),
      logger: () => {},
    });
    const events = await collect(
      provider.stream({ messages: [{ role: 'user', content: 'hi' }], temperature: 0 }),
    );
    expect(calls).toHaveLength(2);
    expect('temperature' in (calls[1]?.body ?? {})).toBe(false);
    expect(events.at(-1)?.type).toBe('finish');
  });

  it('a tools 400 naming reasoning_effort retries with reasoning_effort none, scoped to tool requests', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const warns: string[] = [];
    const provider = openAICompatibleAdapter({
      model: 'gpt-5.6-luna',
      baseUrl: 'http://127.0.0.1:1234/v1',
      fetchImpl: makeSequencedFetch(
        [
          () => new Response(REJECT_TOOLS_REASONING, { status: 400 }),
          () => new Response(OK_JSON, { status: 200 }),
          () => new Response(OK_JSON, { status: 200 }),
          () => new Response(OK_JSON, { status: 200 }),
        ],
        calls,
      ),
      logger: (level, message) => {
        if (level === 'warn') warns.push(message);
      },
    });
    const first = await provider.generate({
      messages: [{ role: 'user', content: 'hi' }],
      tools: TOOLS,
    });
    expect(first.text).toBe('ok');
    expect(calls).toHaveLength(2);
    expect('reasoning_effort' in (calls[0]?.body ?? {})).toBe(false);
    expect(calls[1]?.body.reasoning_effort).toBe('none');
    expect(warns.some((w) => w.includes('reasoning_effort'))).toBe(true);

    // Learned - but only for requests that actually carry tools.
    await provider.generate({ messages: [{ role: 'user', content: 'hi' }], tools: TOOLS });
    expect(calls[2]?.body.reasoning_effort).toBe('none');
    await provider.generate({ messages: [{ role: 'user', content: 'hi' }] });
    expect('reasoning_effort' in (calls[3]?.body ?? {})).toBe(false);
  });

  it('an explicit providerOptions.temperature disables the recovery - the 400 propagates', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const provider = openAICompatibleAdapter({
      model: 'gpt-5.6-luna',
      baseUrl: 'http://127.0.0.1:1234/v1',
      fetchImpl: makeSequencedFetch(
        [() => new Response(REJECT_TEMPERATURE, { status: 400 })],
        calls,
      ),
      logger: () => {},
    });
    await expect(
      provider.generate({
        messages: [{ role: 'user', content: 'hi' }],
        temperature: 0,
        providerOptions: { temperature: 0 },
      }),
    ).rejects.toThrow(/temperature/);
    expect(calls).toHaveLength(1);
  });

  it('an explicit providerOptions.reasoning_effort disables that recovery too', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const provider = openAICompatibleAdapter({
      model: 'gpt-5.6-luna',
      baseUrl: 'http://127.0.0.1:1234/v1',
      fetchImpl: makeSequencedFetch(
        [() => new Response(REJECT_TOOLS_REASONING, { status: 400 })],
        calls,
      ),
      logger: () => {},
    });
    await expect(
      provider.generate({
        messages: [{ role: 'user', content: 'hi' }],
        tools: TOOLS,
        providerOptions: { reasoning_effort: 'low' },
      }),
    ).rejects.toThrow(/reasoning_effort/);
    expect(calls).toHaveLength(1);
  });

  it("unsupportedParamRecovery: 'off' restores fail-loud passthrough", async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const provider = openAICompatibleAdapter({
      model: 'gpt-5.6-luna',
      baseUrl: 'http://127.0.0.1:1234/v1',
      unsupportedParamRecovery: 'off',
      fetchImpl: makeSequencedFetch(
        [() => new Response(REJECT_TEMPERATURE, { status: 400 })],
        calls,
      ),
      logger: () => {},
    });
    await expect(
      provider.generate({
        messages: [{ role: 'user', content: 'hi' }],
        temperature: 0,
      }),
    ).rejects.toThrow(/temperature/);
    expect(calls).toHaveLength(1);
  });

  it('chained recovery: token-param 400 then temperature 400 both learn in one call', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const provider = openAICompatibleAdapter({
      model: 'gpt-5.6-luna',
      baseUrl: 'http://127.0.0.1:1234/v1',
      fetchImpl: makeSequencedFetch(
        [
          () =>
            new Response(
              JSON.stringify({
                error: {
                  message:
                    "Unsupported parameter: 'max_tokens' is not supported with this model. " +
                    "Use 'max_completion_tokens' instead.",
                },
              }),
              { status: 400 },
            ),
          () => new Response(REJECT_TEMPERATURE, { status: 400 }),
          () => new Response(OK_JSON, { status: 200 }),
        ],
        calls,
      ),
      logger: () => {},
    });
    const out = await provider.generate({
      messages: [{ role: 'user', content: 'hi' }],
      temperature: 0,
      maxTokens: 64,
    });
    expect(out.text).toBe('ok');
    expect(calls).toHaveLength(3);
    expect(calls[2]?.body.max_completion_tokens).toBe(64);
    expect('temperature' in (calls[2]?.body ?? {})).toBe(false);
  });
});

describe('W-095 - multimodal image passing', () => {
  const IMG = new Uint8Array([1, 2, 3]);
  const RESPONSE = {
    choices: [{ message: { content: 'a cat' }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
  };
  const imageRequest = {
    messages: [
      {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: 'describe' },
          { type: 'image' as const, image: IMG, mimeType: 'image/jpeg' },
        ],
      },
    ],
  };

  it('capabilities.multimodal: true puts image_url parts on the wire', async () => {
    const capture: { url?: string; init?: RequestInit } = {};
    const provider = openAICompatibleAdapter({
      model: 'llava',
      baseUrl: 'http://127.0.0.1:1234',
      fetchImpl: makeFetchImpl({ jsonOnce: RESPONSE, capture }),
      logger: () => {},
      capabilities: { multimodal: true },
    });
    const result = await provider.generate(imageRequest);
    expect(result.text).toBe('a cat');
    const body = String(capture.init?.body ?? '');
    expect(body).toContain('"image_url"');
    expect(body).toContain(`data:image/jpeg;base64,${Buffer.from(IMG).toString('base64')}`);
  });

  it('default capabilities: body stays a flat string and ONE warn names the dropped kind', async () => {
    const capture: { url?: string; init?: RequestInit } = {};
    const warns: string[] = [];
    const provider = openAICompatibleAdapter({
      model: 'lmstudio',
      baseUrl: 'http://127.0.0.1:1234',
      fetchImpl: makeFetchImpl({ jsonOnce: RESPONSE, capture }),
      logger: (level, message) => {
        if (level === 'warn') warns.push(message);
      },
    });
    await provider.generate(imageRequest);
    await provider.generate(imageRequest);
    const body = String(capture.init?.body ?? '');
    expect(body).not.toContain('image_url');
    expect(body).toContain('"content":"describe"');
    const dropWarns = warns.filter((w) => w.includes('capabilities.multimodal'));
    expect(dropWarns).toHaveLength(1);
    expect(dropWarns[0]).toContain('image');
  });
});

describe('deep-retest-0.13.10 P1 - concurrent cold-start recovery', () => {
  const OK_JSON = JSON.stringify({
    choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  });
  const REJECT_TEMPERATURE = JSON.stringify({
    error: {
      message:
        "Unsupported value: 'temperature' does not support 0 with this model. " +
        'Only the default (1) value is supported.',
      type: 'invalid_request_error',
      param: 'temperature',
      code: 'unsupported_value',
    },
  });
  const REJECT_MAX_TOKENS = JSON.stringify({
    error: {
      message:
        "Unsupported parameter: 'max_tokens' is not supported with this model. " +
        "Use 'max_completion_tokens' instead.",
      type: 'invalid_request_error',
      param: 'max_tokens',
      code: 'unsupported_parameter',
    },
  });
  const REJECT_TOOLS_REASONING = JSON.stringify({
    error: {
      message:
        'Function tools with reasoning_effort are not supported for gpt-5.6-luna in ' +
        "/v1/chat/completions. To use function tools, use /v1/responses or set reasoning_effort to 'none'.",
      type: 'invalid_request_error',
      param: null,
      code: 'unsupported_parameter',
    },
  });
  const TOOLS = [
    {
      name: 'add_numbers',
      description: 'Add two numbers',
      inputSchema: { type: 'object', properties: { a: { type: 'number' } } },
    },
  ];

  /**
   * Holds the first `holdFirst` requests until ALL of them are in
   * flight, then releases them together - the deterministic shape of
   * a cold concurrent batch where every sibling's first attempt fails
   * before any of them has learned.
   */
  function makeBarrierFetch(opts: {
    readonly holdFirst: number;
    readonly respond: (body: Record<string, unknown>) => Response;
    readonly calls: Array<{ url: string; body: Record<string, unknown> }>;
  }): typeof fetch {
    const waiters: Array<() => void> = [];
    return (async (input: unknown, init?: RequestInit): Promise<Response> => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      opts.calls.push({ url: String(input), body });
      if (opts.calls.length <= opts.holdFirst) {
        await new Promise<void>((resolve) => {
          waiters.push(resolve);
          if (waiters.length === opts.holdFirst) {
            for (const w of waiters) w();
          }
        });
      }
      return opts.respond(body);
    }) as typeof fetch;
  }

  it('two concurrent cold generates with unsupported temperature BOTH recover', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const warns: string[] = [];
    const provider = openAICompatibleAdapter({
      model: 'gpt-5.6-luna',
      baseUrl: 'http://127.0.0.1:1234/v1',
      fetchImpl: makeBarrierFetch({
        holdFirst: 2,
        calls,
        respond: (body) =>
          'temperature' in body
            ? new Response(REJECT_TEMPERATURE, { status: 400 })
            : new Response(OK_JSON, { status: 200 }),
      }),
      logger: (level, message) => {
        if (level === 'warn') warns.push(message);
      },
    });
    const [a, b] = await Promise.all([
      provider.generate({ messages: [{ role: 'user', content: 'a' }], temperature: 0 }),
      provider.generate({ messages: [{ role: 'user', content: 'b' }], temperature: 0 }),
    ]);
    // The old state-gated predicates made the second sibling forfeit
    // its retry and surface the 400 (reranker fallback / caller error).
    expect(a.text).toBe('ok');
    expect(b.text).toBe('ok');
    expect(calls).toHaveLength(4);
    expect(calls.filter((c) => 'temperature' in c.body)).toHaveLength(2);
    // The instance still learns (and warns) exactly once.
    expect(warns.filter((w) => w.includes("'temperature'"))).toHaveLength(1);
  });

  it('cold concurrent batch of five (the reranker shape) - zero surfaced errors', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const warns: string[] = [];
    const provider = openAICompatibleAdapter({
      model: 'gpt-5.6-luna',
      baseUrl: 'http://127.0.0.1:1234/v1',
      fetchImpl: makeBarrierFetch({
        holdFirst: 5,
        calls,
        respond: (body) =>
          'temperature' in body
            ? new Response(REJECT_TEMPERATURE, { status: 400 })
            : new Response(OK_JSON, { status: 200 }),
      }),
      logger: (level, message) => {
        if (level === 'warn') warns.push(message);
      },
    });
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        provider.generate({ messages: [{ role: 'user', content: `p${i}` }], temperature: 0 }),
      ),
    );
    expect(results.map((r) => r.text)).toEqual(['ok', 'ok', 'ok', 'ok', 'ok']);
    expect(calls).toHaveLength(10);
    expect(warns.filter((w) => w.includes("'temperature'"))).toHaveLength(1);
  });

  it('two concurrent cold tool calls both recover via reasoning_effort none', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const provider = openAICompatibleAdapter({
      model: 'gpt-5.6-luna',
      baseUrl: 'http://127.0.0.1:1234/v1',
      fetchImpl: makeBarrierFetch({
        holdFirst: 2,
        calls,
        respond: (body) =>
          body.tools !== undefined && body.reasoning_effort === undefined
            ? new Response(REJECT_TOOLS_REASONING, { status: 400 })
            : new Response(OK_JSON, { status: 200 }),
      }),
      logger: () => {},
    });
    const [a, b] = await Promise.all([
      provider.generate({ messages: [{ role: 'user', content: 'a' }], tools: TOOLS }),
      provider.generate({ messages: [{ role: 'user', content: 'b' }], tools: TOOLS }),
    ]);
    expect(a.text).toBe('ok');
    expect(b.text).toBe('ok');
    expect(calls).toHaveLength(4);
    expect(calls.filter((c) => c.body.reasoning_effort === 'none')).toHaveLength(2);
  });

  it('chained token+temperature recovery survives a concurrent cold start', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const warns: string[] = [];
    const provider = openAICompatibleAdapter({
      model: 'gpt-5.6-luna',
      baseUrl: 'http://127.0.0.1:1234/v1',
      fetchImpl: makeBarrierFetch({
        holdFirst: 2,
        calls,
        respond: (body) => {
          if ('max_tokens' in body) return new Response(REJECT_MAX_TOKENS, { status: 400 });
          if ('temperature' in body) return new Response(REJECT_TEMPERATURE, { status: 400 });
          return new Response(OK_JSON, { status: 200 });
        },
      }),
      logger: (level, message) => {
        if (level === 'warn') warns.push(message);
      },
    });
    const [a, b] = await Promise.all([
      provider.generate({
        messages: [{ role: 'user', content: 'a' }],
        temperature: 0,
        maxTokens: 8,
      }),
      provider.generate({
        messages: [{ role: 'user', content: 'b' }],
        temperature: 0,
        maxTokens: 8,
      }),
    ]);
    expect(a.text).toBe('ok');
    expect(b.text).toBe('ok');
    // Exact interleaving of the second wave is engine-scheduling
    // dependent (a sibling may pick up the strip learned in between),
    // so assert bounds instead of a fixed trace.
    expect(calls.length).toBeGreaterThanOrEqual(5);
    expect(calls.length).toBeLessThanOrEqual(6);
    // Learned state settles: a third call goes through in ONE request.
    const before = calls.length;
    await provider.generate({
      messages: [{ role: 'user', content: 'c' }],
      temperature: 0,
      maxTokens: 8,
    });
    expect(calls).toHaveLength(before + 1);
    const last = calls.at(-1)?.body ?? {};
    expect('max_tokens' in last).toBe(false);
    expect('temperature' in last).toBe(false);
    expect(last.max_completion_tokens).toBe(8);
    expect(warns.filter((w) => w.includes('max_completion_tokens'))).toHaveLength(1);
  });

  it('a concurrent stream() and generate() pair both recover from the shared cold start', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const provider = openAICompatibleAdapter({
      model: 'gpt-5.6-luna',
      baseUrl: 'http://127.0.0.1:1234/v1',
      fetchImpl: makeBarrierFetch({
        holdFirst: 2,
        calls,
        respond: (body) => {
          if ('temperature' in body) return new Response(REJECT_TEMPERATURE, { status: 400 });
          if (body.stream === true) {
            return new Response(
              makeSseStream([
                { choices: [{ delta: { content: 'ok' } }] },
                { choices: [{ finish_reason: 'stop' }] },
                '[DONE]',
              ]),
              { status: 200 },
            );
          }
          return new Response(OK_JSON, { status: 200 });
        },
      }),
      logger: () => {},
    });
    const [events, gen] = await Promise.all([
      collect(provider.stream({ messages: [{ role: 'user', content: 's' }], temperature: 0 })),
      provider.generate({ messages: [{ role: 'user', content: 'g' }], temperature: 0 }),
    ]);
    expect(events.at(-1)?.type).toBe('finish');
    expect(gen.text).toBe('ok');
    expect(calls).toHaveLength(4);
  });

  describe('deep-retest-0.13.11 P1 - single-flight cold recovery', () => {
    it('five-way chained token+temperature: only the leader climbs the ladder', async () => {
      const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
      const warns: string[] = [];
      const provider = openAICompatibleAdapter({
        model: 'gpt-5.6-luna',
        baseUrl: 'http://127.0.0.1:1234/v1',
        fetchImpl: makeBarrierFetch({
          holdFirst: 5,
          calls,
          respond: (body) => {
            if ('max_tokens' in body) return new Response(REJECT_MAX_TOKENS, { status: 400 });
            if ('temperature' in body) return new Response(REJECT_TEMPERATURE, { status: 400 });
            return new Response(OK_JSON, { status: 200 });
          },
        }),
        logger: (level, message) => {
          if (level === 'warn') warns.push(message);
        },
      });
      const results = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          provider.generate({
            messages: [{ role: 'user', content: `p${i}` }],
            temperature: 0,
            maxTokens: 8,
          }),
        ),
      );
      expect(results.map((r) => r.text)).toEqual(['ok', 'ok', 'ok', 'ok', 'ok']);
      // 5 cold sends + the leader's two remaining rungs + 4 waiter
      // retries from the settled state = 11. Without the flight every
      // sibling climbed both rungs itself: 15 calls, 10 of them 400s.
      expect(calls).toHaveLength(11);
      // The doomed intermediate shape (new token param, temperature
      // still present) is sent exactly once - by the leader.
      expect(
        calls.filter((c) => 'max_completion_tokens' in c.body && 'temperature' in c.body),
      ).toHaveLength(1);
      expect(warns.filter((w) => w.includes('max_completion_tokens'))).toHaveLength(1);
      expect(warns.filter((w) => w.includes("'temperature'"))).toHaveLength(1);
    });

    it('tri-recovery interleaving: token, temperature and reasoning_effort learn concurrently', async () => {
      const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
      const warns: string[] = [];
      const provider = openAICompatibleAdapter({
        model: 'gpt-5.6-luna',
        baseUrl: 'http://127.0.0.1:1234/v1',
        fetchImpl: makeBarrierFetch({
          holdFirst: 3,
          calls,
          respond: (body) => {
            if ('max_tokens' in body) return new Response(REJECT_MAX_TOKENS, { status: 400 });
            if ('temperature' in body) return new Response(REJECT_TEMPERATURE, { status: 400 });
            if (body.tools !== undefined && body.reasoning_effort === undefined) {
              return new Response(REJECT_TOOLS_REASONING, { status: 400 });
            }
            return new Response(OK_JSON, { status: 200 });
          },
        }),
        logger: (level, message) => {
          if (level === 'warn') warns.push(message);
        },
      });
      const [t, p, m] = await Promise.all([
        provider.generate({ messages: [{ role: 'user', content: 't' }], tools: TOOLS }),
        provider.generate({ messages: [{ role: 'user', content: 'p' }], temperature: 0 }),
        provider.generate({ messages: [{ role: 'user', content: 'm' }], maxTokens: 8 }),
      ]);
      expect([t.text, p.text, m.text]).toEqual(['ok', 'ok', 'ok']);
      // Each call learned ITS dimension before waiting, so every waiter
      // retry succeeds in one request: 3 cold sends + 3 retries.
      expect(calls).toHaveLength(6);
      expect(warns).toHaveLength(3);
      // The instance is now fully learned: a request using all three
      // features goes through in exactly ONE call.
      const before = calls.length;
      const combined = await provider.generate({
        messages: [{ role: 'user', content: 'all' }],
        temperature: 0,
        maxTokens: 8,
        tools: TOOLS,
      });
      expect(combined.text).toBe('ok');
      expect(calls).toHaveLength(before + 1);
      const last = calls.at(-1)?.body ?? {};
      expect('max_tokens' in last).toBe(false);
      expect('temperature' in last).toBe(false);
      expect(last.max_completion_tokens).toBe(8);
      expect(last.reasoning_effort).toBe('none');
    });

    it('a waiter survives the leader dying mid-ladder (non-recoverable 500)', async () => {
      const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
      const provider = openAICompatibleAdapter({
        model: 'gpt-5.6-luna',
        baseUrl: 'http://127.0.0.1:1234/v1',
        fetchImpl: makeBarrierFetch({
          holdFirst: 2,
          calls,
          respond: (body) => {
            if ('temperature' in body) return new Response(REJECT_TEMPERATURE, { status: 400 });
            // The leader's retry (third call) dies on a server error;
            // the waiter's retry must still go through on its own.
            if (calls.length === 3) return new Response('{"error":{}}', { status: 500 });
            return new Response(OK_JSON, { status: 200 });
          },
        }),
        logger: () => {},
      });
      const settled = await Promise.allSettled([
        provider.generate({ messages: [{ role: 'user', content: 'a' }], temperature: 0 }),
        provider.generate({ messages: [{ role: 'user', content: 'b' }], temperature: 0 }),
      ]);
      const rejected = settled.filter((s) => s.status === 'rejected');
      const fulfilled = settled.filter(
        (s): s is PromiseFulfilledResult<Awaited<ReturnType<typeof provider.generate>>> =>
          s.status === 'fulfilled',
      );
      expect(rejected).toHaveLength(1);
      expect((rejected[0]?.reason as { status?: number }).status).toBe(500);
      expect(fulfilled[0]?.value.text).toBe('ok');
      expect(calls).toHaveLength(4);
    });
  });
});
