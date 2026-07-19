/**
 * Bridge the `@graphorin/tools` audit-event bus (`onToolAudit`,
 * which `@graphorin/mcp` also emits into) into the server's
 * tamper-evident audit log. Without this, a shadow-mode
 * `tool:dataflow:flagged` was invisible to an operator unless they
 * hand-wired a subscriber - which no guide showed.
 *
 * Mirrors `commentary/audit-bridge.ts`: writes serialise through one
 * promise tail so concurrent events never race `appendAudit`'s seq
 * chain, a failed write is isolated (warn, never throw into the
 * emitter), and `drain()` lets shutdown/tests await in-flight writes.
 *
 * Volume control (`config.audit.toolEvents`):
 * - `'security'` (default): only the security-significant subset -
 *   dataflow flagged/blocked/declassified, sanitization hits/blocks,
 *   approval lifecycle, collisions, cap-disabled. High-frequency
 *   `tool:execute:*` chatter stays OUT of the Merkle chain.
 * - `'all'`: every tool audit event, including per-call execute
 *   start/end/error (bounded by call volume - size the chain
 *   accordingly).
 * - `'off'`: bridge disabled.
 *
 * @packageDocumentation
 */

import { type AuditDb, type AuditEntryInput, appendAudit } from '@graphorin/security/audit';
import { onToolAudit, type ToolAuditEvent } from '@graphorin/tools/audit';

/** Volume policy for the tool-audit bridge. @stable */
export type ToolEventsAuditPolicy = 'security' | 'all' | 'off';

/**
 * The `'security'` allowlist: decisions an operator reviews, not
 * per-call chatter.
 */
const SECURITY_ACTIONS: ReadonlySet<string> = new Set([
  'tool:dataflow:flagged',
  'tool:dataflow:blocked',
  'tool:dataflow:declassified',
  'tool:result:sanitization:hit',
  'tool:result:sanitization:blocked',
  'tool:approval:requested',
  'tool:approval:granted',
  'tool:approval:denied',
  // E1: a permission-hook rewrite changed what a tool executes -
  // exactly the kind of decision an operator reviews.
  'tool:permission:rewritten',
  'tool:collision:detected',
  'tool:collision:priority-resolved',
  'tool:collision:auto-prefix-applied',
  'tool:collision:manual-rejected',
  'tool:collision:suppressed',
  'tool:result:cap-disabled',
]);

/** Translate a tools audit event into an audit-chain entry. */
export function toolAuditEventToAuditInput(event: ToolAuditEvent): AuditEntryInput {
  const context: AuditEntryInput['context'] = {
    ...(event.context?.runId !== undefined ? { runId: event.context.runId } : {}),
    ...(event.context?.sessionId !== undefined ? { sessionId: event.context.sessionId } : {}),
  };
  return {
    actor: { kind: event.actor.kind, id: event.actor.id },
    action: event.action,
    target: event.target,
    decision: event.decision,
    ts: event.ts,
    ...(Object.keys(context).length > 0 ? { context } : {}),
    metadata: {
      ...(event.metadata ?? {}),
      ...(event.context?.stepNumber !== undefined ? { stepNumber: event.context.stepNumber } : {}),
      ...(event.context?.toolCallId !== undefined ? { toolCallId: event.context.toolCallId } : {}),
    },
  };
}

/** Handle returned by {@link bridgeToolAuditToAudit}. @stable */
export interface ToolAuditBridge {
  /** Unsubscribe from the tool-audit bus. */
  readonly stop: () => void;
  /** Resolve once every queued audit write has settled. */
  readonly drain: () => Promise<void>;
}

/**
 * Subscribe the audit chain to the tools audit bus. Returns a handle
 * whose `stop()` MUST run on shutdown (the bus is process-global).
 *
 * @stable
 */
export function bridgeToolAuditToAudit(
  db: AuditDb,
  options: {
    readonly policy?: ToolEventsAuditPolicy;
    readonly onWriteError?: (event: ToolAuditEvent, error: unknown) => void;
  } = {},
): ToolAuditBridge {
  const policy = options.policy ?? 'security';
  if (policy === 'off') {
    return { stop: () => {}, drain: async () => {} };
  }
  const onWriteError = options.onWriteError ?? defaultOnWriteError;
  let tail: Promise<unknown> = Promise.resolve();
  const stop = onToolAudit((event) => {
    if (policy === 'security' && !SECURITY_ACTIONS.has(event.action)) return;
    const input = toolAuditEventToAuditInput(event);
    tail = tail.then(() => appendAudit(db, input)).catch((error) => onWriteError(event, error));
  });
  return {
    stop,
    drain: async () => {
      await tail;
    },
  };
}

function defaultOnWriteError(event: ToolAuditEvent, error: unknown): void {
  console.warn(
    `[graphorin/server] WARN: failed to write a tool audit entry (${event.action}): ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}
