/**
 * `appendAudit(...)` — write a single tamper-evident entry into the
 * audit chain.
 *
 * @packageDocumentation
 */

import { createHash } from 'node:crypto';

import type { AuditDb } from './audit-db.js';
import { canonicalJson } from './canonical-json.js';
import type { AuditEntryInput, StoredAuditEntry } from './types.js';

/** Genesis prev-hash (64 zero hex chars). */
export const GENESIS_PREV_HASH = '0'.repeat(64);

/**
 * Compute the SHA-256 chain hash for an entry. Exposed for tests and
 * for tooling that wants to recompute hashes outside the verifier.
 *
 * @stable
 */
export function computeAuditHash(entry: Omit<StoredAuditEntry, 'hash'>): string {
  const canonical = canonicalJson({
    seq: entry.seq,
    ts: entry.ts,
    actor: entry.actor,
    action: entry.action,
    target: entry.target,
    decision: entry.decision,
    ...(entry.context === undefined ? {} : { context: entry.context }),
    ...(entry.metadata === undefined ? {} : { metadata: entry.metadata }),
    prevHash: entry.prevHash,
  });
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Append a single audit entry. The function is `async` so it can run
 * the canonical-JSON serializer + SHA-256 in a worker pool in a
 * future revision; today it is synchronous on the inside.
 *
 * @stable
 */
export async function appendAudit(db: AuditDb, input: AuditEntryInput): Promise<StoredAuditEntry> {
  const last = await db.latest();
  const seq = (last?.seq ?? 0) + 1;
  const prevHash = last?.hash ?? GENESIS_PREV_HASH;
  const ts = input.ts ?? Date.now();

  const baseEntry: Omit<StoredAuditEntry, 'hash'> = Object.freeze({
    seq,
    ts,
    actor: input.actor,
    action: input.action,
    target: input.target,
    decision: input.decision,
    ...(input.context === undefined ? {} : { context: input.context }),
    ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
    prevHash,
  });
  const hash = computeAuditHash(baseEntry);
  const stored: StoredAuditEntry = Object.freeze({ ...baseEntry, hash });
  await db.insert(stored);
  return stored;
}
