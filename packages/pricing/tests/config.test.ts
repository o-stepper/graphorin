import { describe, expect, it } from 'vitest';

import { DEFAULT_PRICING_AUTO_REFRESH } from '../src/index.js';

describe('@graphorin/pricing — pricing.autoRefresh defaults', () => {
  it('enabled is hardcoded false in v0.1', () => {
    expect(DEFAULT_PRICING_AUTO_REFRESH.enabled).toBe(false);
  });

  it('default is frozen so consumers cannot mutate the catalogue', () => {
    expect(Object.isFrozen(DEFAULT_PRICING_AUTO_REFRESH)).toBe(true);
  });

  it('declares a suggested intervalHours for v0.2+', () => {
    expect(DEFAULT_PRICING_AUTO_REFRESH.intervalHours).toBeGreaterThan(0);
  });
});
