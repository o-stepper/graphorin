/**
 * Coverage for `ollamaAdapter` - feeds a fixture `fetchImpl` returning
 * a hand-built ndjson `ReadableStream`. Trust-class refusal /
 * acknowledgement and per-tier WARN logging are exercised.
 */
import type { ProviderEvent } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { DEFAULT_OLLAMA_BASE_URL, ollamaAdapter } from '../../src/adapters/ollama.js';
import {
  LocalProviderInsecureTransportError,
  ProviderToolChoiceUnsupportedError,
} from '../../src/errors/errors.js';

interface LogCall {
  level: 'warn' | 'info';
  message: string;
  meta?: object;
}

function makeNdJsonStream(lines: ReadonlyArray<object>): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const line of lines) controller.enqueue(enc.encode(`${JSON.stringify(line)}\n`));
      controller.close();
    },
  });
}

function makeFetchImpl(args: {
  body?: ReadableStream<Uint8Array>;
  jsonOnce?: object;
  status?: number;
  capture?: { url?: string; init?: RequestInit };
}): typeof fetch {
  return (async (input: unknown, init?: RequestInit): Promise<Response> => {
    if (args.capture !== undefined) {
      args.capture.url = String(input);
      args.capture.init = init ?? {};
    }
    const status = args.status ?? 200;
    if (args.jsonOnce !== undefined) {
      return new Response(JSON.stringify(args.jsonOnce), { status });
    }
    return new Response(args.body ?? new ReadableStream<Uint8Array>(), { status });
  }) as typeof fetch;
}

async function collect(stream: AsyncIterable<ProviderEvent>): Promise<ProviderEvent[]> {
  const out: ProviderEvent[] = [];
  for await (const ev of stream) out.push(ev);
  return out;
}

describe('ollamaAdapter - trust class', () => {
  it('refuses to start on a public-cleartext baseUrl', () => {
    expect(() =>
      ollamaAdapter({
        model: 'llama3.1',
        baseUrl: 'http://example.com:11434',
        fetchImpl: makeFetchImpl({}),
        logger: () => {},
      }),
    ).toThrow(LocalProviderInsecureTransportError);
  });

  it('starts when allowInsecureTransport: true is acknowledged but emits a WARN', () => {
    const log: LogCall[] = [];
    const provider = ollamaAdapter({
      model: 'llama3.1',
      baseUrl: 'http://example.com:11434',
      allowInsecureTransport: true,
      fetchImpl: makeFetchImpl({}),
      logger: (level, message, meta) =>
        log.push({ level, message, ...(meta !== undefined ? { meta } : {}) }),
    });
    expect(provider.name).toBe('ollama-llama3.1');
    expect(
      log.some((c) => c.level === 'warn' && c.message.includes('allowInsecureTransport=true')),
    ).toBe(true);
  });

  it('emits a WARN when the baseUrl is on a private network', () => {
    const log: LogCall[] = [];
    ollamaAdapter({
      model: 'llama3.1',
      baseUrl: 'http://10.0.0.5:11434',
      fetchImpl: makeFetchImpl({}),
      logger: (level, message, meta) =>
        log.push({ level, message, ...(meta !== undefined ? { meta } : {}) }),
    });
    expect(
      log.some((c) => c.level === 'warn' && c.message.includes('private-network endpoint')),
    ).toBe(true);
  });

  it('emits no WARN for the default loopback baseUrl', () => {
    const log: LogCall[] = [];
    const provider = ollamaAdapter({
      model: 'llama3.1',
      fetchImpl: makeFetchImpl({}),
      logger: (level, message, meta) =>
        log.push({ level, message, ...(meta !== undefined ? { meta } : {}) }),
    });
    expect(provider.acceptsSensitivity).toEqual(['public', 'internal', 'secret']);
    expect(log).toHaveLength(0);
  });

  it('publishes default loopback baseUrl constant', () => {
    expect(DEFAULT_OLLAMA_BASE_URL).toBe('http://127.0.0.1:11434');
  });
});

describe('ollamaAdapter - streaming', () => {
  it('accumulates text-delta and emits finish with mapped usage', async () => {
    const provider = ollamaAdapter({
      model: 'llama3.1',
      fetchImpl: makeFetchImpl({
        body: makeNdJsonStream([
          { message: { role: 'assistant', content: 'Hel' } },
          { message: { content: 'lo' } },
          {
            done: true,
            done_reason: 'stop',
            prompt_eval_count: 7,
            eval_count: 3,
          },
        ]),
      }),
      logger: () => {},
    });
    const events = await collect(provider.stream({ messages: [{ role: 'user', content: 'hi' }] }));
    expect(events[0]?.type).toBe('stream-start');
    const deltas = events.filter((e) => e.type === 'text-delta');
    expect(deltas.map((e) => (e as { delta: string }).delta).join('')).toBe('Hello');
    const finish = events.at(-1);
    if (finish?.type !== 'finish') throw new Error('expected finish');
    expect(finish.usage).toEqual({ promptTokens: 7, completionTokens: 3, totalTokens: 10 });
    expect(finish.finishReason).toBe('stop');
  });

  it('extracts tool calls from the stream and emits start/end events', async () => {
    const provider = ollamaAdapter({
      model: 'llama3.1',
      fetchImpl: makeFetchImpl({
        body: makeNdJsonStream([
          {
            message: {
              tool_calls: [
                {
                  id: 'tc-1',
                  function: { name: 'lookup', arguments: { q: 'x' } },
                },
              ],
            },
          },
          { done: true, done_reason: 'tool_calls' },
        ]),
      }),
      logger: () => {},
    });
    const events = await collect(provider.stream({ messages: [{ role: 'user', content: 'hi' }] }));
    const start = events.find((e) => e.type === 'tool-call-start');
    expect(start).toMatchObject({ toolCallId: 'tc-1', toolName: 'lookup' });
    const end = events.find((e) => e.type === 'tool-call-end');
    expect(end).toMatchObject({ toolCallId: 'tc-1', finalArgs: { q: 'x' } });
    const finish = events.at(-1);
    if (finish?.type !== 'finish') throw new Error('expected finish');
    expect(finish.finishReason).toBe('tool-calls');
  });

  it('forwards systemMessage, tools, temperature, maxTokens to the request body', async () => {
    const capture: { url?: string; init?: RequestInit } = {};
    const provider = ollamaAdapter({
      model: 'llama3.1',
      fetchImpl: makeFetchImpl({
        body: makeNdJsonStream([{ done: true, done_reason: 'stop' }]),
        capture,
      }),
      logger: () => {},
    });
    await collect(
      provider.stream({
        messages: [{ role: 'user', content: 'hi' }],
        systemMessage: 'sys',
        tools: [{ name: 'lookup', description: 'd', inputSchema: { type: 'object' } }],
        temperature: 0.5,
        maxTokens: 64,
        providerOptions: { keep_alive: '5m' },
      }),
    );
    const body = JSON.parse(String(capture.init?.body)) as {
      messages: Array<{ role: string; content: string }>;
      tools: unknown;
      options: { temperature: number; num_predict: number };
      keep_alive: string;
    };
    expect(body.messages[0]).toMatchObject({ role: 'system', content: 'sys' });
    expect(body.options.temperature).toBe(0.5);
    expect(body.options.num_predict).toBe(64);
    expect(body.tools).toEqual([
      {
        type: 'function',
        function: { name: 'lookup', description: 'd', parameters: { type: 'object' } },
      },
    ]);
    expect(body.keep_alive).toBe('5m');
  });

  it('generate() returns text + toolCalls + usage from a single JSON response', async () => {
    const provider = ollamaAdapter({
      model: 'llama3.1',
      fetchImpl: makeFetchImpl({
        jsonOnce: {
          message: {
            role: 'assistant',
            content: 'final',
            tool_calls: [{ function: { name: 'lookup', arguments: { q: 'x' } } }],
          },
          done: true,
          done_reason: 'stop',
          prompt_eval_count: 5,
          eval_count: 2,
        },
      }),
      logger: () => {},
    });
    const result = await provider.generate({ messages: [{ role: 'user', content: 'hi' }] });
    expect(result.text).toBe('final');
    expect(result.toolCalls?.[0]?.toolName).toBe('lookup');
    expect(result.usage).toEqual({ promptTokens: 5, completionTokens: 2, totalTokens: 7 });
  });
});

describe('W-095 - native images array', () => {
  const IMG = new Uint8Array([9, 8, 7]);
  const RESPONSE = {
    message: { role: 'assistant', content: 'a dog' },
    done: true,
    done_reason: 'stop',
    prompt_eval_count: 5,
    eval_count: 2,
  };
  const imageRequest = {
    messages: [
      {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: 'describe' },
          { type: 'image' as const, image: IMG },
        ],
      },
    ],
  };

  it('capabilities.multimodal: true sends the per-message images base64 array', async () => {
    const capture: { url?: string; init?: RequestInit } = {};
    const provider = ollamaAdapter({
      model: 'llava',
      fetchImpl: makeFetchImpl({ jsonOnce: RESPONSE, capture }),
      logger: () => {},
      capabilities: { multimodal: true },
    });
    const result = await provider.generate(imageRequest);
    expect(result.text).toBe('a dog');
    const body = JSON.parse(String(capture.init?.body ?? '{}')) as {
      messages: Array<{ content: string; images?: string[] }>;
    };
    expect(body.messages[0]?.content).toBe('describe');
    expect(body.messages[0]?.images).toEqual([Buffer.from(IMG).toString('base64')]);
  });

  it('default capabilities: no images field, flat content, one warn per instance', async () => {
    const capture: { url?: string; init?: RequestInit } = {};
    const warns: string[] = [];
    const provider = ollamaAdapter({
      model: 'llama3.1',
      fetchImpl: makeFetchImpl({ jsonOnce: RESPONSE, capture }),
      logger: (level, message) => {
        if (level === 'warn') warns.push(message);
      },
    });
    await provider.generate(imageRequest);
    await provider.generate(imageRequest);
    const body = JSON.parse(String(capture.init?.body ?? '{}')) as {
      messages: Array<{ content: string; images?: string[] }>;
    };
    expect(body.messages[0]?.images).toBeUndefined();
    expect(body.messages[0]?.content).toBe('describe');
    expect(warns.filter((w) => w.includes('capabilities.multimodal'))).toHaveLength(1);
  });
});

describe('audit 2026-07-16 - thinking / context / keep-alive controls', () => {
  it('forwards think, keepAlive, numCtx onto the wire body', async () => {
    const capture: { url?: string; init?: RequestInit } = {};
    const provider = ollamaAdapter({
      model: 'qwen3:8b',
      think: false,
      keepAlive: '10m',
      numCtx: 40_960,
      fetchImpl: makeFetchImpl({
        body: makeNdJsonStream([{ done: true, done_reason: 'stop' }]),
        capture,
      }),
      logger: () => {},
    });
    await collect(provider.stream({ messages: [{ role: 'user', content: 'hi' }] }));
    const body = JSON.parse(String(capture.init?.body)) as {
      think: boolean;
      keep_alive: string;
      options: { num_ctx: number };
    };
    expect(body.think).toBe(false);
    expect(body.keep_alive).toBe('10m');
    expect(body.options.num_ctx).toBe(40_960);
  });

  it('numCtx drives capabilities.contextWindow; explicit capabilities still win', () => {
    const base = { fetchImpl: makeFetchImpl({}), logger: () => {} };
    expect(ollamaAdapter({ model: 'm', ...base }).capabilities.contextWindow).toBe(8_192);
    expect(ollamaAdapter({ model: 'm', numCtx: 40_960, ...base }).capabilities.contextWindow).toBe(
      40_960,
    );
    expect(
      ollamaAdapter({
        model: 'm',
        numCtx: 40_960,
        capabilities: { contextWindow: 16_384 },
        ...base,
      }).capabilities.contextWindow,
    ).toBe(16_384);
  });

  it('a truthy think flips capabilities.reasoning; think: false does not', () => {
    const base = { fetchImpl: makeFetchImpl({}), logger: () => {} };
    expect(ollamaAdapter({ model: 'm', ...base }).capabilities.reasoning).toBe(false);
    expect(ollamaAdapter({ model: 'm', think: false, ...base }).capabilities.reasoning).toBe(false);
    expect(ollamaAdapter({ model: 'm', think: true, ...base }).capabilities.reasoning).toBe(true);
    expect(ollamaAdapter({ model: 'm', think: 'high', ...base }).capabilities.reasoning).toBe(true);
    expect(
      ollamaAdapter({ model: 'm', think: true, capabilities: { reasoning: false }, ...base })
        .capabilities.reasoning,
    ).toBe(false);
  });

  it('normalizes streamed message.thinking into reasoning-delta events', async () => {
    const provider = ollamaAdapter({
      model: 'qwen3:8b',
      fetchImpl: makeFetchImpl({
        body: makeNdJsonStream([
          { message: { role: 'assistant', thinking: 'weigh the ' } },
          { message: { thinking: 'options' } },
          { message: { content: '42' } },
          { done: true, done_reason: 'stop', prompt_eval_count: 4, eval_count: 9 },
        ]),
      }),
      logger: () => {},
    });
    const events = await collect(provider.stream({ messages: [{ role: 'user', content: 'hi' }] }));
    const reasoning = events.filter((e) => e.type === 'reasoning-delta');
    expect(reasoning.map((e) => (e as { delta: string }).delta).join('')).toBe('weigh the options');
    const text = events.filter((e) => e.type === 'text-delta');
    expect(text.map((e) => (e as { delta: string }).delta).join('')).toBe('42');
  });
});

describe('audit 2026-07-16 - honest toolChoice', () => {
  const TOOLS = [{ name: 'lookup', description: 'd', inputSchema: { type: 'object' } }];

  it("toolChoice 'none' withholds the tool catalogue from the request", async () => {
    const capture: { url?: string; init?: RequestInit } = {};
    const provider = ollamaAdapter({
      model: 'llama3.1',
      fetchImpl: makeFetchImpl({
        body: makeNdJsonStream([{ done: true, done_reason: 'stop' }]),
        capture,
      }),
      logger: () => {},
    });
    await collect(
      provider.stream({
        messages: [{ role: 'user', content: 'hi' }],
        tools: TOOLS,
        toolChoice: 'none',
      }),
    );
    const body = JSON.parse(String(capture.init?.body)) as { tools?: unknown };
    expect(body.tools).toBeUndefined();
  });

  it("toolChoice 'auto' keeps the catalogue", async () => {
    const capture: { url?: string; init?: RequestInit } = {};
    const provider = ollamaAdapter({
      model: 'llama3.1',
      fetchImpl: makeFetchImpl({
        body: makeNdJsonStream([{ done: true, done_reason: 'stop' }]),
        capture,
      }),
      logger: () => {},
    });
    await collect(
      provider.stream({
        messages: [{ role: 'user', content: 'hi' }],
        tools: TOOLS,
        toolChoice: 'auto',
      }),
    );
    const body = JSON.parse(String(capture.init?.body)) as { tools?: unknown[] };
    expect(body.tools).toHaveLength(1);
  });

  it('a forced tool fails fast instead of silently degrading to auto', async () => {
    const provider = ollamaAdapter({
      model: 'llama3.1',
      fetchImpl: makeFetchImpl({
        body: makeNdJsonStream([{ done: true, done_reason: 'stop' }]),
      }),
      logger: () => {},
    });
    await expect(
      collect(
        provider.stream({
          messages: [{ role: 'user', content: 'hi' }],
          tools: TOOLS,
          toolChoice: { tool: 'lookup' },
        }),
      ),
    ).rejects.toThrow(ProviderToolChoiceUnsupportedError);
    await expect(
      provider.generate({
        messages: [{ role: 'user', content: 'hi' }],
        tools: TOOLS,
        toolChoice: 'required',
      }),
    ).rejects.toThrow(ProviderToolChoiceUnsupportedError);
  });
});

describe('audit 2026-07-16 - providerOptions options-block merge', () => {
  it('nested options merge into the built block instead of clobbering it', async () => {
    const capture: { url?: string; init?: RequestInit } = {};
    const provider = ollamaAdapter({
      model: 'llama3.1',
      numCtx: 2_048,
      fetchImpl: makeFetchImpl({
        body: makeNdJsonStream([{ done: true, done_reason: 'stop' }]),
        capture,
      }),
      logger: () => {},
    });
    await collect(
      provider.stream({
        messages: [{ role: 'user', content: 'hi' }],
        temperature: 0.5,
        providerOptions: { options: { num_ctx: 1_024, top_k: 20 } },
      }),
    );
    const body = JSON.parse(String(capture.init?.body)) as {
      options: { temperature: number; num_ctx: number; top_k: number };
    };
    expect(body.options.temperature).toBe(0.5);
    expect(body.options.num_ctx).toBe(1_024);
    expect(body.options.top_k).toBe(20);
  });
});
