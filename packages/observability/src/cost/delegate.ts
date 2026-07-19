/**
 * The bridge between the provider middleware `withCostTracking`
 * and a {@link CostTracker}. The
 * middleware's `onUsage` hook carries per-call figures (incl. the
 * prompt-cache legs and a computed `costUsd`); this adapter converts
 * them into a {@link CostRecordInput} and records it - STRUCTURALLY,
 * with no `@graphorin/provider` import, so the observability package
 * keeps its dependency profile.
 *
 * ```ts
 * const tracker = createCostTracker({ budgets: { perSession: 5 } });
 * const provider = withCostTracking(base, {
 *   priceLookup,
 *   onUsage: costTrackerUsageDelegate(tracker, () => ({
 *     spanId: currentSpanId(),
 *     sessionId: currentSessionId(),
 *   })),
 * });
 * ```
 *
 * @packageDocumentation
 */

import type { CostTracker } from './cost-tracker.js';
import type { CostRecordInput } from './types.js';

/**
 * Structural mirror of the info object `withCostTracking`'s `onUsage`
 * hook receives (no provider dependency).
 *
 * @stable
 */
export interface ProviderUsageInfoLike {
  readonly modelId: string;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly cachedReadTokens?: number;
  readonly cacheWriteTokens?: number;
  readonly costUsd: number;
}

/**
 * Attribution ids for one recorded call. `spanId` is mandatory (the
 * tracker keys rollups on it); everything else is optional scope
 * attribution.
 *
 * @stable
 */
export type CostTrackerDelegateIds = Pick<
  CostRecordInput,
  'spanId' | 'parentSpanId' | 'runId' | 'sessionId' | 'agentId' | 'userId'
>;

/**
 * Build an `onUsage` callback that records into `tracker`. Pass either
 * static ids (a provider instance bound to one session) or a resolver
 * invoked per call (a shared provider serving many runs). A zero
 * `costUsd` records token figures WITHOUT a cost so a price-less
 * middleware does not fabricate a $0 USD cost entry.
 *
 * @stable
 */
export function costTrackerUsageDelegate(
  tracker: Pick<CostTracker, 'record'>,
  ids: CostTrackerDelegateIds | ((info: ProviderUsageInfoLike) => CostTrackerDelegateIds),
): (info: ProviderUsageInfoLike) => void {
  return (info) => {
    const resolved = typeof ids === 'function' ? ids(info) : ids;
    tracker.record({
      model: info.modelId,
      promptTokens: info.promptTokens,
      completionTokens: info.completionTokens,
      ...(info.cachedReadTokens !== undefined ? { cachedReadTokens: info.cachedReadTokens } : {}),
      ...(info.cacheWriteTokens !== undefined ? { cacheWriteTokens: info.cacheWriteTokens } : {}),
      ...(info.costUsd > 0 ? { cost: { amount: info.costUsd, currency: 'USD' } } : {}),
      ...resolved,
    });
  };
}
