/**
 * Graphorin v0.1.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runLocomoBenchmark, VERSION } from '../src/runner.js';

describe('benchmarks/locomo', () => {
  it('exposes VERSION = 0.1.0', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('smoke subset passes all seeded cases', async () => {
    const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
    const report = await runLocomoBenchmark({
      datasetPath: join(pkg, 'data', 'seed.jsonl'),
      smoke: true,
    });
    expect(report.summary.failed).toBe(0);
    expect(report.summary.passed).toBeGreaterThan(0);
  });
});
