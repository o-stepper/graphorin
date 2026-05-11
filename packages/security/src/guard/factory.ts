/**
 * `createGuard(...)` — pick the guard implementation that matches a
 * tier. Mirrors the dispatch table from DEC-153.
 *
 * @packageDocumentation
 */

import { type ApiBoundaryGuardOptions, createApiBoundaryGuard } from './api-boundary-guard.js';
import { type AuditOnlyGuardOptions, createAuditOnlyGuard } from './audit-only-guard.js';
import { createNoGuard } from './no-guard.js';
import { createStrictFullGuard, type StrictFullGuardOptions } from './strict-full-guard.js';
import type { MemoryGuardTier, MemoryModificationGuard } from './types.js';

/**
 * Tier-tagged options union. `'memory-aware'` requires the call-path
 * recorder; the other tiers only take optional metadata.
 *
 * @stable
 */
export type CreateGuardOptions =
  | { readonly tier: 'pure' }
  | { readonly tier: 'side-effecting-no-memory' }
  | ({ readonly tier: 'memory-aware' } & ApiBoundaryGuardOptions)
  | ({ readonly tier: 'unknown' } & AuditOnlyGuardOptions)
  | ({ readonly tier: 'untrusted' } & StrictFullGuardOptions);

/**
 * Construct a guard for the supplied tier.
 *
 * @stable
 */
export function createGuard(opts: CreateGuardOptions): MemoryModificationGuard {
  switch (opts.tier) {
    case 'pure':
      return createNoGuard('pure');
    case 'side-effecting-no-memory':
      return createNoGuard('side-effecting-no-memory');
    case 'memory-aware':
      return createApiBoundaryGuard(opts);
    case 'unknown':
      return createAuditOnlyGuard(opts);
    case 'untrusted':
      return createStrictFullGuard(opts);
    default: {
      const exhaustive: never = opts;
      throw new Error(`createGuard: unknown tier ${(exhaustive as { tier: string }).tier}`);
    }
  }
}

/**
 * Look up the guard variant identifier for a tier. Useful for
 * structured logging.
 *
 * @stable
 */
export function guardVariantForTier(
  tier: MemoryGuardTier,
): 'NO_GUARD' | 'API_BOUNDARY_GUARD' | 'AUDIT_ONLY_GUARD' | 'STRICT_FULL_GUARD' {
  switch (tier) {
    case 'pure':
    case 'side-effecting-no-memory':
      return 'NO_GUARD';
    case 'memory-aware':
      return 'API_BOUNDARY_GUARD';
    case 'unknown':
      return 'AUDIT_ONLY_GUARD';
    case 'untrusted':
      return 'STRICT_FULL_GUARD';
    default: {
      const exhaustive: never = tier;
      throw new Error(`guardVariantForTier: unknown tier ${exhaustive as string}`);
    }
  }
}
