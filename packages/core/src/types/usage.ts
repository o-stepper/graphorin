/**
 * Token / cost metrics for a single LLM call.
 *
 * `cost` is optional because the framework cannot compute it without a
 * pricing snapshot — providers/middleware fill it in (e.g. through the
 * separate `@graphorin/pricing` package) when the snapshot is available.
 *
 * @stable
 */
export interface Usage {
  /**
   * Total input tokens for the call, INCLUDING any prompt-cache reads and
   * writes (`cachedReadTokens` / `cacheWriteTokens` are informational
   * subsets, not additions). This matches the context size the model saw.
   */
  promptTokens: number;
  completionTokens: number;
  /**
   * Reasoning tokens billed IN ADDITION to `completionTokens` (exclusive;
   * adapters that receive an inclusive total split it so the sum stays
   * exact). Cost formulas may add this to the output leg without
   * double-counting.
   */
  reasoningTokens?: number;
  /**
   * Prompt tokens served from the provider's prompt cache (a subset of
   * `promptTokens`), billed at the discounted cache-read rate.
   */
  cachedReadTokens?: number;
  /**
   * Prompt tokens written to the provider's prompt cache this call (a
   * subset of `promptTokens`), billed at the cache-write premium where the
   * provider charges one (Anthropic does; OpenAI does not report writes).
   */
  cacheWriteTokens?: number;
  totalTokens: number;
  cost?: Cost;
}

/**
 * Money figure attached to a `Usage`. Always carries a 3-letter currency
 * code so that consumers can perform aggregation safely.
 *
 * @stable
 */
export interface Cost {
  /** Amount in the smallest fractional unit of the declared currency. */
  amount: number;
  /** ISO-4217 currency code; default `'USD'`. */
  currency: string;
}

/**
 * Per-model breakdown used by aggregators (e.g. `CostTracker` in
 * `@graphorin/observability`).
 *
 * @stable
 */
export interface ModelUsage {
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  reasoningTokens?: number;
  cachedReadTokens?: number;
  cacheWriteTokens?: number;
  totalTokens: number;
  cost?: Cost;
  callCount: number;
}

/**
 * A live accumulator of token / cost figures. Implementations live in
 * `@graphorin/observability`. The contract sits here so every package
 * (agent, workflow, server, …) can type a parameter as `UsageAccumulator`
 * without taking an observability dependency.
 *
 * @stable
 */
export interface UsageAccumulator {
  /** Current rolled-up totals across every model that has been added. */
  readonly total: Usage;
  /** Per-model breakdown; preserves call counts for observability. */
  readonly byModel: ReadonlyMap<string, ModelUsage>;

  /** Add a single LLM-call usage record under the given model id. */
  add(modelId: string, usage: Usage): void;
  /** Reset the accumulator to a zeroed state. */
  reset(): void;
  /** Render an immutable snapshot suitable for serialization / span attrs. */
  snapshot(): UsageSnapshot;
}

/**
 * Immutable, JSON-serializable snapshot of a `UsageAccumulator`.
 *
 * @stable
 */
export interface UsageSnapshot {
  readonly total: Usage;
  readonly byModel: readonly ModelUsage[];
}

/**
 * Returns a fresh, zeroed `Usage` value.
 *
 * @stable
 */
export function zeroUsage(): Usage {
  return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
}
