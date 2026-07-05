import testPkg from '../package.json' with { type: 'json' };

const pkgVersion: string = testPkg.version;

/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 */

import { describe, expect, it } from 'vitest';
import { runMemorySim, VERSION } from '../src/runner.js';

describe('benchmarks/memory-sim', () => {
  it('exposes the package.json version', () => {
    expect(VERSION).toBe(pkgVersion);
  });

  it('achieves perfect top-1 recall on the synthetic needle task', async () => {
    const r = await runMemorySim({ seed: 0xcafebabe, rounds: 12 });
    expect(r.hitRate).toBe(1);
  });
});
