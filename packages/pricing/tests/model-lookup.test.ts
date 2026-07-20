/**
 * Coverage for `priceLookupByModel` - the vendor-agnostic model-id
 * lookup the eval harnesses feed to `withCostTracking` so
 * `--max-cost-usd` can actually observe spend (deep-retest-0.13.6
 * P2-4).
 */
import { describe, expect, it } from 'vitest';

import { priceLookupByModel } from '../src/index.js';

describe('priceLookupByModel', () => {
  it('resolves an exact model id to per-Mtok rates regardless of vendor', () => {
    const rates = priceLookupByModel({ modelId: 'gpt-5.6-luna' });
    expect(rates).toEqual({
      inputPerMtok: 1,
      outputPerMtok: 6,
      cachedReadPerMtok: 0.1,
      cacheWritePerMtok: 1.25,
    });
  });

  it('falls back from a dated id to its dateless alias', () => {
    const dated = priceLookupByModel({ modelId: 'claude-haiku-4-5-20251001' });
    const alias = priceLookupByModel({ modelId: 'claude-haiku-4-5' });
    expect(dated).not.toBeNull();
    expect(dated).toEqual(alias);
  });

  it('returns null for unknown models so accumulators keep honest zeros', () => {
    expect(priceLookupByModel({ modelId: 'totally-unknown-model' })).toBeNull();
  });

  it('ignores the extra providerName the middleware passes (drop-in contract)', () => {
    const asMiddlewareLookup: (info: {
      readonly providerName: string;
      readonly modelId: string;
    }) => unknown = priceLookupByModel;
    expect(
      asMiddlewareLookup({ providerName: 'openai-compatible-x', modelId: 'gpt-5.6-luna' }),
    ).not.toBeNull();
  });
});
