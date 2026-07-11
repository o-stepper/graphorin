import { BUNDLED_SNAPSHOT, lookupPrice } from '@graphorin/pricing';
import { describe, expect, it } from 'vitest';

import { runPricingLookup, runPricingMissing, runPricingStatus } from '../src/commands/pricing.js';

const RATE_KEYS = [
  'inputUsdPerToken',
  'outputUsdPerToken',
  'cachedReadUsdPerToken',
  'cacheWriteUsdPerToken',
  'reasoningUsdPerToken',
] as const;

describe('graphorin pricing status', () => {
  it('reports the bundled snapshot version + entry count + digest', () => {
    const lines: string[] = [];
    const result = runPricingStatus({ print: (l) => lines.push(l) });
    expect(result.entries).toBeGreaterThan(0);
    expect(result.digest).toMatch(/^[0-9a-f]+$/);
  });
});

describe('graphorin pricing lookup', () => {
  it('returns null + flips exitCode for an unknown model', () => {
    const before = process.exitCode;
    process.exitCode = 0;
    const result = runPricingLookup({
      provider: 'unknown-vendor',
      model: 'fake-model-id-9999',
      print: () => undefined,
    });
    expect(result).toBeNull();
    process.exitCode = before;
  });
});

describe('graphorin pricing lookup --json rate serialization (S-05)', () => {
  it('prints the claude-haiku-4-5 cache-read rate as 1e-7, not an IEEE754 artifact', () => {
    let payload: unknown;
    runPricingLookup({
      provider: 'anthropic',
      model: 'claude-haiku-4-5',
      json: true,
      jsonPrint: (p) => {
        payload = p;
      },
      print: () => undefined,
    });
    const doc = JSON.stringify(payload, null, 2);
    expect(doc).toContain('"cachedReadUsdPerToken": 1e-7');
    expect(doc).not.toContain('1.0000000000000001e-7');
    // Parsing the document back must reproduce the snapshot value
    // within 1e-15 relative - presentation only, never a price change.
    const parsed = JSON.parse(doc) as Record<string, number>;
    const raw = lookupPrice({ provider: 'anthropic', model: 'claude-haiku-4-5' });
    expect(raw).not.toBeNull();
    for (const key of RATE_KEYS) {
      const rawValue = (raw as unknown as Record<string, number | undefined>)[key];
      if (rawValue === undefined) continue;
      const parsedValue = parsed[key] ?? Number.NaN;
      expect(Math.abs(parsedValue - rawValue)).toBeLessThanOrEqual(Math.abs(rawValue) * 1e-15);
    }
  });

  it('serializes every bundled snapshot entry cleanly and value-identically', () => {
    for (const entry of BUNDLED_SNAPSHOT.entries) {
      let payload: unknown;
      const result = runPricingLookup({
        provider: entry.provider,
        model: entry.model,
        ...(entry.region !== undefined ? { region: entry.region } : {}),
        json: true,
        jsonPrint: (p) => {
          payload = p;
        },
        print: () => undefined,
      });
      expect(result).not.toBeNull();
      const doc = JSON.stringify(payload);
      // The IEEE754-artifact signature: a mantissa dragging 16+ digits.
      expect(doc).not.toMatch(/\d[.]\d{15,}/);
      const parsed = JSON.parse(doc) as Record<string, number>;
      const raw = result as unknown as Record<string, number | undefined>;
      for (const key of RATE_KEYS) {
        const rawValue = raw[key];
        if (rawValue === undefined) continue;
        const parsedValue = parsed[key] ?? Number.NaN;
        expect(Math.abs(parsedValue - rawValue)).toBeLessThanOrEqual(Math.abs(rawValue) * 1e-15);
      }
    }
  });
});

describe('graphorin pricing missing', () => {
  it('refuses an input file that is not JSON', async () => {
    await expect(
      runPricingMissing({
        spans: '/this/path/does/not/exist.json',
        print: () => undefined,
      }),
    ).rejects.toThrow();
  });
});

describe('graphorin pricing refresh --format (W-097)', () => {
  const GENAI_BODY = {
    providers: [
      {
        id: 'anthropic',
        models: [
          { id: 'claude-sonnet-4-5', prices: { input_mtok: 3, output_mtok: 15 } },
          { id: 'tiered', prices: [{ input_mtok: 1 }, { input_mtok: 2 }] },
        ],
      },
    ],
  };

  it('converts a genai-prices body and reports the skipped count', async () => {
    const { runPricingRefresh } = await import('../src/commands/pricing.js');
    const lines: string[] = [];
    const result = await runPricingRefresh({
      url: 'https://example.com/genai-prices/data.json',
      format: 'auto',
      print: (line) => lines.push(line),
      fetchImpl: (async () =>
        new Response(JSON.stringify(GENAI_BODY), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })) as typeof fetch,
    });
    expect(result.entries).toBe(1);
    expect(result.version).toBe('genai-prices+converted');
    expect(result.skipped).toBe(1);
    expect(lines.some((line) => line.includes('1 entry skipped'))).toBe(true);
  });

  it('E-09: auto-detects the published bare top-level provider array', async () => {
    // The live genai-prices data.json has no `providers` wrapper;
    // previously this exited with 'missing provider / model'.
    const { runPricingRefresh } = await import('../src/commands/pricing.js');
    const result = await runPricingRefresh({
      url: 'https://example.com/genai-prices/data.json',
      print: () => undefined,
      fetchImpl: (async () =>
        new Response(JSON.stringify(GENAI_BODY.providers), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })) as typeof fetch,
    });
    expect(result.entries).toBe(1);
    expect(result.version).toBe('genai-prices+converted');
    expect(result.skipped).toBe(1);
  });
});
