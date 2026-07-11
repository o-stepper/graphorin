import { describe, expect, it } from 'vitest';

import { calculateCost, computeEntriesDigest, refreshPricing } from '../src/index.js';

describe('@graphorin/pricing - refreshPricing', () => {
  it('parses the upstream JSON and returns a frozen snapshot', async () => {
    const snapshot = await refreshPricing({
      url: 'https://example.com/pricing.json',
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            entries: [
              {
                provider: 'openai',
                model: 'gpt-future',
                inputUsdPerToken: 0.000001,
                outputUsdPerToken: 0.000003,
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      snapshotDate: '2026-05-01',
    });
    expect(snapshot.snapshotDate).toBe('2026-05-01');
    expect(snapshot.source).toBe('https://example.com/pricing.json');
    expect(snapshot.entries).toHaveLength(1);
    expect(snapshot.sha256).toBe(computeEntriesDigest(snapshot.entries));
  });

  it('also accepts a top-level array shape', async () => {
    const snapshot = await refreshPricing({
      url: 'https://example.com/pricing.json',
      fetchImpl: async () =>
        new Response(
          JSON.stringify([
            {
              provider: 'openai',
              model: 'gpt-future',
              inputUsdPerToken: 0.000001,
              outputUsdPerToken: 0.000003,
            },
          ]),
          { status: 200 },
        ),
    });
    expect(snapshot.entries).toHaveLength(1);
  });

  it('throws on non-2xx', async () => {
    await expect(
      refreshPricing({
        url: 'https://example.com/pricing.json',
        fetchImpl: async () => new Response('boom', { status: 500, statusText: 'Server Error' }),
      }),
    ).rejects.toThrow(/500/);
  });

  it('throws when the body is not a recognised shape', async () => {
    await expect(
      refreshPricing({
        url: 'https://example.com/pricing.json',
        fetchImpl: async () => new Response(JSON.stringify({ wrong: 'shape' }), { status: 200 }),
      }),
    ).rejects.toThrow(/entries/);
  });

  it('throws when an entry is missing required fields', async () => {
    await expect(
      refreshPricing({
        url: 'https://example.com/pricing.json',
        fetchImpl: async () =>
          new Response(JSON.stringify({ entries: [{ provider: 'p' }] }), { status: 200 }),
      }),
    ).rejects.toThrow(/provider \/ model/);
  });
});

describe('W-097 - refreshPricing genai-prices auto-detection', () => {
  const GENAI_BODY = {
    providers: [
      {
        id: 'anthropic',
        models: [
          {
            id: 'claude-sonnet-4-5',
            prices: { input_mtok: 3, output_mtok: 15, cache_read_mtok: 0.3 },
          },
          { id: 'tiered', prices: [{ input_mtok: 1 }, { input_mtok: 2 }] },
        ],
      },
    ],
  };
  const fetchBody = (body: unknown) => async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

  it('auto-detects the dataset, converts it and marks the snapshot', async () => {
    const snapshot = await refreshPricing({
      url: 'https://example.com/genai-prices/data.json',
      fetchImpl: fetchBody(GENAI_BODY),
      snapshotDate: '2026-07-06',
    });
    expect(snapshot.version).toBe('genai-prices+converted');
    expect(snapshot.conversion).toEqual({ format: 'genai-prices', skipped: 1 });
    expect(snapshot.entries).toHaveLength(1);
    expect(snapshot.entries[0]).toMatchObject({
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      inputUsdPerToken: 3e-6,
      outputUsdPerToken: 15e-6,
      cachedReadUsdPerToken: 3e-7,
    });
    expect(snapshot.sha256).toBe(computeEntriesDigest(snapshot.entries));
    // The converted snapshot is consumable by the ordinary lookup path.
    const cost = calculateCost(
      {
        provider: 'anthropic',
        model: 'claude-sonnet-4-5',
        inputTokens: 1_000_000,
        outputTokens: 0,
      },
      snapshot,
    );
    expect(cost).toEqual({ amount: 3, currency: 'USD' });
  });

  it('E-09: auto-detects the published bare top-level array of providers', async () => {
    // The live genai-prices data.json ships WITHOUT the `providers`
    // wrapper; previously this threw the misleading native
    // 'missing provider / model' error in auto mode.
    const snapshot = await refreshPricing({
      url: 'https://example.com/genai-prices/data.json',
      fetchImpl: fetchBody(GENAI_BODY.providers),
      snapshotDate: '2026-07-11',
    });
    expect(snapshot.version).toBe('genai-prices+converted');
    expect(snapshot.conversion).toEqual({ format: 'genai-prices', skipped: 1 });
    expect(snapshot.entries).toHaveLength(1);
    expect(snapshot.entries[0]).toMatchObject({
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      inputUsdPerToken: 3e-6,
    });
  });

  it("E-09: format 'genai-prices' accepts the bare array form too", async () => {
    const snapshot = await refreshPricing({
      url: 'https://example.com/genai-prices/data.json',
      fetchImpl: fetchBody(GENAI_BODY.providers),
      format: 'genai-prices',
    });
    expect(snapshot.entries).toHaveLength(1);
    expect(snapshot.conversion?.format).toBe('genai-prices');
  });

  it("format: 'graphorin' pins the native shape (a genai body fails fast)", async () => {
    await expect(
      refreshPricing({
        url: 'https://example.com/genai-prices/data.json',
        fetchImpl: fetchBody(GENAI_BODY),
        format: 'graphorin',
      }),
    ).rejects.toThrow(/entries/);
  });

  it('a dataset declaring a non-USD currency throws instead of stamping dollars', async () => {
    await expect(
      refreshPricing({
        url: 'https://example.com/genai-prices/data.json',
        fetchImpl: fetchBody({ ...GENAI_BODY, currency: 'EUR' }),
      }),
    ).rejects.toThrow(/USD-only/);
  });

  it('the native shape keeps working byte-identically', async () => {
    const snapshot = await refreshPricing({
      url: 'https://example.com/pricing.json',
      fetchImpl: fetchBody({
        entries: [
          {
            provider: 'openai',
            model: 'gpt-future',
            inputUsdPerToken: 1e-6,
            outputUsdPerToken: 3e-6,
          },
        ],
      }),
    });
    expect(snapshot.version).toBe('graphorin/0.1+refreshed');
    expect(snapshot.conversion).toBeUndefined();
  });
});
