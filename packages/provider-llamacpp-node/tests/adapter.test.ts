/**
 * Coverage for `llamaCppNodeAdapter` - feeds stubbed `modelOverride`
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

describe('llamaCppNodeAdapter - declarations', () => {
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

describe('llamaCppNodeAdapter - stream()', () => {
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

  it('does NOT render the system prompt into the prompt text (core-provider-08)', async () => {
    // The session already carries `systemPrompt` via its chat template;
    // rendering it again showed the model the system prompt twice.
    let capturedPrompt: string | undefined;
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => ({
        async *promptStreamingResponse(prompt: string): AsyncIterable<string> {
          capturedPrompt = prompt;
          yield 'ok';
        },
      }),
    });
    await consume(provider.stream({ ...REQ, systemMessage: 'SECRET-SYSTEM-LINE' }));
    expect(capturedPrompt).toBeDefined();
    expect(capturedPrompt).not.toContain('SECRET-SYSTEM-LINE');
    expect(capturedPrompt).toContain('[user] hi');
  });

  it("halts the stream when AbortSignal is aborted mid-stream and reports 'aborted' (PS-12)", async () => {
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
    const finish = events.at(-1);
    expect(finish?.type).toBe('finish');
    // core-provider-08: an aborted stream must not masquerade as a clean
    // 'stop' - middleware and cost accounting key on the honest reason.
    if (finish?.type === 'finish') expect(finish.finishReason).toBe('aborted');
  });

  it('disposes the session (context + sequence) after every stream (core-provider-08)', async () => {
    let disposed = 0;
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => ({
        async *promptStreamingResponse(): AsyncIterable<string> {
          yield 'hi';
        },
        dispose() {
          disposed++;
        },
      }),
    });
    await consume(provider.stream(REQ));
    expect(disposed).toBe(1);
    // The error path must release the context too.
    let disposedOnError = 0;
    const failing = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => ({
        // biome-ignore lint/correctness/useYield: deliberate error-path fixture; the throw runs before any yield.
        async *promptStreamingResponse(): AsyncIterable<string> {
          throw new Error('boom');
        },
        dispose() {
          disposedOnError++;
        },
      }),
    });
    await consume(failing.stream(REQ));
    expect(disposedOnError).toBe(1);
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

describe('llamaCppNodeAdapter - generate()', () => {
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

describe('llamaCppNodeAdapter - real default sessionFactory (PS-3)', () => {
  it('streams through the default factory: createContext + LlamaChatSession from the (stubbed) peer', async () => {
    const ctorArgs: Array<{ contextSequence: unknown; systemPrompt?: string }> = [];
    class StubChatSession {
      constructor(args: { contextSequence: unknown; systemPrompt?: string }) {
        ctorArgs.push(args);
      }
      async prompt(
        _text: string,
        options?: { onTextChunk?: (chunk: string) => void },
      ): Promise<string> {
        options?.onTextChunk?.('hel');
        options?.onTextChunk?.('lo');
        return 'hello';
      }
    }
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
      runtimeOverrides: { LlamaChatSession: StubChatSession },
    });
    const events = await consume(provider.stream({ ...REQ, systemMessage: 'be brief' }));
    const text = events
      .filter((e) => e.type === 'text-delta')
      .map((e) => (e.type === 'text-delta' ? e.delta : ''))
      .join('');
    expect(text).toBe('hello');
    const finish = events.at(-1);
    expect(finish?.type).toBe('finish');
    if (finish?.type === 'finish') expect(finish.finishReason).toBe('stop');
    // The session was built from the model's context sequence with the
    // system prompt threaded through.
    expect(ctorArgs).toHaveLength(1);
    expect(ctorArgs[0]?.systemPrompt).toBe('be brief');
  });

  it('a rejecting prompt() surfaces through the default factory as an error event', async () => {
    class FailingChatSession {
      async prompt(): Promise<string> {
        throw new Error('native inference crashed');
      }
    }
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
      runtimeOverrides: { LlamaChatSession: FailingChatSession as never },
    });
    const events = await consume(provider.stream(REQ));
    const err = events.find((e) => e.type === 'error');
    expect(err).toBeDefined();
    if (err?.type === 'error') expect(err.error.message).toContain('native inference crashed');
    const finish = events.at(-1);
    if (finish?.type === 'finish') expect(finish.finishReason).toBe('error');
  });
});

describe('llamaCppNodeAdapter - mid-stream error honesty (PS-4)', () => {
  const failingSession = async (): Promise<LlamaSessionInstance> => ({
    async *promptStreamingResponse(): AsyncIterable<string> {
      yield 'partial ';
      throw new Error('cuda device lost');
    },
  });

  it("a mid-stream error finishes with finishReason 'error', not 'stop'", async () => {
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: failingSession,
    });
    const events = await consume(provider.stream(REQ));
    expect(events.some((e) => e.type === 'error')).toBe(true);
    const finish = events.at(-1);
    expect(finish?.type).toBe('finish');
    if (finish?.type === 'finish') expect(finish.finishReason).toBe('error');
  });

  it('generate() THROWS on a mid-stream error instead of returning partial text', async () => {
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: failingSession,
    });
    await expect(provider.generate(REQ)).rejects.toThrow(/cuda device lost/);
  });
});

describe('llamaCppNodeAdapter - multimodal user content', () => {
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

describe('W-096 - real chat history + honest tokens + persistent session', () => {
  const MULTI_TURN: ProviderRequest = {
    systemMessage: 'be terse',
    messages: [
      { role: 'user', content: 'first question' },
      { role: 'assistant', content: 'first answer' },
      { role: 'user', content: 'second question' },
    ],
  };

  function historySession(pieces: ReadonlyArray<string>) {
    const setHistoryCalls: unknown[][] = [];
    const prompts: string[] = [];
    const session: LlamaSessionInstance = {
      async *promptStreamingResponse(prompt: string): AsyncIterable<string> {
        prompts.push(prompt);
        for (const p of pieces) yield p;
      },
      setChatHistory(history) {
        setHistoryCalls.push([...history]);
      },
    };
    return { session, setHistoryCalls, prompts };
  }

  it('passes prior turns via setChatHistory and prompts ONLY the last user text', async () => {
    const fx = historySession(['ok']);
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => fx.session,
    });
    await provider.generate(MULTI_TURN);
    expect(fx.prompts).toEqual(['second question']);
    expect(fx.setHistoryCalls).toHaveLength(1);
    expect(fx.setHistoryCalls[0]).toEqual([
      { type: 'system', text: 'be terse' },
      { type: 'user', text: 'first question' },
      { type: 'model', response: ['first answer'] },
    ]);
    // No pseudo-prompt [user]/[assistant] framing anywhere.
    expect(fx.prompts[0]).not.toContain('[user]');
  });

  it('a session WITHOUT setChatHistory keeps the legacy renderPrompt path (regression)', async () => {
    const prompts: string[] = [];
    const session: LlamaSessionInstance = {
      async *promptStreamingResponse(prompt: string): AsyncIterable<string> {
        prompts.push(prompt);
        yield 'ok';
      },
    };
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
      sessionFactory: async () => session,
    });
    await provider.generate(MULTI_TURN);
    expect(prompts[0]).toBe(
      '[user] first question\n[assistant] first answer\n[user] second question',
    );
  });

  it('completionTokens tokenize the ASSEMBLED text once - never per chunk', async () => {
    const tokenizedTexts: string[] = [];
    const model = fixtureModel({
      tokenize: (text: string) => {
        tokenizedTexts.push(text);
        return new Uint32Array(text.length);
      },
    });
    const fx = historySession(['ab', 'cd', 'e']);
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: model,
      sessionFactory: async () => fx.session,
    });
    const result = await provider.generate(MULTI_TURN);
    // Exactly two tokenize calls: the prompt proxy + the joined response.
    expect(tokenizedTexts).toHaveLength(2);
    expect(tokenizedTexts[1]).toBe('abcde');
    expect(result.usage.completionTokens).toBe(5);
  });

  it('persistentSession: one factory call across requests, history re-synced, mutex serialises', async () => {
    let factoryCalls = 0;
    const fx = historySession(['ok']);
    let inFlight = 0;
    let sawOverlap = false;
    const session: LlamaSessionInstance = {
      async *promptStreamingResponse(prompt: string): AsyncIterable<string> {
        inFlight += 1;
        if (inFlight > 1) sawOverlap = true;
        await new Promise((resolve) => setTimeout(resolve, 5));
        fx.prompts.push(prompt);
        yield 'ok';
        inFlight -= 1;
      },
      setChatHistory(history) {
        fx.setHistoryCalls.push([...history]);
      },
    };
    const provider = llamaCppNodeAdapter({
      modelPath: '/tmp/fixture.gguf',
      modelOverride: fixtureModel(),
      persistentSession: true,
      sessionFactory: async () => {
        factoryCalls += 1;
        return session;
      },
    });
    await Promise.all([provider.generate(MULTI_TURN), provider.generate(MULTI_TURN)]);
    expect(factoryCalls).toBe(1);
    expect(fx.setHistoryCalls).toHaveLength(2);
    expect(sawOverlap).toBe(false);
  });
});
