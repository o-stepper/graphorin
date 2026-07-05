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
  readonly callCount: number;
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
}
