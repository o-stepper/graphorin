/**
 * `AUDIT_ONLY_GUARD` — the framework default for `'unknown'` tools
 * per DEC-153. Hashes every region declared by the reader before and
 * after the tool runs; on mismatch it emits a
 * `memory:guard:mismatch` audit event but does **not** roll back.
 *
 * The performance budget per DEC-153 is < 3 ms p95 for the snapshot +
 * verify cycle on session-scope regions.
 *
 * @packageDocumentation
 */

import { emitMemoryGuardAudit, type MemoryGuardActor } from './audit-emitter.js';
import type {
  GuardVerifyResult,
  MemoryModificationGuard,
  MemoryRegionReader,
  MemorySnapshot,
} from './types.js';
import { hashRegion } from './xxhash.js';

/**
 * Options for `createAuditOnlyGuard(...)`.
 *
 * @stable
 */
export interface AuditOnlyGuardOptions {
  /** Optional actor pointer surfaced through audit events. */
  readonly actor?: MemoryGuardActor;
}

/**
 * Construct an `AUDIT_ONLY_GUARD`.
 *
 * @stable
 */
export function createAuditOnlyGuard(opts: AuditOnlyGuardOptions = {}): MemoryModificationGuard {
  return Object.freeze({
    tier: 'unknown' as const,
    snapshot: async (reader: MemoryRegionReader): Promise<MemorySnapshot> =>
      snapshotImpl('unknown', reader, opts.actor),
    verify: async (pre: MemorySnapshot, reader: MemoryRegionReader): Promise<GuardVerifyResult> =>
      verifyImpl('unknown', pre, reader, opts.actor, /* enforce= */ false),
  });
}

/**
 * Internal snapshot implementation reused by `STRICT_FULL_GUARD`.
 *
 * @internal
 */
export async function snapshotImpl(
  tier: 'unknown' | 'untrusted',
  reader: MemoryRegionReader,
  actor?: MemoryGuardActor,
): Promise<MemorySnapshot> {
  const start = performance.now();
  const digest = [];
  for (const region of reader.regions) {
    const bytes = await reader.read(region);
    digest.push({ region, hash: await hashRegion(bytes) });
  }
  const durationUs = (performance.now() - start) * 1_000;
  // Canonical "before" entry called out by DEC-153 (the
  // memory.modification.{before,after} pair).
  emitMemoryGuardAudit({
    action: 'memory:modification:before',
    decision: 'success',
    ts: Date.now(),
    tier,
    ...(actor ? { actor } : {}),
    metadata: Object.freeze({
      regionCount: digest.length,
      regions: Object.freeze(digest.map((d) => d.region)),
      durationUs,
    }),
  });
  // Granular telemetry-friendly variant.
  emitMemoryGuardAudit({
    action: 'memory:guard:snapshot',
    decision: 'success',
    ts: Date.now(),
    tier,
    ...(actor ? { actor } : {}),
    metadata: Object.freeze({ regionCount: digest.length, durationUs }),
  });
  return Object.freeze({ digest: Object.freeze(digest), durationUs });
}

/**
 * Internal verify implementation reused by `STRICT_FULL_GUARD`. When
 * `enforce` is `true` the implementation returns `ok: false` on
 * mismatch (the caller rolls back); when `false` the verifier
 * returns `ok: true` so the AUDIT_ONLY tier never blocks tool
 * progress.
 *
 * @internal
 */
export async function verifyImpl(
  tier: 'unknown' | 'untrusted',
  pre: MemorySnapshot,
  reader: MemoryRegionReader,
  actor: MemoryGuardActor | undefined,
  enforce: boolean,
): Promise<GuardVerifyResult> {
  const start = performance.now();
  const post: Array<{ region: string; hash: string }> = [];
  const previousByRegion = new Map(pre.digest.map((d) => [d.region, d.hash]));
  const mismatched: string[] = [];
  for (const region of reader.regions) {
    const bytes = await reader.read(region);
    const hash = await hashRegion(bytes);
    post.push({ region, hash });
    const previous = previousByRegion.get(region);
    if (previous !== undefined && previous !== hash) mismatched.push(region);
  }
  const verifyDurationUs = (performance.now() - start) * 1_000;
  const snapshot: MemorySnapshot = Object.freeze({
    digest: Object.freeze(post),
    durationUs: verifyDurationUs,
  });

  // Canonical "after" entry called out by DEC-153. Always emitted
  // regardless of whether the digest changed, so SIEM dashboards can
  // pair it with the matching `memory:modification:before` row.
  emitMemoryGuardAudit({
    action: 'memory:modification:after',
    decision: mismatched.length === 0 ? 'success' : enforce ? 'denied' : 'success',
    ts: Date.now(),
    tier,
    ...(mismatched.length > 0 ? { regions: Object.freeze([...mismatched]) } : {}),
    ...(actor ? { actor } : {}),
    metadata: Object.freeze({
      mismatchCount: mismatched.length,
      regionCount: post.length,
      verifyDurationUs,
    }),
  });

  if (mismatched.length === 0) {
    emitMemoryGuardAudit({
      action: 'memory:guard:verified',
      decision: 'success',
      ts: Date.now(),
      tier,
      ...(actor ? { actor } : {}),
    });
    return { ok: true, tier, snapshot, verifyDurationUs };
  }

  emitMemoryGuardAudit({
    action: 'memory:guard:mismatch',
    decision: enforce ? 'denied' : 'success',
    ts: Date.now(),
    tier,
    regions: Object.freeze([...mismatched]),
    ...(actor ? { actor } : {}),
  });

  if (!enforce) {
    return { ok: true, tier, snapshot, verifyDurationUs };
  }
  return {
    ok: false,
    tier,
    mismatched: Object.freeze([...mismatched]),
    snapshot,
    verifyDurationUs,
  };
}
