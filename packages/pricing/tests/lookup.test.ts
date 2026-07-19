import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  _resetLookupWarningsForTesting,
  BUNDLED_SNAPSHOT,
  calculateCost,
  lookupPrice,
  setLookupWarnSink,
} from '../src/index.js';

describe('@graphorin/pricing - lookupPrice', () => {
  beforeEach(() => {
    _resetLookupWarningsForTesting();
    setLookupWarnSink(() => {});
  });
  afterEach(() => {
    _resetLookupWarningsForTesting();
  });

  it('returns the per-token price for known models', () => {
    const price = lookupPrice({
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
    });
    expect(price).not.toBeNull();
    expect(price?.inputUsdPerToken).toBeGreaterThan(0);
    expect(price?.outputUsdPerToken).toBeGreaterThan(price?.inputUsdPerToken ?? 0);
  });

  it('returns null + WARN-once for unknown models', () => {
    const sink = vi.fn<(line: string) => void>();
    setLookupWarnSink(sink);
    expect(lookupPrice({ provider: 'unknown', model: 'gpt-9' })).toBeNull();
    expect(lookupPrice({ provider: 'unknown', model: 'gpt-9' })).toBeNull();
    expect(sink).toHaveBeenCalledTimes(1);
  });

  it('falls back to a wildcard entry when present', () => {
    const local = lookupPrice({ provider: 'ollama', model: 'llama3' });
    expect(local).not.toBeNull();
    expect(local?.inputUsdPerToken).toBe(0);
  });

  it('exposes cached-read prices when the entry declares one', () => {
    const price = lookupPrice({ provider: 'openai', model: 'gpt-4o-2024-11-20' });
    expect(price?.cachedReadUsdPerToken).toBeGreaterThan(0);
  });

  it('reports the snapshot source on the result', () => {
    const price = lookupPrice({ provider: 'anthropic', model: 'claude-3-opus-20240229' });
    expect(price?.snapshotDate).toBe(BUNDLED_SNAPSHOT.snapshotDate);
    expect(price?.source).toBe(BUNDLED_SNAPSHOT.source);
  });

  it('honours the optional region filter when an entry declares one', async () => {
    const { computeEntriesDigest } = await import('../src/snapshot/bundled.js');
    const entries = [
      {
        provider: 'aws.bedrock',
        model: 'claude-3-5-sonnet',
        inputUsdPerToken: 3 / 1_000_000,
        outputUsdPerToken: 15 / 1_000_000,
        region: 'us-east-1',
      },
      {
        provider: 'aws.bedrock',
        model: 'claude-3-5-sonnet',
        inputUsdPerToken: 4 / 1_000_000,
        outputUsdPerToken: 18 / 1_000_000,
        region: 'eu-west-1',
      },
    ];
    const snapshot = {
      version: 'test',
      source: 'test',
      snapshotDate: '2026-04-30',
      currency: 'USD' as const,
      sha256: computeEntriesDigest(entries),
      entries,
    };
    const us = lookupPrice(
      { provider: 'aws.bedrock', model: 'claude-3-5-sonnet', region: 'us-east-1' },
      snapshot,
    );
    expect(us?.inputUsdPerToken).toBeCloseTo(3 / 1_000_000);
    const eu = lookupPrice(
      { provider: 'aws.bedrock', model: 'claude-3-5-sonnet', region: 'eu-west-1' },
      snapshot,
    );
    expect(eu?.inputUsdPerToken).toBeCloseTo(4 / 1_000_000);
  });
});

describe('@graphorin/pricing - calculateCost', () => {
  beforeEach(() => {
    _resetLookupWarningsForTesting();
    setLookupWarnSink(() => {});
  });

  it('multiplies the per-token price by the token counts', () => {
    const cost = calculateCost({
      provider: 'openai',
      model: 'gpt-4o-mini-2024-07-18',
      inputTokens: 1_000,
      outputTokens: 1_000,
    });
    expect(cost).not.toBeNull();
    expect(cost?.amount).toBeCloseTo((0.15 + 0.6) / 1_000, 6);
    expect(cost?.currency).toBe('USD');
  });

  it('returns null for unknown models', () => {
    const cost = calculateCost({
      provider: 'unknown',
      model: 'unknown',
      inputTokens: 1,
      outputTokens: 1,
    });
    expect(cost).toBeNull();
  });

  it('bills reasoning tokens at the output rate when no explicit reasoning price (PS-19)', () => {
    // gpt-4o-mini has an output rate of 0.6/Mtok and no reasoningUsdPerToken in
    // the bundle, so the documented fallback bills reasoning at the output rate.
    const cost = calculateCost({
      provider: 'openai',
      model: 'gpt-4o-mini-2024-07-18',
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 1_000,
    });
    expect(cost?.amount).toBeCloseTo(0.6 / 1_000, 9); // NOT $0
  });

  it('adds cached-read tokens at the cached rate without inflating input (PS-19)', () => {
    const price = lookupPrice({ provider: 'openai', model: 'gpt-4o-2024-11-20' });
    const cachedRate = price?.cachedReadUsdPerToken ?? 0;
    expect(cachedRate).toBeGreaterThan(0);
    const withCache = calculateCost({
      provider: 'openai',
      model: 'gpt-4o-2024-11-20',
      inputTokens: 1_000,
      outputTokens: 0,
      cachedReadTokens: 1_000,
    });
    const noCache = calculateCost({
      provider: 'openai',
      model: 'gpt-4o-2024-11-20',
      inputTokens: 1_000,
      outputTokens: 0,
    });
    // inputTokens is the NON-cached prompt; cached tokens add only the cached
    // rate - they are never also billed at the (higher) input rate.
    expect((withCache?.amount ?? 0) - (noCache?.amount ?? 0)).toBeCloseTo(cachedRate * 1_000, 12);
  });
});

describe('prompt-cache write pricing + date-suffix fallback (core-provider-02/03)', () => {
  beforeEach(() => {
    _resetLookupWarningsForTesting();
    setLookupWarnSink(() => {});
  });

  it('resolves a dated model id through its dateless alias entry', () => {
    const dated = lookupPrice({ provider: 'anthropic', model: 'claude-haiku-4-5-20251001' });
    const alias = lookupPrice({ provider: 'anthropic', model: 'claude-haiku-4-5' });
    expect(dated).not.toBeNull();
    expect(dated).toEqual(alias);
  });

  it('does NOT strip non-date suffixes', () => {
    // An 8-digit-suffix regex must not eat version-ish tails like -20b.
    expect(lookupPrice({ provider: 'anthropic', model: 'claude-unknown-20b' })).toBeNull();
  });

  it('bills cacheWriteTokens at cacheWriteUsdPerToken when the entry declares one', () => {
    const price = lookupPrice({ provider: 'anthropic', model: 'claude-sonnet-4-5' });
    expect(price?.cacheWriteUsdPerToken).toBeDefined();
    const base = calculateCost({
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      inputTokens: 1_000,
      outputTokens: 0,
    });
    const withWrite = calculateCost({
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      inputTokens: 1_000,
      outputTokens: 0,
      cacheWriteTokens: 1_000,
    });
    const writeRate = price?.cacheWriteUsdPerToken ?? 0;
    expect((withWrite?.amount ?? 0) - (base?.amount ?? 0)).toBeCloseTo(writeRate * 1_000, 12);
    // Anthropic write premium is 1.25x input.
    const inputRate = price?.inputUsdPerToken ?? 0;
    expect(writeRate).toBeCloseTo(inputRate * 1.25, 15);
  });

  it('falls back to the input rate for cache writes when the entry has no write price', () => {
    // gpt-5 has cachedRead but no cacheWrite (OpenAI does not bill writes).
    const price = lookupPrice({ provider: 'openai', model: 'gpt-5' });
    expect(price?.cacheWriteUsdPerToken).toBeUndefined();
    const base = calculateCost({
      provider: 'openai',
      model: 'gpt-5',
      inputTokens: 0,
      outputTokens: 0,
    });
    const withWrite = calculateCost({
      provider: 'openai',
      model: 'gpt-5',
      inputTokens: 0,
      outputTokens: 0,
      cacheWriteTokens: 2_000,
    });
    const inputRate = price?.inputUsdPerToken ?? 0;
    expect((withWrite?.amount ?? 0) - (base?.amount ?? 0)).toBeCloseTo(inputRate * 2_000, 12);
  });

  it('falls back to the input rate for cached reads when the entry has no read price (PROVIDER-01)', () => {
    // mistral-large declares an input rate but no cachedReadUsdPerToken; the
    // documented fallback bills cached reads at the full input rate (never $0),
    // mirroring the cache-write leg.
    const price = lookupPrice({ provider: 'mistral', model: 'mistral-large-2411' });
    expect(price?.cachedReadUsdPerToken).toBeUndefined();
    const base = calculateCost({
      provider: 'mistral',
      model: 'mistral-large-2411',
      inputTokens: 0,
      outputTokens: 0,
    });
    const withCachedRead = calculateCost({
      provider: 'mistral',
      model: 'mistral-large-2411',
      inputTokens: 0,
      outputTokens: 0,
      cachedReadTokens: 2_000,
    });
    const inputRate = price?.inputUsdPerToken ?? 0;
    expect(inputRate).toBeGreaterThan(0);
    const delta = (withCachedRead?.amount ?? 0) - (base?.amount ?? 0);
    expect(delta).toBeCloseTo(inputRate * 2_000, 12);
    expect(delta).toBeGreaterThan(0); // NOT $0
  });
});

describe('W-045 - Cost.amount units pin (whole dollars, never minor units)', () => {
  it('one million input tokens at $5/Mtok cost exactly 5 (dollars, not 500 cents)', () => {
    const cost = calculateCost({
      provider: 'anthropic',
      model: 'claude-opus-4-5',
      inputTokens: 1_000_000,
      outputTokens: 0,
    });
    expect(cost).toEqual({ amount: 5, currency: 'USD' });
  });

  it('a typical single call is a fraction of a dollar (sub-cent figures expected)', () => {
    const cost = calculateCost({
      provider: 'anthropic',
      model: 'claude-opus-4-5',
      inputTokens: 1_000,
      outputTokens: 0,
    });
    expect(cost?.amount).toBeCloseTo(0.005, 10);
  });
});

describe('deep retest 2026-07-19 P1-3 - GPT-5.6 family is priced', () => {
  it('resolves luna/terra/sol at the official standard short-context rates', () => {
    const luna = lookupPrice({ provider: 'openai', model: 'gpt-5.6-luna' });
    expect(luna?.inputUsdPerToken).toBeCloseTo(1 / 1_000_000, 12);
    expect(luna?.outputUsdPerToken).toBeCloseTo(6 / 1_000_000, 12);
    expect(luna?.cachedReadUsdPerToken).toBeCloseTo(0.1 / 1_000_000, 12);

    const terra = lookupPrice({ provider: 'openai', model: 'gpt-5.6-terra' });
    expect(terra?.inputUsdPerToken).toBeCloseTo(2.5 / 1_000_000, 12);
    expect(terra?.outputUsdPerToken).toBeCloseTo(15 / 1_000_000, 12);

    const sol = lookupPrice({ provider: 'openai', model: 'gpt-5.6-sol' });
    expect(sol?.inputUsdPerToken).toBeCloseTo(5 / 1_000_000, 12);
    expect(sol?.outputUsdPerToken).toBeCloseTo(30 / 1_000_000, 12);
  });
});
