/**
 * `withCostTracking` - reports `tokensUsed` + `cost` per `provider × model`
 * from the `finish` event of every stream / one-shot generation via the
 * `onUsage` hook. For a ready-made process-local accumulator, wire
 * {@link createCostAccumulator}'s `onUsage` and read its `.totals()`; consumers
 * that prefer the framework's `CostTracker` from `@graphorin/observability`
 * pass their own delegate.
 *
 * @packageDocumentation
 */

import type { Provider, ProviderEvent, Usage } from '@graphorin/core';

import { defineProviderMiddleware } from './compose.js';

/**
 * Aggregated totals for one `provider × model`, returned by
 * {@link CostAccumulator.totalFor} / {@link CostAccumulator.totals}.
 *
 * @stable
 */
export interface CostTrackingTotals {
  readonly callCount: number;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
  /** Prompt tokens served from the provider cache (subset of promptTokens). */
  readonly cachedReadTokens: number;
  /** Prompt tokens written to the provider cache (subset of promptTokens). */
  readonly cacheWriteTokens: number;
  readonly costUsd: number;
}

/**
 * A process-local cost accumulator. Wire {@link CostAccumulator.onUsage}
 * into {@link withCostTracking} and read the running totals - keyed by
 * `provider × model` - back via {@link CostAccumulator.totals} /
 * {@link CostAccumulator.totalFor}.
 *
 * @stable
 */
export interface CostAccumulator {
  /** Pass this to {@link withCostTracking}'s `onUsage`. */
  readonly onUsage: NonNullable<WithCostTrackingOptions['onUsage']>;
  /** Snapshot of every tracked `provider::model` → totals. */
  totals(): ReadonlyMap<string, CostTrackingTotals>;
  /** Running totals for one `provider × model` (zeros when unseen). */
  totalFor(providerName: string, modelId: string): CostTrackingTotals;
  /** Clear all accumulated totals. */
  reset(): void;
}

const ZERO_TOTALS: CostTrackingTotals = Object.freeze({
  callCount: 0,
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  cachedReadTokens: 0,
  cacheWriteTokens: 0,
  costUsd: 0,
});

/**
 * Create a {@link CostAccumulator} - the process-local accumulator described on
 * {@link withCostTracking}. Keys totals by `'<providerName>::<modelId>'`.
 *
 * @stable
 */
export function createCostAccumulator(): CostAccumulator {
  const map = new Map<string, CostTrackingTotals>();
  const keyOf = (providerName: string, modelId: string): string => `${providerName}::${modelId}`;
  return {
    onUsage: (info) => {
      const key = keyOf(info.providerName, info.modelId);
      const prev = map.get(key) ?? ZERO_TOTALS;
      map.set(key, {
        callCount: prev.callCount + 1,
        promptTokens: prev.promptTokens + info.promptTokens,
        completionTokens: prev.completionTokens + info.completionTokens,
        totalTokens: prev.totalTokens + info.totalTokens,
        cachedReadTokens: prev.cachedReadTokens + (info.cachedReadTokens ?? 0),
        cacheWriteTokens: prev.cacheWriteTokens + (info.cacheWriteTokens ?? 0),
        costUsd: prev.costUsd + info.costUsd,
      });
    },
    totals: () => new Map(map),
    totalFor: (providerName, modelId) => map.get(keyOf(providerName, modelId)) ?? ZERO_TOTALS,
    reset: () => map.clear(),
  };
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
    readonly cachedReadTokens?: number;
    readonly cacheWriteTokens?: number;
    readonly costUsd: number;
    readonly metadata: Readonly<Record<string, unknown>> | undefined;
  }) => void;
  /**
   * Optional pricing lookup. When set, the middleware computes
   * `costUsd` from the returned price and surfaces it on the hook.
   *
   * `cachedReadPerMtok` / `cacheWritePerMtok` price the prompt-cache legs;
   * when omitted, cache tokens are billed at the full
   * input rate. For reads that over-counts (reads are discounted), but for
   * writes it can UNDER-count: providers with a write premium (Anthropic,
   * and OpenAI from GPT-5.6 on) charge 1.25x input for cache writes, so
   * keep the write rate populated for models that report `cacheWriteTokens`.
   */
  readonly priceLookup?: (info: { readonly providerName: string; readonly modelId: string }) => {
    readonly inputPerMtok?: number;
    readonly outputPerMtok?: number;
    readonly cachedReadPerMtok?: number;
    readonly cacheWritePerMtok?: number;
  } | null;
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
        const priced = priceUsage(result.usage, next, opts);
        emitUsage(priced, next, opts, asRecord(req.metadata));
        // R-01: return the cost-stamped usage so the agent run loop's
        // accumulateUsage folds it into state.usage.cost and
        // RunBudget.maxCostUsd can actually enforce (the onUsage hook
        // alone never reaches the run-level aggregate).
        return priced.stamped ? { ...result, usage: priced.usage } : result;
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
    if (event.type === 'finish') {
      const priced = priceUsage(event.usage, next, opts);
      // R-01: stamp the computed cost BEFORE yielding so the consumer
      // (the run loop) sees usage.cost on the finish event.
      yield priced.stamped ? { ...event, usage: priced.usage } : event;
      emitUsage(priced, next, opts, metadata);
    } else {
      yield event;
    }
  }
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> | undefined {
  if (value === undefined || value === null) return undefined;
  return value as Readonly<Record<string, unknown>>;
}

interface PricedUsage {
  /** Usage, cost-stamped when a price was resolved (else the original). */
  readonly usage: Usage;
  /** Cost surfaced on the onUsage hook. */
  readonly costUsd: number;
  /** True when `usage.cost` was set from a resolved price. */
  readonly stamped: boolean;
}

/**
 * Resolve the price for `next` and compute the call cost. When a price is
 * available the cost is STAMPED onto a copy of the usage so downstream
 * accumulators (the agent run loop, per-model breakdowns) fold it into the
 * run-level aggregate; without a price a provider-reported `usage.cost` is
 * left untouched.
 */
function priceUsage(usage: Usage, next: Provider, opts: WithCostTrackingOptions): PricedUsage {
  const price = opts.priceLookup?.({ providerName: next.name, modelId: next.modelId }) ?? null;
  if (price === null) {
    return { usage, costUsd: usage.cost?.amount ?? 0, stamped: false };
  }
  // Reasoning tokens are billed at the output rate (the PS-19 contract
  // in @graphorin/pricing) - providers that report them separately from
  // completionTokens must not get them for free.
  // Cache legs (core-provider-02): promptTokens INCLUDES cache reads and
  // writes, so subtract them from the base-rate leg and bill each at its
  // own rate; a missing cache rate falls back to the full input rate.
  const cachedRead = usage.cachedReadTokens ?? 0;
  const cacheWrite = usage.cacheWriteTokens ?? 0;
  const basePromptTokens = Math.max(0, usage.promptTokens - cachedRead - cacheWrite);
  const inputRate = price.inputPerMtok ?? 0;
  const costUsd =
    (basePromptTokens * inputRate +
      cachedRead * (price.cachedReadPerMtok ?? inputRate) +
      cacheWrite * (price.cacheWritePerMtok ?? inputRate) +
      (usage.completionTokens + (usage.reasoningTokens ?? 0)) * (price.outputPerMtok ?? 0)) /
    1_000_000;
  return {
    usage: { ...usage, cost: { amount: costUsd, currency: 'USD' } },
    costUsd,
    stamped: true,
  };
}

function emitUsage(
  priced: PricedUsage,
  next: Provider,
  opts: WithCostTrackingOptions,
  metadata: Readonly<Record<string, unknown>> | undefined,
): void {
  if (opts.onUsage === undefined) return;
  const usage = priced.usage;
  opts.onUsage({
    providerName: next.name,
    modelId: next.modelId,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
    ...(usage.cachedReadTokens !== undefined ? { cachedReadTokens: usage.cachedReadTokens } : {}),
    ...(usage.cacheWriteTokens !== undefined ? { cacheWriteTokens: usage.cacheWriteTokens } : {}),
    costUsd: priced.costUsd,
    metadata,
  });
}
