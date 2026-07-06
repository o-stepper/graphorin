/**
 * Shared types for the tool-cassette schema 1.0
 * (`graphorin-tool-cassette/1.0`).
 *
 * The cassette format is a sibling JSONL contract to
 * `graphorin-session-export/1.0` (`../export/types.ts`); the format
 * ID is **distinct** so consumers cannot confuse the two streams.
 *
 * @packageDocumentation
 */

import type { MessageContent, SideEffectClass } from '@graphorin/core';

/**
 * Stable canonical schema version supported by this writer.
 *
 * @stable
 */
export const TOOL_CASSETTE_SCHEMA_CURRENT = '1.0';

/**
 * Stable canonical format identifier surfaced in every header.
 *
 * @stable
 */
export const TOOL_CASSETTE_FORMAT = 'graphorin-tool-cassette';

/**
 * Reader compatibility band: the writer accepts the current MAJOR
 * minus 0..N inclusive. v0.1 supports MAJOR `1` only.
 *
 * @stable
 */
export const TOOL_CASSETTE_BACKWARDS_COMPAT_MAJORS = 2;

/**
 * Discriminator on every cassette record.
 *
 * @stable
 */
export type ToolCassetteRecordKind =
  | 'meta'
  | 'tool-call'
  | 'tool-search-resolved'
  | 'model-fallback'
  | 'compaction'
  | 'progress-artifact-ref'
  | 'audit'
  | 'footer';

/**
 * Sentinel header (always line 1).
 *
 * @stable
 */
export interface ToolCassetteMetaRecord {
  readonly kind: 'meta';
  readonly version: string;
  readonly format: typeof TOOL_CASSETTE_FORMAT;
  readonly createdAt: string;
  readonly writer: string;
  readonly sessionId: string;
  readonly runId: string;
  readonly minRuntimeVersion: string;
  readonly schemaUrl?: string;
}

/**
 * Status of a recorded tool execution.
 *
 * @stable
 */
export type ToolCallRecordStatus = 'completed' | 'failed' | 'cancelled' | 'budget-exceeded';

/**
 * Per-`Tool.execute(...)` invocation. The canonical record kind that
 * the `ToolCassetteReplayPolicy` consumes during replay.
 *
 * @stable
 */
export interface ToolCallRecord {
  readonly kind: 'tool-call';
  readonly stepNumber: number;
  readonly toolCallId: string;
  readonly toolName: string;
  readonly sideEffectClass: SideEffectClass;
  readonly idempotencyKey?: string;
  readonly args: unknown;
  readonly output: unknown;
  readonly status: ToolCallRecordStatus;
  readonly durationMs: number;
  readonly agentId: string;
  readonly timestampIso: string;
  readonly sha256OfArgs?: string;
  readonly sha256OfOutput?: string;
  readonly contentPartsRefs?: ReadonlyArray<{
    readonly kind: 'image' | 'file' | 'audio' | 'resource-link';
    readonly path: string;
    readonly sizeBytes: number;
  }>;
  /**
   * Optional in-line `MessageContent` parts. When the cassette is
   * written with `includeArtifacts: false`, only `contentPartsRefs`
   * is populated; when `true`, the parts are also surfaced inline
   * for self-contained replay.
   */
  readonly contentParts?: ReadonlyArray<MessageContent>;
}

/**
 * `tool_search` lazy-load resolution event.
 *
 * @stable
 */
export interface ToolSearchResolvedRecord {
  readonly kind: 'tool-search-resolved';
  readonly stepNumber: number;
  readonly query: string;
  readonly matchCount: number;
  readonly resolvedToolNames: ReadonlyArray<string>;
}

/**
 * Model fallback chain advance event.
 *
 * @stable
 */
export interface ModelFallbackRecord {
  readonly kind: 'model-fallback';
  readonly stepNumber: number;
  readonly fromModel: string;
  readonly toModel: string;
  readonly reason: string;
}

/**
 * Context compaction event.
 *
 * @stable
 */
export interface CompactionRecord {
  readonly kind: 'compaction';
  readonly stepNumber: number;
  readonly originalTokens: number;
  readonly summarizedTokens: number;
  readonly summarizerModel: string;
}

/**
 * Spilled-artifact path emission.
 *
 * @stable
 */
export interface ProgressArtifactRefRecord {
  readonly kind: 'progress-artifact-ref';
  readonly stepNumber: number;
  readonly path: string;
  readonly sizeBytes: number;
}

/**
 * Audit row segment carried in the cassette so the chain-segment can
 * be verified post-mortem.
 *
 * @stable
 */
export interface CassetteAuditRecord {
  readonly kind: 'audit';
  readonly action: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly prevHash?: string;
  readonly hash?: string;
}

/**
 * Sentinel footer (always last line).
 *
 * @stable
 */
export interface ToolCassetteFooterRecord {
  readonly kind: 'footer';
  readonly recordCount: number;
  readonly toolCallCount: number;
  readonly checksum?: string;
  readonly writtenAtIso: string;
  readonly cipher?: 'aes256gcm' | 'chacha20-poly1305';
}

/**
 * Union of every record kind. Consumed by the writer + parser.
 *
 * @stable
 */
export type ToolCassetteRecord =
  | ToolCassetteMetaRecord
  | ToolCallRecord
  | ToolSearchResolvedRecord
  | ModelFallbackRecord
  | CompactionRecord
  | ProgressArtifactRefRecord
  | CassetteAuditRecord
  | ToolCassetteFooterRecord;

/**
 * Forward-parse-resilient wrapper. Unknown record kinds are surfaced
 * via this shape so callers can WARN + skip.
 *
 * @stable
 */
export interface ToolCassetteUnknownRecord {
  readonly kind: 'unknown';
  readonly raw: Readonly<Record<string, unknown>>;
}

/**
 * Either a typed record or the unknown wrapper.
 *
 * @stable
 */
export type ToolCassetteParsedRecord = ToolCassetteRecord | ToolCassetteUnknownRecord;

/**
 * Discriminated union accepted by `Session.replay({ cassette })`.
 *
 * @stable
 */
export type ToolCassetteSource =
  | { readonly kind: 'file'; readonly path: string }
  | { readonly kind: 'inline'; readonly records: ReadonlyArray<ToolCassetteRecord> }
  | { readonly kind: 'stream'; readonly stream: AsyncIterable<ToolCassetteRecord> };

/**
 * High-level orchestration mode for the cassette replay engine.
 *
 * @stable
 */
export type ToolReplayMode = 'auto' | 'live' | 'recorded' | 'mixed';

/**
 * Per-tool override consulted under `'mixed'`.
 *
 * @stable
 */
export type PerToolReplayMode = Readonly<Record<string, 'live' | 'recorded'>>;
