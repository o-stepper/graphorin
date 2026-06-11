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
 * Default reporter for an audit-bridge write that failed and would
 * otherwise be silently dropped (SPL-4). The four bridges
 * (secrets / oauth / memory-guard / supply-chain) all accept an
 * optional `onWriteError`; when the consumer does not supply one, the
 * failure must still be visible rather than swallowed — a dropped audit
 * entry is a security-relevant loss. Emits a single `console.warn` so
 * an under-configured deployment surfaces the drop in its logs.
 *
 * @stable
 */
export function reportDroppedAuditWrite(source: string, error: unknown): void {
  console.warn(
    `[graphorin/security] audit ${source} write failed; entry dropped (configure onWriteError to handle this):`,
    error,
  );
}

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
 * Per-`AuditDb` write-serialisation chains (SPL-4). `appendAudit` does
 * a read-modify-write — `latest()` to read the tip `seq`/`hash`, then
 * `insert()` — with an `await` point between the two. Without
 * serialisation, concurrent callers (the secrets/oauth/memory-guard/
 * supply-chain bridges plus the server's per-request audit middleware
 * and replay routes all share one handle) read the same tip, compute
 * the same `seq`, and the UNIQUE `seq` primary key rejects all but one
 * — a silently-dropped audit entry. Because the chain hashes each entry
 * to its predecessor (`prevHash`), a transactional `seq` alone is not
 * enough: the whole `latest()`→`insert()` critical section must run one
 * at a time per handle. A `WeakMap` keyed on the handle means a closed/
 * discarded `AuditDb` drops its chain with no manual cleanup.
 */
const WRITE_CHAINS = new WeakMap<AuditDb, Promise<unknown>>();

/**
 * Append a single audit entry. The function is `async` so it can run
 * the canonical-JSON serializer + SHA-256 in a worker pool in a
 * future revision; today it is synchronous on the inside.
 *
 * Concurrent calls against the same `AuditDb` are serialised so the
 * `latest()`→`insert()` read-modify-write never races (SPL-4).
 *
 * @stable
 */
export async function appendAudit(db: AuditDb, input: AuditEntryInput): Promise<StoredAuditEntry> {
  // Splice this append onto the tail of the handle's write chain. The
  // get→set pair runs synchronously (no `await` between), so it is
  // atomic on the single JS thread and two concurrent callers cannot
  // observe the same tail. A failed prior write must not wedge the
  // queue, so the next link runs regardless of how the previous settled.
  const tail = WRITE_CHAINS.get(db) ?? Promise.resolve();
  const run = tail.then(
    () => appendAuditUnsynchronized(db, input),
    () => appendAuditUnsynchronized(db, input),
  );
  WRITE_CHAINS.set(
    db,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );
  return run;
}

async function appendAuditUnsynchronized(
  db: AuditDb,
  input: AuditEntryInput,
): Promise<StoredAuditEntry> {
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
