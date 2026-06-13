/**
 * Graphorin v0.1.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 */

import { describe, expect, it } from 'vitest';
import { runDialogueSmoke, VERSION } from '../src/runner.js';

describe('benchmarks/dialogue-smoke', () => {
  it('VERSION is 0.1.0', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('runDialogueSmoke recovers the reservation token', async () => {
    const r = await runDialogueSmoke();
    expect(r.pass).toBe(true);
    expect(r.accuracy).toBe(1);
  });
});
