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
    const fused = fuseRrf(lists, this.k, options.labels);
    const topK = options.topK ?? 10;
    return fused.slice(0, Math.max(0, topK));
  }
}

/**
 * Weighted-RRF reranker (X-2). Fuses parallel ranked lists through
 * {@link fuseWeighted}, applying a per-list `weights[i]` so a caller who
 * has calibrated list reliability against labels (the P0-1 eval harness)
 * can trust one retriever over another — e.g. up-weight dense vector
 * hits over lexical FTS hits. `weights` is **positional**: aligned to the
 * input `lists` order (the built-in hybrid search passes FTS first, then
 * vector). At equal weights it is identical to {@link RRFReranker}; RRF
 * stays the framework default.
 *
 * Like the RRF reranker it is deterministic and tie-broken by stable
 * record id, and it preserves the upstream `signals` on each hit.
 *
 * @stable
 */
export class WeightedRRFReranker implements ReRanker {
  readonly id = 'weighted-rrf' as const;
  readonly k: number;
  readonly weights: ReadonlyArray<number>;

  constructor(args: { weights: ReadonlyArray<number>; k?: number }) {
    const k = args.k ?? RRF_DEFAULT_K;
    if (!Number.isFinite(k) || k <= 0) {
      throw new TypeError(
        `[graphorin/memory] WeightedRRFReranker: 'k' must be a positive finite number, got ${String(k)}.`,
      );
    }
    for (const w of args.weights) {
      if (!Number.isFinite(w) || w < 0) {
        throw new TypeError(
          `[graphorin/memory] WeightedRRFReranker: every weight must be a non-negative finite number, got ${String(w)}.`,
        );
      }
    }
    this.k = k;
    this.weights = args.weights;
  }

  async rerank<TRecord extends MemoryRecord>(
    query: string,
    lists: ReadonlyArray<ReadonlyArray<MemoryHit<TRecord>>>,
    options: ReRankOptions = {},
  ): Promise<ReadonlyArray<MemoryHit<TRecord>>> {
    void query;
    if (options.signal?.aborted === true) {
      throw new DOMException('WeightedRRFReranker aborted', 'AbortError');
    }
    const fused = fuseWeighted(lists, this.weights, this.k, options.labels);
    const topK = options.topK ?? 10;
    return fused.slice(0, Math.max(0, topK));
  }
}

/**
 * Pure functional core of the RRF reranker — the equal-weight case of
 * {@link fuseWeighted}. Exported separately so the test suite (and the
 * property-based fuzzer) can exercise the math without the `Promise<…>`
 * wrapping of the public surface.
 *
 * @stable
 */
export function fuseRrf<TRecord extends MemoryRecord>(
  lists: ReadonlyArray<ReadonlyArray<MemoryHit<TRecord>>>,
  k: number,
  labels?: ReadonlyArray<string>,
): ReadonlyArray<MemoryHit<TRecord>> {
  return fuseWeighted(lists, undefined, k, labels);
}

/**
 * Weighted / convex generalization of {@link fuseRrf} (X-2). Each input
 * list `i` contributes `weights[i] · 1 / (k + rank)` to a record's fused
 * score instead of the flat `1 / (k + rank)`, so a caller who has
 * calibrated list reliability against labels (the P0-1 eval harness) can
 * trust one retriever over another. RRF stays the zero-tuning default: a
 * `weights` of `undefined` (or all-`1`) is byte-for-byte identical to
 * {@link fuseRrf}. A missing, non-finite, or negative entry falls back to
 * the neutral weight `1`, so a partial / malformed `weights` never throws
 * or poisons the ranking.
 *
 * Like {@link fuseRrf} the fusion is deterministic, tie-broken by
 * first-seen order, and preserves any upstream `signals` (FTS `bm25`,
 * vector similarity) the hits carried in — the `rrf` / `rrf.list_N`
 * signals it records are the *weighted* contributions, so the fused
 * `score` still equals their sum. Note that — unlike RRF — the result
 * depends on input list *order*, because each weight is bound to a list
 * position.
 *
 * @stable
 */
export function fuseWeighted<TRecord extends MemoryRecord>(
  lists: ReadonlyArray<ReadonlyArray<MemoryHit<TRecord>>>,
  weights: ReadonlyArray<number> | undefined,
  k: number,
  labels?: ReadonlyArray<string>,
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
    const weight = resolveWeight(weights, listIdx);
    // MRET-13: explanation signals key by the caller's retriever-kind
    // label when supplied — `rrf.list_N` is an ephemeral position that
    // changes meaning whenever a leg (vector / HyDE / graph) is
    // conditionally absent from the fan-out.
    const signalKey = `rrf.${labels?.[listIdx] ?? `list_${listIdx}`}`;
    for (let i = 0; i < list.length; i++) {
      const hit = list[i];
      if (hit === undefined) continue;
      const rank = i + 1;
      const contribution = weight / (k + rank);
      const id = hit.record.id;
      const existing = aggregates.get(id);
      if (existing === undefined) {
        const signals: Record<string, number> = {
          ...(hit.signals ?? {}),
          rrf: contribution,
          [signalKey]: contribution,
        };
        aggregates.set(id, {
          record: hit.record,
          score: contribution,
          signals,
          firstSeenOrder: nextOrder++,
        });
      } else {
        existing.score += contribution;
        existing.signals[signalKey] = contribution;
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

/**
 * Resolve list `index`'s fusion weight, defaulting a missing / non-finite
 * / negative entry to the neutral `1` (so an absent or malformed
 * `weights` degrades to plain RRF rather than poisoning the ranking).
 */
function resolveWeight(weights: ReadonlyArray<number> | undefined, index: number): number {
  const raw = weights?.[index];
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : 1;
}
