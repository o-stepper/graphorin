/**
 * Public surface of the multi-stage conflict resolution pipeline
 * shipped in `@graphorin/memory` Phase 10b (DEC-117 / ADR-018 ext /
 * RB-02).
 *
 * @packageDocumentation
 */

export * from './locale-packs/index.js';
export {
  _resetBypassWarningForTesting,
  createConflictPipeline,
  runConflictPipeline,
} from './pipeline.js';
export {
  type ConflictDecision,
  type ConflictPipeline,
  type ConflictPipelineDeps,
  type ConflictPipelineOptions,
  type ConflictStage,
  type ConflictThresholds,
  DEFAULT_CONFLICT_THRESHOLDS,
  type PipelineStage,
  type StageContext,
  type StageOutcome,
} from './types.js';
