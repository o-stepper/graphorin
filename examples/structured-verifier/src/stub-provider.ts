/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Deterministic stub Provider for the structured-verifier example. It
 * plays back a fixed script of terminal text drafts (one per provider
 * call) and RECORDS every {@link ProviderRequest} it receives, so the
 * tests can assert the structured-output contract actually reaches the
 * wire (`request.outputType.jsonSchema` forwarded on every call). Zero
 * sockets, zero child processes, zero disk I/O.
 */

import type { Provider, ProviderEvent, ProviderRequest, ProviderResponse } from '@graphorin/core';

export interface StubProviderHandle {
  readonly provider: Provider;
  /** Every request the agent runtime sent, in call order. */
  readonly requests: ReadonlyArray<ProviderRequest>;
  /** Number of scripted drafts consumed so far. */
  scriptsConsumed(): number;
}

/**
 * Build a stub that answers call N with `drafts[N]` as a streamed text
 * completion. A call past the end of the script yields a provider
 * error event, so a runaway loop fails loudly instead of hanging.
 */
export function createScriptedProvider(drafts: ReadonlyArray<string>): StubProviderHandle {
  const requests: ProviderRequest[] = [];
  let cursor = 0;
  const provider: Provider = {
    name: 'stub',
    modelId: 'stub-structured',
    capabilities: {
      streaming: true,
      toolCalling: true,
      parallelToolCalls: true,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: 200_000,
      maxOutput: 8_192,
    },
    async *stream(request: ProviderRequest): AsyncIterable<ProviderEvent> {
      requests.push(request);
      const draft = drafts[cursor++];
      if (draft === undefined) {
        yield {
          type: 'error',
          error: { kind: 'unknown', message: 'stub script exhausted - unexpected extra call' },
        };
        return;
      }
      yield { type: 'stream-start', metadata: { providerName: 'stub', modelId: 'stub' } };
      yield { type: 'text-delta', delta: draft };
      yield {
        type: 'finish',
        finishReason: 'stop',
        usage: { promptTokens: 12, completionTokens: 24, totalTokens: 36 },
      };
    },
    async generate(): Promise<ProviderResponse> {
      throw new Error('the example streams; generate() is unused');
    },
  };
  return { provider, requests, scriptsConsumed: () => cursor };
}
