/**
 * Coverage for `ollamaAdapter` - feeds a fixture `fetchImpl` returning
 * a hand-built ndjson `ReadableStream`. Trust-class refusal /
 * acknowledgement and per-tier WARN logging are exercised.
 */
import type { ProviderEvent } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { DEFAULT_OLLAMA_BASE_URL, ollamaAdapter } from '../../src/adapters/ollama.js';
import { LocalProviderInsecureTransportError } from '../../src/errors/errors.js';

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
