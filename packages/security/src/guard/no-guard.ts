/**
 * `NO_GUARD` — pass-through guard for `'pure'` and
 * `'side-effecting-no-memory'` tools per DEC-153.
 *
 * The implementation is intentionally trivial: it returns an empty
 * snapshot and immediately succeeds on `verify(...)`. Zero overhead
 * (well, one function call + one allocation per call).
 *
 * @packageDocumentation
 */

import type {
  GuardVerifyResult,
  MemoryModificationGuard,
  MemoryRegionReader,
  MemorySnapshot,
} from './types.js';

const EMPTY_DIGEST = Object.freeze<MemorySnapshot['digest']>([]);

/**
 * Construct a `NO_GUARD` guard for the supplied tier (either
 * `'pure'` or `'side-effecting-no-memory'`).
 *
 * @stable
 */
export function createNoGuard(tier: 'pure' | 'side-effecting-no-memory'): MemoryModificationGuard {
  return Object.freeze({
    tier,
    snapshot: async (_reader: MemoryRegionReader): Promise<MemorySnapshot> =>
      Object.freeze({ digest: EMPTY_DIGEST, durationUs: 0 }),
    verify: async (
      pre: MemorySnapshot,
      _reader: MemoryRegionReader,
    ): Promise<GuardVerifyResult> => ({
      ok: true,
      tier,
      snapshot: pre,
      verifyDurationUs: 0,
    }),
  });
}
