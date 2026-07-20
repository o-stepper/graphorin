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

  it('surfaces the upstream pricing authorities alongside the artifact source', () => {
    const price = lookupPrice({ provider: 'anthropic', model: 'claude-3-opus-20240229' });
    expect(price?.upstreamSources).toEqual(BUNDLED_SNAPSHOT.upstreamSources);
    expect(BUNDLED_SNAPSHOT.upstreamSources?.length).toBeGreaterThan(0);
    // The artifact source and the upstream authorities are distinct links
    // in the provenance chain.
    expect(BUNDLED_SNAPSHOT.upstreamSources).not.toContain(BUNDLED_SNAPSHOT.source);
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

describe('deep-retest 0.13.8 P1 - alias rows, date formats, -latest', () => {
  beforeEach(() => {
    _resetLookupWarningsForTesting();
    setLookupWarnSink(() => {});
  });

  it('prices the official undated OpenAI aliases at their routing target rates', () => {
    const pairs = [
      ['gpt-4o', 'gpt-4o-2024-11-20'],
      ['gpt-4o-mini', 'gpt-4o-mini-2024-07-18'],
      ['o1', 'o1-2024-12-17'],
      ['o3-mini', 'o3-mini-2025-01-31'],
    ] as const;
    for (const [alias, dated] of pairs) {
      const aliasPrice = lookupPrice({ provider: 'openai', model: alias });
      const datedPrice = lookupPrice({ provider: 'openai', model: dated });
      expect(aliasPrice, `${alias} must be priced`).not.toBeNull();
      expect(aliasPrice, `${alias} must equal ${dated}`).toEqual(datedPrice);
    }
  });

  it('pins the alias/dated price-equality invariant across the whole snapshot', () => {
    // Every dated entry whose family also has a dateless row must carry the
    // SAME rates - an alias row is a routing statement, not a second price.
    for (const entry of BUNDLED_SNAPSHOT.entries) {
      const base = entry.model.replace(/-(?:\d{8}|\d{4}-\d{2}-\d{2})$/, '');
      if (base === entry.model) continue;
      const anchor = BUNDLED_SNAPSHOT.entries.find(
        (e) => e.provider === entry.provider && e.model === base,
      );
      if (anchor === undefined) continue;
      expect(anchor.inputUsdPerToken, `${base} vs ${entry.model} input`).toBe(
        entry.inputUsdPerToken,
      );
      expect(anchor.outputUsdPerToken, `${base} vs ${entry.model} output`).toBe(
        entry.outputUsdPerToken,
      );
      expect(anchor.cachedReadUsdPerToken, `${base} vs ${entry.model} cachedRead`).toBe(
        entry.cachedReadUsdPerToken,
      );
    }
  });

  it('strips dashed OpenAI-style date suffixes to the dateless entry', () => {
    // No exact row for this dated id - it must resolve through gpt-4.1-mini.
    const dated = lookupPrice({ provider: 'openai', model: 'gpt-4.1-mini-2025-04-14' });
    const anchor = lookupPrice({ provider: 'openai', model: 'gpt-4.1-mini' });
    expect(dated).not.toBeNull();
    expect(dated).toEqual(anchor);
  });

  it('resolves -latest through the dateless entry when the family has one', () => {
    const latest = lookupPrice({ provider: 'anthropic', model: 'claude-haiku-4-5-latest' });
    const anchor = lookupPrice({ provider: 'anthropic', model: 'claude-haiku-4-5' });
    expect(latest).not.toBeNull();
    expect(latest).toEqual(anchor);
  });

  it('resolves -latest to the single retained dated entry of a legacy family', () => {
    const latest = lookupPrice({ provider: 'anthropic', model: 'claude-3-5-sonnet-latest' });
    const dated = lookupPrice({ provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' });
    expect(latest).not.toBeNull();
    expect(latest).toEqual(dated);
  });

  it('stays null for -latest when the family has TWO dated snapshots (ambiguous)', async () => {
    const { computeEntriesDigest } = await import('../src/snapshot/bundled.js');
    const entries = [
      {
        provider: 'openai',
        model: 'gpt-x-2025-01-01',
        inputUsdPerToken: 1 / 1_000_000,
        outputUsdPerToken: 2 / 1_000_000,
      },
      {
        provider: 'openai',
        model: 'gpt-x-2025-06-01',
        inputUsdPerToken: 3 / 1_000_000,
        outputUsdPerToken: 4 / 1_000_000,
      },
    ];
    const snapshot = {
      version: 'test',
      source: 'test',
      snapshotDate: '2026-07-20',
      currency: 'USD' as const,
      sha256: computeEntriesDigest(entries),
      entries,
    };
    expect(lookupPrice({ provider: 'openai', model: 'gpt-x-latest' }, snapshot)).toBeNull();
  });

  it('does not resolve -latest through non-date suffixed rows', () => {
    // gemini-1.5-pro-002 is a build suffix, not a date - "latest" cannot
    // know what it bills as, so the honest answer stays null.
    expect(lookupPrice({ provider: 'google', model: 'gemini-1.5-pro-latest' })).toBeNull();
  });

  it('prices OpenAI embeddings on input only (zero output rate is the price)', () => {
    const small = lookupPrice({ provider: 'openai', model: 'text-embedding-3-small' });
    expect(small?.inputUsdPerToken).toBeCloseTo(0.02 / 1_000_000, 15);
    expect(small?.outputUsdPerToken).toBe(0);
    const large = lookupPrice({ provider: 'openai', model: 'text-embedding-3-large' });
    expect(large?.inputUsdPerToken).toBeCloseTo(0.13 / 1_000_000, 15);
    const cost = calculateCost({
      provider: 'openai',
      model: 'text-embedding-3-small',
      inputTokens: 1_000_000,
      outputTokens: 0,
    });
    expect(cost).toEqual({ amount: 0.02, currency: 'USD' });
  });
});

describe('GPT-5.6 family pricing', () => {
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

  it('carries the explicit cache-write premium (1.25x input) for all three variants', () => {
    const luna = lookupPrice({ provider: 'openai', model: 'gpt-5.6-luna' });
    expect(luna?.cacheWriteUsdPerToken).toBeCloseTo(1.25 / 1_000_000, 12);
    const terra = lookupPrice({ provider: 'openai', model: 'gpt-5.6-terra' });
    expect(terra?.cacheWriteUsdPerToken).toBeCloseTo(3.125 / 1_000_000, 12);
    const sol = lookupPrice({ provider: 'openai', model: 'gpt-5.6-sol' });
    expect(sol?.cacheWriteUsdPerToken).toBeCloseTo(6.25 / 1_000_000, 12);
  });

  it('resolves the bare `gpt-5.6` alias at sol rates (the API routes it to sol)', () => {
    const alias = lookupPrice({ provider: 'openai', model: 'gpt-5.6' });
    const sol = lookupPrice({ provider: 'openai', model: 'gpt-5.6-sol' });
    expect(alias).not.toBeNull();
    expect(alias?.inputUsdPerToken).toBe(sol?.inputUsdPerToken);
    expect(alias?.outputUsdPerToken).toBe(sol?.outputUsdPerToken);
    expect(alias?.cachedReadUsdPerToken).toBe(sol?.cachedReadUsdPerToken);
    expect(alias?.cacheWriteUsdPerToken).toBe(sol?.cacheWriteUsdPerToken);
  });

  it('calculateCost matches the official four-leg formula (base + cached read + cache write + output)', () => {
    // luna: 1000 base-input + 500 cached reads + 200 cache writes + 300 output
    // = (1000*1.00 + 500*0.10 + 200*1.25 + 300*6.00) / 1e6
    // = (1000 + 50 + 250 + 1800) / 1e6 = $0.0031
    const cost = calculateCost({
      provider: 'openai',
      model: 'gpt-5.6-luna',
      inputTokens: 1_000,
      outputTokens: 300,
      cachedReadTokens: 500,
      cacheWriteTokens: 200,
    });
    expect(cost?.amount).toBeCloseTo(0.0031, 12);
  });
});
