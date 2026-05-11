/**
 * `STRICT_FULL_GUARD` — the strict tier for tools sourced from
 * untrusted skills (DEC-153). Every region is hashed before and
 * after; on mismatch the guard returns `ok: false` so the caller can
 * roll back via the savepoint mechanism (the agent runtime in
 * Phase 12 owns the actual rollback wiring).
 *
 * The guard also enforces a **memory size budget**: if the total
 * snapshot bytes exceed `maxMemoryBytes` (default 200 KB per DEC-153)
 * the snapshot fails with `memory:guard:exceeded-budget` so the
 * caller knows to deny the tool execution and recommend
 * `memoryGuardTier: 'memory-aware'`.
 *
 * @packageDocumentation
 */

import { emitMemoryGuardAudit, type MemoryGuardActor } from './audit-emitter.js';
import { snapshotImpl, verifyImpl } from './audit-only-guard.js';
import type {
  GuardVerifyResult,
  MemoryModificationGuard,
  MemoryRegionReader,
  MemorySnapshot,
} from './types.js';
import { hashRegion } from './xxhash.js';

/**
 * Options for `createStrictFullGuard(...)`.
 *
 * @stable
 */
export interface StrictFullGuardOptions {
  /** Optional actor pointer surfaced through audit events. */
  readonly actor?: MemoryGuardActor;
  /** Hard ceiling on total snapshot bytes. Defaults to 200 KB per DEC-153. */
  readonly maxMemoryBytes?: number;
}

const DEFAULT_MAX_BYTES = 200 * 1024;

/**
 * Construct a `STRICT_FULL_GUARD`.
 *
 * @stable
 */
export function createStrictFullGuard(opts: StrictFullGuardOptions = {}): MemoryModificationGuard {
  const maxMemoryBytes = opts.maxMemoryBytes ?? DEFAULT_MAX_BYTES;

  return Object.freeze({
    tier: 'untrusted' as const,
    snapshot: async (reader: MemoryRegionReader): Promise<MemorySnapshot> => {
      const start = performance.now();
      const digest = [];
      let total = 0;
      for (const region of reader.regions) {
        const bytes = await reader.read(region);
        const len = typeof bytes === 'string' ? Buffer.byteLength(bytes, 'utf8') : bytes.length;
        total += len;
        if (total > maxMemoryBytes) {
          emitMemoryGuardAudit({
            action: 'memory:guard:exceeded-budget',
            decision: 'denied',
            ts: Date.now(),
            tier: 'untrusted',
            regions: [region],
            ...(opts.actor ? { actor: opts.actor } : {}),
            metadata: Object.freeze({ totalBytes: total, maxMemoryBytes }),
          });
          throw new MemoryGuardBudgetExceededError(total, maxMemoryBytes);
        }
        digest.push({ region, hash: await hashRegion(bytes) });
      }
      const durationUs = (performance.now() - start) * 1_000;
      // Canonical "before" entry called out by DEC-153.
      emitMemoryGuardAudit({
        action: 'memory:modification:before',
        decision: 'success',
        ts: Date.now(),
        tier: 'untrusted',
        ...(opts.actor ? { actor: opts.actor } : {}),
        metadata: Object.freeze({
          regionCount: digest.length,
          regions: Object.freeze(digest.map((d) => d.region)),
          totalBytes: total,
          durationUs,
        }),
      });
      // Granular telemetry-friendly variant.
      emitMemoryGuardAudit({
        action: 'memory:guard:snapshot',
        decision: 'success',
        ts: Date.now(),
        tier: 'untrusted',
        ...(opts.actor ? { actor: opts.actor } : {}),
        metadata: Object.freeze({
          regionCount: digest.length,
          totalBytes: total,
          durationUs,
        }),
      });
      return Object.freeze({ digest: Object.freeze(digest), durationUs });
    },
    verify: async (pre: MemorySnapshot, reader: MemoryRegionReader): Promise<GuardVerifyResult> =>
      verifyImpl('untrusted', pre, reader, opts.actor, /* enforce= */ true),
  });
}

// Re-export the snapshot helper so the strict tier can extend it
// without circular imports in tests.
export { snapshotImpl };

/**
 * Raised by `STRICT_FULL_GUARD` when the total snapshot bytes exceed
 * the configured budget. Thrown from `snapshot(...)` so the caller
 * can deny the tool execution before the tool runs.
 *
 * @stable
 */
export class MemoryGuardBudgetExceededError extends Error {
  override readonly name = 'MemoryGuardBudgetExceededError';
  readonly kind = 'memory-guard-budget-exceeded';
  constructor(
    readonly observedBytes: number,
    readonly maxBytes: number,
  ) {
    super(`STRICT_FULL_GUARD: total snapshot bytes (${observedBytes}) exceed budget (${maxBytes})`);
  }
}
