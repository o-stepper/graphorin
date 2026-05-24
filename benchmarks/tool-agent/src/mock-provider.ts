/**
 * Graphorin — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Deterministic, offline stub `Provider` for the tool-agent benchmark.
 * Each call to `stream(...)` pops the next scripted step and yields its
 * `ProviderEvent`s — no model, no network. Mirrors the agent test fixture
 * (`packages/agent/tests/fixtures/mock-provider.ts`); test fixtures are not
 * importable across package boundaries, so the harness keeps a local copy.
 */

import type { Provider, ProviderEvent, ProviderRequest, ProviderResponse } from '@graphorin/core';

export interface MockProviderScript {
  readonly events: ReadonlyArray<ProviderEvent>;
}

export function createMockProvider(args: {
  readonly modelId: string;
  readonly name?: string;
  readonly scripts: ReadonlyArray<MockProviderScript>;
  readonly contextWindow?: number;
}): Provider {
  let cursor = 0;
  return {
    name: args.name ?? 'mock-tool-agent',
    modelId: args.modelId,
    capabilities: {
      streaming: true,
      toolCalling: true,
      parallelToolCalls: true,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: args.contextWindow ?? 200_000,
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
}

export function textOnlyScript(text: string, totalTokens = 10): MockProviderScript {
  return {
    events: [
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
    ],
  };
}

export function toolCallScript(args: {
  readonly toolCallId: string;
  readonly toolName: string;
  readonly args: unknown;
  readonly text?: string;
  readonly totalTokens?: number;
}): MockProviderScript {
  return multiToolCallScript(
    [{ toolCallId: args.toolCallId, toolName: args.toolName, args: args.args }],
    {
      ...(args.text !== undefined ? { text: args.text } : {}),
      ...(args.totalTokens !== undefined ? { totalTokens: args.totalTokens } : {}),
    },
  );
}

export function multiToolCallScript(
  calls: ReadonlyArray<{
    readonly toolCallId: string;
    readonly toolName: string;
    readonly args: unknown;
  }>,
  opts: { readonly text?: string; readonly totalTokens?: number } = {},
): MockProviderScript {
  const totalTokens = opts.totalTokens ?? 10;
  const events: ProviderEvent[] = [
    { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
  ];
  if (opts.text !== undefined) {
    events.push({ type: 'text-delta', delta: opts.text });
  }
  for (const call of calls) {
    events.push(
      { type: 'tool-call-start', toolCallId: call.toolCallId, toolName: call.toolName },
      {
        type: 'tool-call-input-delta',
        toolCallId: call.toolCallId,
        argsDelta: JSON.stringify(call.args),
      },
      { type: 'tool-call-end', toolCallId: call.toolCallId, finalArgs: call.args },
    );
  }
  events.push({
    type: 'finish',
    finishReason: 'tool-calls',
    usage: {
      promptTokens: Math.max(1, Math.floor(totalTokens / 2)),
      completionTokens: Math.max(1, Math.floor(totalTokens / 2)),
      totalTokens,
    },
  });
  return { events };
}
