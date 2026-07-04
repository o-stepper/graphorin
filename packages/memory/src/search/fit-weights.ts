/**
 * C5: offline fusion-weight fitting. Tuned convex/weighted fusion beats
 * RRF with a handful of labelled queries (Bruch et al., TOIS 2023) — this
 * module turns that into a small, pure routine: grid-search
 * {@link FusionWeights} over labelled cases and return the setting that
 * maximizes mean nDCG@k, together with the plain-RRF baseline so the
 * caller can see whether tuning actually paid.
 *
 * Pure and I/O-free: the caller supplies per-kind candidate lists (run
 * your FTS and vector retrievers once per query, offline) plus the ids
 * judged relevant. Feed the winning weights to
 * `search(..., { fusion: { strategy: 'weighted', weights } })` or a
 * process-default `WeightedRRFReranker`.
 *
 * @packageDocumentation
 */

import type { MemoryHit, MemoryRecord } from '@graphorin/core';
import { fuseWeighted } from './rrf.js';

/** One labelled query: per-kind candidate lists + the relevant ids. */
export interface FitFusionCase<TRecord extends MemoryRecord = MemoryRecord> {
  /** FTS candidate list, best-first (as the store returns it). */
  readonly fts: ReadonlyArray<MemoryHit<TRecord>>;
  /** Vector candidate list, best-first. */
  readonly vector: ReadonlyArray<MemoryHit<TRecord>>;
  /** Ids judged relevant for this query (binary gain). */
  readonly relevantIds: ReadonlyArray<string>;
}

/** Options for {@link fitFusionWeights}. */
export interface FitFusionOptions {
  /** Candidate weight values per axis. Default `[0.25, 0.5, 1, 2, 4]`. */
  readonly grid?: ReadonlyArray<number>;
  /** nDCG cutoff. Default `10`. */
  readonly k?: number;
  /** RRF constant forwarded to the fuse. Default `60`. */
  readonly rrfK?: number;
}

/** Result of a fit: the winning weights + its score and the RRF baseline. */
export interface FitFusionResult {
  readonly weights: { readonly fts: number; readonly vector: number };
  /** Mean nDCG@k of the winning weights across the cases. */
  readonly score: number;
  /** Mean nDCG@k of unit weights (plain RRF) — compare before adopting. */
  readonly baseline: number;
}

/**
 * Binary-gain nDCG@k over a ranked id list.
 *
 * @stable
 */
export function ndcgAtK(
  rankedIds: ReadonlyArray<string>,
  relevant: ReadonlySet<string>,
  k: number,
): number {
  const cutoff = Math.min(k, rankedIds.length);
  let dcg = 0;
  for (let i = 0; i < cutoff; i++) {
    const id = rankedIds[i];
    if (id !== undefined && relevant.has(id)) dcg += 1 / Math.log2(i + 2);
  }
  const idealHits = Math.min(relevant.size, k);
  let idcg = 0;
  for (let i = 0; i < idealHits; i++) idcg += 1 / Math.log2(i + 2);
  return idcg === 0 ? 0 : dcg / idcg;
}

/**
 * Grid-search fusion weights against labelled cases (C5).
 *
 * @stable
 */
export function fitFusionWeights<TRecord extends MemoryRecord = MemoryRecord>(
  cases: ReadonlyArray<FitFusionCase<TRecord>>,
  options: FitFusionOptions = {},
): FitFusionResult {
  if (cases.length === 0) {
    throw new TypeError('[graphorin/memory] fitFusionWeights: at least one labelled case required');
  }
  const grid = options.grid ?? [0.25, 0.5, 1, 2, 4];
  const k = options.k ?? 10;
  const rrfK = options.rrfK ?? 60;

  const meanNdcg = (wFts: number, wVector: number): number => {
    let total = 0;
    for (const c of cases) {
      const fused = fuseWeighted([c.fts, c.vector], [wFts, wVector], rrfK);
      const rankedIds = fused.map((h) => h.record.id);
      total += ndcgAtK(rankedIds, new Set(c.relevantIds), k);
    }
    return total / cases.length;
  };

  const baseline = meanNdcg(1, 1);
  let best: FitFusionResult = { weights: { fts: 1, vector: 1 }, score: baseline, baseline };
  for (const wFts of grid) {
    for (const wVector of grid) {
      const score = meanNdcg(wFts, wVector);
      if (score > best.score + 1e-12) {
        best = { weights: { fts: wFts, vector: wVector }, score, baseline };
      }
    }
  }
  return best;
}
