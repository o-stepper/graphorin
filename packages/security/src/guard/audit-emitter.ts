/**
 * Typed in-process emitter for memory-modification guard events. The
 * audit-log subsystem (`@graphorin/security/audit`) registers a
 * subscriber via `bridgeMemoryGuardToAudit({ db })` to forward each
 * event into the dedicated audit database.
 *
 * The emitter mirrors the `secretsAuditEmitter` pattern from
 * subsystem 03a so downstream code only has to learn one shape.
 *
 * @packageDocumentation
 */

import type { MemoryGuardTier } from './types.js';

/**
 * Discriminator for `MemoryGuardAuditEvent` variants. The audit log
 * stores the values verbatim under the canonical
 * `<resource>:<action>` convention.
 *
 * Two layers of action names coexist by design:
 *
 *  - `memory:modification:before` and `memory:modification:after` are
 *    the canonical audit-log entries called out by the
 *    `AUDIT_ONLY_GUARD` and `STRICT_FULL_GUARD` specifications
 *    (DEC-153). Every snapshot / verify cycle emits exactly one
 *    `before` and one `after` row so SIEM dashboards can pair them.
 *  - The `memory:guard:*` family carries the more granular
 *    discriminator (`snapshot`, `verified`, `mismatch`,
 *    `rolled-back`, `exceeded-budget`) for telemetry consumers that
 *    want to filter by outcome without re-reading the metadata.
 *
 * @stable
 */
export type MemoryGuardAuditAction =
  | 'memory:modification:before'
  | 'memory:modification:after'
  | 'memory:guard:snapshot'
  | 'memory:guard:verified'
  | 'memory:guard:mismatch'
  | 'memory:guard:rolled-back'
  | 'memory:guard:exceeded-budget';

/**
 * Decision discriminator on a guard event.
 *
 * @stable
 */
export type MemoryGuardDecision = 'success' | 'denied' | 'error';

/**
 * Optional actor pointer. The secrets / agent layer supplies the
 * tool name and the current run / session id so the audit log can
 * attribute the event without inventing identities.
 *
 * @stable
 */
export interface MemoryGuardActor {
  readonly kind: 'tool' | 'agent' | 'subagent' | 'system';
  readonly id?: string;
  readonly toolName?: string;
  readonly runId?: string;
  readonly sessionId?: string;
}

/**
 * One audit event. The payload never contains the raw contents of a
 * memory region — only the digest, the region name, and the actor.
 *
 * @stable
 */
export interface MemoryGuardAuditEvent {
  readonly action: MemoryGuardAuditAction;
  readonly decision: MemoryGuardDecision;
  /** Epoch milliseconds at which the event fired. */
  readonly ts: number;
  /** Stable identifier of the guard tier that fired the event. */
  readonly tier: MemoryGuardTier;
  /** Mismatched region names (only populated on mismatch / rollback). */
  readonly regions?: ReadonlyArray<string>;
  /** Optional actor pointer. */
  readonly actor?: MemoryGuardActor;
  /** Optional structured metadata. Must be safe to log. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

type Listener = (event: MemoryGuardAuditEvent) => void;

const listeners = new Set<Listener>();

/**
 * Subscribe to guard audit events. Returns an unsubscribe function.
 *
 * @stable
 */
export function onMemoryGuardAudit(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Reset the listener set. Used by tests.
 *
 * @experimental
 */
export function _resetMemoryGuardAuditListenersForTesting(): void {
  listeners.clear();
}

/**
 * Number of currently-registered listeners. Useful for diagnostics.
 *
 * @experimental
 */
export function _getMemoryGuardAuditListenerCountForTesting(): number {
  return listeners.size;
}

/**
 * Emit an event to every subscriber. Listeners that throw are
 * isolated — a faulty listener never tears down the guard.
 *
 * @stable
 */
export function emitMemoryGuardAudit(event: MemoryGuardAuditEvent): void {
  if (listeners.size === 0) return;
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Audit listeners are isolated from the guard fast path.
    }
  }
}
