/**
 * Typed in-process event emitter for skills supply-chain audit
 * events. Mirrors the secrets / OAuth emitters so the audit log
 * subscribes once and translates every event into a tamper-evident
 * chain entry.
 *
 * @packageDocumentation
 */

/**
 * Discriminator for `SupplyChainAuditEvent`.
 *
 * @stable
 */
export type SupplyChainAuditAction =
  | 'skill:installed'
  | 'skill:upgraded'
  | 'skill:removed'
  | 'skill:audit'
  | 'skill:install-denied';

/**
 * Discriminator for the outcome of a single audit event.
 *
 * @stable
 */
export type SupplyChainAuditDecision = 'success' | 'denied' | 'error';

/**
 * Optional identifier of who initiated the install.
 *
 * @stable
 */
export interface SupplyChainAuditActor {
  readonly kind: 'cli' | 'agent' | 'system' | 'tool' | 'subagent';
  readonly id?: string;
}

/**
 * One audit event. The payload is intentionally minimal — never
 * carry credentials or token material; only safe metadata.
 *
 * @stable
 */
export interface SupplyChainAuditEvent {
  readonly action: SupplyChainAuditAction;
  readonly decision: SupplyChainAuditDecision;
  readonly ts: number;
  /** Always `'skills-supply-chain'`. */
  readonly source: string;
  /** Stable identifier of the form `skill:<name>@<version>`. */
  readonly target: string;
  readonly actor?: SupplyChainAuditActor;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

type SupplyChainAuditListener = (event: SupplyChainAuditEvent) => void;

const listeners = new Set<SupplyChainAuditListener>();

/**
 * Subscribe to supply-chain audit events. The audit-log subsystem
 * registers exactly one listener.
 *
 * @stable
 */
export function onSupplyChainAudit(listener: SupplyChainAuditListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Emit an event to every subscriber. Listeners that throw are
 * isolated.
 *
 * @stable
 */
export function emitSupplyChainAudit(event: SupplyChainAuditEvent): void {
  if (listeners.size === 0) return;
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Audit listeners are isolated from the install code path.
    }
  }
}

/**
 * Reset the listener set. Used by tests.
 *
 * @experimental
 */
export function _resetSupplyChainAuditListenersForTesting(): void {
  listeners.clear();
}

/**
 * Number of currently-registered listeners.
 *
 * @experimental
 */
export function _getSupplyChainAuditListenerCountForTesting(): number {
  return listeners.size;
}
