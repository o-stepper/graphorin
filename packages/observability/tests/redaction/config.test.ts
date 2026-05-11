import { describe, expect, it } from 'vitest';

import { DEFAULT_VALIDATION_CONFIG } from '../../src/redaction/index.js';

describe('@graphorin/observability/redaction — DEFAULT_VALIDATION_CONFIG', () => {
  it('defaults minTier to public (default-deny non-public)', () => {
    expect(DEFAULT_VALIDATION_CONFIG.minTier).toBe('public');
  });

  it('failOnUnredactedSensitive is false by default (drop + warn in production)', () => {
    expect(DEFAULT_VALIDATION_CONFIG.failOnUnredactedSensitive).toBe(false);
  });

  it('the default object is frozen', () => {
    expect(Object.isFrozen(DEFAULT_VALIDATION_CONFIG)).toBe(true);
  });
});
