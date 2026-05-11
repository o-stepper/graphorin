/**
 * Public types for the multi-stage conflict resolution pipeline shipped
 * in `@graphorin/memory` Phase 10b (DEC-117 / ADR-018 ext / RB-02).
 *
 * @packageDocumentation
 */

import type { EmbedderProvider, Fact, MemoryHit, Tracer } from '@graphorin/core';
import type { ConflictMemoryStoreExt, MemoryStoreAdapter } from '../internal/storage-adapter.js';
import type { LocalePack } from './locale-packs/index.js';

/**
 * Stable lowercase identifier of the pipeline stage. Mirrored
 * byte-for-byte by `@graphorin/store-sqlite`'s `ConflictPipelineStage`
 * so `fact_conflicts` / `conflict_check_pending` rows can be grouped
 * deterministically.
 *
 * @stable
 */
export type ConflictStage =
  | 'exact-dedup'
  | 'embedding-three-zone'
  | 'heuristic-regex'
  | 'subject-predicate'
  | 'defer-to-deep';

/**
 * Configurable similarity thresholds for Stage 2 (embedding three-
 * zone). Defaults pinned at `0.95 / 0.85 / 0.4` per RB-02 §8 — the
 * production values for the default `Xenova/multilingual-e5-base`
 * embedder (DEC-130).
 *
 * @stable
 */
export interface ConflictThresholds {
  readonly hot: number;
  readonly nearDup: number;
  readonly cold: number;
}

/**
 * Hard-coded defaults for the three-zone thresholds. Imported by the
 * pipeline + the test suite so call sites stay aligned.
 *
 * @stable
 */
export const DEFAULT_CONFLICT_THRESHOLDS: ConflictThresholds = Object.freeze({
  hot: 0.95,
  nearDup: 0.85,
  cold: 0.4,
});

/**
 * Final pipeline outcome — discriminated union returned by
 * {@link runConflictPipeline}. Mirrors RB-02 §8.1 / DEC-117 — every
 * variant carries the originating `stage` so audit + replay tooling
 * can pattern-match without inspecting the message.
 *
 * @stable
 */
export type ConflictDecision =
  | {
      readonly kind: 'admit';
      readonly stage: ConflictStage;
      readonly reason?: string;
    }
  | {
      readonly kind: 'dedup';
      readonly stage: ConflictStage;
      readonly existingId: string;
      readonly similarity?: number;
      readonly reason?: string;
    }
  | {
      readonly kind: 'supersede';
      readonly stage: ConflictStage;
      readonly existingId: string;
      readonly reason: string;
    }
  | {
      readonly kind: 'pending';
      readonly stage: ConflictStage;
      /** The candidate id that was admitted as `pending`. */
      readonly candidateId: string;
      /** Top-K conflicting existing fact ids from Stage 2's vector search. */
      readonly conflictingIds: ReadonlyArray<string>;
      readonly similarity?: number;
      readonly reason?: string;
    };

/**
 * Pipeline configuration accepted by `createMemory({ conflictPipeline:
 * ... })` and surfaced through {@link createConflictPipeline}.
 *
 * The `mode` field is the master switch:
 *
 *  - `'on'` (default) — the multi-stage pipeline runs on every
 *    `SemanticMemory.remember(...)` call.
 *  - `'off'` — bypass the pipeline and fall back to 10a's straight-
 *    through write. Emits a one-shot WARN (per process) so operators
 *    notice the regression risk.
 *
 * @stable
 */
export interface ConflictPipelineOptions {
  readonly mode?: 'on' | 'off';
  readonly thresholds?: Partial<ConflictThresholds>;
  readonly localePack?: LocalePack;
  /** Per-list candidate count fed into Stage 2. Default `5` (RB-02 §8.1). */
  readonly stage2TopK?: number;
  /** Override the audit / pending sink. Defaults to `store.conflicts` when present. */
  readonly conflictStore?: ConflictMemoryStoreExt;
  /** Inject a deterministic clock. Defaults to `() => new Date().toISOString()`. */
  readonly now?: () => string;
}

/**
 * Inputs the orchestrator hands every stage. The `existing` array is
 * populated during Stage 2 (vector search top-K); Stage 1 receives an
 * empty array because the dedup hash is computed off the candidate
 * alone.
 *
 * @stable
 */
export interface StageContext {
  readonly candidate: Fact;
  readonly existing: ReadonlyArray<MemoryHit<Fact>>;
  readonly localePack: LocalePack;
  readonly thresholds: ConflictThresholds;
}

/**
 * Per-stage outcome surfaced to the orchestrator. `'admit'` means the
 * stage decided not to short-circuit — the pipeline continues to the
 * next stage. Every other variant terminates the pipeline.
 *
 * @stable
 */
export type StageOutcome =
  | { readonly kind: 'continue' }
  | { readonly kind: 'admit'; readonly reason?: string }
  | {
      readonly kind: 'dedup';
      readonly existingId: string;
      readonly similarity?: number;
      readonly reason?: string;
    }
  | {
      readonly kind: 'supersede';
      readonly existingId: string;
      readonly reason: string;
    }
  | {
      readonly kind: 'pending';
      readonly conflictingIds: ReadonlyArray<string>;
      readonly similarity?: number;
      readonly reason?: string;
    };

/**
 * Stage interface every step implements. The orchestrator visits
 * stages in declaration order and stops at the first non-`'continue'`
 * outcome.
 *
 * @stable
 */
export interface PipelineStage {
  readonly id: ConflictStage;
  evaluate(ctx: StageContext): Promise<StageOutcome>;
}

/**
 * Pre-built pipeline returned by {@link createConflictPipeline}. The
 * `run` method is what `SemanticMemory.remember(...)` calls to make
 * the conflict decision.
 *
 * @stable
 */
export interface ConflictPipeline {
  readonly mode: 'on' | 'off';
  readonly localePack: LocalePack;
  readonly thresholds: ConflictThresholds;
  run(deps: ConflictPipelineDeps, candidate: Fact): Promise<ConflictDecision>;
}

/**
 * Per-call dependency bag handed to the pipeline by `SemanticMemory`.
 *
 * @stable
 */
export interface ConflictPipelineDeps {
  readonly store: MemoryStoreAdapter;
  readonly tracer: Tracer;
  readonly embedder: EmbedderProvider | null;
  readonly embedderId: string | null;
  /** Optional cancellation signal forwarded to embedder + searchVector. */
  readonly signal?: AbortSignal;
}
