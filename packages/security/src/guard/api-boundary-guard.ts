/**
 * `API_BOUNDARY_GUARD` - for `'memory-aware'` tools that declared
 * `allowedMemoryOps` in their definition. The guard does **not**
 * snapshot memory; instead it asserts that every `ctx.memory.*` call
 * the tool issued during execution belongs to the declared set.
 *
 * The recorder is supplied by the host (the agent runtime in
 * Phase 12). The guard receives a callable that returns the list of
 * `<scope>.<op>` calls observed during the surrounding execution
 * context. The guard fails verification when an unexpected operation
 * is observed.
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

const EMPTY_DIGEST = Object.freeze<MemorySnapshot['digest']>([]);

/**
 * Options for `createApiBoundaryGuard(...)`.
 *
 * @stable
 */
export interface ApiBoundaryGuardOptions {
  /** List of allowed `<scope>.<op>` operations. */
  readonly allowedOps: ReadonlyArray<string>;
  /**
   * Returns the list of `<scope>.<op>` operations observed during
   * the surrounding execution context. The host records each
   * `ctx.memory.*` call before it routes the call to the actual
   * memory store; the recorder is reset between snapshots.
   */
  readonly observedOps: () => ReadonlyArray<string>;
  /**
   * Optional actor pointer surfaced through audit events.
   */
  readonly actor?: MemoryGuardActor;
}

/**
 * Construct an `API_BOUNDARY_GUARD`.
 *
 * @stable
 */
export function createApiBoundaryGuard(opts: ApiBoundaryGuardOptions): MemoryModificationGuard {
  const allowed = new Set(opts.allowedOps);

  return Object.freeze({
    tier: 'memory-aware' as const,
    snapshot: async (_reader: MemoryRegionReader): Promise<MemorySnapshot> => {
      // No region snapshotting at this tier - the guard is purely
      // call-path-based. We still emit an audit event so the audit
      // chain records that the guard was active for the run.
      emitMemoryGuardAudit({
        action: 'memory:guard:snapshot',
        decision: 'success',
        ts: Date.now(),
        tier: 'memory-aware',
        ...(opts.actor ? { actor: opts.actor } : {}),
      });
      return Object.freeze({ digest: EMPTY_DIGEST, durationUs: 0 });
    },
    verify: async (
      pre: MemorySnapshot,
      _reader: MemoryRegionReader,
    ): Promise<GuardVerifyResult> => {
      const start = performance.now();
      const observed = opts.observedOps();
      const violations = observed.filter((op) => !allowed.has(op));
      const verifyDurationUs = (performance.now() - start) * 1_000;
      if (violations.length === 0) {
        emitMemoryGuardAudit({
          action: 'memory:guard:verified',
          decision: 'success',
          ts: Date.now(),
          tier: 'memory-aware',
          ...(opts.actor ? { actor: opts.actor } : {}),
          metadata: Object.freeze({ observed }),
        });
        return {
          ok: true,
          tier: 'memory-aware',
          snapshot: pre,
          verifyDurationUs,
        };
      }
      emitMemoryGuardAudit({
        action: 'memory:guard:mismatch',
        decision: 'denied',
        ts: Date.now(),
        tier: 'memory-aware',
        regions: violations,
        ...(opts.actor ? { actor: opts.actor } : {}),
        metadata: Object.freeze({ observed }),
      });
      return {
        ok: false,
        tier: 'memory-aware',
        mismatched: Object.freeze([...violations]),
        snapshot: pre,
        verifyDurationUs,
      };
    },
  });
}
