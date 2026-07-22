/**
 * Coverage for the opt-in `timeoutMs` deadline on
 * `llamaCppNodeAdapter`: scope = time to first token, expiry surfaces
 * as the adapter's in-band PS-4 error idiom with kind `'transient'`
 * (generate() re-throws it as `ProviderHttpError{ status: 0 }`), and
 * the deadline clears once tokens flow.
 */
import type { ProviderEvent } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { llamaCppNodeAdapter } from '../src/adapter.js';
import type { LlamaModelInstance, LlamaSessionInstance } from '../src/runtime.js';

function fixtureModel(): LlamaModelInstance {
  return {
    tokenize: (text: string) => new Uint32Array(Math.max(1, Math.ceil(text.length / 4))),
  } as LlamaModelInstance;
}

function abortError(): Error {
  const err = new Error('The operation was aborted');
  err.name = 'AbortError';
  return err;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** A session that produces nothing until the abort signal fires. */
function hangingSession(): LlamaSessionInstance {
  return {
    async *promptStreamingResponse(
      _prompt: string,
      options?: { signal?: AbortSignal },
    ): AsyncIterable<string> {
      await new Promise<void>((_resolve, reject) => {
        const onAbort = (): void => reject(abortError());
        if (options?.signal?.aborted) onAbort();
        else options?.signal?.addEventListener('abort', onAbort, { once: true });
      });
    },
  } as LlamaSessionInstance;
}

async function consume(stream: AsyncIterable<ProviderEvent>): Promise<ProviderEvent[]> {
  const out: ProviderEvent[] = [];
  for await (const ev of stream) out.push(ev);
  return out;
}

const REQ = { messages: [{ role: 'user' as const, content: 'hi' }] };

describe('llamaCppNodeAdapter timeoutMs', () => {
  it('surfaces a fired deadline as an in-band transient error and finish error', async () => {
    const adapter = llamaCppNodeAdapter({
      modelPath: '/models/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => hangingSession(),
      timeoutMs: 20,
    });
    const events = await consume(adapter.stream(REQ));
    const errorEvent = events.find(
      (e): e is Extract<ProviderEvent, { type: 'error' }> => e.type === 'error',
    );
    expect(errorEvent?.error.kind).toBe('transient');
    expect(errorEvent?.error.message).toMatch(/timed out after 20ms/);
    expect(events.at(-1)).toMatchObject({ type: 'finish', finishReason: 'error' });
  });

  it('generate() re-throws the timeout as a retryable ProviderHttpError', async () => {
    const adapter = llamaCppNodeAdapter({
      modelPath: '/models/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => hangingSession(),
      timeoutMs: 20,
    });
    await expect(adapter.generate(REQ)).rejects.toMatchObject({
      name: 'ProviderHttpError',
      status: 0,
      errorKind: 'transient',
      message: expect.stringMatching(/timed out after 20ms/),
    });
  });

  it('clears the deadline on the first token (slow tails survive)', async () => {
    const session = {
      async *promptStreamingResponse(): AsyncIterable<string> {
        yield 'fast';
        await sleep(80);
        yield '-tail';
      },
    } as LlamaSessionInstance;
    const adapter = llamaCppNodeAdapter({
      modelPath: '/models/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => session,
      timeoutMs: 30,
    });
    const events = await consume(adapter.stream(REQ));
    const text = events
      .filter((e): e is Extract<ProviderEvent, { type: 'text-delta' }> => e.type === 'text-delta')
      .map((e) => e.delta)
      .join('');
    expect(text).toBe('fast-tail');
    expect(events.at(-1)).toMatchObject({ type: 'finish', finishReason: 'stop' });
  });

  it('keeps a caller abort as finishReason aborted with a deadline armed', async () => {
    const ctl = new AbortController();
    const session = {
      async *promptStreamingResponse(
        _prompt: string,
        options?: { signal?: AbortSignal },
      ): AsyncIterable<string> {
        yield 'one';
        await new Promise<void>((resolve) => {
          if (options?.signal?.aborted) resolve();
          else options?.signal?.addEventListener('abort', () => resolve(), { once: true });
        });
        yield 'two';
      },
    } as LlamaSessionInstance;
    const adapter = llamaCppNodeAdapter({
      modelPath: '/models/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => session,
      timeoutMs: 5000,
    });
    setTimeout(() => ctl.abort(), 10);
    const events = await consume(adapter.stream({ ...REQ, signal: ctl.signal }));
    expect(events.at(-1)).toMatchObject({ type: 'finish', finishReason: 'aborted' });
  });
});
