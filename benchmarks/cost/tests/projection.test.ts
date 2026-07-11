/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Regression tests (e2e 2026-07-11, S-23-02b):
 *
 * - the fixture tool schemas used to be bare {parse, safeParse} validators
 *   that degraded to a permissive {} on the wire with three
 *   'unprojectable-schema' WARNs per run - schema-body tokens were never
 *   counted; the fixtures must project real JSON Schema, warning-free;
 * - the regression failure message used to be anonymous ("a scenario grew
 *   by N%"); it must name the offending scenario.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  formatRegressionFailures,
  measureAllScenarios,
  SCENARIO_FIXTURES,
  type ScenarioResult,
} from '../src/runner.js';

describe('benchmarks/cost tool-schema projection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('every fixture tool schema projects to a real JSON Schema body', () => {
    const withTools = SCENARIO_FIXTURES.find((s) => s.id === 'with-tools');
    expect(withTools).toBeDefined();
    expect(withTools?.tools.length).toBeGreaterThan(0);
    for (const tool of withTools?.tools ?? []) {
      const schema = tool.inputSchema as { toJSON?: () => Record<string, unknown> };
      const projected = schema.toJSON?.();
      expect(projected?.type).toBe('object');
      expect(
        Object.keys((projected?.properties as object | undefined) ?? {}).length,
      ).toBeGreaterThan(0);
    }
  });

  it('measuring the scenarios emits no unprojectable-schema warnings', async () => {
    // The agent WARNs once per process per tool; this file runs in its own
    // vitest worker, so the spy sees the first (and only) chance to warn.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const tokens = await measureAllScenarios();
    const unprojectable = warn.mock.calls.filter((call) =>
      call.some((arg) => typeof arg === 'string' && arg.includes('unprojectable-schema')),
    );
    expect(unprojectable).toEqual([]);
    // The schema bodies now ride the wire, so with-tools must clear bare by
    // more than the tool names/descriptions alone ever did.
    expect(tokens['with-tools'] ?? 0).toBeGreaterThan(tokens.bare ?? 0);
  });
});

describe('benchmarks/cost regression message', () => {
  it('names every offending scenario and only the offenders', () => {
    const results: ScenarioResult[] = [
      { id: 'bare', tokens: 82, baseline: 31, ratio: (82 - 31) / 31 },
      { id: 'with-tools', tokens: 111, baseline: 111, ratio: 0 },
      { id: 'rich-instructions', tokens: 90, baseline: 68, ratio: (90 - 68) / 68 },
    ];
    const lines = formatRegressionFailures(results, 0.1);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("scenario 'bare'");
    expect(lines[0]).toContain('grew by 164.52%');
    expect(lines[0]).toContain('tokens=82 baseline=31');
    expect(lines[1]).toContain("scenario 'rich-instructions'");
    expect(lines.some((l) => l.includes('with-tools'))).toBe(false);
  });

  it('returns nothing when every scenario is within tolerance', () => {
    const results: ScenarioResult[] = [{ id: 'bare', tokens: 31, baseline: 31, ratio: 0 }];
    expect(formatRegressionFailures(results, 0.1)).toEqual([]);
  });
});
