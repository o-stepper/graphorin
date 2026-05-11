/**
 * Shared types for the JSONL session export schema 1.0
 * (`graphorin-session-export/1.0`).
 *
 * The format is a sibling JSONL contract to
 * `graphorin-tool-cassette/1.0` (`../cassette/types.ts`) and to the
 * observability replay log; the format ID is **distinct** so
 * consumers cannot confuse the three streams.
 *
 * @packageDocumentation
 */

import type {
  HandoffInputFilterDescriptor,
  HandoffSecretsInheritance,
  Message,
} from '@graphorin/core';

/**
 * Stable canonical schema version supported by this writer.
 *
 * @stable
 */
export const SESSION_EXPORT_SCHEMA_CURRENT = '1.0';

/**
 * Stable canonical format identifier surfaced in every header.
 *
 * @stable
 */
export const SESSION_EXPORT_FORMAT = 'graphorin-session-export';

/**
 * Reader compatibility band: the writer accepts the current MAJOR
 * minus 0..N inclusive, where N is set by this constant. v0.1
 * supports MAJOR `1` only (there is no prior schema), so the value
 * is `0` — the import path nonetheless honours the N-2 backwards-
 * compat discipline once `2.x` and `3.x` writers exist.
 *
 * @stable
 */
export const SESSION_EXPORT_BACKWARDS_COMPAT_MAJORS = 2;

/**
 * Discriminator on every stream record. `'meta'` is always line 1;
 * `'footer'` is always the last line.
 *
 * @stable
 */
export type SessionExportRecordKind =
  | 'meta'
  | 'session'
  | 'agent'
  | 'message'
  | 'handoff'
  | 'audit'
  | 'footer';

/**
 * Sentinel header (always line 1).
 *
 * @stable
 */
export interface SessionExportMetaRecord {
  readonly kind: 'meta';
  readonly version: string;
  readonly format: typeof SESSION_EXPORT_FORMAT;
  readonly createdAt: string;
  readonly writer: string;
  readonly minRuntimeVersion: string;
  readonly schemaUrl?: string;
  /**
   * Active embedder identifiers at write time. Used by the importer
   * to drop embeddings under embedder mismatch.
   */
  readonly embedderIds?: ReadonlyArray<string>;
  readonly counts?: {
    readonly messageCount?: number;
    readonly agentCount?: number;
    readonly handoffCount?: number;
  };
}

/**
 * Single session metadata row.
 *
 * @stable
 */
export interface SessionExportSessionRecord {
  readonly kind: 'session';
  readonly id: string;
  readonly userId: string;
  readonly agentId: string;
  readonly title?: string;
  readonly tags?: ReadonlyArray<string>;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly closedAt?: string;
}

/**
 * One per agent referenced from the session messages or handoffs.
 *
 * @stable
 */
export interface SessionExportAgentRecord {
  readonly kind: 'agent';
  readonly id: string;
  readonly displayName: string;
  readonly registeredAt: string;
  readonly retiredAt?: string;
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Single message row. Carries the full `Message` shape (after
 * commentary-phase sanitization) plus storage metadata.
 *
 * @stable
 */
export interface SessionExportMessageRecord {
  readonly kind: 'message';
  readonly sessionId: string;
  readonly messageId: string;
  readonly sequence: number;
  readonly createdAt: string;
  readonly tokenCount?: number;
  readonly tokenizerVersion?: string;
  readonly sensitivity?: 'public' | 'internal' | 'secret';
  readonly message: Message;
  /**
   * Optional embedding metadata. The bytes themselves are NOT
   * included — only the embedder id; importers re-compute embeddings
   * locally if the embedder matches, or drop them under mismatch.
   */
  readonly embedderId?: string;
}

/**
 * Single handoff record. Mirrors {@link HandoffRecord} byte-for-byte
 * plus the session id.
 *
 * @stable
 */
export interface SessionExportHandoffRecord {
  readonly kind: 'handoff';
  readonly sessionId: string;
  readonly fromAgentId: string;
  readonly toAgentId: string;
  readonly stepNumber: number;
  readonly at: string;
  readonly reason?: string;
  readonly inputFilter?: HandoffInputFilterDescriptor;
  readonly secretsInheritance?: HandoffSecretsInheritance;
  readonly inheritedSecrets?: ReadonlyArray<string>;
  readonly secretsOverrideReason?: string;
}

/**
 * Single audit row. Includes the audit-chain `prevHash` / `hash` when
 * the row was sourced from a tamper-evident audit DB so importers can
 * verify the chain segment.
 *
 * @stable
 */
export interface SessionExportAuditRecord {
  readonly kind: 'audit';
  readonly sessionId: string;
  readonly action: string;
  readonly at: string;
  readonly actor?: {
    readonly kind: string;
    readonly id: string;
    readonly label?: string;
  };
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly prevHash?: string;
  readonly hash?: string;
}

/**
 * Sentinel footer (always last line).
 *
 * @stable
 */
export interface SessionExportFooterRecord {
  readonly kind: 'footer';
  readonly recordCount: number;
  readonly messageCount: number;
  readonly handoffCount: number;
  readonly agentCount: number;
  /** SHA-256 of the body lines (everything between header + footer), only when `--hash`. */
  readonly checksum?: string;
  readonly writtenAtIso: string;
  /** When `--encrypt`, the cipher used so importers can fail fast. */
  readonly cipher?: 'aes256gcm' | 'chacha20-poly1305';
}

/**
 * Union of every record kind. Used by the writer + parser.
 *
 * @stable
 */
export type SessionExportRecord =
  | SessionExportMetaRecord
  | SessionExportSessionRecord
  | SessionExportAgentRecord
  | SessionExportMessageRecord
  | SessionExportHandoffRecord
  | SessionExportAuditRecord
  | SessionExportFooterRecord;

/**
 * Forward-parse-resilient wrapper. Unknown record kinds are surfaced
 * via this shape so consumers can WARN + skip.
 *
 * @stable
 */
export interface SessionExportUnknownRecord {
  readonly kind: 'unknown';
  readonly raw: Readonly<Record<string, unknown>>;
}

/**
 * Either a typed record or the unknown wrapper.
 *
 * @stable
 */
export type SessionExportParsedRecord = SessionExportRecord | SessionExportUnknownRecord;
