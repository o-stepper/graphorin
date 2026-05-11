/**
 * Sanitized-by-default replay surface.
 *
 * @packageDocumentation
 */

export { DEFAULT_REPLAY_LOG_CONFIG, type ReplayLogConfig } from './config.js';
export { getTraceLog, type PruneTracesOptions, pruneTraces } from './log.js';
export { createReplay, type Replay } from './replay.js';
export type {
  ReplayAuditBridge,
  ReplayAuditEvent,
  ReplayEvent,
  ReplayMode,
  ReplayOptions,
  ReplayRunInput,
} from './types.js';
