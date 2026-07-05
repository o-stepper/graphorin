/**
 * `runConflictPipeline` - orchestrator for the multi-stage conflict
 * resolution pipeline shipped in `@graphorin/memory` Phase 10b
 * (DEC-117 / ADR-018 ext / RB-02).
 *
 * @packageDocumentation
 */

import type { Fact, MemoryHit } from '@graphorin/core';
import { withMemorySpan } from '../internal/spans.js';
import { enLocalePack, type LocalePack } from './locale-packs/index.js';
import { stage1ExactDedup } from './stages/stage1-exact-dedup.js';
import { stage2EmbeddingThreeZone } from './stages/stage2-embedding-three-zone.js';
import { stage3HeuristicRegex } from './stages/stage3-heuristic-regex.js';
import { stage4SubjectPredicate } from './stages/stage4-subject-predicate.js';
import { stage5DeferToDeep } from './stages/stage5-defer-to-deep.js';
import {
  type ConflictDecision,
  type ConflictPipeline,
  type ConflictPipelineDeps,
  type ConflictPipelineOptions,
  type ConflictStage,
  type ConflictThresholds,
  DEFAULT_CONFLICT_THRESHOLDS,
  type StageContext,
  type StageOutcome,
} from './types.js';

let bypassWarnedOnce = false;

/**
 * Reset the one-shot bypass-warning flag. Test-only helper - production
 * callers never invoke this.
 *
 * @internal
 */
export function _resetBypassWarningForTesting(): void {
  bypassWarnedOnce = false;
}

/**
 * One-shot helper that mirrors RB-02 §8.1's `runConflictPipeline({...})`
 * spec - convenient for callers that do not need to pre-build + cache
 * the pipeline. Production wiring should still go through
 * {@link createConflictPipeline} (`SemanticMemory` re-uses the cached
 * instance per `Memory`).
 *
 * @stable
 */
export async function runConflictPipeline(args: {
  readonly candidate: Fact;
  readonly deps: ConflictPipelineDeps;
  readonly options?: ConflictPipelineOptions;
}): Promise<ConflictDecision> {
  const pipeline = createConflictPipeline(args.options ?? {});
  return pipeline.run(args.deps, args.candidate);
}

/**
 * Returns a frozen pipeline handle wired with the supplied options.
 *
 * @stable
 */
export function createConflictPipeline(options: ConflictPipelineOptions = {}): ConflictPipeline {
  const mode: 'on' | 'off' = options.mode ?? 'on';
  const localePack: LocalePack = options.localePack ?? enLocalePack;
  const thresholds: ConflictThresholds = Object.freeze({
    hot: options.thresholds?.hot ?? DEFAULT_CONFLICT_THRESHOLDS.hot,
    nearDup: options.thresholds?.nearDup ?? DEFAULT_CONFLICT_THRESHOLDS.nearDup,
    cold: options.thresholds?.cold ?? DEFAULT_CONFLICT_THRESHOLDS.cold,
  });
  validateThresholds(thresholds);
  const stage2TopK = options.stage2TopK ?? 5;
  const now = options.now ?? ((): string => new Date().toISOString());

  async function run(deps: ConflictPipelineDeps, candidate: Fact): Promise<ConflictDecision> {
    if (mode === 'off') {
      if (!bypassWarnedOnce) {
        bypassWarnedOnce = true;
        warnBypass();
      }
      return { kind: 'admit', stage: 'exact-dedup', reason: 'pipeline-mode-off' };
    }

    checkAbort(deps.signal);
    const conflictStore = options.conflictStore ?? deps.store.conflicts;

    return withMemorySpan(
      deps.tracer,
      'memory.conflict',
      {
        userId: candidate.userId,
        ...(candidate.sessionId !== undefined ? { sessionId: candidate.sessionId } : {}),
        ...(candidate.agentId !== undefined ? { agentId: candidate.agentId } : {}),
      },
      {
        'memory.conflict.candidate_id': candidate.id,
        'memory.conflict.locale_pack': localePack.id,
      },
      async (span) => {
        const existing = await collectVectorCandidates(deps, candidate, stage2TopK);
        const ctx: StageContext = {
          candidate,
          existing,
          localePack,
          thresholds,
        };
        const decision = await orchestrate(ctx);
        await persistDecision(decision, candidate, conflictStore, now);
        span.setAttributes({
          'memory.conflict.stage': decision.stage,
          'memory.conflict.decision': decision.kind,
          'memory.conflict.candidate_count': existing.length,
          ...(decision.kind === 'dedup' && decision.similarity !== undefined
            ? { 'memory.conflict.similarity': decision.similarity }
            : {}),
          ...(decision.kind === 'pending' && decision.similarity !== undefined
            ? { 'memory.conflict.similarity': decision.similarity }
            : {}),
          ...(decision.kind !== 'admit'
            ? { 'memory.conflict.reason': decision.reason ?? 'unspecified' }
            : decision.reason !== undefined
              ? { 'memory.conflict.reason': decision.reason }
              : {}),
        });
        return decision;
      },
    );
  }

  /**
   * Visit the five stages in the order documented by RB-02 §8.1 and
   * the conflict-resolution policy (DEC-117). Stage 1 short-circuits
   * exact duplicates. Stage 2 always computes the zone but the
   * orchestrator splits its decision in two halves: the HOT zone is
   * the only zone that overrides Stage 3 / Stage 4 (semantic identity
   * outranks any explicit user marker); every other zone runs Stages
   * 3 and 4 first to give the heuristic markers a chance to supersede
   * before falling back to Stage 2's default decision.
   *
   * Stage 3 is declared "orthogonal to Stage 2", which is why the
   * heuristic stages run regardless of Stage 2's COLD / NEAR-DUP /
   * CONFLICT-CHECK assignment as long as Stage 2 surfaced at least
   * one candidate. The HOT-zone short-circuit preserves the dedup
   * invariant for semantic identity.
   */
  async function orchestrate(ctx: StageContext): Promise<ConflictDecision> {
    const stage1 = await stage1ExactDedup.evaluate(ctx);
    if (stage1.kind !== 'continue') {
      return mapOutcomeToDecision('exact-dedup', stage1, ctx.candidate);
    }

    const stage2 = await stage2EmbeddingThreeZone.evaluate(ctx);
    if (stage2.kind === 'dedup' && stage2.reason === 'embedding-hot-zone') {
      return mapOutcomeToDecision('embedding-three-zone', stage2, ctx.candidate);
    }

    if (ctx.existing.length > 0) {
      const stage3 = await stage3HeuristicRegex.evaluate(ctx);
      if (stage3.kind !== 'continue') {
        return mapOutcomeToDecision('heuristic-regex', stage3, ctx.candidate);
      }
      const stage4 = await stage4SubjectPredicate.evaluate(ctx);
      if (stage4.kind !== 'continue') {
        return mapOutcomeToDecision('subject-predicate', stage4, ctx.candidate);
      }
    }

    if (stage2.kind === 'dedup' || stage2.kind === 'admit') {
      return mapOutcomeToDecision('embedding-three-zone', stage2, ctx.candidate);
    }

    const stage5 = await stage5DeferToDeep.evaluate(ctx);
    return mapOutcomeToDecision('defer-to-deep', stage5, ctx.candidate);
  }

  return Object.freeze({
    mode,
    localePack,
    thresholds,
    run,
  }) satisfies ConflictPipeline;
}

function mapOutcomeToDecision(
  stage: ConflictStage,
  outcome: StageOutcome,
  candidate: Fact,
): ConflictDecision {
  switch (outcome.kind) {
    case 'continue':
      return { kind: 'admit', stage, reason: 'continue-fallthrough' };
    case 'admit':
      return {
        kind: 'admit',
        stage,
        ...(outcome.reason !== undefined ? { reason: outcome.reason } : {}),
      };
    case 'dedup':
      return {
        kind: 'dedup',
        stage,
        existingId: outcome.existingId,
        ...(outcome.similarity !== undefined ? { similarity: outcome.similarity } : {}),
        ...(outcome.reason !== undefined ? { reason: outcome.reason } : {}),
      };
    case 'supersede':
      return {
        kind: 'supersede',
        stage,
        existingId: outcome.existingId,
        reason: outcome.reason,
      };
    case 'pending':
      return {
        kind: 'pending',
        stage,
        candidateId: candidate.id,
        conflictingIds: outcome.conflictingIds,
        ...(outcome.similarity !== undefined ? { similarity: outcome.similarity } : {}),
        ...(outcome.reason !== undefined ? { reason: outcome.reason } : {}),
      };
  }
}

async function persistDecision(
  decision: ConflictDecision,
  candidate: Fact,
  conflictStore: ConflictPipelineDeps['store']['conflicts'],
  now: () => string,
): Promise<void> {
  if (conflictStore === undefined) return;
  const scope = {
    userId: candidate.userId,
    ...(candidate.sessionId !== undefined ? { sessionId: candidate.sessionId } : {}),
    ...(candidate.agentId !== undefined ? { agentId: candidate.agentId } : {}),
  };
  const detectionZone = decisionToZone(decision);
  const auditInput: Parameters<NonNullable<typeof conflictStore>['recordDecision']>[0] = {
    scope,
    candidateId: candidate.id,
    decision: decision.kind,
    stage: decision.stage,
    ...(detectionZone !== undefined ? { detectionZone } : {}),
    ...(decision.kind === 'dedup' && decision.existingId !== undefined
      ? { existingId: decision.existingId }
      : {}),
    ...(decision.kind === 'supersede' ? { existingId: decision.existingId } : {}),
    ...(decision.kind === 'dedup' && decision.similarity !== undefined
      ? { similarity: decision.similarity }
      : {}),
    ...(decision.kind === 'pending' && decision.similarity !== undefined
      ? { similarity: decision.similarity }
      : {}),
    ...(decision.kind !== 'admit' && decision.reason !== undefined
      ? { reason: decision.reason }
      : {}),
    ...(decision.kind === 'admit' && decision.reason !== undefined
      ? { reason: decision.reason }
      : {}),
  };
  await conflictStore.recordDecision(auditInput);
  if (decision.kind === 'pending') {
    await conflictStore.enqueuePending({
      scope,
      factId: candidate.id,
      candidateText: candidate.text,
      stage: decision.stage,
      conflictingIds: decision.conflictingIds,
      ...(decision.reason !== undefined ? { reason: decision.reason } : {}),
    });
  }
  void now;
}

function decisionToZone(decision: ConflictDecision): string | undefined {
  switch (decision.kind) {
    case 'admit':
      if (decision.reason === 'embedding-cold-zone') return 'cold';
      return undefined;
    case 'dedup':
      if (decision.reason === 'embedding-hot-zone') return 'hot';
      if (decision.reason === 'embedding-near-dup-zone') return 'near-dup';
      if (decision.reason === 'exact-hash-match') return 'exact';
      if (decision.reason === 'subject-predicate-match-same-object') return 'subject-predicate';
      return undefined;
    case 'supersede':
      if (decision.reason.startsWith('regex-supersede-marker')) return 'heuristic';
      if (decision.reason.startsWith('regex-negation')) return 'heuristic';
      if (decision.reason.startsWith('subject-predicate-match')) return 'subject-predicate';
      return undefined;
    case 'pending':
      return 'conflict-check';
  }
}

async function collectVectorCandidates(
  deps: ConflictPipelineDeps,
  candidate: Fact,
  topK: number,
): Promise<ReadonlyArray<MemoryHit<Fact>>> {
  if (deps.embedder === null || deps.embedderId === null) return [];
  const adapter = deps.store.semantic;
  if (typeof adapter.searchVector !== 'function') return [];
  checkAbort(deps.signal);
  // PS-10: the candidate is compared against stored facts, which are embedded
  // as `passage` - keep it in the same space for the asymmetric (E5) embedder.
  const [vector] = await deps.embedder.embed([candidate.text], { taskType: 'passage' });
  if (vector === undefined) return [];
  checkAbort(deps.signal);
  const scope = {
    userId: candidate.userId,
    ...(candidate.sessionId !== undefined ? { sessionId: candidate.sessionId } : {}),
    ...(candidate.agentId !== undefined ? { agentId: candidate.agentId } : {}),
  };
  // Vector search may throw when the storage layer's vector extension
  // is missing or mis-configured (e.g. `sqlite-vec` not loaded). Fall
  // back to "no candidates" so the conflict pipeline degrades to the
  // 10a straight-through write rather than blocking the agent loop.
  // AbortError is re-raised so cancellation propagates up.
  let hits: ReadonlyArray<MemoryHit<Fact>>;
  try {
    hits = await adapter.searchVector(scope, vector, deps.embedderId, topK);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    return [];
  }
  return [...hits].filter((hit) => hit.record.id !== candidate.id);
}

function validateThresholds(thresholds: ConflictThresholds): void {
  if (
    !(
      thresholds.hot >= thresholds.nearDup &&
      thresholds.nearDup >= thresholds.cold &&
      thresholds.hot <= 1 &&
      thresholds.cold >= 0
    )
  ) {
    throw new TypeError(
      `[graphorin/memory] invalid conflict thresholds: expected 0 <= cold <= nearDup <= hot <= 1, got ${JSON.stringify(thresholds)}.`,
    );
  }
}

/**
 * Throw the canonical `AbortError` when the supplied signal is
 * already aborted. Safe to call with `undefined`.
 *
 * @internal
 */
function checkAbort(signal: AbortSignal | undefined): void {
  if (signal === undefined) return;
  if (signal.aborted) {
    if (typeof signal.throwIfAborted === 'function') {
      signal.throwIfAborted();
    }
    throw new DOMException('The operation was aborted.', 'AbortError');
  }
}

function warnBypass(): void {
  // Use the structured logger once it lands (Phase 04 follow-up). For
  // now, surface a one-shot console.warn so operators notice the
  // regression risk per the Phase 10b spec ("WARN-once per process").
  console.warn(
    '[graphorin/memory] conflict pipeline disabled (mode: "off"). ' +
      'Semantic writes fall back to a straight-through path - bi-temporal supersede / dedup ' +
      'will not fire until you re-enable the pipeline.',
  );
}
