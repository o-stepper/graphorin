/**
 * Replay surface types for `@graphorin/sessions`.
 *
 * @packageDocumentation
 */

import type { Sensitivity } from '@graphorin/core';
import type { ReplayEvent as ObsReplayEvent } from '@graphorin/observability/replay';
import type { CassetteReplayDecision } from '../cassette/replay.js';
import type { PerToolReplayMode, ToolCassetteSource, ToolReplayMode } from '../cassette/types.js';

/**
 * Per-replay actor surfaced on every audit row.
 *
 * @stable
 */
export interface ReplayActor {
  readonly kind: 'token' | 'cli' | 'agent' | 'system';
  readonly id: string;
  readonly label?: string;
}

/**
 * Mode discriminator. `'sanitized'` is the default; `'raw'` requires
 * the `traces:read:raw` scope.
 *
 * @stable
 */
export type SessionReplayMode = 'sanitized' | 'raw';

/**
 * Options accepted by `Session.replay({...})`.
 *
 * @stable
 */
export interface SessionReplayOptions {
  /**
   * Default `false`. When `true`, the configured `canReadRaw`
   * predicate must return `true` AND the audit row records a raw
   * access entry.
   */
  readonly raw?: boolean;
  /** Restrict the replay to spans newer than this id. */
  readonly fromMessageId?: string;
  /** Default `'public'` (library mode safe default). */
  readonly minSensitivity?: Sensitivity;
  /** Override the actor on the audit row. */
  readonly actor?: ReplayActor;
  /**
   * Optional cassette to apply substitution-vs-live tool decisions
   * over. When supplied, the replay engine emits
   * `tool.cassette.replay.*` events alongside the trace replay.
   */
  readonly cassette?: ToolCassetteSource;
  /** Default `'auto'` when `cassette` is supplied; ignored otherwise. */
  readonly toolReplayMode?: ToolReplayMode;
  /** Per-tool overrides honoured under `toolReplayMode: 'mixed'`. */
  readonly perToolMode?: PerToolReplayMode;
  /** Default `false`. */
  readonly failOnIdempotencyMismatch?: boolean;
  /** Default `true` (silent schema drift is a debugging black hole). */
  readonly failOnSchemaMismatch?: boolean;
  /** Default `'abort'`. */
  readonly onMissingArtifact?: 'abort' | 'fallback-live';
}

/**
 * Single event yielded by `Session.replay({...})`. Combines the
 * sanitized observability replay events + the cassette-driven
 * decisions surfaced by the cassette engine.
 *
 * @stable
 */
export type SessionReplayEvent = ObsReplayEvent | CassetteReplayDecision;
