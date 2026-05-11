/**
 * `withCostTracking` — accumulates `tokensUsed` + `cost` per
 * `provider × model` from the `finish` event of every stream / one-
 * shot generation. The shipped middleware is intentionally simple: it
 * surfaces a process-local accumulator. Consumers that want to wire
 * the framework's `CostTracker` from `@graphorin/observability` pass
 * a delegate via `onUsage`.
 *
 * @packageDocumentation
 */

import type { Provider, ProviderEvent, ProviderResponse } from '@graphorin/core';

import { defineProviderMiddleware } from './compose.js';

/**
 * Aggregated totals exposed via {@link withCostTracking}'s
 * `accumulator()` callback.
 *
 * @stable
 */
export interface CostTrackingTotals {
  readonly callCount: number;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
  readonly costUsd: number;
}

/**
 * Options for {@link withCostTracking}.
 *
 * @stable
 */
export interface WithCostTrackingOptions {
  /**
   * Hook fired on every `finish` event with the parsed usage. The
   * hook receives the underlying provider's name + modelId so the
   * caller can route into a per-model accumulator.
   */
  readonly onUsage?: (info: {
    readonly providerName: string;
    readonly modelId: string;
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
    readonly costUsd: number;
    readonly metadata: Readonly<Record<string, unknown>> | undefined;
  }) => void;
  /**
   * Optional pricing lookup. When set, the middleware computes
   * `costUsd` from the returned price and surfaces it on the hook.
   */
  readonly priceLookup?: (info: {
    readonly providerName: string;
    readonly modelId: string;
  }) => { readonly inputPerMtok?: number; readonly outputPerMtok?: number } | null;
}

/**
 * @stable
 */
export const withCostTracking = defineProviderMiddleware<WithCostTrackingOptions>({
  kind: 'withCostTracking',
  factory: (opts: WithCostTrackingOptions) => {
    return (next: Provider): Provider => ({
      name: next.name,
      modelId: next.modelId,
      capabilities: next.capabilities,
      ...(next.acceptsSensitivity !== undefined
        ? { acceptsSensitivity: next.acceptsSensitivity }
        : {}),
      stream(req) {
        return trackingStream(next, req, opts);
      },
      async generate(req) {
        const result = await next.generate(req);
        emitUsage(result, next, opts, asRecord(req.metadata));
        return result;
      },
      ...(next.countTokens ? { countTokens: next.countTokens.bind(next) } : {}),
    });
  },
});

async function* trackingStream(
  next: Provider,
  req: import('@graphorin/core').ProviderRequest,
  opts: WithCostTrackingOptions,
): AsyncIterable<ProviderEvent> {
  const metadata = asRecord(req.metadata);
  for await (const event of next.stream(req)) {
    yield event;
    if (event.type === 'finish') {
      emitUsage({ usage: event.usage, finishReason: event.finishReason }, next, opts, metadata);
    }
  }
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> | undefined {
  if (value === undefined || value === null) return undefined;
  return value as Readonly<Record<string, unknown>>;
}

function emitUsage(
  result:
    | ProviderResponse
    | { usage: ProviderResponse['usage']; finishReason: ProviderResponse['finishReason'] },
  next: Provider,
  opts: WithCostTrackingOptions,
  metadata: Readonly<Record<string, unknown>> | undefined,
): void {
  if (opts.onUsage === undefined) return;
  const usage = result.usage;
  const price = opts.priceLookup?.({ providerName: next.name, modelId: next.modelId }) ?? null;
  const costUsd =
    price !== null
      ? (usage.promptTokens * (price.inputPerMtok ?? 0)) / 1_000_000 +
        (usage.completionTokens * (price.outputPerMtok ?? 0)) / 1_000_000
      : (usage.cost?.amount ?? 0);
  opts.onUsage({
    providerName: next.name,
    modelId: next.modelId,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
    costUsd,
    metadata,
  });
}
