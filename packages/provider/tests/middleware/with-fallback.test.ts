/**
 * Coverage for `withFallback` — primary failure → secondary success,
 * mid-stream failures NOT falling back, predicate gating, and abort
 * propagation.
 */
import type { Provider, ProviderEvent, ProviderRequest, ProviderResponse } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { withFallback } from '../../src/middleware/with-fallback.js';

interface ScriptedAdapter {
  provider: Provider;
  calls: number;
}

function scripted(args: {
  name?: string;
  streamThrows?: () => unknown;
  generateThrows?: () => unknown;
  events?: ReadonlyArray<ProviderEvent>;
  generateResult?: ProviderResponse;
}): ScriptedAdapter {
  let calls = 0;
  const provider: Provider = {
    name: args.name ?? 'scripted',
    modelId: `${args.name ?? 'scripted'}-model`,
    capabilities: {
      streaming: true,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: false,
      reasoning: false,
      contextWindow: 1024,
      maxOutput: 256,
    },
    async *stream(): AsyncIterable<ProviderEvent> {
      calls++;
      if (args.streamThrows !== undefined) {
        // Fire any pre-yield events first then throw.
        if (args.events !== undefined) for (const ev of args.events) yield ev;
        throw args.streamThrows();
      }
      const events = args.events ?? [
        {
          type: 'finish' as const,
          finishReason: 'stop' as const,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        },
      ];
      for (const ev of events) yield ev;
    },
    async generate(): Promise<ProviderResponse> {
      calls++;
      if (args.generateThrows !== undefined) throw args.generateThrows();
      return (
        args.generateResult ?? {
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          finishReason: 'stop' as const,
        }
      );
    },
  };
  const out: ScriptedAdapter = { provider, calls: 0 };
  Object.defineProperty(out, 'calls', { get: () => calls });
  return out;
}

const REQ: ProviderRequest = { messages: [{ role: 'user', content: 'hi' }] };

async function collect(stream: AsyncIterable<ProviderEvent>): Promise<ProviderEvent[]> {
  const out: ProviderEvent[] = [];
  for await (const ev of stream) out.push(ev);
  return out;
}

describe('withFallback — option validation', () => {
  it('throws when fallbacks array is empty', () => {
    const primary = scripted({}).provider;
    expect(() => withFallback({ fallbacks: [] })(primary)).toThrow(TypeError);
  });
});

describe('withFallback — generate()', () => {
  it('runs the secondary when the primary throws a transient error', async () => {
    const primary = scripted({ generateThrows: () => ({ kind: 'transient' }) });
    const secondary = scripted({
      name: 'sec',
      generateResult: {
        text: 'sec-text',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: 'stop',
      },
    });
    const wrapped = withFallback({
      fallbacks: [secondary.provider],
      logger: () => {},
    })(primary.provider);
    const result = await wrapped.generate(REQ);
    expect(result.text).toBe('sec-text');
    expect(primary.calls).toBe(1);
    expect(secondary.calls).toBe(1);
  });

  it('propagates the original error when shouldFallback returns false', async () => {
    const primary = scripted({ generateThrows: () => new Error('hard fail') });
    const secondary = scripted({ name: 'sec' });
    const wrapped = withFallback({
      fallbacks: [secondary.provider],
      shouldFallback: () => false,
    })(primary.provider);
    await expect(wrapped.generate(REQ)).rejects.toThrow('hard fail');
    expect(secondary.calls).toBe(0);
  });

  it('throws the last seen error when every candidate fails', async () => {
    const primary = scripted({ generateThrows: () => ({ kind: 'transient' }) });
    const secondary = scripted({
      name: 'sec',
      generateThrows: () => ({ kind: 'transient' }),
    });
    const wrapped = withFallback({
      fallbacks: [secondary.provider],
      logger: () => {},
    })(primary.provider);
    await expect(wrapped.generate(REQ)).rejects.toMatchObject({ kind: 'transient' });
  });

  it('propagates the abort error without falling back', async () => {
    const primary = scripted({ generateThrows: () => new Error('aborted!') });
    const secondary = scripted({ name: 'sec' });
    const ac = new AbortController();
    ac.abort();
    const wrapped = withFallback({
      fallbacks: [secondary.provider],
    })(primary.provider);
    await expect(wrapped.generate({ ...REQ, signal: ac.signal })).rejects.toThrow('aborted!');
    expect(secondary.calls).toBe(0);
  });
});

describe('withFallback — stream()', () => {
  it('falls back when the primary throws BEFORE yielding any events', async () => {
    const primary = scripted({ streamThrows: () => ({ kind: 'transient' }) });
    const secondary = scripted({
      name: 'sec',
      events: [
        { type: 'text-delta', delta: 'sec' },
        {
          type: 'finish',
          finishReason: 'stop',
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        },
      ],
    });
    const wrapped = withFallback({
      fallbacks: [secondary.provider],
      logger: () => {},
    })(primary.provider);
    const events = await collect(wrapped.stream(REQ));
    const deltas = events.filter((e) => e.type === 'text-delta');
    expect(deltas[0]).toMatchObject({ delta: 'sec' });
  });

  it('does NOT fall back when the primary already streamed events', async () => {
    const primary = scripted({
      events: [{ type: 'text-delta', delta: 'partial' }],
      streamThrows: () => ({ kind: 'transient' }),
    });
    const secondary = scripted({ name: 'sec' });
    const wrapped = withFallback({
      fallbacks: [secondary.provider],
      logger: () => {},
    })(primary.provider);
    await expect(collect(wrapped.stream(REQ))).rejects.toMatchObject({ kind: 'transient' });
    expect(secondary.calls).toBe(0);
  });

  it('aborts the loop without falling back when the request signal is aborted', async () => {
    const primary = scripted({ streamThrows: () => new Error('boom') });
    const secondary = scripted({ name: 'sec' });
    const ac = new AbortController();
    ac.abort();
    const wrapped = withFallback({
      fallbacks: [secondary.provider],
    })(primary.provider);
    await expect(collect(wrapped.stream({ ...REQ, signal: ac.signal }))).rejects.toThrow('boom');
    expect(secondary.calls).toBe(0);
  });
});
