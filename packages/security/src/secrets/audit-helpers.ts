/**
 * Internal helpers shared by every `SecretsStore` implementation so
 * audit emission lives in one place.
 *
 * @packageDocumentation
 */

import { getActiveToolSecretsContext } from './acl.js';
import {
  emitSecretsAudit,
  type SecretsAuditAction,
  type SecretsAuditActor,
  type SecretsAuditDecision,
  type SecretsAuditEvent,
} from './audit-emitter.js';
import { SecretAccessDeniedError, SecretRequiredError } from './errors.js';

/**
 * Build an `actor` envelope from the active per-tool ACL context. The
 * AsyncLocalStorage scope is the canonical attribution for tool /
 * agent operations; outside a scope the helper returns `undefined` so
 * downstream listeners can decide whether to insert a `system` actor.
 *
 * @internal
 */
export function actorFromActiveContext(): SecretsAuditActor | undefined {
  const ctx = getActiveToolSecretsContext();
  if (!ctx) return undefined;
  const actor: SecretsAuditActor = {
    kind: 'tool',
    toolName: ctx.toolName,
    ...(ctx.runId !== undefined ? { runId: ctx.runId } : {}),
    ...(ctx.sessionId !== undefined ? { sessionId: ctx.sessionId } : {}),
    ...(ctx.agentId !== undefined ? { id: ctx.agentId } : {}),
  };
  return actor;
}

/**
 * Run a `SecretsStore` action while emitting a single audit event with
 * the right `decision` discriminator regardless of how the action
 * resolves (success / not-found / denied / error).
 *
 * @internal
 */
export async function auditStoreOperation<T>(
  action: SecretsAuditAction,
  source: string,
  key: string,
  fn: () => Promise<T>,
  options: {
    /** Override the actor envelope; defaults to the active ACL context. */
    readonly actor?: SecretsAuditActor;
    /** Map a successful return value to a decision. Defaults to `'success'`. */
    readonly decisionFor?: (result: T) => SecretsAuditDecision;
    /** Optional metadata appended to the event. */
    readonly metadata?: Readonly<Record<string, unknown>>;
  } = {},
): Promise<T> {
  const actor = options.actor ?? actorFromActiveContext();
  try {
    const result = await fn();
    const decision = options.decisionFor ? options.decisionFor(result) : 'success';
    emitEvent({
      action,
      decision,
      source,
      target: key,
      ...(actor ? { actor } : {}),
      ...(options.metadata ? { metadata: options.metadata } : {}),
    });
    return result;
  } catch (err) {
    const decision: SecretsAuditDecision =
      err instanceof SecretAccessDeniedError
        ? 'denied'
        : err instanceof SecretRequiredError
          ? 'not-found'
          : 'error';
    emitEvent({
      action,
      decision,
      source,
      target: key,
      ...(actor ? { actor } : {}),
      metadata: {
        ...(options.metadata ?? {}),
        errorKind: (err as { kind?: string }).kind,
      },
    });
    throw err;
  }
}

function emitEvent(args: {
  action: SecretsAuditAction;
  decision: SecretsAuditDecision;
  source: string;
  target: string;
  actor?: SecretsAuditActor;
  metadata?: Readonly<Record<string, unknown>>;
}): void {
  const event: SecretsAuditEvent = {
    action: args.action,
    decision: args.decision,
    ts: Date.now(),
    source: args.source,
    target: args.target,
    ...(args.actor ? { actor: args.actor } : {}),
    ...(args.metadata ? { metadata: args.metadata } : {}),
  };
  emitSecretsAudit(event);
}
