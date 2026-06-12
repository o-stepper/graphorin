/**
 * Bridge between the OAuth-subsystem audit emitter and the audit-log
 * subsystem. Mirrors `bridgeSecretsToAudit(...)` so downstream
 * consumers only have to learn one shape.
 *
 * @packageDocumentation
 */

import { type OAuthAuditEvent, onOAuthAudit } from '../oauth/audit-emitter.js';
import { appendAudit, reportDroppedAuditWrite } from './append.js';
import type { AuditDb } from './audit-db.js';
import type { AuditAction, AuditActor, AuditDecision, AuditEntryInput } from './types.js';

/**
 * Options accepted by {@link bridgeOAuthToAudit}.
 *
 * @stable
 */
export interface BridgeOAuthToAuditOptions {
  readonly db: AuditDb;
  readonly onWriteError?: (event: OAuthAuditEvent, error: unknown) => void;
}

/**
 * Teardown function returned by {@link bridgeOAuthToAudit}.
 *
 * @stable
 */
export interface OAuthBridgeTeardown {
  (): void;
  readonly drain: () => Promise<void>;
}

/**
 * Subscribe the audit-log subsystem to the OAuth audit emitter.
 *
 * @stable
 */
export function bridgeOAuthToAudit(opts: BridgeOAuthToAuditOptions): OAuthBridgeTeardown {
  let tail: Promise<unknown> = Promise.resolve();
  const unsubscribe = onOAuthAudit((event) => {
    const input = translate(event);
    tail = tail
      .then(() => appendAudit(opts.db, input))
      .catch((error) => {
        if (opts.onWriteError !== undefined) opts.onWriteError(event, error);
        else reportDroppedAuditWrite('oauth', error);
      });
  });
  const teardown = (): void => unsubscribe();
  return Object.assign(teardown, {
    drain: async (): Promise<void> => {
      await tail;
    },
  });
}

function translate(event: OAuthAuditEvent): AuditEntryInput {
  const actor: AuditActor =
    event.actor === undefined
      ? Object.freeze({ kind: 'system', id: 'graphorin/security/oauth' })
      : Object.freeze({ kind: event.actor.kind, id: event.actor.id ?? 'unknown' });
  return Object.freeze({
    actor,
    action: event.action as AuditAction,
    target: event.target,
    decision: event.decision satisfies AuditDecision,
    ts: event.ts,
    ...(event.metadata === undefined ? {} : { metadata: event.metadata }),
  });
}
