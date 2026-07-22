/**
 * Coverage for the opt-in `timeoutMs` deadline on `vercelAdapter`:
 * stream scope = time to first chunk, generate scope = whole call, a
 * fired deadline surfaces as the retryable
 * `ProviderHttpError{ status: 0 }` shape (never a silent 'aborted'),
 * and a caller abort keeps its cancellation semantics.
 */
import type { ProviderEvent, ProviderRequest } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import {
  type AISDKChunk,
  type LanguageModelLike,
  type VercelRuntimeOverrides,
  vercelAdapter,
} from '../../src/adapters/vercel.js';
import { ProviderHttpError } from '../../src/errors/errors.js';

const MODEL: LanguageModelLike = {
  provider: 'fixture',
  modelId: 'fixture-model',
  specificationVersion: 'v4',
};

const REQ: ProviderRequest = {
  messages: [{ role: 'user', content: 'hi' }],
};

function abortError(): Error {
  const err = new Error('The operation was aborted');
  err.name = 'AbortError';
  return err;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function collect(stream: AsyncIterable<ProviderEvent>): Promise<ProviderEvent[]> {
  const out: ProviderEvent[] = [];
  for await (const ev of stream) out.push(ev);
  return out;
}

/**
 * A stream that produces nothing until its abort signal fires, then
 * either throws an AbortError from the iterator (`'throw'`) or pushes
 * the SDK's in-band `{type:'error'}` chunk (`'error-chunk'`).
 */
function hangingOverrides(mode: 'throw' | 'error-chunk'): VercelRuntimeOverrides {
  return {
    streamText: (callArgs) => {
      const signal = (callArgs as { abortSignal?: AbortSignal }).abortSignal;
      return {
        fullStream: (async function* (): AsyncIterable<AISDKChunk> {
          await new Promise<void>((resolve, reject) => {
            const onAbort = (): void => {
              if (mode === 'throw') reject(abortError());
              else resolve();
            };
            if (signal?.aborted) onAbort();
            else signal?.addEventListener('abort', onAbort, { once: true });
          });
          yield { type: 'error', error: abortError() };
        })(),
      };
    },
    generateText: async (callArgs) => {
      const signal = (callArgs as { abortSignal?: AbortSignal }).abortSignal;
      await new Promise<void>((_resolve, reject) => {
        const onAbort = (): void => reject(abortError());
        if (signal?.aborted) onAbort();
        else signal?.addEventListener('abort', onAbort, { once: true });
      });
      return { text: 'unreachable' };
    },
  };
}

describe('vercelAdapter timeoutMs', () => {
  it('converts a deadline abort thrown by the stream into a retryable ProviderHttpError', async () => {
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: hangingOverrides('throw'),
      timeoutMs: 20,
    });
    const err = await collect(adapter.stream(REQ)).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProviderHttpError);
    expect((err as ProviderHttpError).status).toBe(0);
    expect((err as ProviderHttpError).errorKind).toBe('transient');
    expect((err as ProviderHttpError).message).toMatch(/timed out after 20ms/);
  });

  it('converts a deadline abort surfacing as an in-band error chunk the same way', async () => {
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: hangingOverrides('error-chunk'),
      timeoutMs: 20,
    });
    const err = await collect(adapter.stream(REQ)).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProviderHttpError);
    expect((err as ProviderHttpError).errorKind).toBe('transient');
    expect((err as ProviderHttpError).message).toMatch(/timed out after 20ms/);
  });

  it('keeps caller aborts as finishReason aborted, never a timeout', async () => {
    const ctl = new AbortController();
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: hangingOverrides('error-chunk'),
      timeoutMs: 5000,
    });
    setTimeout(() => ctl.abort(), 10);
    const events = await collect(adapter.stream({ ...REQ, signal: ctl.signal }));
    const finish = events.at(-1);
    expect(finish).toMatchObject({ type: 'finish', finishReason: 'aborted' });
  });

  it('clears the deadline on the first chunk (slow tails survive)', async () => {
    const overrides: VercelRuntimeOverrides = {
      streamText: () => ({
        fullStream: (async function* (): AsyncIterable<AISDKChunk> {
          yield { type: 'text-delta', textDelta: 'fast' };
          await sleep(80);
          yield { type: 'text-delta', textDelta: '-tail' };
          yield {
            type: 'finish',
            finishReason: 'stop',
            usage: { inputTokens: 1, outputTokens: 2 },
          };
        })(),
      }),
      generateText: async () => ({ text: '' }),
    };
    const adapter = vercelAdapter(MODEL, { runtimeOverrides: overrides, timeoutMs: 30 });
    const events = await collect(adapter.stream(REQ));
    const text = events
      .filter((e): e is Extract<ProviderEvent, { type: 'text-delta' }> => e.type === 'text-delta')
      .map((e) => e.delta)
      .join('');
    expect(text).toBe('fast-tail');
    expect(events.at(-1)).toMatchObject({ type: 'finish', finishReason: 'stop' });
  });

  it('bounds the whole generate() call', async () => {
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: hangingOverrides('throw'),
      timeoutMs: 20,
    });
    await expect(adapter.generate(REQ)).rejects.toMatchObject({
      name: 'ProviderHttpError',
      status: 0,
      errorKind: 'transient',
      message: expect.stringMatching(/timed out after 20ms awaiting generateText/),
    });
  });

  it('leaves behaviour untouched when timeoutMs is unset', async () => {
    const overrides: VercelRuntimeOverrides = {
      streamText: () => ({
        fullStream: (async function* (): AsyncIterable<AISDKChunk> {
          yield { type: 'text-delta', textDelta: 'ok' };
          yield {
            type: 'finish',
            finishReason: 'stop',
            usage: { inputTokens: 1, outputTokens: 1 },
          };
        })(),
      }),
      generateText: async () => ({ text: 'ok' }),
    };
    const adapter = vercelAdapter(MODEL, { runtimeOverrides: overrides });
    const events = await collect(adapter.stream(REQ));
    expect(events.at(-1)).toMatchObject({ type: 'finish', finishReason: 'stop' });
    await expect(adapter.generate(REQ)).resolves.toMatchObject({ text: 'ok' });
  });
});
