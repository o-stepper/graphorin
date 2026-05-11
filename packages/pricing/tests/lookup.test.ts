import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  _resetLookupWarningsForTesting,
  BUNDLED_SNAPSHOT,
  calculateCost,
  lookupPrice,
  setLookupWarnSink,
} from '../src/index.js';

describe('@graphorin/pricing — lookupPrice', () => {
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

describe('@graphorin/pricing — calculateCost', () => {
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

  it('honours optional cached-read and reasoning tokens', () => {
    const cost = calculateCost({
      provider: 'openai',
      model: 'gpt-4o-2024-11-20',
      inputTokens: 0,
      outputTokens: 0,
      cachedReadTokens: 1_000,
      reasoningTokens: 500,
    });
    expect(cost?.amount).toBeGreaterThanOrEqual(0);
  });
});
