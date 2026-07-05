import type { ProviderError, ProviderErrorKind } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { isAgentFallbackEligible } from '../src/fallback/index.js';

const make = (kind: ProviderErrorKind): ProviderError => ({
  kind,
  message: `simulated ${kind}`,
});

describe('isAgentFallbackEligible - default policy', () => {
  it('flags rate-limit / capacity / context-length as eligible by default', () => {
    expect(isAgentFallbackEligible(make('rate-limit')).eligible).toBe(true);
    expect(isAgentFallbackEligible(make('capacity')).eligible).toBe(true);
    expect(isAgentFallbackEligible(make('context-length')).eligible).toBe(true);
  });

  it('treats transient as ineligible by default', () => {
    expect(isAgentFallbackEligible(make('transient')).eligible).toBe(false);
  });

  it('returns the matching reason taxonomy', () => {
    expect(isAgentFallbackEligible(make('rate-limit')).reason).toBe('rate-limit');
    expect(isAgentFallbackEligible(make('capacity')).reason).toBe('capacity');
    expect(isAgentFallbackEligible(make('context-length')).reason).toBe('context-length');
  });

  it('rejects auth / invalid-input / content-filter / unknown', () => {
    for (const kind of ['unauthorized', 'invalid-request', 'content-filter', 'unknown'] as const) {
      expect(isAgentFallbackEligible(make(kind)).eligible).toBe(false);
    }
  });
});

describe('isAgentFallbackEligible - operator policy overrides', () => {
  it('flips rate-limit to ineligible when policy disables it', () => {
    expect(isAgentFallbackEligible(make('rate-limit'), { rateLimitEligible: false }).eligible).toBe(
      false,
    );
  });

  it('opt-in transient eligibility', () => {
    expect(isAgentFallbackEligible(make('transient'), { transientEligible: true }).eligible).toBe(
      true,
    );
  });
});
