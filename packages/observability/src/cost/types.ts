/**
 * Public types for the cost-tracker surface.
 *
 * @packageDocumentation
 */

import type { Cost } from '@graphorin/core';

/**
 * Aggregation scope used by {@link CostTracker.usage}. The framework
 * tracks four canonical scopes; deployments needing additional
 * dimensions can build them by registering listeners on
 * `CostTracker.onRollup(...)`.
 *
 * @stable
 */
export type CostScope = 'run' | 'session' | 'agent' | 'user';

/**
 * Per-call usage record fed into {@link CostTracker.record}.
 *
 * @stable
 */
export interface CostRecordInput {
  readonly model: string;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly reasoningTokens?: number;
  /** Prompt-cache READ leg (W-092; name mirrors core `Usage`). */
  readonly cachedReadTokens?: number;
  /** Prompt-cache WRITE leg (W-092; name mirrors core `Usage`). */
  readonly cacheWriteTokens?: number;
  readonly cost?: Cost;
  /** Span id; used to thread parent-child rollups. */
  readonly spanId: string;
  /** Optional parent span id (when the call is part of a nested run). */
  readonly parentSpanId?: string;
  readonly runId?: string;
  readonly sessionId?: string;
  readonly agentId?: string;
  readonly userId?: string;
}

/**
 * Snapshot returned by {@link CostTracker.usage}.
 *
 * @stable
 */
export interface CostSnapshot {
  readonly totalTokens: number;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly reasoningTokens: number;
  /** W-092: aggregated prompt-cache READ tokens (0 when never recorded). */
  readonly cachedReadTokens: number;
  /** W-092: aggregated prompt-cache WRITE tokens (0 when never recorded). */
  readonly cacheWriteTokens: number;
  readonly callCount: number;
  /**
   * Aggregated cost in WHOLE currency units (W-045; for USD - dollars,
   * fractional values expected). Same convention as core `Cost.amount`
   * and `@graphorin/pricing.calculateCost` - never minor units.
   */
  readonly cost: Cost | null;
  /**
   * RP-22: `true` when records carrying differing currencies were aggregated
   * into this snapshot. `cost.amount` is then a sum across currencies and must
   * not be treated as a single clean figure.
   */
  readonly mixedCurrency: boolean;
  readonly byModel: ReadonlyArray<{
    readonly model: string;
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly reasoningTokens: number;
    /** W-092: per-model prompt-cache READ tokens. */
    readonly cachedReadTokens: number;
    /** W-092: per-model prompt-cache WRITE tokens. */
    readonly cacheWriteTokens: number;
    readonly callCount: number;
    readonly cost: Cost | null;
    readonly mixedCurrency: boolean;
  }>;
}

/**
 * Budget configuration shape consumed by {@link createCostTracker}.
 *
 * @stable
 */
export interface CostBudgets {
  /** Per-session budget in the configured currency. */
  readonly perSession?: number;
  /** Per-user budget. */
  readonly perUser?: number;
  /** Per-agent budget. */
  readonly perAgent?: number;
  /** Per-run budget. */
  readonly perRun?: number;
  /** Currency. Defaults to `'USD'`. */
  readonly currency?: string;
}

/**
 * Callback invoked when an aggregation scope crosses its configured
 * budget. The handler receives a sanitized payload - the secret-free
 * scope id + the breached numbers.
 *
 * @stable
 */
export type CostBudgetExceededCallback = (event: {
  readonly scope: CostScope;
  readonly id: string;
  readonly budget: number;
  readonly actual: number;
  readonly currency: string;
}) => void;

/**
 * Configuration shape for {@link createCostTracker}.
 *
 * @stable
 */
export interface CostTrackerOptions {
  readonly budgets?: CostBudgets;
  readonly onExceed?: CostBudgetExceededCallback;
  /**
   * W-092: memory bound for the tracker's internal maps. The tracker
   * aggregates for the LIFETIME of the process - exactly the
   * long-running-assistant scenario - so unbounded per-span / per-scope
   * maps are a leak. When an insertion pushes a map past its limit the
   * OLDEST entries (insertion order, not LRU) are evicted and
   * `onEviction` fires per dropped id; `usage()` / `usageForSpan()` for
   * an evicted id then report zero figures, and a late rollup to an
   * evicted ancestor re-creates it from zero. Defaults to
   * `{ maxSpanEntries: 10_000, maxScopeEntries: 10_000 }`; pass `false`
   * to restore the previous unbounded behaviour.
   */
  readonly retention?:
    | {
        readonly maxSpanEntries?: number;
        /** Per scope-kind cap (each of run/session/agent/user maps). */
        readonly maxScopeEntries?: number;
      }
    | false;
  /** W-092: observer for retention evictions (dashboards / warnings). */
  readonly onEviction?: (event: {
    readonly surface: 'span' | CostScope;
    readonly id: string;
  }) => void;
}
