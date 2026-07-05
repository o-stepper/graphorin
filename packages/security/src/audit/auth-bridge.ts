/**
 * Bridge between the server-token auth audit emitter (SPL-5) and the
 * audit-log subsystem. A single `onAuthAudit(...)` listener translates
 * each emitted event into an `appendAudit(...)` call on the supplied
 * `AuditDb` - the auth layer never writes audit rows across the package
 * boundary itself. Mirrors `bridgeSecretsToAudit` / `bridgeOAuthToAudit`.
 *
 * @packageDocumentation
 */

import { type AuthAuditEvent, onAuthAudit } from '../auth/audit-emitter.js';
import { appendAudit, reportDroppedAuditWrite } from './append.js';
import type { AuditDb } from './audit-db.js';
import type { AuditAction, AuditActor, AuditDecision, AuditEntryInput } from './types.js';

/** Options for {@link bridgeAuthToAudit}. @stable */
export interface BridgeAuthToAuditOptions {
  readonly db: AuditDb;
  readonly onWriteError?: (event: AuthAuditEvent, error: unknown) => void;
}

/** Teardown returned by `bridgeAuthToAudit(...)`. @stable */
export interface AuthBridgeTeardown {
  (): void;
  readonly drain: () => Promise<void>;
}

/**
 * Subscribe the audit-log subsystem to the auth-layer audit emitter
 * (SPL-5). Token mint / revoke / rotate / rekey and every verification
 * outcome (granted, unauth, scope-denied, lockout) land in the chain.
 * Writes serialise through `appendAudit` (SPL-4) so concurrent events
 * never race on `seq`; a failed write is isolated from the auth path
 * and logged (never swallowed) when no `onWriteError` is supplied.
 *
 * @stable
 */
export function bridgeAuthToAudit(options: BridgeAuthToAuditOptions): AuthBridgeTeardown {
  let tail: Promise<unknown> = Promise.resolve();
  const unsubscribe = onAuthAudit((event) => {
    const input = translate(event);
    tail = tail
      .then(() => appendAudit(options.db, input))
      .catch((error) => {
        if (options.onWriteError !== undefined) options.onWriteError(event, error);
        else reportDroppedAuditWrite('auth', error);
      });
  });
  const teardown = (): void => unsubscribe();
  return Object.assign(teardown, {
    drain: async (): Promise<void> => {
      await tail;
    },
  });
}

function translate(event: AuthAuditEvent): AuditEntryInput {
  const actor: AuditActor =
    event.actor === undefined
      ? Object.freeze({ kind: 'system', id: 'graphorin/security' })
      : Object.freeze({ kind: event.actor.kind, id: event.actor.id ?? 'unknown' });
  const context: AuditEntryInput['context'] = (() => {
    if (event.actor === undefined) return undefined;
    const ctx: { runId?: string; sessionId?: string } = {};
    if (event.actor.runId !== undefined) ctx.runId = event.actor.runId;
    if (event.actor.sessionId !== undefined) ctx.sessionId = event.actor.sessionId;
    return Object.keys(ctx).length === 0 ? undefined : Object.freeze(ctx);
  })();
  return Object.freeze({
    actor,
    action: event.action as AuditAction,
    target: event.target,
    decision: event.decision as AuditDecision,
    ts: event.ts,
    ...(context === undefined ? {} : { context }),
    ...(event.metadata === undefined ? {} : { metadata: event.metadata }),
  });
}
