import testPkg from '../package.json' with { type: 'json' };

const pkgVersion: string = testPkg.version;

/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 */

import { describe, expect, it } from 'vitest';
import { runDialogueSmoke, VERSION } from '../src/runner.js';

describe('benchmarks/dialogue-smoke', () => {
  it('VERSION mirrors the package manifest', () => {
    expect(VERSION).toBe(pkgVersion);
  });

  it('runDialogueSmoke recovers the reservation token', async () => {
    const r = await runDialogueSmoke();
    expect(r.pass).toBe(true);
    expect(r.accuracy).toBe(1);
  });
});
