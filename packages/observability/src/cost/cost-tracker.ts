/**
 * `createCostTracker(...)` - aggregate token + cost figures across
 * spans and provide per-scope queries.
 *
 * The tracker preserves parent-child relationships: when
 * `record({ parentSpanId })` is supplied, the recorded usage is also
 * attributed to the ancestor span via the configured spans-by-id
 * lookup. Aggregations across runs / sessions / agents / users are
 * computed on demand.
 *
 * @packageDocumentation
 */

import type { Cost } from '@graphorin/core';

import type {
  CostBudgetExceededCallback,
  CostBudgets,
  CostRecordInput,
  CostScope,
  CostSnapshot,
  CostTrackerOptions,
} from './types.js';

/**
 * @stable
 */
export interface CostTracker {
  /** Record a single LLM-call usage / cost figure. */
  record(input: CostRecordInput): void;
  /** Snapshot for a given scope id. Returns zero figures when unknown. */
  usage(scope: CostScope, id: string): CostSnapshot;
  /** Snapshot for a single span id (carries nested attributions). */
  usageForSpan(spanId: string): CostSnapshot;
  /** Reset every counter back to zero. */
  reset(): void;
  /** Subscribe to per-scope rollup notifications. Returns an unsubscribe. */
  onRollup(listener: (input: CostRecordInput) => void): () => void;
}

interface AggregateBucket {
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  cachedReadTokens: number;
  cacheWriteTokens: number;
  callCount: number;
  costAmount: number;
  costCurrency: string | null;
  /** Set when records carrying differing currencies are aggregated. */
  mixedCurrency: boolean;
  byModel: Map<string, AggregateBucket>;
  exceeded: boolean;
}

function freshBucket(): AggregateBucket {
  return {
    promptTokens: 0,
    completionTokens: 0,
    reasoningTokens: 0,
    cachedReadTokens: 0,
    cacheWriteTokens: 0,
    callCount: 0,
    costAmount: 0,
    costCurrency: null,
    mixedCurrency: false,
    byModel: new Map(),
    exceeded: false,
  };
}

// RP-22: accumulate a cost without silently overwriting the currency. The
// first currency seen is kept; a record in a different currency flags the
// bucket as `mixedCurrency` so a USD + EUR total is never reported as one
// clean figure.
function addCost(bucket: AggregateBucket, cost: Cost): void {
  if (bucket.costCurrency !== null && bucket.costCurrency !== cost.currency) {
    bucket.mixedCurrency = true;
  } else if (bucket.costCurrency === null) {
    bucket.costCurrency = cost.currency;
  }
  bucket.costAmount += cost.amount;
}

function combine(target: AggregateBucket, input: CostRecordInput): void {
  target.promptTokens += input.promptTokens;
  target.completionTokens += input.completionTokens;
  target.reasoningTokens += input.reasoningTokens ?? 0;
  target.cachedReadTokens += input.cachedReadTokens ?? 0;
  target.cacheWriteTokens += input.cacheWriteTokens ?? 0;
  target.callCount += 1;
  if (input.cost !== undefined) addCost(target, input.cost);
  const modelBucket = target.byModel.get(input.model) ?? freshBucket();
  modelBucket.promptTokens += input.promptTokens;
  modelBucket.completionTokens += input.completionTokens;
  modelBucket.reasoningTokens += input.reasoningTokens ?? 0;
  modelBucket.cachedReadTokens += input.cachedReadTokens ?? 0;
  modelBucket.cacheWriteTokens += input.cacheWriteTokens ?? 0;
  modelBucket.callCount += 1;
  if (input.cost !== undefined) addCost(modelBucket, input.cost);
  target.byModel.set(input.model, modelBucket);
}

function snapshotOf(bucket: AggregateBucket): CostSnapshot {
  const cost: Cost | null =
    bucket.costCurrency === null
      ? null
      : { amount: bucket.costAmount, currency: bucket.costCurrency };
  return {
    promptTokens: bucket.promptTokens,
    completionTokens: bucket.completionTokens,
    reasoningTokens: bucket.reasoningTokens,
    cachedReadTokens: bucket.cachedReadTokens,
    cacheWriteTokens: bucket.cacheWriteTokens,
    totalTokens: bucket.promptTokens + bucket.completionTokens + bucket.reasoningTokens,
    callCount: bucket.callCount,
    cost,
    mixedCurrency: bucket.mixedCurrency,
    byModel: [...bucket.byModel.entries()].map(([model, b]) => ({
      model,
      promptTokens: b.promptTokens,
      completionTokens: b.completionTokens,
      reasoningTokens: b.reasoningTokens,
      cachedReadTokens: b.cachedReadTokens,
      cacheWriteTokens: b.cacheWriteTokens,
      callCount: b.callCount,
      cost: b.costCurrency === null ? null : { amount: b.costAmount, currency: b.costCurrency },
      mixedCurrency: b.mixedCurrency,
    })),
  };
}

const ZERO: CostSnapshot = Object.freeze({
  promptTokens: 0,
  completionTokens: 0,
  reasoningTokens: 0,
  cachedReadTokens: 0,
  cacheWriteTokens: 0,
  totalTokens: 0,
  callCount: 0,
  cost: null,
  mixedCurrency: false,
  byModel: [],
});

/**
 * Build a {@link CostTracker} configured with the supplied budgets.
 *
 * @stable
 */
export function createCostTracker(opts: CostTrackerOptions = {}): CostTracker {
  const budgets: CostBudgets = opts.budgets ?? {};
  const currency = budgets.currency ?? 'USD';
  const onExceed = opts.onExceed;
  // W-092: memory bounds - the tracker lives for the process lifetime,
  // so unbounded maps are a leak in the long-running-assistant scenario.
  const retention = opts.retention;
  const maxSpanEntries =
    retention === false
      ? Number.POSITIVE_INFINITY
      : (retention?.maxSpanEntries ?? DEFAULT_MAX_SPAN_ENTRIES);
  const maxScopeEntries =
    retention === false
      ? Number.POSITIVE_INFINITY
      : (retention?.maxScopeEntries ?? DEFAULT_MAX_SCOPE_ENTRIES);

  const bySpan = new Map<string, AggregateBucket>();
  const byScope: Record<CostScope, Map<string, AggregateBucket>> = {
    run: new Map(),
    session: new Map(),
    agent: new Map(),
    user: new Map(),
  };

  // Parent index: child span -> parent span. Used to roll attributions
  // up the ancestor chain on every record call.
  const parents = new Map<string, string>();
  const listeners = new Set<(input: CostRecordInput) => void>();

  // W-092: evict OLDEST entries (Map insertion order - a re-recorded
  // key keeps its original position on purpose: this is an age bound,
  // not an LRU) once a map exceeds its cap. Evicting a span also drops
  // its parent edge so `parents` cannot outgrow `bySpan`.
  function evictOldest(
    map: Map<string, AggregateBucket>,
    max: number,
    surface: 'span' | CostScope,
  ): void {
    while (map.size > max) {
      const oldest = map.keys().next().value;
      if (oldest === undefined) return;
      map.delete(oldest);
      if (surface === 'span') parents.delete(oldest);
      try {
        opts.onEviction?.({ surface, id: oldest });
      } catch {
        // Observers must never break the tracker.
      }
    }
  }

  function bump(scope: CostScope, id: string | undefined, input: CostRecordInput): void {
    if (id === undefined) return;
    const map = byScope[scope];
    const bucket = map.get(id) ?? freshBucket();
    combine(bucket, input);
    map.set(id, bucket);
    evictOldest(map, maxScopeEntries, scope);
    enforceBudget(scope, id, bucket, onExceed);
  }

  function enforceBudget(
    scope: CostScope,
    id: string,
    bucket: AggregateBucket,
    cb?: CostBudgetExceededCallback,
  ): void {
    const limit = pickBudget(budgets, scope);
    if (limit === undefined) return;
    if (bucket.exceeded) return;
    if (bucket.costAmount > limit) {
      bucket.exceeded = true;
      cb?.({
        scope,
        id,
        budget: limit,
        actual: bucket.costAmount,
        currency: bucket.costCurrency ?? currency,
      });
    }
  }

  return {
    record(input: CostRecordInput): void {
      // Record the raw span figures.
      const spanBucket = bySpan.get(input.spanId) ?? freshBucket();
      combine(spanBucket, input);
      bySpan.set(input.spanId, spanBucket);

      // Walk the ancestor chain so that the figures roll up to every
      // parent span. The walker breaks if it encounters a cycle.
      if (input.parentSpanId !== undefined) {
        parents.set(input.spanId, input.parentSpanId);
      }
      const seen = new Set<string>();
      let ancestor = parents.get(input.spanId);
      while (ancestor !== undefined && !seen.has(ancestor)) {
        seen.add(ancestor);
        const ancestorBucket = bySpan.get(ancestor) ?? freshBucket();
        combine(ancestorBucket, input);
        bySpan.set(ancestor, ancestorBucket);
        ancestor = parents.get(ancestor);
      }
      // W-092: bound the span map AFTER the rollup walk so the entries
      // this record touched are all present before age eviction runs.
      evictOldest(bySpan, maxSpanEntries, 'span');

      // Roll up to the requested aggregation scopes.
      bump('run', input.runId, input);
      bump('session', input.sessionId, input);
      bump('agent', input.agentId, input);
      bump('user', input.userId, input);

      for (const listener of listeners) {
        try {
          listener(input);
        } catch {
          // Listeners must never break the tracker.
        }
      }
    },
    // W-092: an id evicted by the retention bound reports ZERO - same
    // as never-seen. Pass `retention: false` for the old unbounded maps.
    usage(scope: CostScope, id: string): CostSnapshot {
      const bucket = byScope[scope].get(id);
      if (bucket === undefined) return ZERO;
      return snapshotOf(bucket);
    },
    usageForSpan(spanId: string): CostSnapshot {
      const bucket = bySpan.get(spanId);
      if (bucket === undefined) return ZERO;
      return snapshotOf(bucket);
    },
    reset(): void {
      bySpan.clear();
      for (const map of Object.values(byScope)) {
        map.clear();
      }
      parents.clear();
    },
    onRollup(listener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Default retention caps - generous for a long-lived assistant. */
const DEFAULT_MAX_SPAN_ENTRIES = 10_000;
const DEFAULT_MAX_SCOPE_ENTRIES = 10_000;

function pickBudget(budgets: CostBudgets, scope: CostScope): number | undefined {
  switch (scope) {
    case 'session':
      return budgets.perSession;
    case 'user':
      return budgets.perUser;
    case 'agent':
      return budgets.perAgent;
    case 'run':
      return budgets.perRun;
  }
}
