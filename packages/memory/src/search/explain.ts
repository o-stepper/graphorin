/**
 * Recall explainability for `@graphorin/memory` — "why was this
 * recalled?" (X-3). Turns the per-signal scores the hybrid pipeline
 * already records on each {@link MemoryHit} (FTS `bm25`, vector
 * similarity, the fused reciprocal-rank term, the decay multiplier,
 * future graph-hop terms) into a structured, renderable explanation.
 *
 * Pure data: the builder re-uses whatever {@link MemoryHit.signals} the
 * pipeline left behind rather than re-deriving them, so the explanation
 * always matches the ranking that actually happened. The renderer
 * returns a string and performs no I/O, so the explanation can be
 * attached to a span, logged, or surfaced by operator tooling.
 *
 * @packageDocumentation
 */

import type { MemoryHit, MemoryKind, MemoryRecord } from '@graphorin/core';

/**
 * Per-memory contribution breakdown for one recalled record: the
 * decomposed signals the hybrid pipeline summed into the final score,
 * plus the record's final rank. Surfaces *why* a single memory was
 * recalled and how it ranked relative to its siblings.
 *
 * @stable
 */
export interface RecalledMemoryExplanation {
  /** Record id (fact / episode / insight / …). */
  readonly id: string;
  /** Memory kind of the recalled record. */
  readonly kind: MemoryKind;
  /** 1-based position in the final fused + decayed ranking. */
  readonly rank: number;
  /** Final score after fusion and (optional) decay. */
  readonly score: number;
  /**
   * Raw per-signal scores contributing to `score`, exactly as the
   * pipeline recorded them on the hit: FTS (`bm25`), vector similarity
   * (`vector`), the fused reciprocal-rank terms (`rrf` plus one
   * `rrf.<label>` entry per fused list keyed by the retriever kind,
   * e.g. `rrf.fts` / `rrf.vector`, with `rrf.list_N` as the fallback
   * when a list carries no label), and the decay multiplier (`decay`)
   * when decay ran.
   */
  readonly signals: Readonly<Record<string, number>>;
}

/**
 * Structured "why was this recalled?" explanation for one
 * {@link SemanticMemory.search} call: the query, the reranker that
 * fused the candidate lists, and the per-memory signal breakdown in
 * final-rank order. Pure data — safe to attach to a span, log, or
 * render. X-3.
 *
 * @stable
 */
export interface RecallExplanation {
  /** The query the recall ran for. */
  readonly query: string;
  /** Stable id of the reranker that fused the candidate lists. */
  readonly rerankerId: string;
  /** Number of recalled memories explained. */
  readonly count: number;
  /** Per-memory breakdown, in final-rank order (rank 1 first). */
  readonly results: ReadonlyArray<RecalledMemoryExplanation>;
}

/**
 * Build a {@link RecallExplanation} from a ranked hit list. Pure and
 * deterministic: it surfaces whatever per-signal scores the hybrid
 * pipeline left on each {@link MemoryHit.signals} (FTS, vector, RRF,
 * decay, future graph-hop terms) without re-deriving them, so the
 * explanation always matches what actually drove the ranking. Hits are
 * assumed to be in final-rank order (as returned by `search`).
 *
 * @stable
 */
export function explainRecall<TRecord extends MemoryRecord>(
  hits: ReadonlyArray<MemoryHit<TRecord>>,
  opts: { readonly query: string; readonly rerankerId: string },
): RecallExplanation {
  const results = hits.map(
    (hit, idx): RecalledMemoryExplanation =>
      Object.freeze({
        id: hit.record.id,
        kind: hit.record.kind,
        rank: idx + 1,
        score: hit.score,
        signals: Object.freeze({ ...(hit.signals ?? {}) }),
      }),
  );
  return Object.freeze({
    query: opts.query,
    rerankerId: opts.rerankerId,
    count: results.length,
    results: Object.freeze(results),
  });
}

/**
 * Render a {@link RecallExplanation} as a compact ASCII block — a
 * header line plus one line per recalled memory with its signal
 * breakdown. Pure (returns a string, no I/O); used by operator tooling
 * and trace inspectors.
 *
 * @stable
 */
export function formatRecallExplanation(explanation: RecallExplanation): string {
  const header = `recall ${JSON.stringify(explanation.query)} via ${explanation.rerankerId} -> ${explanation.count} result(s)`;
  if (explanation.results.length === 0) return header;
  const lines = explanation.results.map((r) => {
    const signals = Object.entries(r.signals)
      .map(([key, value]) => `${key}=${formatScore(value)}`)
      .join(' ');
    const suffix = signals === '' ? '' : ` (${signals})`;
    return `  #${r.rank} ${r.id} [${r.kind}] score=${formatScore(r.score)}${suffix}`;
  });
  return [header, ...lines].join('\n');
}

function formatScore(value: number): string {
  return Number.isFinite(value) ? value.toFixed(4) : String(value);
}
