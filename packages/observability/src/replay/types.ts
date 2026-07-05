/**
 * Public types for the replay surface.
 *
 * @packageDocumentation
 */

import type { Sensitivity } from '@graphorin/core';

import type { SpanRecord } from '../exporters/types.js';
import type { RedactionValidatorInstance } from '../redaction/types.js';

/**
 * Replay scope hint. Server mode requires `'raw'` to be backed by a
 * token carrying the `traces:read:raw` scope. The library mode uses
 * the same flag but without scope enforcement (the server is the only
 * boundary that can grant `'raw'`).
 *
 * @stable
 */
export type ReplayMode = 'sanitized' | 'raw';

/**
 * Audit-bridge contract used by the replay layer. Every replay
 * invocation emits one entry through the bridge - sanitized + raw
 * alike. The actual audit storage lives in `@graphorin/security`; the
 * replay layer keeps the bridge generic so the package stays free of
 * a hard dependency on the security package.
 *
 * @stable
 */
export interface ReplayAuditBridge {
  emit(event: ReplayAuditEvent): void;
}

/**
 * Sanitized event passed to the audit bridge.
 *
 * @stable
 */
export interface ReplayAuditEvent {
  readonly action: 'trace.replay.accessed';
  readonly actor: { readonly kind: 'token' | 'cli' | 'agent' | 'system'; readonly id: string };
  readonly target: string;
  readonly decision: 'success' | 'denied';
  readonly metadata: {
    readonly mode: ReplayMode;
    readonly minSensitivity: Sensitivity;
    readonly fromSpanId?: string;
    readonly eventCount: number;
    readonly durationMs: number;
  };
}

/**
 * Single record yielded by the replay iterator.
 *
 * @stable
 */
export type ReplayEvent =
  | {
      readonly type: 'replay.start';
      readonly target: string;
      readonly mode: ReplayMode;
      readonly eventCount?: number;
    }
  | { readonly type: 'replay.event'; readonly span: SpanRecord; readonly sanitized: boolean }
  | {
      readonly type: 'replay.skipped';
      readonly reason: 'sensitivity' | 'redaction-violation' | 'access-denied';
      readonly spanId: string;
    }
  | {
      readonly type: 'replay.end';
      readonly durationMs: number;
      readonly eventsEmitted: number;
      readonly eventsSkipped: number;
    };

/**
 * Configuration shape for {@link createReplay}.
 *
 * @stable
 */
export interface ReplayOptions {
  /** Validator used to sanitize records when `mode === 'sanitized'`. */
  readonly validator?: RedactionValidatorInstance;
  /** Optional audit bridge - called once per replay invocation. */
  readonly audit?: ReplayAuditBridge;
  /** Default actor reported via `audit.actor` when none is supplied. */
  readonly defaultActor?: ReplayAuditEvent['actor'];
  /**
   * Scope check invoked when the caller asks for `mode: 'raw'`. Returns
   * `true` to allow, `false` to deny. The server (Phase 14) wires this
   * to the `traces:read:raw` token scope; in library mode it defaults
   * to `() => true` (operators trust their own process).
   */
  readonly canReadRaw?: (context: { readonly target: string }) => boolean;
}

/**
 * Per-call options consumed by `Replay.run(...)`.
 *
 * @stable
 */
export interface ReplayRunInput {
  readonly source: AsyncIterable<SpanRecord> | Iterable<SpanRecord>;
  readonly target: string;
  readonly mode?: ReplayMode;
  readonly minSensitivity?: Sensitivity;
  readonly fromSpanId?: string;
  readonly actor?: ReplayAuditEvent['actor'];
}
