/**
 * Typed in-process event emitter for secrets-layer audit events. The
 * audit-log subsystem subscribes to this emitter to write events into
 * the dedicated audit database. The emitter intentionally lives in
 * `@graphorin/security` so the secrets layer never reaches across the
 * package boundary to write audit rows itself.
 *
 * @packageDocumentation
 */

/**
 * Discriminator for `SecretsAuditEvent`. Every variant follows the
 * `<resource>:<action>` convention used throughout the audit log.
 *
 * @stable
 */
export type SecretsAuditAction =
  | 'secret:get'
  | 'secret:require'
  | 'secret:set'
  | 'secret:delete'
  | 'secret:list'
  | 'secrets:downgrade';

/**
 * Discriminator for the outcome of a single audit event.
 *
 * @stable
 */
export type SecretsAuditDecision = 'success' | 'denied' | 'not-found' | 'error';

/**
 * Optional identifier of who initiated the event. The secrets layer
 * never invents identities - it forwards whatever the per-tool ACL or
 * factory caller supplied.
 *
 * @stable
 */
export interface SecretsAuditActor {
  readonly kind: 'tool' | 'agent' | 'cli' | 'system' | 'subagent';
  readonly id?: string;
  readonly toolName?: string;
  readonly runId?: string;
  readonly sessionId?: string;
}

/**
 * One audit event. The payload is intentionally minimal - never carry
 * the secret value itself, only metadata that is safe to log
 * (resolver / store identifier, key name, actor pointer).
 *
 * @stable
 */
export interface SecretsAuditEvent {
  /** Discriminator. */
  readonly action: SecretsAuditAction;
  /** Outcome. */
  readonly decision: SecretsAuditDecision;
  /** Epoch milliseconds at which the event fired. */
  readonly ts: number;
  /** Stable identifier of the SecretsStore / resolver that fired the event. */
  readonly source: string;
  /**
   * Target of the action. For `secret:*` events this is the secret
   * key; for `secrets:downgrade` events this is the kind of store the
   * factory downgraded to (e.g. `'env'`).
   */
  readonly target: string;
  /** Optional actor pointer. */
  readonly actor?: SecretsAuditActor;
  /** Optional structured metadata. Must be safe to log. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

type SecretsAuditListener = (event: SecretsAuditEvent) => void;

const listeners = new Set<SecretsAuditListener>();

/**
 * Subscribe to secrets-layer audit events. The audit-log subsystem
 * registers exactly one listener that forwards each event into the
 * dedicated audit database.
 *
 * @stable
 */
export function onSecretsAudit(listener: SecretsAuditListener): () => void {
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
export function _resetSecretsAuditListenersForTesting(): void {
  listeners.clear();
}

/**
 * Emit an event to every subscriber. Listeners that throw are
 * isolated - a faulty listener never tears down the secret access
 * path.
 *
 * @stable
 */
export function emitSecretsAudit(event: SecretsAuditEvent): void {
  if (listeners.size === 0) return;
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Audit listeners are isolated from the secret access path.
    }
  }
}

/**
 * Number of currently-registered listeners. Useful for diagnostics.
 *
 * @experimental
 */
export function _getSecretsAuditListenerCountForTesting(): number {
  return listeners.size;
}
