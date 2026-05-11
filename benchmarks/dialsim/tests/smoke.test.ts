/**
 * Graphorin v0.1.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 */

import { describe, expect, it } from 'vitest';
import { runDialSim, VERSION } from '../src/runner.js';

describe('benchmarks/dialsim', () => {
  it('VERSION is 0.1.0', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('runDialSim recovers the reservation token', async () => {
    const r = await runDialSim();
    expect(r.pass).toBe(true);
    expect(r.accuracy).toBe(1);
  });
});
