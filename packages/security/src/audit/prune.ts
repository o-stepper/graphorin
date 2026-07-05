/**
 * `pruneAudit(...)` - drop a contiguous prefix of the audit chain
 * while preserving the integrity of the surviving suffix.
 *
 * The retention policy is a deliberate trade-off: the framework keeps
 * audit entries forever by default, but operators can delete
 * everything older than `before` provided that the surviving prefix
 * keeps at least `retain` entries.
 *
 * Only the longest *contiguous* run of fully-expired entries at the
 * front of the chain is removed. Because the chain is a hash chain it
 * can only be trimmed at the front, so an expired entry that sits (by
 * `seq`) behind a not-yet-expired one - e.g. when timestamps are not
 * monotonic in `seq` order - is retained rather than punching a hole in
 * the chain. Deleting fewer entries than the wall-clock cutoff implies
 * is the safe behaviour here, never a silent gap.
 *
 * After deletion the first surviving entry's `prevHash` is rewritten
 * to the genesis value so `verifyAuditChain(...)` keeps returning
 * `{ ok: true }` on the surviving suffix. This recomputes every
 * surviving entry's `hash`, so any entry hashes previously archived via
 * `exportAudit(...)` will no longer match the post-prune chain - treat a
 * prune as invalidating the hashes of earlier exports.
 *
 * @packageDocumentation
 */

import { computeAuditHash, GENESIS_PREV_HASH } from './append.js';
import type { AuditDb } from './audit-db.js';
import type { StoredAuditEntry } from './types.js';

/**
 * Options for `pruneAudit(...)`.
 *
 * @stable
 */
export interface PruneAuditOptions {
  /**
   * Drop entries older than this Date / epoch ms. Required so the
   * helper never silently truncates the audit chain.
   */
  readonly before: Date | number;
  /**
   * Minimum number of entries that must survive. The helper refuses
   * to leave the chain emptier than this. Defaults to 1.
   */
  readonly retain?: number;
  /**
   * Optional structured log sink invoked exactly once per prune run.
   * The framework logger ships in a follow-on phase; until then,
   * consumers can wire `console.info` (or a custom logger) here so
   * the operational signal is not lost.
   */
  readonly logger?: (event: PruneAuditLogEvent) => void;
}

/**
 * Structured shape of the single log event emitted per prune run.
 *
 * @stable
 */
export interface PruneAuditLogEvent {
  readonly level: 'info';
  readonly message: string;
  readonly deleted: number;
  readonly firstSurvivingSeq?: number;
  readonly retain: number;
  readonly before: number;
}

/**
 * Result of `pruneAudit(...)`.
 *
 * @stable
 */
export interface PruneAuditResult {
  readonly deleted: number;
  /** Sequence number of the first surviving entry, or `undefined` if empty. */
  readonly firstSurvivingSeq?: number;
}

/**
 * Drop entries older than `before`, leaving at least `retain`
 * entries. Maintains the chain integrity by rewriting the first
 * surviving entry's `prevHash` to the genesis value.
 *
 * @stable
 */
export async function pruneAudit(
  db: AuditDb,
  options: PruneAuditOptions,
): Promise<PruneAuditResult> {
  const beforeMs = options.before instanceof Date ? options.before.getTime() : options.before;
  if (!Number.isFinite(beforeMs)) {
    throw new RangeError(`pruneAudit: 'before' must be finite; got ${String(options.before)}.`);
  }
  const retain = Math.max(1, options.retain ?? 1);
  const total = await db.count();
  if (total === 0) return Object.freeze({ deleted: 0 });

  // Collect candidate seqs while respecting the retain floor. We
  // walk the iterator twice - once to identify the threshold and
  // once to find the first surviving entry - so we never have to
  // load the entire chain into memory.
  let lastQualifyingSeq: number | undefined;
  let walked = 0;
  for await (const entry of db.iterate()) {
    walked += 1;
    if (entry.ts >= beforeMs) break;
    if (total - walked < retain) break;
    lastQualifyingSeq = entry.seq;
  }
  if (lastQualifyingSeq === undefined) return Object.freeze({ deleted: 0 });

  const deleted = await db.deleteUpTo(lastQualifyingSeq);

  // Reroot the surviving chain at the genesis prev-hash. Every
  // surviving entry's `prevHash` (and consequently its `hash`) is
  // recomputed so `verifyAuditChain` keeps reporting a clean chain
  // on the trimmed log. The cryptographic link to the deleted prefix
  // is severed by design - that is the documented retention contract.
  let prevHash = GENESIS_PREV_HASH;
  let firstSurviving: StoredAuditEntry | undefined;
  for await (const entry of db.iterate()) {
    const rewritten = withRehashedChain(entry, prevHash);
    await db.replaceEntry(rewritten);
    if (firstSurviving === undefined) firstSurviving = rewritten;
    prevHash = rewritten.hash;
  }

  const result: PruneAuditResult = Object.freeze({
    deleted,
    ...(firstSurviving === undefined ? {} : { firstSurvivingSeq: firstSurviving.seq }),
  });
  options.logger?.(
    Object.freeze({
      level: 'info',
      message:
        firstSurviving === undefined
          ? `pruneAudit: deleted ${deleted} entries (chain is now empty)`
          : `pruneAudit: deleted ${deleted} entries; surviving chain rerooted at seq ${firstSurviving.seq}`,
      deleted,
      ...(firstSurviving === undefined ? {} : { firstSurvivingSeq: firstSurviving.seq }),
      retain,
      before: beforeMs,
    }),
  );
  return result;
}

function withRehashedChain(entry: StoredAuditEntry, prevHash: string): StoredAuditEntry {
  const { hash: _ignored, ...withoutHash } = entry;
  void _ignored;
  const baseEntry: Omit<StoredAuditEntry, 'hash'> = Object.freeze({
    ...withoutHash,
    prevHash,
  });
  const hash = computeAuditHash(baseEntry);
  return Object.freeze({ ...baseEntry, hash });
}
