/**
 * Typed in-process event emitter for server-token auth events (SPL-5).
 * The audit-log subsystem subscribes via {@link bridgeAuthToAudit} to
 * write these into the dedicated audit database — the auth layer never
 * reaches across the package boundary to write rows itself, mirroring
 * the secrets / oauth / supply-chain bridges.
 *
 * @packageDocumentation
 */

/**
 * Discriminator for `AuthAuditEvent`. The `token:*` actions cover the
 * CRUD lifecycle; `auth:granted` / `auth:denied:*` cover verification
 * outcomes.
 *
 * @stable
 */
export type AuthAuditAction =
  | 'token:create'
  | 'token:revoke'
  | 'token:rotate'
  | 'token:rekey'
  | 'auth:granted'
  | 'auth:denied:unauth'
  | 'auth:denied:scope'
  | 'auth:denied:lockout';

/** Outcome of a single auth audit event. @stable */
export type AuthAuditDecision = 'success' | 'denied' | 'error';

/** Optional pointer to who initiated the event. @stable */
export interface AuthAuditActor {
  readonly kind: 'cli' | 'agent' | 'tool' | 'system' | 'subagent' | 'token';
  readonly id?: string;
  readonly runId?: string;
  readonly sessionId?: string;
}

/**
 * One auth audit event. The payload never carries the raw token or the
 * pepper — only the token id / metadata safe to log.
 *
 * @stable
 */
export interface AuthAuditEvent {
  readonly action: AuthAuditAction;
  readonly decision: AuthAuditDecision;
  readonly ts: number;
  /** Token id (`token:*`) or the failure subject (`auth:denied:*`). */
  readonly target: string;
  readonly actor?: AuthAuditActor;
  /** Bounded, secret-free context (scopes, ip, reason). */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Listener signature. @stable */
export type AuthAuditListener = (event: AuthAuditEvent) => void;

const listeners = new Set<AuthAuditListener>();

/**
 * Subscribe to auth audit events. Returns an unsubscribe function.
 *
 * @stable
 */
export function onAuthAudit(listener: AuthAuditListener): () => void {
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
export function _resetAuthAuditListenersForTesting(): void {
  listeners.clear();
}

/** @experimental — test seam to assert wiring. */
export function _getAuthAuditListenerCountForTesting(): number {
  return listeners.size;
}

/**
 * Emit an auth audit event to every subscriber. Listener exceptions are
 * isolated from the auth path.
 *
 * @stable
 */
export function emitAuthAudit(event: AuthAuditEvent): void {
  if (listeners.size === 0) return;
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Audit listeners are isolated from the auth path.
    }
  }
}
