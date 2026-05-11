/**
 * Graphorin v0.1.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 */

import { describe, expect, it } from 'vitest';
import { runMemorySim, VERSION } from '../src/runner.js';

describe('benchmarks/memory-sim', () => {
  it('exposes VERSION = 0.1.0', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('achieves perfect top-1 recall on the synthetic needle task', async () => {
    const r = await runMemorySim({ seed: 0xcafebabe, rounds: 12 });
    expect(r.hitRate).toBe(1);
  });
});
