/**
 * `verifyAuditChain(...)` - walk the chain and report the first
 * divergent link.
 *
 * @packageDocumentation
 */

import { computeAuditHash, GENESIS_PREV_HASH } from './append.js';
import type { AuditDb } from './audit-db.js';
import type { AuditChainVerifyResult } from './types.js';

/**
 * Walk the audit chain inside the supplied bounds and return the
 * first divergent link (if any) plus the entry count traversed. The
 * function never throws; callers branch on the discriminated `ok`
 * field.
 *
 * @stable
 */
export async function verifyAuditChain(
  db: AuditDb,
  bounds: { readonly fromSeq?: number; readonly toSeq?: number } = {},
): Promise<AuditChainVerifyResult> {
  let count = 0;
  let expectedPrevHash: string | undefined;
  for await (const entry of db.iterate(bounds)) {
    if (count === 0) {
      // First iterate either at genesis (no `fromSeq`) or at an
      // arbitrary `fromSeq`. In both cases we trust the stored
      // `prevHash` for the first entry; subsequent entries must
      // chain to the previous entry's hash.
      expectedPrevHash =
        bounds.fromSeq === undefined || bounds.fromSeq <= 1 ? GENESIS_PREV_HASH : entry.prevHash;
    }
    if (expectedPrevHash !== undefined && entry.prevHash !== expectedPrevHash) {
      return Object.freeze({
        ok: false,
        brokenAt: entry.seq,
        expected: expectedPrevHash,
        actual: entry.prevHash,
      });
    }
    const recomputed = computeAuditHash({
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
    if (recomputed !== entry.hash) {
      return Object.freeze({
        ok: false,
        brokenAt: entry.seq,
        expected: recomputed,
        actual: entry.hash,
      });
    }
    expectedPrevHash = entry.hash;
    count += 1;
  }
  return Object.freeze({ ok: true, count });
}
