/**
 * Coverage for `vercelAdapter` - feeds a fixture-driven
 * `runtimeOverrides` shape so the suite never imports the real
 * `ai` peer dependency. Every documented chunk variant is exercised
 * (text-delta, reasoning-delta, tool-call streaming, finish, error)
 * plus the `generate()` one-shot path.
 */
import type { AssistantMessage, ProviderEvent, ProviderRequest, Usage } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import {
  __resetVercelRuntimeCache,
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

function chunksToStream(chunks: ReadonlyArray<AISDKChunk>): {
  fullStream: AsyncIterable<AISDKChunk>;
} {
  return {
    fullStream: (async function* () {
      for (const c of chunks) yield c;
    })(),
  };
}

function makeOverrides(args: {
  streamChunks?: ReadonlyArray<AISDKChunk>;
  generateResult?: Awaited<ReturnType<VercelRuntimeOverrides['generateText']>>;
  streamError?: Error;
  generateError?: Error;
  capture?: { lastArgs?: Record<string, unknown> };
}): VercelRuntimeOverrides {
  return {
    streamText: (callArgs) => {
      if (args.capture !== undefined) args.capture.lastArgs = { ...callArgs };
      if (args.streamError !== undefined) throw args.streamError;
      return chunksToStream(args.streamChunks ?? []);
    },
    generateText: async (callArgs) => {
      if (args.capture !== undefined) args.capture.lastArgs = { ...callArgs };
      if (args.generateError !== undefined) throw args.generateError;
      return args.generateResult ?? { text: '' };
    },
  };
}

const REQ: ProviderRequest = {
  messages: [{ role: 'user', content: 'hi' }],
};

async function collect(stream: AsyncIterable<ProviderEvent>): Promise<ProviderEvent[]> {
  const out: ProviderEvent[] = [];
  for await (const ev of stream) out.push(ev);
  return out;
}

describe('vercelAdapter', () => {
  it('emits stream-start, text-delta, finish with mapped usage', async () => {
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({
        streamChunks: [
          { type: 'text-delta', textDelta: 'hel' },
          { type: 'text-delta', text: 'lo' },
          {
            type: 'finish',
            finishReason: 'stop',
            usage: { inputTokens: 4, outputTokens: 2 },
          },
        ],
      }),
    });
    const events = await collect(adapter.stream(REQ));
    expect(events[0]?.type).toBe('stream-start');
    const textDeltas = events.filter((e) => e.type === 'text-delta');
    expect(textDeltas.map((e) => (e as { delta: string }).delta)).toEqual(['hel', 'lo']);
    const finish = events.at(-1);
    expect(finish?.type).toBe('finish');
    if (finish?.type !== 'finish') throw new Error('expected finish');
    expect(finish.usage).toEqual<Usage>({ promptTokens: 4, completionTokens: 2, totalTokens: 6 });
    expect(finish.finishReason).toBe('stop');
  });

  it('emits reasoning-delta from both reasoning and reasoning-delta chunk types', async () => {
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({
        streamChunks: [
          { type: 'reasoning', textDelta: 'plan: ' },
          { type: 'reasoning-delta', delta: 'step1' },
        ],
      }),
    });
    const events = await collect(adapter.stream(REQ));
    const reasoning = events.filter((e) => e.type === 'reasoning-delta');
    expect(reasoning.map((e) => (e as { delta: string }).delta)).toEqual(['plan: ', 'step1']);
  });

  it('streams tool-call events: start, input-delta, end', async () => {
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({
        streamChunks: [
          { type: 'tool-call-streaming-start', toolCallId: 'c1', toolName: 'search' },
          { type: 'tool-call-delta', toolCallId: 'c1', argsTextDelta: '{"q":' },
          { type: 'tool-call-delta', toolCallId: 'c1', argsTextDelta: '"x"}' },
          { type: 'tool-call', toolCallId: 'c1', args: { q: 'x' } },
        ],
      }),
    });
    const events = await collect(adapter.stream(REQ));
    const start = events.find((e) => e.type === 'tool-call-start');
    expect(start).toMatchObject({ toolCallId: 'c1', toolName: 'search' });
    const deltas = events.filter((e) => e.type === 'tool-call-input-delta');
    expect(deltas).toHaveLength(2);
    const end = events.find((e) => e.type === 'tool-call-end');
    expect(end).toMatchObject({ toolCallId: 'c1', finalArgs: { q: 'x' } });
  });

  it('W-023: an error chunk BEFORE any content throws a typed ProviderHttpError (retryable)', async () => {
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({
        streamChunks: [{ type: 'error', error: { message: 'boom', statusCode: 500 } }],
      }),
    });
    await expect(collect(adapter.stream(REQ))).rejects.toMatchObject({
      name: 'ProviderHttpError',
      status: 500,
      errorKind: 'transient',
    });
  });

  it('W-023: a pre-content 429 chunk throws rate-limit with retry-after headers lifted', async () => {
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({
        streamChunks: [
          {
            type: 'error',
            error: {
              message: 'rate limited',
              statusCode: 429,
              responseHeaders: { 'retry-after': '2' },
            },
          },
        ],
      }),
    });
    await expect(collect(adapter.stream(REQ))).rejects.toMatchObject({
      name: 'ProviderHttpError',
      status: 429,
      errorKind: 'rate-limit',
      headers: { 'retry-after': '2' },
    });
  });

  it('W-023: a mid-stream 529 yields a classified capacity error event and finishReason error', async () => {
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({
        streamChunks: [
          { type: 'text-delta', textDelta: 'partial ' },
          { type: 'error', error: { message: 'overloaded', statusCode: 529 } },
        ],
      }),
    });
    const events = await collect(adapter.stream(REQ));
    const error = events.find((e) => e.type === 'error');
    expect(error).toMatchObject({ error: { kind: 'capacity', message: 'overloaded' } });
    const finish = events.find((e) => e.type === 'finish');
    expect(finish).toMatchObject({ finishReason: 'error' });
    // The partial content was already delivered - PS-1 forbids a restart.
    expect(events.some((e) => e.type === 'text-delta')).toBe(true);
  });

  it('W-023: an abort-shaped error chunk finishes as aborted, no error event, no throw', async () => {
    const abortError = Object.assign(new Error('The operation was aborted'), {
      name: 'AbortError',
    });
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({
        streamChunks: [{ type: 'error', error: abortError }],
      }),
    });
    const events = await collect(adapter.stream(REQ));
    expect(events.some((e) => e.type === 'error')).toBe(false);
    const finish = events.find((e) => e.type === 'finish');
    expect(finish).toMatchObject({ finishReason: 'aborted' });
  });

  it('W-023: stream-start is emitted exactly once, before the first content event', async () => {
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({
        streamChunks: [
          { type: 'text-delta', textDelta: 'a' },
          { type: 'text-delta', textDelta: 'b' },
          { type: 'finish', finishReason: 'stop', usage: {} },
        ],
      }),
    });
    const events = await collect(adapter.stream(REQ));
    const starts = events.filter((e) => e.type === 'stream-start');
    expect(starts).toHaveLength(1);
    expect(events[0]?.type).toBe('stream-start');
    expect(events[1]?.type).toBe('text-delta');
  });

  it('wraps a synchronous streamText() throw into ProviderHttpError', async () => {
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({ streamError: new Error('sdk down') }),
    });
    await expect(collect(adapter.stream(REQ))).rejects.toBeInstanceOf(ProviderHttpError);
  });

  it('aborts the loop when the request signal is already aborted', async () => {
    const ac = new AbortController();
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({
        streamChunks: [
          { type: 'text-delta', textDelta: 'a' },
          { type: 'text-delta', textDelta: 'b' },
          { type: 'text-delta', textDelta: 'c' },
        ],
      }),
    });
    ac.abort();
    const events = await collect(adapter.stream({ ...REQ, signal: ac.signal }));
    const textDeltas = events.filter((e) => e.type === 'text-delta');
    expect(textDeltas).toHaveLength(0);
    expect(events.at(-1)?.type).toBe('finish');
    // PS-12: an aborted stream reports 'aborted', not the initial 'stop'.
    expect((events.at(-1) as { finishReason?: string }).finishReason).toBe('aborted');
  });

  it('default capabilities are populated and overridable', () => {
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({}),
    });
    expect(adapter.capabilities.streaming).toBe(true);
    expect(adapter.capabilities.toolCalling).toBe(true);
    expect(adapter.capabilities.contextWindow).toBe(200_000);

    const narrowed = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({}),
      capabilities: { multimodal: false, contextWindow: 8_192 },
    });
    expect(narrowed.capabilities.multimodal).toBe(false);
    expect(narrowed.capabilities.contextWindow).toBe(8_192);
  });

  it('generate() returns text + toolCalls + usage from the SDK result', async () => {
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({
        generateResult: {
          text: 'final answer',
          toolCalls: [{ toolCallId: 'c1', toolName: 'search', args: { q: 'x' } }],
          usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
          finishReason: 'tool-calls',
          providerMetadata: { latencyMs: 42 },
        },
      }),
    });
    const result = await adapter.generate(REQ);
    expect(result.text).toBe('final answer');
    expect(result.toolCalls).toEqual([{ toolCallId: 'c1', toolName: 'search', args: { q: 'x' } }]);
    expect(result.usage).toEqual<Usage>({
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
    });
    expect(result.finishReason).toBe('tool-calls');
    expect(result.providerMetadata).toEqual({ latencyMs: 42 });
  });

  it('generate() rejects with ProviderHttpError when the SDK throws', async () => {
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({ generateError: new Error('boom') }),
    });
    await expect(adapter.generate(REQ)).rejects.toBeInstanceOf(ProviderHttpError);
  });

  it('generate() lifts the real statusCode from the SDK error (PS-2)', async () => {
    // AI SDK APICallError carries a numeric `statusCode`; the adapter must
    // surface it so withRetry / withFallback see a real 429/5xx instead of
    // the status-0 "network error" placeholder.
    const apiError = Object.assign(new Error('rate limited'), { statusCode: 429 });
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({ generateError: apiError }),
    });
    await expect(adapter.generate(REQ)).rejects.toMatchObject({ status: 429 });
  });

  it('stream() lifts the real statusCode from a pre-yield SDK error (PS-2)', async () => {
    const apiError = Object.assign(new Error('service unavailable'), { statusCode: 503 });
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({ streamError: apiError }),
    });
    await expect(collect(adapter.stream(REQ))).rejects.toMatchObject({ status: 503 });
  });

  it('uses default name "<provider>-<modelId>" when name option omitted', () => {
    const adapter = vercelAdapter(MODEL, { runtimeOverrides: makeOverrides({}) });
    expect(adapter.name).toBe('fixture-fixture-model');
  });

  it('forwards request fields (system, tools, temperature, maxTokens, signal) to the SDK', async () => {
    const capture: { lastArgs?: Record<string, unknown> } = {};
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({ streamChunks: [], capture }),
    });
    const ac = new AbortController();
    await collect(
      adapter.stream({
        messages: REQ.messages,
        systemMessage: 'sys',
        tools: [{ name: 't', inputSchema: {} }],
        toolChoice: 'auto',
        temperature: 0.1,
        maxTokens: 16,
        signal: ac.signal,
        providerOptions: { custom: true },
      }),
    );
    expect(capture.lastArgs?.system).toBe('sys');
    expect(capture.lastArgs?.temperature).toBe(0.1);
    expect(capture.lastArgs?.maxTokens).toBe(16);
    expect(capture.lastArgs?.toolChoice).toBe('auto');
    expect(capture.lastArgs?.abortSignal).toBe(ac.signal);
    expect(capture.lastArgs?.providerOptions).toEqual({ custom: true });
  });

  it('maps unknown finish reasons to "stop" and aborted/cancelled to "aborted"', async () => {
    const aborted = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({
        streamChunks: [{ type: 'finish', finishReason: 'cancelled' }],
      }),
    });
    const events = await collect(aborted.stream(REQ));
    expect((events.at(-1) as { finishReason: string }).finishReason).toBe('aborted');

    const fallback = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({
        streamChunks: [{ type: 'finish', finishReason: 'something-new' }],
      }),
    });
    const ev2 = await collect(fallback.stream(REQ));
    expect((ev2.at(-1) as { finishReason: string }).finishReason).toBe('stop');
  });

  it('__resetVercelRuntimeCache is callable (test-only hook)', () => {
    expect(() => __resetVercelRuntimeCache()).not.toThrow();
  });
});

// Type-only sanity to keep AssistantMessage referenced for clarity in
// downstream test harnesses.
const _typeWitness: AssistantMessage = { role: 'assistant', content: '' };
void _typeWitness;

describe('vercelAdapter - AI SDK v7 shapes (PS-6)', () => {
  const V7_MODEL: LanguageModelLike = {
    provider: 'fixture',
    modelId: 'fixture-model-v7',
    specificationVersion: 'v2',
  };

  it('streams v7 tool-input-start/tool-input-delta/tool-call (id + input fields)', async () => {
    const provider = vercelAdapter(V7_MODEL, {
      runtimeOverrides: makeOverrides({
        streamChunks: [
          { type: 'tool-input-start', id: 'c7', toolName: 'search' },
          { type: 'tool-input-delta', id: 'c7', delta: '{"q":' },
          { type: 'tool-input-delta', id: 'c7', delta: '"x"}' },
          { type: 'tool-call', toolCallId: 'c7', toolName: 'search', input: { q: 'x' } },
          {
            type: 'finish',
            finishReason: 'tool-calls',
            totalUsage: { inputTokens: 7, outputTokens: 3, totalTokens: 10 },
          },
        ],
      }),
    });
    const events = await collect(provider.stream(REQ));
    const types = events.map((e) => e.type);
    expect(types).toContain('tool-call-start');
    expect(types).toContain('tool-call-input-delta');
    expect(types).toContain('tool-call-end');
    const start = events.find((e) => e.type === 'tool-call-start');
    if (start?.type === 'tool-call-start') {
      expect(start.toolCallId).toBe('c7');
      expect(start.toolName).toBe('search');
    }
    const deltas = events.filter((e) => e.type === 'tool-call-input-delta');
    expect(
      deltas.map((d) => (d.type === 'tool-call-input-delta' ? d.argsDelta : '')).join(''),
    ).toBe('{"q":"x"}');
    const end = events.find((e) => e.type === 'tool-call-end');
    if (end?.type === 'tool-call-end') {
      expect(end.finalArgs).toEqual({ q: 'x' });
    }
    // v7 finish carries totalUsage - must not zero out cost tracking.
    const finish = events.find((e) => e.type === 'finish');
    if (finish?.type === 'finish') {
      expect(finish.usage.totalTokens).toBe(10);
      expect(finish.usage.promptTokens).toBe(7);
    }
  });

  it('generate() normalizes v7 toolCalls (input field) to args', async () => {
    const provider = vercelAdapter(V7_MODEL, {
      runtimeOverrides: makeOverrides({
        generateResult: {
          text: '',
          toolCalls: [{ toolCallId: 'g1', toolName: 'lookup', input: { id: 42 } }],
          usage: { inputTokens: 5, outputTokens: 2, totalTokens: 7 },
        } as never,
      }),
    });
    const res = await provider.generate(REQ);
    expect(res.toolCalls?.[0]?.toolName).toBe('lookup');
    expect((res.toolCalls?.[0] as { args?: unknown })?.args).toEqual({ id: 42 });
    expect(res.usage.totalTokens).toBe(7);
  });

  it('sends maxOutputTokens (v7 name) alongside legacy maxTokens', async () => {
    const capture: { lastArgs?: Record<string, unknown> } = {};
    const provider = vercelAdapter(V7_MODEL, {
      runtimeOverrides: makeOverrides({ streamChunks: [], capture }),
    });
    await collect(provider.stream({ ...REQ, maxTokens: 128 }));
    expect(capture.lastArgs?.maxOutputTokens).toBe(128);
    expect(capture.lastArgs?.maxTokens).toBe(128);
  });
});
