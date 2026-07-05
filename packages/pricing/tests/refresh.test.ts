import { describe, expect, it } from 'vitest';

import { computeEntriesDigest, refreshPricing } from '../src/index.js';

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
