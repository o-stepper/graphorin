import testPkg from '../package.json' with { type: 'json' };

const pkgVersion: string = testPkg.version;

/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 */

import { describe, expect, it } from 'vitest';
import { measureMemorySearchLatency, VERSION } from '../src/runner.js';

describe('benchmarks/latency', () => {
  it('exposes the package.json version', () => {
    expect(VERSION).toBe(pkgVersion);
  });

  it('reports stable order statistics for hybrid search', async () => {
    const r = await measureMemorySearchLatency({ factCount: 80, samples: 12 });
    expect(r.p50ms).toBeGreaterThanOrEqual(0);
    expect(r.p95ms).toBeGreaterThanOrEqual(r.p50ms);
  });
});
