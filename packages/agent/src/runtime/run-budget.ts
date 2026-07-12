/**
 * Run-level budget enforcement (C5 / W-084 residual, decision D-8).
 *
 * A pure between-step precheck against the run's accumulated
 * `state.usage`: the run loop calls {@link checkRunBudget} at the top
 * of every step, after the previous step's usage (and any sub-agent
 * folds, W-033) landed. The step that crosses a ceiling completes -
 * in-flight overshoot is inherent to between-step enforcement, exactly
 * like the consolidator's `BudgetTracker` precheck.
 *
 * @packageDocumentation
 */

import type { Usage } from '@graphorin/core';

import type { RunBudget } from '../types.js';

/** A tripped ceiling reported by {@link checkRunBudget}. */
export interface RunBudgetBreach {
  readonly resource: 'cost' | 'tokens';
  readonly observed: number;
  readonly limit: number;
  readonly message: string;
}

/**
 * Validate a caller-supplied budget eagerly, before the first step. A
 * malformed ceiling is a caller bug and throws a `TypeError`
 * immediately (the `ConcurrentRunError` precedent: bad invocations
 * reject synchronously instead of producing a half-run).
 */
export function validateRunBudget(budget: RunBudget | undefined): RunBudget | undefined {
  if (budget === undefined) return undefined;
  for (const key of ['maxCostUsd', 'maxTokens'] as const) {
    const value = budget[key];
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      throw new TypeError(
        `[graphorin/agent] RunBudget.${key} must be a finite number >= 0, got ${String(value)}`,
      );
    }
  }
  return budget;
}

/**
 * Compare the accumulated run usage against the budget. Tokens are
 * checked first (provider-independent); the cost leg compares only USD
 * cost - `RunBudget.maxCostUsd` is a USD ceiling and cross-currency
 * arithmetic would be a lie. Returns the first breach or `null`.
 */
export function checkRunBudget(
  budget: RunBudget | undefined,
  usage: Usage,
): RunBudgetBreach | null {
  if (budget === undefined) return null;
  if (budget.maxTokens !== undefined && usage.totalTokens > budget.maxTokens) {
    return {
      resource: 'tokens',
      observed: usage.totalTokens,
      limit: budget.maxTokens,
      message:
        `run budget exceeded: ${usage.totalTokens} > ${budget.maxTokens} tokens ` +
        `(RunBudget.maxTokens)`,
    };
  }
  const cost = usage.cost;
  if (
    budget.maxCostUsd !== undefined &&
    cost !== undefined &&
    cost.currency === 'USD' &&
    cost.amount > budget.maxCostUsd
  ) {
    return {
      resource: 'cost',
      observed: cost.amount,
      limit: budget.maxCostUsd,
      message:
        `run budget exceeded: $${cost.amount.toFixed(4)} > $${budget.maxCostUsd.toFixed(4)} ` +
        `USD (RunBudget.maxCostUsd)`,
    };
  }
  return null;
}

/**
 * `true` when a cost ceiling is configured but the accumulated usage
 * carries no USD cost data - the ceiling is unenforceable. The run
 * loop WARNs once per run on this condition (the `withCostLimit` PS-8
 * precedent: a silently inert limit is worse than none).
 */
export function isCostCeilingUnpriced(budget: RunBudget, usage: Usage): boolean {
  if (budget.maxCostUsd === undefined) return false;
  if (usage.totalTokens === 0) return false;
  return usage.cost === undefined || usage.cost.currency !== 'USD';
}
