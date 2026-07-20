/**
 * Branch coverage for `flattenUsageByModel` in `types/run.ts` - the
 * undefined input and the optional reasoning-token / cost spreads.
 */
import { describe, expect, it } from 'vitest';

import { flattenUsageByModel } from '../src/types/run.js';

describe('flattenUsageByModel', () => {
  it('returns an empty list for an absent map', () => {
    expect(flattenUsageByModel(undefined)).toEqual([]);
  });

  it('maps entries and keeps only supplied optional fields', () => {
    const rows = flattenUsageByModel({
      'model-a': {
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
        attemptCount: 2,
      },
      'model-b': {
        promptTokens: 1,
        completionTokens: 1,
        totalTokens: 2,
        attemptCount: 1,
        reasoningTokens: 7,
        cost: { amount: 0.25, currency: 'USD' },
      },
    });
    expect(rows).toHaveLength(2);
    const a = rows.find((r) => r.modelId === 'model-a');
    expect(a).toEqual({
      modelId: 'model-a',
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
      callCount: 2,
    });
    const b = rows.find((r) => r.modelId === 'model-b');
    expect(b?.reasoningTokens).toBe(7);
    expect(b?.cost).toEqual({ amount: 0.25, currency: 'USD' });
  });
});
