/**
 * Stage 3 — Heuristic regex (per-locale, pluggable).
 *
 * Inspects the candidate fact body for explicit supersede or negation
 * markers from the active locale pack (English by default). When a
 * marker fires the stage emits a `supersede` outcome against the
 * highest-scoring CONFLICT-CHECK candidate from Stage 2.
 *
 * @packageDocumentation
 */

import { evaluateMarkers } from '../locale-packs/index.js';
import type { PipelineStage, StageOutcome } from '../types.js';

export const stage3HeuristicRegex: PipelineStage = {
  id: 'heuristic-regex',
  async evaluate(ctx): Promise<StageOutcome> {
    const top = ctx.existing[0];
    if (top === undefined) {
      return { kind: 'continue' };
    }
    const candidateText = ctx.candidate.text;
    const supersede = evaluateMarkers(candidateText, ctx.localePack.supersedeMarkers);
    if (supersede.matched) {
      return {
        kind: 'supersede',
        existingId: top.record.id,
        reason: formatReason('regex-supersede-marker', supersede),
      };
    }
    const negation = evaluateMarkers(candidateText, ctx.localePack.negationMarkers);
    if (negation.matched) {
      return {
        kind: 'supersede',
        existingId: top.record.id,
        reason: formatReason('regex-negation', negation),
      };
    }
    return { kind: 'continue' };
  },
};

function formatReason(
  base: string,
  match: { kind?: string | undefined; excerpt?: string | undefined },
): string {
  const parts = [base];
  if (match.kind !== undefined) parts.push(`kind=${match.kind}`);
  if (match.excerpt !== undefined) parts.push(`marker=${match.excerpt}`);
  return parts.join('; ');
}
