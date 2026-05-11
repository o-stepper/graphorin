/**
 * Bridge between the supply-chain audit emitter and the audit-log
 * subsystem. Mirrors `bridgeSecretsToAudit(...)` so downstream
 * consumers only have to learn one shape.
 *
 * @packageDocumentation
 */

import { onSupplyChainAudit, type SupplyChainAuditEvent } from '../supply-chain/audit-emitter.js';
import { appendAudit } from './append.js';
import type { AuditDb } from './audit-db.js';
import type { AuditAction, AuditActor, AuditDecision, AuditEntryInput } from './types.js';

/**
 * Options accepted by {@link bridgeSupplyChainToAudit}.
 *
 * @stable
 */
export interface BridgeSupplyChainToAuditOptions {
  readonly db: AuditDb;
  readonly onWriteError?: (event: SupplyChainAuditEvent, error: unknown) => void;
}

/**
 * Teardown function returned by {@link bridgeSupplyChainToAudit}.
 *
 * @stable
 */
export interface SupplyChainBridgeTeardown {
  (): void;
  readonly drain: () => Promise<void>;
}

/**
 * Subscribe the audit-log subsystem to the supply-chain audit
 * emitter.
 *
 * @stable
 */
export function bridgeSupplyChainToAudit(
  opts: BridgeSupplyChainToAuditOptions,
): SupplyChainBridgeTeardown {
  let tail: Promise<unknown> = Promise.resolve();
  const unsubscribe = onSupplyChainAudit((event) => {
    const input = translate(event);
    tail = tail
      .then(() => appendAudit(opts.db, input))
      .catch((error) => {
        opts.onWriteError?.(event, error);
      });
  });
  const teardown = (): void => unsubscribe();
  return Object.assign(teardown, {
    drain: async (): Promise<void> => {
      await tail;
    },
  });
}

function translate(event: SupplyChainAuditEvent): AuditEntryInput {
  const actor: AuditActor =
    event.actor === undefined
      ? Object.freeze({ kind: 'system', id: 'graphorin/security/supply-chain' })
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
