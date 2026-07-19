/**
 * Bridge the delivery-commentary sanitizer's audit decisions into the
 * tamper-evident audit log. `createWsDispatcher` ran the sanitizer without a
 * `sink`, so every documented sanitization decision - what was wrapped or
 * stripped on the wire, with before/after digests and the matched-pattern
 * bucket - was silently dropped instead of landing in the audit chain.
 *
 * The WS dispatcher is constructed before the audit DB is unsealed (the DB
 * opens during `start()`), so the server hands the dispatcher a
 * {@link LateBoundCommentarySink} and installs the real audit-writing target
 * via {@link bridgeCommentaryToAudit} once the DB exists. Mirrors the
 * `bridgeAuthToAudit` / `bridgeSecretsToAudit` pattern in `@graphorin/security`.
 *
 * @packageDocumentation
 */

import { type AuditDb, type AuditEntryInput, appendAudit } from '@graphorin/security/audit';

import type { DeliveryCommentaryDecision, DeliveryCommentarySink } from './types.js';

/**
 * Audit action recorded for a delivery-commentary sanitization decision.
 *
 * @stable
 */
export const COMMENTARY_AUDIT_ACTION = 'delivery:commentary:sanitized';

/**
 * Translate a sanitizer decision into an audit entry. The digests + matched
 * pattern bucket land in `metadata`; raw payloads never do (the sanitizer only
 * ever exposes SHA-256s of the before/after bodies).
 */
export function commentaryDecisionToAuditInput(
  decision: DeliveryCommentaryDecision,
): AuditEntryInput {
  return {
    actor: { kind: 'system', id: 'graphorin/server' },
    action: COMMENTARY_AUDIT_ACTION,
    target: `${decision.transport}:${decision.eventType}`,
    decision: 'success',
    metadata: {
      policy: decision.policy,
      applied: decision.applied,
      boundary: decision.boundary,
      reasons: decision.reasons,
      ...(decision.matchedPattern !== undefined ? { matchedPattern: decision.matchedPattern } : {}),
      sha256OfBefore: decision.sha256OfBefore,
      sha256OfAfter: decision.sha256OfAfter,
    },
  };
}

/**
 * A commentary sink that also exposes a `drain()` so callers (and tests) can
 * await any in-flight audit writes.
 *
 * @stable
 */
export interface CommentaryAuditSink extends DeliveryCommentarySink {
  /** Resolve once every queued audit write has settled. */
  readonly drain: () => Promise<void>;
}

/**
 * Build a commentary sink that appends each sanitization decision to the audit
 * log. Writes serialise through `appendAudit` so concurrent decisions never
 * race on `seq`; a failed write is isolated from the wire - `onWriteError`
 * (default: a console warning) runs instead of throwing.
 *
 * @stable
 */
export function bridgeCommentaryToAudit(
  db: AuditDb,
  onWriteError: (
    decision: DeliveryCommentaryDecision,
    error: unknown,
  ) => void = defaultOnWriteError,
): CommentaryAuditSink {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    onDecision(decision) {
      const input = commentaryDecisionToAuditInput(decision);
      tail = tail
        .then(() => appendAudit(db, input))
        .catch((error) => onWriteError(decision, error));
    },
    drain: async () => {
      await tail;
    },
  };
}

function defaultOnWriteError(_decision: DeliveryCommentaryDecision, error: unknown): void {
  console.warn(
    `[graphorin/server] WARN: failed to write a delivery-commentary audit entry: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}

/**
 * A {@link DeliveryCommentarySink} whose real target is installed later. The WS
 * dispatcher is created before the audit DB opens; the server hands it
 * this forwarding sink and calls {@link LateBoundCommentarySink.bind} once the
 * audit-writing sink exists. Decisions emitted before binding are dropped - the
 * dispatcher only sanitizes once it is live (after `start()`, by which point
 * the audit DB, if configured, has opened and bound).
 *
 * @stable
 */
export interface LateBoundCommentarySink extends DeliveryCommentarySink {
  /** Install the real sink. Replaces any previously-bound target. */
  bind(target: DeliveryCommentarySink): void;
}

/**
 * @stable
 */
export function createLateBoundCommentarySink(): LateBoundCommentarySink {
  let target: DeliveryCommentarySink | undefined;
  return {
    bind(next) {
      target = next;
    },
    onDecision(decision) {
      // Contract: a sink never throws into the wire. The sanitizer also guards,
      // but be defensive in case a bound target misbehaves.
      try {
        target?.onDecision(decision);
      } catch {
        // swallow
      }
    },
  };
}
