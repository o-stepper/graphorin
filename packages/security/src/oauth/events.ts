/**
 * Lifecycle event emitter for the OAuth subsystem. Distinct from the
 * audit emitter (which targets the tamper-evident chain) - these
 * events drive in-process consumers like the MCP client (Phase 09)
 * that needs to react to `mcp.auth.expired` by triggering re-auth.
 *
 * @packageDocumentation
 */

/**
 * Discriminator for `OAuthLifecycleEvent`.
 *
 * @stable
 */
export type OAuthLifecycleEventName =
  | 'oauth.granted'
  | 'oauth.refreshed'
  | 'oauth.revoked'
  | 'oauth.registered'
  | 'mcp.auth.expired';

/**
 * Lifecycle event payload. Intentionally minimal so the framework can
 * keep the same shape across consumers.
 *
 * @stable
 */
export interface OAuthLifecycleEvent {
  readonly type: OAuthLifecycleEventName;
  readonly serverId: string;
  readonly ts: number;
  readonly reason?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Callback shape accepted by {@link onOAuthLifecycle}.
 *
 * @stable
 */
export type OAuthLifecycleListener = (event: OAuthLifecycleEvent) => void;

const listeners = new Set<OAuthLifecycleListener>();

/**
 * Subscribe to OAuth lifecycle events. Returns an unsubscribe
 * function.
 *
 * @stable
 */
export function onOAuthLifecycle(listener: OAuthLifecycleListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Emit a lifecycle event. Listeners that throw are isolated from the
 * OAuth fast path.
 *
 * @stable
 */
export function emitOAuthLifecycle(event: OAuthLifecycleEvent): void {
  if (listeners.size === 0) return;
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Lifecycle listeners must never crash the OAuth flow.
    }
  }
}

/**
 * Reset the listener set. Used by tests.
 *
 * @experimental
 */
export function _resetOAuthLifecycleListenersForTesting(): void {
  listeners.clear();
}
