/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 */

import { describe, expect, it } from 'vitest';
import { measureAllScenarios, runCostRegression, SCENARIO_IDS, VERSION } from '../src/runner.js';

describe('benchmarks/cost', () => {
  it('exposes VERSION', () => {
    expect(VERSION).toBe('0.2.0');
  });

  it('measures prompt assembly - tool schemas and a richer system prompt grow the count (EB-12)', async () => {
    const tokens = await measureAllScenarios();
    const bare = tokens.bare ?? Number.NaN;
    const withTools = tokens['with-tools'] ?? Number.NaN;
    const rich = tokens['rich-instructions'] ?? Number.NaN;
    expect(bare).toBeGreaterThan(0);
    // Advertising tool schemas grows the assembled prompt - a regression that
    // inflates tool descriptions would be caught here, unlike the old harness.
    expect(withTools).toBeGreaterThan(bare);
    // A longer system prompt grows it too.
    expect(rich).toBeGreaterThan(bare);
  });

  it('every scenario is within tolerance of the stored baseline', async () => {
    const report = await runCostRegression();
    expect(report.results.map((r) => r.id).sort()).toEqual([...SCENARIO_IDS].sort());
    expect(report.worstRatio).toBeLessThanOrEqual(0.1);
    for (const r of report.results) {
      expect(r.ratio).toBe(0);
    }
  });
});
