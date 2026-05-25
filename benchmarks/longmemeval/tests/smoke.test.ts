/**
 * Graphorin — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Offline smoke test: the LongMemEval runner must produce a report on
 * the committed fixture using the deterministic stub provider — no
 * model, no network.
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { runLongMemEvalBenchmark, VERSION } from '../src/runner.js';
import { createDefaultStubProvider } from '../src/stub-provider.js';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = join(pkg, 'data', 'fixture.json');

describe('benchmarks/longmemeval', () => {
  it('exposes VERSION = 0.1.0', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('runs fully offline on the fixture with a stub provider', async () => {
    const report = await runLongMemEvalBenchmark({
      datasetPath: fixture,
      provider: createDefaultStubProvider(),
    });
    expect(report.summary.total).toBe(3);
    // both scorers ran on every case, in order
    expect(report.results[0]?.scores.map((s) => s.scorer)).toEqual(['llm-judge-j', 'abstention']);
    // the "J" judge produced a numeric score
    expect(report.summary.byScorer['llm-judge-j']?.avgScore).not.toBeNull();
  });

  it('filters to a single ability for per-category gates', async () => {
    const report = await runLongMemEvalBenchmark({
      datasetPath: fixture,
      ability: 'abstention',
      provider: createDefaultStubProvider(),
    });
    expect(report.summary.total).toBe(1);
  });
});
