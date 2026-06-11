/**
 * Bridge between the memory-modification guard audit emitter
 * (Phase 03c) and the audit-log subsystem (Phase 03b). The bridge is
 * a single `onMemoryGuardAudit(...)` listener that translates each
 * emitted event into an `appendAudit(...)` call on the supplied
 * `AuditDb`.
 *
 * Mirrors `bridgeSecretsToAudit(...)` so downstream consumers only
 * have to learn one shape.
 *
 * @packageDocumentation
 */

import { type MemoryGuardAuditEvent, onMemoryGuardAudit } from '../guard/audit-emitter.js';
import { appendAudit, reportDroppedAuditWrite } from './append.js';
import type { AuditDb } from './audit-db.js';
import type { AuditAction, AuditActor, AuditDecision, AuditEntryInput } from './types.js';

/**
 * Options accepted by `bridgeMemoryGuardToAudit(...)`.
 *
 * @stable
 */
export interface BridgeMemoryGuardToAuditOptions {
  readonly db: AuditDb;
  readonly onWriteError?: (event: MemoryGuardAuditEvent, error: unknown) => void;
}

/**
 * Teardown function returned by `bridgeMemoryGuardToAudit(...)`.
 *
 * Calling it detaches the listener; the `.drain()` helper resolves
 * once every queued audit-log write has settled so test suites and
 * graceful-shutdown paths can wait for the bridge to finish before
 * closing the audit database.
 *
 * @stable
 */
export interface MemoryGuardBridgeTeardown {
  (): void;
  readonly drain: () => Promise<void>;
}

/**
 * Subscribe the audit-log subsystem to the guard audit emitter.
 * Returns a teardown function.
 *
 * Writes are serialised through a per-bridge queue so concurrent
 * guard events never race on `db.latest()` and produce duplicate
 * `seq` values. Failures are isolated from the guard fast path via
 * the `onWriteError` callback.
 *
 * @stable
 */
export function bridgeMemoryGuardToAudit(
  opts: BridgeMemoryGuardToAuditOptions,
): MemoryGuardBridgeTeardown {
  let tail: Promise<unknown> = Promise.resolve();
  const unsubscribe = onMemoryGuardAudit((event) => {
    const input = translate(event);
    tail = tail
      .then(() => appendAudit(opts.db, input))
      .catch((error) => {
        if (opts.onWriteError !== undefined) opts.onWriteError(event, error);
        else reportDroppedAuditWrite('memory-guard', error);
      });
  });
  const teardown = (): void => unsubscribe();
  return Object.assign(teardown, {
    drain: async (): Promise<void> => {
      await tail;
    },
  });
}

function translate(event: MemoryGuardAuditEvent): AuditEntryInput {
  const actor: AuditActor = (() => {
    if (event.actor === undefined) {
      return Object.freeze({ kind: 'system', id: 'graphorin/security' });
    }
    return Object.freeze({
      kind: event.actor.kind,
      id: event.actor.id ?? event.actor.toolName ?? 'unknown',
      ...(event.actor.toolName === undefined ? {} : { label: event.actor.toolName }),
    });
  })();
  const context: AuditEntryInput['context'] = (() => {
    if (event.actor === undefined) return undefined;
    const ctx: { runId?: string; sessionId?: string; toolName?: string } = {};
    if (event.actor.runId !== undefined) ctx.runId = event.actor.runId;
    if (event.actor.sessionId !== undefined) ctx.sessionId = event.actor.sessionId;
    if (event.actor.toolName !== undefined) ctx.toolName = event.actor.toolName;
    return Object.keys(ctx).length === 0 ? undefined : Object.freeze(ctx);
  })();
  const target =
    event.regions !== undefined && event.regions.length > 0 ? event.regions.join(',') : event.tier;
  const decision: AuditDecision = mapDecision(event.decision);
  return Object.freeze({
    actor,
    action: event.action as AuditAction,
    target,
    decision,
    ts: event.ts,
    ...(context === undefined ? {} : { context }),
    ...(event.metadata === undefined ? {} : { metadata: event.metadata }),
  });
}

function mapDecision(decision: MemoryGuardAuditEvent['decision']): AuditDecision {
  switch (decision) {
    case 'success':
      return 'success';
    case 'denied':
      return 'denied';
    case 'error':
      return 'error';
    default:
      return 'success';
  }
}
