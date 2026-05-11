/**
 * Stage 4 — Subject / predicate match.
 *
 * Naively splits each fact body into `(subject, predicate, object)`
 * triples using the locale pack's predicate normalisers. When the
 * candidate and an existing CONFLICT-CHECK fact share the same
 * subject + predicate but differ on the object, Stage 4 marks the
 * existing fact as superseded.
 *
 * The split is intentionally simple: anything more sophisticated
 * (full entity linking) lives in the post-MVP knowledge-graph layer.
 *
 * @packageDocumentation
 */

import type { PipelineStage, StageOutcome } from '../types.js';
import { splitSubjectPredicateObject } from './helpers.js';

export const stage4SubjectPredicate: PipelineStage = {
  id: 'subject-predicate',
  async evaluate(ctx): Promise<StageOutcome> {
    const candidateTriple = splitSubjectPredicateObject(ctx.candidate.text, ctx.localePack);
    if (candidateTriple === null) {
      return { kind: 'continue' };
    }
    for (const hit of ctx.existing) {
      const existingTriple = splitSubjectPredicateObject(hit.record.text, ctx.localePack);
      if (existingTriple === null) continue;
      if (candidateTriple.subject !== existingTriple.subject) continue;
      if (candidateTriple.predicate !== existingTriple.predicate) continue;
      if (candidateTriple.object === existingTriple.object) {
        return {
          kind: 'dedup',
          existingId: hit.record.id,
          reason: 'subject-predicate-match-same-object',
        };
      }
      return {
        kind: 'supersede',
        existingId: hit.record.id,
        reason: `subject-predicate-match; subject=${candidateTriple.subject}; predicate=${candidateTriple.predicate}`,
      };
    }
    return { kind: 'continue' };
  },
};
