import { describe, expect, it } from 'vitest';

import { runPricingLookup, runPricingMissing, runPricingStatus } from '../src/commands/pricing.js';

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
});
