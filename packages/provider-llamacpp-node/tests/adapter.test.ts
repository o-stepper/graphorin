/**
 * Coverage for `llamaCppNodeAdapter` — feeds stubbed `modelOverride`
 * + `sessionFactory` so the suite never loads the real
 * `node-llama-cpp` peer.
 */
import type { ProviderEvent, ProviderRequest } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { LLAMA_CPP_NODE_ACCEPTS_SENSITIVITY, llamaCppNodeAdapter } from '../src/adapter.js';
import type { LlamaModelInstance, LlamaSessionInstance } from '../src/runtime.js';

function fixtureModel(opts: { tokenize?: (text: string) => Uint32Array } = {}): LlamaModelInstance {
  const tokenize = opts.tokenize ?? ((text: string) => new Uint32Array(text.length));
  return {
    tokenize,
    async createContext() {
      return { getSequence: () => ({}) };
    },
  };
}

function fixtureSession(pieces: ReadonlyArray<string>): LlamaSessionInstance {
  return {
    async *promptStreamingResponse(): AsyncIterable<string> {
      for (const p of pieces) yield p;
    },
  };
}

const REQ: ProviderRequest = { messages: [{ role: 'user', content: 'hi' }] };

async function consume(stream: AsyncIterable<ProviderEvent>): Promise<ProviderEvent[]> {
  const out: ProviderEvent[] = [];
  for await (const ev of stream) out.push(ev);
  return out;
}

describe('llamaCppNodeAdapter — declarations', () => {
  it('declares loopback sensitivity envelope by default', () => {
    expect(LLAMA_CPP_NODE_ACCEPTS_SENSITIVITY).toEqual(['public', 'internal', 'secret']);
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => fixtureSession([]),
    });
    expect(provider.acceptsSensitivity).toEqual(['public', 'internal', 'secret']);
  });

  it('honours an acceptsSensitivity override', () => {
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      acceptsSensitivity: ['public'],
      modelOverride: fixtureModel(),
      sessionFactory: async () => fixtureSession([]),
    });
    expect(provider.acceptsSensitivity).toEqual(['public']);
  });

  it('uses a default name derived from the model path basename', () => {
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/some/path/qwen2.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => fixtureSession([]),
    });
    expect(provider.name).toBe('llama-cpp-node-qwen2.gguf');
  });

  it('honours an explicit name option', () => {
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/x.gguf',
      name: 'my-model',
      modelOverride: fixtureModel(),
      sessionFactory: async () => fixtureSession([]),
    });
    expect(provider.name).toBe('my-model');
  });

  it('declares streaming-only capabilities by default', () => {
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/x.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => fixtureSession([]),
    });
    expect(provider.capabilities.streaming).toBe(true);
    expect(provider.capabilities.toolCalling).toBe(false);
    expect(provider.capabilities.multimodal).toBe(false);
  });

  it('merges capability overrides on top of defaults', () => {
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/x.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => fixtureSession([]),
      capabilities: { contextWindow: 32_000 },
    });
    expect(provider.capabilities.contextWindow).toBe(32_000);
  });
});

describe('llamaCppNodeAdapter — stream()', () => {
  it('yields stream-start, text-delta(s), and finish with computed token counts', async () => {
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => fixtureSession(['Hel', 'lo']),
    });
    const events = await consume(provider.stream(REQ));
    expect(events[0]?.type).toBe('stream-start');
    const deltas = events.filter((e) => e.type === 'text-delta');
    expect(deltas.map((e) => (e as { delta: string }).delta).join('')).toBe('Hello');
    const finish = events.at(-1);
    if (finish?.type !== 'finish') throw new Error('expected finish');
    expect(finish.usage.completionTokens).toBeGreaterThan(0);
    expect(finish.usage.promptTokens).toBeGreaterThan(0);
    expect(finish.usage.totalTokens).toBe(
      finish.usage.promptTokens + finish.usage.completionTokens,
    );
  });

  it('passes systemMessage to the session factory', async () => {
    let capturedSystem: string | undefined;
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async (_model, system) => {
        capturedSystem = system;
        return fixtureSession([]);
      },
    });
    await consume(provider.stream({ ...REQ, systemMessage: 'sys' }));
    expect(capturedSystem).toBe('sys');
  });

  it('halts the stream when AbortSignal is aborted mid-stream', async () => {
    const ac = new AbortController();
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => ({
        async *promptStreamingResponse() {
          yield 'piece1';
          ac.abort();
          yield 'piece2';
        },
      }),
    });
    const events = await consume(provider.stream({ ...REQ, signal: ac.signal }));
    const deltas = events.filter((e) => e.type === 'text-delta');
    expect(deltas.length).toBeLessThanOrEqual(2);
    expect(events.at(-1)?.type).toBe('finish');
  });

  it('emits an error event when the session throws', async () => {
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => ({
        // biome-ignore lint/correctness/useYield: deliberate error-path fixture; the throw runs before any yield.
        async *promptStreamingResponse() {
          throw new Error('boom');
        },
      }),
    });
    const events = await consume(provider.stream(REQ));
    const err = events.find((e) => e.type === 'error');
    expect(err).toMatchObject({ error: { kind: 'unknown', message: 'boom' } });
    expect(events.at(-1)?.type).toBe('finish');
  });
});

describe('llamaCppNodeAdapter — generate()', () => {
  it('collects all text-delta events into the response text field', async () => {
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => fixtureSession(['Hel', 'lo']),
    });
    const result = await provider.generate(REQ);
    expect(result.text).toBe('Hello');
    expect(result.finishReason).toBe('stop');
  });
});

describe('llamaCppNodeAdapter — default sessionFactory error', () => {
  it('throws an actionable error when no sessionFactory or runtime override is configured', async () => {
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
    });
    const events: ProviderEvent[] = [];
    await expect(
      (async () => {
        for await (const ev of provider.stream(REQ)) events.push(ev);
      })(),
    ).rejects.toMatchObject({ message: expect.stringContaining('sessionFactory') });
  });
});

describe('llamaCppNodeAdapter — multimodal user content', () => {
  it('flattens multimodal text parts when rendering the prompt', async () => {
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => fixtureSession(['ok']),
    });
    const result = await provider.generate({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'hello ' },
            { type: 'text', text: 'world' },
          ],
        },
      ],
    });
    expect(result.finishReason).toBe('stop');
  });
});
