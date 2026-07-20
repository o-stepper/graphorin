/**
 * Typed in-process event emitter for OAuth-subsystem audit events.
 * Mirrors the secrets-layer emitter so the audit-log subsystem can
 * subscribe via `bridgeOAuthToAudit(...)` and translate every event
 * into a tamper-evident chain entry.
 *
 * @packageDocumentation
 */

/**
 * Discriminator for `OAuthAuditEvent`. Variants follow the
 * `<resource>:<action>` convention used throughout the audit log.
 *
 * @stable
 */
export type OAuthAuditAction =
  | 'oauth:granted'
  | 'oauth:refreshed'
  | 'oauth:revoked'
  | 'oauth:registered'
  | 'oauth:expired';

/**
 * Discriminator for the outcome of a single audit event.
 *
 * @stable
 */
export type OAuthAuditDecision = 'success' | 'denied' | 'error';

/**
 * Optional identifier of who initiated the event. Forwarded by the
 * library functions / CLI so the audit log records the correct
 * actor.
 *
 * @stable
 */
export interface OAuthAuditActor {
  readonly kind: 'cli' | 'agent' | 'system' | 'tool' | 'subagent';
  readonly id?: string;
}

/**
 * One audit event. The payload is intentionally minimal - no token
 * material - only safe metadata (server identifier, scope, expiry,
 * registration kind).
 *
 * @stable
 */
export interface OAuthAuditEvent {
  readonly action: OAuthAuditAction;
  readonly decision: OAuthAuditDecision;
  readonly ts: number;
  /** Stable identifier of the OAuth subsystem (always `'oauth'`). */
  readonly source: string;
  /** Target follows the convention `mcp:<server-id>` for MCP servers. */
  readonly target: string;
  readonly actor?: OAuthAuditActor;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Callback shape accepted by {@link onOAuthAudit}.
 *
 * @stable
 */
export type OAuthAuditListener = (event: OAuthAuditEvent) => void;

const listeners = new Set<OAuthAuditListener>();

/**
 * Subscribe to OAuth-subsystem audit events. The audit-log subsystem
 * registers exactly one listener that forwards each event to the
 * audit database.
 *
 * @stable
 */
export function onOAuthAudit(listener: OAuthAuditListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Emit an event to every subscriber. Listeners that throw are
 * isolated - a faulty listener never tears down the OAuth fast
 * path.
 *
 * @stable
 */
export function emitOAuthAudit(event: OAuthAuditEvent): void {
  if (listeners.size === 0) return;
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Audit listeners are isolated from the OAuth code path.
    }
  }
}

/**
 * Reset the listener set. Used by tests.
 *
 * @experimental
 */
export function _resetOAuthAuditListenersForTesting(): void {
  listeners.clear();
}

/**
 * Number of currently-registered listeners.
 *
 * @experimental
 */
export function _getOAuthAuditListenerCountForTesting(): number {
  return listeners.size;
}
