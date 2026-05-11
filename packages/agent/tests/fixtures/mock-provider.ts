import type { Provider, ProviderEvent, ProviderRequest, ProviderResponse } from '@graphorin/core';

export interface MockProviderScript {
  readonly events: ReadonlyArray<ProviderEvent>;
}

/**
 * In-memory stub provider used by tests. Each call to `stream(...)`
 * pops the next script from the supplied queue and yields its
 * events. Useful for testing the agent loop's event handling +
 * usage accounting without bringing in the real Vercel adapter.
 */
export function createMockProvider(args: {
  readonly modelId: string;
  readonly name?: string;
  readonly scripts: ReadonlyArray<MockProviderScript>;
  readonly contextWindow?: number;
}): Provider & { readonly scriptsConsumed: () => number } {
  let cursor = 0;
  const provider: Provider = {
    name: args.name ?? 'mock',
    modelId: args.modelId,
    capabilities: {
      streaming: true,
      toolCalling: true,
      parallelToolCalls: true,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: args.contextWindow ?? 200000,
      maxOutput: 8192,
    },
    async *stream(_req: ProviderRequest): AsyncIterable<ProviderEvent> {
      const idx = cursor++;
      const script = args.scripts[idx];
      if (script === undefined) {
        yield {
          type: 'error',
          error: { kind: 'unknown', message: `mock provider: no script for call #${idx}` },
        };
        return;
      }
      for (const ev of script.events) {
        yield ev;
      }
    },
    async generate(_req: ProviderRequest): Promise<ProviderResponse> {
      throw new Error('mock provider: generate(...) not implemented; use stream(...).');
    },
  };
  return Object.assign(provider, { scriptsConsumed: () => cursor });
}

export function textOnlyScript(text: string, totalTokens = 10): MockProviderScript {
  const events: ProviderEvent[] = [
    { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
    { type: 'text-delta', delta: text },
    {
      type: 'finish',
      finishReason: 'stop',
      usage: {
        promptTokens: Math.max(1, Math.floor(totalTokens / 2)),
        completionTokens: Math.max(1, Math.floor(totalTokens / 2)),
        totalTokens,
      },
    },
  ];
  return { events };
}

export function toolCallScript(args: {
  readonly text?: string;
  readonly toolCallId: string;
  readonly toolName: string;
  readonly args: unknown;
  readonly totalTokens?: number;
}): MockProviderScript {
  const events: ProviderEvent[] = [
    { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
  ];
  if (args.text !== undefined) {
    events.push({ type: 'text-delta', delta: args.text });
  }
  events.push(
    { type: 'tool-call-start', toolCallId: args.toolCallId, toolName: args.toolName },
    {
      type: 'tool-call-input-delta',
      toolCallId: args.toolCallId,
      argsDelta: JSON.stringify(args.args),
    },
    { type: 'tool-call-end', toolCallId: args.toolCallId, finalArgs: args.args },
    {
      type: 'finish',
      finishReason: 'tool-calls',
      usage: {
        promptTokens: Math.max(1, Math.floor((args.totalTokens ?? 10) / 2)),
        completionTokens: Math.max(1, Math.floor((args.totalTokens ?? 10) / 2)),
        totalTokens: args.totalTokens ?? 10,
      },
    },
  );
  return { events };
}

export function errorScript(args: {
  readonly kind: 'rate-limit' | 'capacity' | 'context-length' | 'transient' | 'unknown';
  readonly message?: string;
}): MockProviderScript {
  return {
    events: [
      { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
      {
        type: 'error',
        error: { kind: args.kind, message: args.message ?? `simulated ${args.kind}` },
      },
    ],
  };
}
