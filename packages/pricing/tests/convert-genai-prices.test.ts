/**
 * W-097: converter from the @pydantic/genai-prices dataset shape into
 * graphorin-native ModelPrice entries. The fixture is a vendored,
 * minimal sample of the published shape (no network - the no-network
 * gate applies).
 */
import { describe, expect, it } from 'vitest';
import { convertGenaiPrices, isGenaiPricesShape } from '../src/index.js';

const FIXTURE = {
  providers: [
    {
      id: 'anthropic',
      name: 'Anthropic',
      models: [
        {
          id: 'claude-sonnet-4-5',
          prices: {
            input_mtok: 3,
            output_mtok: 15,
            cache_read_mtok: 0.3,
            cache_write_mtok: 3.75,
          },
        },
        {
          id: 'tiered-model',
          // Conditional / time-tiered pricing - unrepresentable, skipped.
          prices: [
            { input_mtok: 1, output_mtok: 2 },
            { input_mtok: 3, output_mtok: 4 },
          ],
        },
      ],
    },
    {
      id: 'openai',
      models: [
        { id: 'gpt-5.2', prices: { input_mtok: 1.25, output_mtok: 10 } },
        // Single-record array form is usable.
        { id: 'single-array', prices: [{ input_mtok: 2, output_mtok: 4 }] },
        // Missing output price - skipped.
        { id: 'no-output', prices: { input_mtok: 1 } },
      ],
    },
  ],
};

describe('W-097 - convertGenaiPrices', () => {
  it('detects the dataset shape structurally', () => {
    expect(isGenaiPricesShape(FIXTURE)).toBe(true);
    expect(isGenaiPricesShape({ entries: [] })).toBe(false);
    expect(isGenaiPricesShape([])).toBe(false);
    expect(isGenaiPricesShape(null)).toBe(false);
  });

  it('converts per-Mtok figures to per-token USD, including the cache legs', () => {
    const { entries, skipped } = convertGenaiPrices(FIXTURE);
    expect(skipped).toBe(2);
    expect(entries).toHaveLength(3);
    const sonnet = entries.find((e) => e.model === 'claude-sonnet-4-5');
    expect(sonnet).toEqual({
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      inputUsdPerToken: 3 / 1_000_000,
      outputUsdPerToken: 15 / 1_000_000,
      cachedReadUsdPerToken: 0.3 / 1_000_000,
      cacheWriteUsdPerToken: 3.75 / 1_000_000,
    });
    const gpt = entries.find((e) => e.model === 'gpt-5.2');
    expect(gpt?.inputUsdPerToken).toBeCloseTo(1.25e-6, 12);
    expect(gpt?.cachedReadUsdPerToken).toBeUndefined();
    expect(entries.find((e) => e.model === 'single-array')?.outputUsdPerToken).toBe(4e-6);
  });

  it('rejects garbage instead of guessing', () => {
    expect(() => convertGenaiPrices({ entries: [] })).toThrow(/does not match/);
    expect(() => convertGenaiPrices('nope')).toThrow(/does not match/);
  });
});
