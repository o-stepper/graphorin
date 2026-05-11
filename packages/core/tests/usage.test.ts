import { describe, expect, it } from 'vitest';

import { zeroUsage } from '../src/types/usage.js';

describe('zeroUsage', () => {
  it('returns a zeroed Usage record', () => {
    expect(zeroUsage()).toEqual({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    });
  });

  it('returns a fresh object on every call', () => {
    const a = zeroUsage();
    const b = zeroUsage();
    expect(a).not.toBe(b);
  });
});
