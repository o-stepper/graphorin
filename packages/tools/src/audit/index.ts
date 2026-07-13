/**
 * Audit-event emitter + counter registry for `@graphorin/tools`.
 *
 * Two surfaces:
 *
 * - `emitToolAudit(...)` / `onToolAudit(...)` - sanitized audit-event
 *   broadcasting, mirroring the discipline used by `@graphorin/security`.
 * - `incrementCounter(...)` / `snapshotCounters(...)` - in-process
 *   metrics registry exported through {@link CounterSnapshot}.
 *
 * @packageDocumentation
 */

export type { CounterSnapshot } from './counters.js';
export {
  getCounterForTesting,
  getHistogramForTesting,
  incrementCounter,
  observeHistogram,
  resetCountersForTesting,
  setGauge,
  snapshotCounters,
} from './counters.js';

/**
 * Audit-event emitter for `@graphorin/tools`. Mirrors the discipline
 * used by `@graphorin/security`'s subsystem-specific emitters: a
 * narrow listener registry; never throws across listener boundaries;
 * sanitized metadata only - never the matched value bytes / tool
 * args / tool results.
 *
 * Downstream consumers (the standalone server's audit bridge in Phase
 * 14 + the `audit.db` hash chain in `@graphorin/security/audit`) wire
 * their listeners here at startup.
 *
 * @packageDocumentation
 */

import type {
  InboundSanitizationPolicy,
  SideEffectClass,
  ToolTrustClass,
  TruncationStrategy,
} from '@graphorin/core';

/**
 * Discriminator for the audit-event family emitted by the tools
 * subsystem.
 *
 * @stable
 */
export type ToolAuditAction =
  | 'tool:registered'
  | 'tool:classification:warn'
  | 'tool:examples:overflow'
  | 'tool:result:cap-disabled'
  | 'tool:execute:start'
  | 'tool:execute:end'
  | 'tool:execute:error'
  | 'tool:execute:streamed'
  | 'tool:approval:requested'
  | 'tool:approval:granted'
  | 'tool:approval:denied'
  | 'tool:permission:rewritten'
  | 'tool:result:truncated'
  | 'tool:result:spill:written'
  | 'tool:result:sanitization:hit'
  | 'tool:result:sanitization:blocked'
  | 'tool:dataflow:flagged'
  | 'tool:dataflow:blocked'
  | 'tool:dataflow:declassified'
  | 'tool:retrieval:deferred'
  | 'tool:retrieval:search:executed'
  | 'tool:collision:detected'
  | 'tool:collision:priority-resolved'
  | 'tool:collision:auto-prefix-applied'
  | 'tool:collision:manual-rejected'
  | 'tool:collision:suppressed';

/**
 * Lightweight actor descriptor for tool-subsystem audit events.
 *
 * @stable
 */
export interface ToolAuditActor {
  readonly kind: 'tool' | 'agent' | 'system';
  readonly id: string;
}

/**
 * Decision recorded by an audit event.
 *
 * @stable
 */
export type ToolAuditDecision = 'success' | 'denied' | 'error';

/**
 * Sanitized payload emitted by the tool subsystem. Listeners receive
 * only metadata that is safe to log - the actual tool args, the
 * matched bytes, the secret values are NEVER forwarded.
 *
 * @stable
 */
export interface ToolAuditEvent {
  readonly action: ToolAuditAction;
  readonly actor: ToolAuditActor;
  readonly target: string;
  readonly decision: ToolAuditDecision;
  readonly ts: number;
  readonly context?: {
    readonly runId?: string;
    readonly sessionId?: string;
    readonly stepNumber?: number;
    readonly toolCallId?: string;
  };
  readonly metadata?: Readonly<Record<string, unknown>>;
}

type Listener = (event: ToolAuditEvent) => void;
const listeners = new Set<Listener>();

/**
 * Subscribe to tool-subsystem audit events. Returns a teardown
 * function that removes the listener; callers must invoke it on
 * shutdown to avoid leaks in long-running server processes.
 *
 * @stable
 */
export function onToolAudit(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Reset listener registry. Used by tests.
 *
 * @experimental
 */
export function _resetToolAuditListenersForTesting(): void {
  listeners.clear();
}

/**
 * Snapshot of currently-registered listener count. Used by tests.
 *
 * @experimental
 */
export function _getToolAuditListenerCountForTesting(): number {
  return listeners.size;
}

/**
 * Emit an audit event. Never throws across listener boundaries -
 * a listener that throws is isolated so it cannot tear down the
 * tool execution path.
 *
 * @stable
 */
export function emitToolAudit(event: ToolAuditEvent): void {
  if (listeners.size === 0) return;
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Audit listeners are isolated - never let a faulty listener
      // tear down the tool execution path.
    }
  }
}

/**
 * Convenience factory for the `tool:registered` audit row. Carries
 * the resolved trust class + side-effect class + per-tool fields the
 * downstream cassette / replay layers care about.
 *
 * @stable
 */
export function createRegisteredEvent(opts: {
  readonly toolName: string;
  readonly trustClass: ToolTrustClass;
  readonly sideEffectClass: SideEffectClass;
  readonly hasIdempotencyKey: boolean;
  readonly streamingHint: boolean;
  readonly inboundSanitization: InboundSanitizationPolicy;
  readonly truncationStrategy: TruncationStrategy;
  readonly maxResultTokens: number;
  readonly deferLoading: boolean;
  readonly examplesCount: number;
  readonly ts?: number;
}): ToolAuditEvent {
  return {
    action: 'tool:registered',
    actor: { kind: 'system', id: 'tool-registry' },
    target: opts.toolName,
    decision: 'success',
    ts: opts.ts ?? Date.now(),
    metadata: {
      trustClass: opts.trustClass,
      sideEffectClass: opts.sideEffectClass,
      hasIdempotencyKey: opts.hasIdempotencyKey,
      streamingHint: opts.streamingHint,
      inboundSanitization: opts.inboundSanitization,
      truncationStrategy: opts.truncationStrategy,
      maxResultTokens: opts.maxResultTokens,
      deferLoading: opts.deferLoading,
      examplesCount: opts.examplesCount,
    },
  };
}
