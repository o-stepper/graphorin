/**
 * Stage 5 - Defer to deep LLM judge.
 *
 * Reached only when Stages 1-4 left the decision unresolved. The
 * stage records every CONFLICT-CHECK candidate id surfaced by Stage 2
 * so the orchestrator can hand the queue write to the storage layer
 * (the actual `conflict_check_pending` insert is the orchestrator's
 * responsibility - Stage 5 only computes the payload).
 *
 * The candidate fact itself is admitted with a `pending` flag so it
 * remains searchable; the deep phase (Phase 10c) drains the queue and
 * applies the resolution later.
 *
 * @packageDocumentation
 */

import type { PipelineStage, StageOutcome } from '../types.js';

export const stage5DeferToDeep: PipelineStage = {
  id: 'defer-to-deep',
  async evaluate(ctx): Promise<StageOutcome> {
    if (ctx.existing.length === 0) {
      return { kind: 'admit', reason: 'stage5-no-candidates' };
    }
    const conflictingIds = ctx.existing.map((hit) => hit.record.id);
    const top = ctx.existing[0];
    return {
      kind: 'pending',
      conflictingIds,
      ...(top !== undefined ? { similarity: top.score } : {}),
      reason: 'awaiting-deep-llm-judge',
    };
  },
};
