/**
 * Coverage for `vercelAdapter` — feeds a fixture-driven
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

  it('forwards error chunks as ProviderEvent.error and keeps streaming', async () => {
    const adapter = vercelAdapter(MODEL, {
      runtimeOverrides: makeOverrides({
        streamChunks: [
          { type: 'error', error: 'boom' },
          { type: 'error', error: { message: 'wrapped' } },
        ],
      }),
    });
    const events = await collect(adapter.stream(REQ));
    const errors = events.filter((e) => e.type === 'error');
    expect(errors).toHaveLength(2);
    expect((errors[0] as { error: { message: string } }).error.message).toBe('boom');
    expect((errors[1] as { error: { message: string } }).error.message).toBe('wrapped');
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
