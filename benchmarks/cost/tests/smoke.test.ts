/**
 * Graphorin v0.1.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 */

import { describe, expect, it } from 'vitest';
import { runCostRegression, VERSION } from '../src/runner.js';

describe('benchmarks/cost', () => {
  it('exposes VERSION = 0.1.0', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('pinned transcript matches regression baseline tokens', async () => {
    const r = await runCostRegression();
    expect(r.tokens).toBe(r.baseline);
    expect(r.ratio).toBe(0);
  });
});
