/**
 * Coverage for the reasoning-retention precedence resolver.
 */
import { describe, expect, it } from 'vitest';

import {
  REASONING_RETENTION_DEFAULTS,
  resolveReasoningRetention,
} from '../../src/reasoning/retention.js';

describe('resolveReasoningRetention', () => {
  it('returns the explicit per-request value when supplied', () => {
    expect(
      resolveReasoningRetention({
        requested: 'pass-through-claude',
        overridden: 'strip',
        contract: 'hidden',
      }),
    ).toBe('pass-through-claude');
  });

  it('returns the createProvider() override when no request override is supplied', () => {
    expect(
      resolveReasoningRetention({ overridden: 'pass-through-claude', contract: 'hidden' }),
    ).toBe('pass-through-claude');
  });

  it('falls back to the contract-driven default when neither override is set', () => {
    expect(resolveReasoningRetention({ contract: 'hidden' })).toBe('strip');
    expect(resolveReasoningRetention({ contract: 'round-trip-required' })).toBe(
      'pass-through-claude',
    );
    expect(resolveReasoningRetention({ contract: 'optional' })).toBe('strip');
  });

  it('falls back to "strip" when nothing is supplied', () => {
    expect(resolveReasoningRetention({})).toBe('strip');
  });

  it('exposes a frozen defaults table with one entry per ReasoningContract', () => {
    expect(REASONING_RETENTION_DEFAULTS.hidden).toBe('strip');
    expect(REASONING_RETENTION_DEFAULTS['round-trip-required']).toBe('pass-through-claude');
    expect(REASONING_RETENTION_DEFAULTS.optional).toBe('strip');
    expect(Object.isFrozen(REASONING_RETENTION_DEFAULTS)).toBe(true);
  });
});
