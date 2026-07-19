/**
 * Stage 2 - Embedding three-zone classifier (RB-02 §8.1).
 *
 * Inspects the candidate similarity against the top-K nearest
 * neighbours surfaced by the semantic vector store and routes the
 * decision into one of four zones:
 *
 *  - HOT (`sim ≥ thresholds.hot`): silent dedup - the existing fact is
 *    semantically identical, no audit-worthy conflict.
 *  - NEAR-DUP (`thresholds.nearDup ≤ sim < thresholds.hot`): same
 *    fact phrased differently - dedup with `near-dup` zone label so
 *    operators can spot the case in `fact_conflicts`.
 *  - CONFLICT-CHECK (`thresholds.cold < sim < thresholds.nearDup`):
 *    candidate sounds related; defer decision to Stages 3 → 4 → 5.
 *  - COLD (`sim ≤ thresholds.cold`): no conflict - admit the candidate.
 *
 * `sim` is the **raw cosine** similarity (DEC-130): the store's
 * normalized `[0, 1]` hit score (`(1 + cos) / 2`) is mapped back
 * through `rawCosineFromStoreScore` before the zone comparison so
 * the thresholds keep their calibrated raw-cosine semantics.
 *
 * @packageDocumentation
 */

import { type PipelineStage, rawCosineFromStoreScore, type StageOutcome } from '../types.js';

export const stage2EmbeddingThreeZone: PipelineStage = {
  id: 'embedding-three-zone',
  async evaluate(ctx): Promise<StageOutcome> {
    if (ctx.existing.length === 0) {
      return { kind: 'admit', reason: 'no-existing-candidates' };
    }
    const top = ctx.existing[0];
    if (top === undefined) {
      return { kind: 'admit', reason: 'no-existing-candidates' };
    }
    const similarity = rawCosineFromStoreScore(top.score);
    if (similarity >= ctx.thresholds.hot) {
      return {
        kind: 'dedup',
        existingId: top.record.id,
        similarity,
        reason: 'embedding-hot-zone',
      };
    }
    if (similarity >= ctx.thresholds.nearDup) {
      return {
        kind: 'dedup',
        existingId: top.record.id,
        similarity,
        reason: 'embedding-near-dup-zone',
      };
    }
    if (similarity > ctx.thresholds.cold) {
      return { kind: 'continue' };
    }
    return { kind: 'admit', reason: 'embedding-cold-zone' };
  },
};
