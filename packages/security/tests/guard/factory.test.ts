import { describe, expect, it } from 'vitest';

import { createGuard, guardVariantForTier } from '../../src/guard/factory.js';

describe('createGuard', () => {
  it("returns a NO_GUARD for 'pure'", () => {
    const guard = createGuard({ tier: 'pure' });
    expect(guard.tier).toBe('pure');
  });

  it("returns a NO_GUARD for 'side-effecting-no-memory'", () => {
    const guard = createGuard({ tier: 'side-effecting-no-memory' });
    expect(guard.tier).toBe('side-effecting-no-memory');
  });

  it("returns an API_BOUNDARY_GUARD for 'memory-aware'", () => {
    const guard = createGuard({
      tier: 'memory-aware',
      allowedOps: ['session.append'],
      observedOps: () => [],
    });
    expect(guard.tier).toBe('memory-aware');
  });

  it("returns an AUDIT_ONLY_GUARD for 'unknown'", () => {
    const guard = createGuard({ tier: 'unknown' });
    expect(guard.tier).toBe('unknown');
  });

  it("returns a STRICT_FULL_GUARD for 'untrusted'", () => {
    const guard = createGuard({ tier: 'untrusted' });
    expect(guard.tier).toBe('untrusted');
  });
});

describe('guardVariantForTier', () => {
  it('maps each tier to the canonical variant identifier', () => {
    expect(guardVariantForTier('pure')).toBe('NO_GUARD');
    expect(guardVariantForTier('side-effecting-no-memory')).toBe('NO_GUARD');
    expect(guardVariantForTier('memory-aware')).toBe('API_BOUNDARY_GUARD');
    expect(guardVariantForTier('unknown')).toBe('AUDIT_ONLY_GUARD');
    expect(guardVariantForTier('untrusted')).toBe('STRICT_FULL_GUARD');
  });
});
