/**
 * core-provider-03 release gate: every model family the tier classifier
 * recognises must either resolve a price in the bundled pricing snapshot
 * or be explicitly listed as known-unpriced. Without this cross-check the
 * two catalogues drift apart silently and cost tracking no-ops for every
 * current model (the state the 2026-07 audit found).
 */
import {
  _resetLookupWarningsForTesting,
  BUNDLED_SNAPSHOT,
  lookupPrice,
  setLookupWarnSink,
} from '@graphorin/pricing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { classifyModelTier } from '../../src/model-tier/classify.js';

/**
 * One representative CURRENT model id per classifier family. Dated ids
 * exercise the lookup's date-suffix fallback on purpose.
 */
const REPRESENTATIVE_MODELS: ReadonlyArray<{ provider: string; model: string }> = [
  { provider: 'anthropic', model: 'claude-opus-4-5' },
  { provider: 'anthropic', model: 'claude-sonnet-4-5' },
  { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },
  { provider: 'anthropic', model: 'claude-fable-5' },
  { provider: 'anthropic', model: 'claude-mythos-5' },
  { provider: 'openai', model: 'gpt-5' },
  { provider: 'openai', model: 'gpt-5-mini' },
  { provider: 'openai', model: 'gpt-5-nano' },
  { provider: 'openai', model: 'gpt-4.1' },
  { provider: 'openai', model: 'o3' },
  { provider: 'openai', model: 'o4-mini' },
  { provider: 'google', model: 'gemini-2.5-pro' },
  { provider: 'google', model: 'gemini-2.5-flash' },
];

/**
 * Models the classifier knows whose public pricing was NOT verifiable at
 * snapshot time. Each entry here is a documented, deliberate gap: cost
 * tracking reports null + one WARN for them until an operator refreshes
 * the snapshot. Shrink this list — never let a model silently join it
 * (a lookup miss NOT listed here fails the gate).
 */
const KNOWN_UNPRICED: ReadonlySet<string> = new Set([
  // Claude 5 family: released after the 2026-07-04 snapshot's verified
  // pricing sources; add entries via refreshPricing / a snapshot bump.
  'anthropic/claude-fable-5',
  'anthropic/claude-mythos-5',
]);

describe('pricing snapshot coverage vs model-tier classifier (core-provider-03)', () => {
  beforeAll(() => {
    setLookupWarnSink(() => undefined);
  });
  afterAll(() => {
    setLookupWarnSink((line) => console.warn(line));
    _resetLookupWarningsForTesting();
  });

  for (const { provider, model } of REPRESENTATIVE_MODELS) {
    const key = `${provider}/${model}`;
    it(`covers ${key} (priced or explicitly known-unpriced)`, () => {
      // Guard the fixture itself: every representative id must be one the
      // classifier actually recognises, otherwise the gate tests nothing.
      const tier = classifyModelTier({ name: provider, modelId: model });
      expect(tier, `classifier no longer recognises ${key}`).toBeDefined();

      const price = lookupPrice({ provider, model }, BUNDLED_SNAPSHOT);
      if (KNOWN_UNPRICED.has(key)) {
        expect(price, `${key} is listed KNOWN_UNPRICED but now has a price — remove it`).toBeNull();
      } else {
        expect(price, `${key} has no bundled price entry and is not KNOWN_UNPRICED`).not.toBeNull();
      }
    });
  }

  it('prices every KNOWN_UNPRICED entry nowhere else in the snapshot', () => {
    for (const key of KNOWN_UNPRICED) {
      const [provider, model] = key.split('/') as [string, string];
      const direct = BUNDLED_SNAPSHOT.entries.find(
        (e) => e.provider === provider && e.model === model,
      );
      expect(direct, `${key} unexpectedly present in the snapshot`).toBeUndefined();
    }
  });

  it('cache economics: every current anthropic entry carries both cache rates', () => {
    const current = BUNDLED_SNAPSHOT.entries.filter(
      (e) => e.provider === 'anthropic' && /^claude-(opus|sonnet|haiku)-4-/.test(e.model),
    );
    expect(current.length).toBeGreaterThanOrEqual(4);
    for (const entry of current) {
      expect(entry.cachedReadUsdPerToken, `${entry.model} missing cachedRead`).toBeDefined();
      expect(entry.cacheWriteUsdPerToken, `${entry.model} missing cacheWrite`).toBeDefined();
    }
  });
});
