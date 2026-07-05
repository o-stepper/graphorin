/**
 * Stage 1 - Exact dedup. Computes an MD5 hash on the canonical fact
 * body (lowercase + trimmed + collapsed whitespace) and short-circuits
 * to `dedup` when an existing fact in the supplied vector hit list
 * shares the same canonical form.
 *
 * Stage 1 only inspects `existing` when Stage 2 already populated it
 * for the orchestrator (re-using the embedding round-trip). When the
 * orchestrator calls Stage 1 with an empty list the stage falls
 * through to `'continue'` - Stage 2 will gather candidates and Stage 1
 * is folded into Stage 2's HOT zone via the same canonical-form
 * comparison.
 *
 * @packageDocumentation
 */

import type { PipelineStage } from '../types.js';
import { canonicaliseFactBody, fastFactHash } from './helpers.js';

export const stage1ExactDedup: PipelineStage = {
  id: 'exact-dedup',
  async evaluate(ctx) {
    const candidateHash = fastFactHash(canonicaliseFactBody(ctx.candidate.text));
    if (ctx.existing.length === 0) {
      return { kind: 'continue' };
    }
    for (const hit of ctx.existing) {
      const existingHash = fastFactHash(canonicaliseFactBody(hit.record.text));
      if (existingHash === candidateHash) {
        return {
          kind: 'dedup',
          existingId: hit.record.id,
          similarity: 1,
          reason: 'exact-hash-match',
        };
      }
    }
    return { kind: 'continue' };
  },
};
