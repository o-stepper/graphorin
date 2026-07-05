/**
 * Public types for the memory-modification guard subsystem.
 *
 * The guard sits between a tool and the long-lived memory store. Its
 * job is to confirm that the tool only mutated memory through the
 * sanctioned `ctx.memory.*` surface - not through a direct file or
 * SQL escape hatch - and to record any non-tool-mediated mutation.
 *
 * The guard is **tier-based** per DEC-153. The four tiers trade
 * runtime cost against attack-surface coverage; the framework default
 * (`'unknown'` → `AUDIT_ONLY_GUARD`) is a sub-millisecond audit-only
 * checkpoint.
 *
 * @packageDocumentation
 */

/**
 * Discriminator for memory-tier classification per DEC-153.
 *
 * @stable
 */
export type MemoryGuardTier =
  | 'pure'
  | 'side-effecting-no-memory'
  | 'memory-aware'
  | 'unknown'
  | 'untrusted';

/**
 * Snapshot a guard takes before / after a tool runs. Implementations
 * record the xxhash digest of the regions of memory the tool could
 * touch; the guard compares the after-snapshot against the
 * before-snapshot to detect non-tool-mediated mutation.
 *
 * @stable
 */
export interface MemorySnapshot {
  /** xxhash digest of every relevant region. Empty for `NO_GUARD`. */
  readonly digest: ReadonlyArray<{ readonly region: string; readonly hash: string }>;
  /** Total snapshot wall-clock duration in microseconds. */
  readonly durationUs: number;
}

/**
 * Result returned by `Guard.verify(...)`. The `ok` discriminator
 * matches the rest of the package so callers can switch uniformly.
 *
 * @stable
 */
export type GuardVerifyResult =
  | {
      readonly ok: true;
      readonly tier: MemoryGuardTier;
      readonly snapshot: MemorySnapshot;
      readonly verifyDurationUs: number;
    }
  | {
      readonly ok: false;
      readonly tier: MemoryGuardTier;
      readonly mismatched: ReadonlyArray<string>;
      readonly snapshot: MemorySnapshot;
      readonly verifyDurationUs: number;
    };

/**
 * Pluggable region reader. The host (the agent runtime, in Phase 12)
 * supplies a region reader that knows how to materialise a region as
 * raw bytes / a string for hashing.
 *
 * @stable
 */
export interface MemoryRegionReader {
  /** Stable list of region names the guard should snapshot. */
  readonly regions: ReadonlyArray<string>;
  /** Materialise the named region as bytes. */
  readonly read: (region: string) => Promise<Uint8Array | string>;
}

/**
 * Per-tool guard interface. Each tier returns its own implementation
 * via the `createGuard(...)` factory.
 *
 * @stable
 */
export interface MemoryModificationGuard {
  readonly tier: MemoryGuardTier;
  /** Snapshot the relevant regions before tool execution. */
  readonly snapshot: (reader: MemoryRegionReader) => Promise<MemorySnapshot>;
  /** Verify that the post-execution state matches the pre-execution snapshot. */
  readonly verify: (pre: MemorySnapshot, reader: MemoryRegionReader) => Promise<GuardVerifyResult>;
}
