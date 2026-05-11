/**
 * Bridge between the secrets-layer audit emitter (Phase 03a) and the
 * audit-log subsystem (Phase 03b). The bridge is a single
 * `onSecretsAudit(...)` listener that translates each emitted event
 * into an `appendAudit(...)` call on the supplied `AuditDb`.
 *
 * The bridge is the only direct cross-cut between the secrets layer
 * and the audit layer; every other audit consumer goes through
 * `appendAudit(...)` directly.
 *
 * @packageDocumentation
 */

import { onSecretsAudit, type SecretsAuditEvent } from '../secrets/audit-emitter.js';
import { appendAudit } from './append.js';
import type { AuditDb } from './audit-db.js';
import type { AuditAction, AuditActor, AuditDecision, AuditEntryInput } from './types.js';

/**
 * Subscribe the audit-log subsystem to the secrets-layer event
 * emitter. Returns a teardown function that detaches the listener.
 *
 * Failures inside the bridge never propagate — the audit subsystem
 * cannot tear down the secret-access path.
 *
 * @stable
 */
export interface BridgeSecretsToAuditOptions {
  /** Audit database the bridge writes into. */
  readonly db: AuditDb;
  /** Optional logger called when a write fails. */
  readonly onWriteError?: (event: SecretsAuditEvent, error: unknown) => void;
}

/**
 * Teardown function returned by `bridgeSecretsToAudit(...)`.
 *
 * Calling it detaches the listener; the `.drain()` helper resolves
 * once every queued audit-log write has settled so test suites and
 * graceful-shutdown paths can wait for the bridge to finish before
 * closing the audit database.
 *
 * @stable
 */
export interface SecretsBridgeTeardown {
  (): void;
  readonly drain: () => Promise<void>;
}

/**
 * Subscribe the audit-log subsystem to the secrets-layer audit
 * emitter. Returns a teardown function.
 *
 * Writes are serialised through a per-bridge queue so concurrent
 * secrets events never race on `db.latest()` and produce duplicate
 * `seq` values. Failures are isolated from the secret access path
 * via the `onWriteError` callback.
 *
 * @stable
 */
export function bridgeSecretsToAudit(options: BridgeSecretsToAuditOptions): SecretsBridgeTeardown {
  let tail: Promise<unknown> = Promise.resolve();
  const unsubscribe = onSecretsAudit((event) => {
    const input = translate(event);
    tail = tail
      .then(() => appendAudit(options.db, input))
      .catch((error) => {
        options.onWriteError?.(event, error);
      });
  });
  const teardown = (): void => unsubscribe();
  return Object.assign(teardown, {
    drain: async (): Promise<void> => {
      await tail;
    },
  });
}

function translate(event: SecretsAuditEvent): AuditEntryInput {
  const actor: AuditActor = (() => {
    if (event.actor === undefined) {
      return Object.freeze({ kind: 'system', id: 'graphorin/security' });
    }
    return Object.freeze({
      kind: event.actor.kind === 'cli' ? 'cli' : event.actor.kind,
      id: event.actor.id ?? event.actor.toolName ?? 'unknown',
      ...(event.actor.toolName === undefined ? {} : { label: event.actor.toolName }),
    });
  })();
  const decision = mapDecision(event.decision);
  const action = event.action as AuditAction;
  const context: AuditEntryInput['context'] = (() => {
    if (event.actor === undefined) return undefined;
    const ctx: { runId?: string; sessionId?: string; toolName?: string } = {};
    if (event.actor.runId !== undefined) ctx.runId = event.actor.runId;
    if (event.actor.sessionId !== undefined) ctx.sessionId = event.actor.sessionId;
    if (event.actor.toolName !== undefined) ctx.toolName = event.actor.toolName;
    return Object.keys(ctx).length === 0 ? undefined : Object.freeze(ctx);
  })();
  const input: AuditEntryInput = Object.freeze({
    actor,
    action,
    target: event.target,
    decision,
    ts: event.ts,
    ...(context === undefined ? {} : { context }),
    ...(event.metadata === undefined ? {} : { metadata: event.metadata }),
  });
  return input;
}

function mapDecision(decision: SecretsAuditEvent['decision']): AuditDecision {
  switch (decision) {
    case 'denied':
      return 'denied';
    case 'not-found':
      return 'not-found';
    case 'error':
      return 'error';
    case 'success':
      return 'success';
    default: {
      // Exhaustiveness; no-op fallback returns 'success' so an
      // unrecognised decision never silently drops the event.
      return 'success';
    }
  }
}
