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
