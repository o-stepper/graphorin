import testPkg from '../package.json' with { type: 'json' };

const pkgVersion: string = testPkg.version;

/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 */

import { describe, expect, it } from 'vitest';
import { CONFORMANCE_CHECKS, VERSION } from '../src/checks.js';
import { runConformance, summarizeOutcomes } from '../src/runner.js';

describe('benchmarks/conformance', () => {
  it('exposes VERSION', () => {
    expect(VERSION).toBe(pkgVersion);
  });

  it('registry has unique ids and every check has a non-empty statement', () => {
    expect(CONFORMANCE_CHECKS.length).toBeGreaterThanOrEqual(10);
    const ids = CONFORMANCE_CHECKS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const check of CONFORMANCE_CHECKS) {
      expect(check.id.length).toBeGreaterThan(0);
      expect(check.area.length).toBeGreaterThan(0);
      expect(check.statement.trim().length).toBeGreaterThan(0);
      expect(typeof check.run).toBe('function');
    }
  });

  it('every registered framework-floor check runs green', async () => {
    const outcomes = await runConformance();
    expect(outcomes.length).toBe(CONFORMANCE_CHECKS.length);
    for (const outcome of outcomes) {
      expect.soft(outcome.ok, `${outcome.id}: ${outcome.message ?? ''}`).toBe(true);
    }
    const summary = summarizeOutcomes(outcomes);
    expect(summary.failed).toBe(0);
    expect(summary.shouldFail).toBe(false);
    expect(summary.lines).toEqual(CONFORMANCE_CHECKS.map((c) => `PASS ${c.id}`));
  });

  it('a deliberately-broken check is reported as a failure by the summarizer', async () => {
    const outcomes = await runConformance([
      {
        id: 'broken.check',
        area: 'test',
        statement: 'this inline fixture always violates its invariant',
        run: async () => {
          throw new Error('boom');
        },
      },
    ]);
    const summary = summarizeOutcomes(outcomes);
    expect(summary.failed).toBe(1);
    expect(summary.passed).toBe(0);
    expect(summary.shouldFail).toBe(true);
    expect(summary.lines).toEqual(['FAIL broken.check: boom']);
  });
});
