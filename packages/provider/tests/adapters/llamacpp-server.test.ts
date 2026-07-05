/**
 * Coverage for `llamaCppServerAdapter` - feeds a fixture `fetchImpl`
 * returning hand-built SSE chunks. Trust-class refusal, bearer-auth
 * header injection, tool-call streaming, finish reason mapping, and
 * the `generate()` one-shot are all exercised here.
 */
import type { ProviderEvent } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LLAMACPP_SERVER_BASE_URL,
  llamaCppServerAdapter,
} from '../../src/adapters/llamacpp-server.js';
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

describe('llamaCppServerAdapter - trust class', () => {
  it('refuses to start on a public-cleartext baseUrl', () => {
    expect(() =>
      llamaCppServerAdapter({
        model: 'qwen2.5',
        baseUrl: 'http://example.com:8080',
        fetchImpl: makeFetchImpl({}),
        logger: () => {},
      }),
    ).toThrow(LocalProviderInsecureTransportError);
  });

  it('uses the documented default baseUrl when not specified', () => {
    const provider = llamaCppServerAdapter({
      model: 'qwen2.5',
      fetchImpl: makeFetchImpl({}),
      logger: () => {},
    });
    expect(DEFAULT_LLAMACPP_SERVER_BASE_URL).toBe('http://127.0.0.1:8080');
    expect(provider.acceptsSensitivity).toEqual(['public', 'internal', 'secret']);
  });
});

describe('llamaCppServerAdapter - streaming', () => {
  it('streams text-delta chunks and emits finish with mapped usage', async () => {
    const provider = llamaCppServerAdapter({
      model: 'qwen2.5',
      apiKey: 'kk',
      fetchImpl: makeFetchImpl({
        body: makeSseStream([
          { choices: [{ delta: { content: 'Hel' } }] },
          { choices: [{ delta: { content: 'lo' } }] },
          {
            choices: [{ finish_reason: 'stop' }],
            usage: { prompt_tokens: 4, completion_tokens: 2, total_tokens: 6 },
          },
          '[DONE]',
        ]),
      }),
      logger: () => {},
    });
    const events = await collect(provider.stream({ messages: [{ role: 'user', content: 'hi' }] }));
    const deltas = events.filter((e) => e.type === 'text-delta');
    expect(deltas.map((e) => (e as { delta: string }).delta).join('')).toBe('Hello');
    const finish = events.at(-1);
    if (finish?.type !== 'finish') throw new Error('expected finish');
    expect(finish.usage).toEqual({ promptTokens: 4, completionTokens: 2, totalTokens: 6 });
  });

  it('accumulates streaming tool-call deltas and emits one tool-call-end per slot', async () => {
    const provider = llamaCppServerAdapter({
      model: 'qwen2.5',
      fetchImpl: makeFetchImpl({
        body: makeSseStream([
          {
            choices: [
              {
                delta: {
                  tool_calls: [
                    {
                      index: 0,
                      id: 'call_1',
                      function: { name: 'search', arguments: '{"q":' },
                    },
                  ],
                },
              },
            ],
          },
          {
            choices: [
              {
                delta: {
                  tool_calls: [
                    {
                      index: 0,
                      function: { arguments: '"x"}' },
                    },
                  ],
                },
              },
            ],
          },
          { choices: [{ finish_reason: 'tool_calls' }] },
          '[DONE]',
        ]),
      }),
      logger: () => {},
    });
    const events = await collect(provider.stream({ messages: [{ role: 'user', content: 'hi' }] }));
    const start = events.find((e) => e.type === 'tool-call-start');
    expect(start).toMatchObject({ toolCallId: 'call_1', toolName: 'search' });
    const argsDeltas = events.filter((e) => e.type === 'tool-call-input-delta');
    expect(argsDeltas).toHaveLength(2);
    const end = events.find((e) => e.type === 'tool-call-end');
    expect(end).toMatchObject({ toolCallId: 'call_1', finalArgs: { q: 'x' } });
    const finish = events.at(-1);
    if (finish?.type !== 'finish') throw new Error('expected finish');
    expect(finish.finishReason).toBe('tool-calls');
  });

  it('populates Authorization: Bearer header from apiKey', async () => {
    const capture: { url?: string; init?: RequestInit } = {};
    const provider = llamaCppServerAdapter({
      model: 'qwen2.5',
      apiKey: 'secret-token',
      fetchImpl: makeFetchImpl({
        body: makeSseStream([{ choices: [{ finish_reason: 'stop' }] }, '[DONE]']),
        capture,
      }),
      logger: () => {},
    });
    await collect(provider.stream({ messages: [{ role: 'user', content: 'hi' }] }));
    const headers = capture.init?.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer secret-token');
    expect(headers['content-type']).toBe('application/json');
  });

  it('declares multimodal: false and parallelToolCalls: false by default', () => {
    const provider = llamaCppServerAdapter({
      model: 'qwen2.5',
      fetchImpl: makeFetchImpl({}),
      logger: () => {},
    });
    expect(provider.capabilities.multimodal).toBe(false);
    expect(provider.capabilities.parallelToolCalls).toBe(false);
  });
});

describe('llamaCppServerAdapter - generate()', () => {
  it('returns text + toolCalls + usage from a single JSON response', async () => {
    const provider = llamaCppServerAdapter({
      model: 'qwen2.5',
      fetchImpl: makeFetchImpl({
        jsonOnce: {
          choices: [
            {
              message: {
                content: 'done',
                tool_calls: [
                  { id: 'call_1', function: { name: 'lookup', arguments: '{"q":"x"}' } },
                ],
              },
              finish_reason: 'tool_calls',
            },
          ],
          usage: { prompt_tokens: 9, completion_tokens: 1, total_tokens: 10 },
        },
      }),
      logger: () => {},
    });
    const result = await provider.generate({ messages: [{ role: 'user', content: 'hi' }] });
    expect(result.text).toBe('done');
    expect(result.toolCalls?.[0]?.args).toEqual({ q: 'x' });
    expect(result.finishReason).toBe('tool-calls');
    expect(result.usage).toEqual({ promptTokens: 9, completionTokens: 1, totalTokens: 10 });
  });
});
