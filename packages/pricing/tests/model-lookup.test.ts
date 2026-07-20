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

  it('prices the gpt-4o-mini alias (deep-retest 0.13.8 P1)', () => {
    expect(priceLookupByModel({ modelId: 'gpt-4o-mini' })).toEqual({
      inputPerMtok: 0.15,
      outputPerMtok: 0.6,
      cachedReadPerMtok: 0.075,
    });
  });

  it('falls back from a dashed-date id to its dateless alias (deep-retest 0.13.8 P1)', () => {
    const dated = priceLookupByModel({ modelId: 'gpt-4.1-mini-2025-04-14' });
    const alias = priceLookupByModel({ modelId: 'gpt-4.1-mini' });
    expect(dated).not.toBeNull();
    expect(dated).toEqual(alias);
  });

  it('resolves -latest ids like lookupPrice does', () => {
    const viaAnchor = priceLookupByModel({ modelId: 'claude-haiku-4-5-latest' });
    expect(viaAnchor).toEqual(priceLookupByModel({ modelId: 'claude-haiku-4-5' }));
    const viaSingleDated = priceLookupByModel({ modelId: 'claude-3-5-sonnet-latest' });
    expect(viaSingleDated).toEqual(priceLookupByModel({ modelId: 'claude-3-5-sonnet-20241022' }));
    expect(viaSingleDated).not.toBeNull();
    expect(priceLookupByModel({ modelId: 'never-heard-of-it-latest' })).toBeNull();
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
