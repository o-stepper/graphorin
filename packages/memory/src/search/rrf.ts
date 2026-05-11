import type { MemoryHit, MemoryRecord } from '@graphorin/core';
import type { ReRanker, ReRankOptions } from './types.js';

/**
 * Industry-standard Reciprocal Rank Fusion constant. Lower `k` makes
 * top-ranked items dominate; higher `k` smooths the contribution of
 * lower-ranked items. `k = 60` is the value popularised by Cormack,
 * Clarke, and Büttcher (2009) and is the framework default.
 *
 * @stable
 */
export const RRF_DEFAULT_K = 60;

/**
 * Built-in Reciprocal Rank Fusion reranker. Combines multiple ranked
 * lists (vector hits, FTS5 hits, optional entity boost) into a single
 * fused ranking by summing `1 / (k + rank)` per list each item appears
 * in.
 *
 * Properties (verified by the property-based test suite):
 *
 *  - **Deterministic.** Identical input lists yield identical output.
 *  - **Stable under permutation of input lists.** The fusion is
 *    independent of the order in which the input lists are passed in.
 *  - **Tie-broken by stable record id.** Records with equal RRF
 *    scores keep their first-seen order.
 *
 * @stable
 */
export class RRFReranker implements ReRanker {
  readonly id = 'rrf' as const;
  readonly k: number;

  constructor(k: number = RRF_DEFAULT_K) {
    if (!Number.isFinite(k) || k <= 0) {
      throw new TypeError(
        `[graphorin/memory] RRFReranker: 'k' must be a positive finite number, got ${String(k)}.`,
      );
    }
    this.k = k;
  }

  async rerank<TRecord extends MemoryRecord>(
    query: string,
    lists: ReadonlyArray<ReadonlyArray<MemoryHit<TRecord>>>,
    options: ReRankOptions = {},
  ): Promise<ReadonlyArray<MemoryHit<TRecord>>> {
    void query;
    if (options.signal?.aborted === true) {
      throw new DOMException('RRFReranker aborted', 'AbortError');
    }
    const fused = fuseRrf(lists, this.k);
    const topK = options.topK ?? 10;
    return fused.slice(0, Math.max(0, topK));
  }
}

/**
 * Pure functional core of the RRF reranker. Exported separately so the
 * test suite (and the property-based fuzzer) can exercise the math
 * without the `Promise<…>` wrapping of the public surface.
 *
 * @stable
 */
export function fuseRrf<TRecord extends MemoryRecord>(
  lists: ReadonlyArray<ReadonlyArray<MemoryHit<TRecord>>>,
  k: number,
): ReadonlyArray<MemoryHit<TRecord>> {
  type Aggregate = {
    record: TRecord;
    score: number;
    signals: Record<string, number>;
    firstSeenOrder: number;
  };
  const aggregates = new Map<string, Aggregate>();
  let nextOrder = 0;
  for (let listIdx = 0; listIdx < lists.length; listIdx++) {
    const list = lists[listIdx] ?? [];
    for (let i = 0; i < list.length; i++) {
      const hit = list[i];
      if (hit === undefined) continue;
      const rank = i + 1;
      const contribution = 1 / (k + rank);
      const id = hit.record.id;
      const existing = aggregates.get(id);
      if (existing === undefined) {
        const signals: Record<string, number> = {
          ...(hit.signals ?? {}),
          rrf: contribution,
          [`rrf.list_${listIdx}`]: contribution,
        };
        aggregates.set(id, {
          record: hit.record,
          score: contribution,
          signals,
          firstSeenOrder: nextOrder++,
        });
      } else {
        existing.score += contribution;
        existing.signals[`rrf.list_${listIdx}`] = contribution;
        existing.signals.rrf = (existing.signals.rrf ?? 0) + contribution;
        for (const [key, value] of Object.entries(hit.signals ?? {})) {
          if (key in existing.signals) continue;
          existing.signals[key] = value;
        }
      }
    }
  }
  const fused: MemoryHit<TRecord>[] = [];
  for (const a of aggregates.values()) {
    fused.push({
      record: a.record,
      score: a.score,
      signals: Object.freeze({ ...a.signals }),
    });
  }
  fused.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const orderA = aggregates.get(a.record.id)?.firstSeenOrder ?? 0;
    const orderB = aggregates.get(b.record.id)?.firstSeenOrder ?? 0;
    return orderA - orderB;
  });
  return fused;
}
