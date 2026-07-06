import { describe, expect, it } from 'vitest';

import { createFakeEmbedder, runScaleBenchmark } from '../src/runner.js';

describe('benchmark-scale harness', () => {
  it('fake embedder is deterministic and normalized', async () => {
    const embedder = createFakeEmbedder(64);
    const [a] = await embedder.embed(['project alpha deployment']);
    const [b] = await embedder.embed(['project alpha deployment']);
    expect(a).toEqual(b);
    let norm = 0;
    for (const v of a ?? []) norm += v * v;
    expect(Math.sqrt(norm)).toBeCloseTo(1, 6);
  });

  it('runs end-to-end at a tiny corpus and reports sane shapes', async () => {
    const r = await runScaleBenchmark({ factCount: 150, querySamples: 10, hop2Samples: 2 });
    expect(r.factCount).toBe(150);
    expect(r.seedSeconds).toBeGreaterThan(0);
    expect(r.hybrid.samples).toBe(10);
    expect(r.hybridHitRate).toBeGreaterThan(0.9);
    expect(r.graphHitRate).toBeGreaterThan(0.9);
    expect(r.graphHop2?.samples).toBe(2);
    expect(r.entities).toBeGreaterThan(0);
    expect(r.dbBytes).toBeGreaterThan(0);
    expect(r.lightPhaseSeconds).not.toBeNull();
    // 180s: the full harness (seed + FTS + vector + graph + light phase)
    // needs >60s wall on a degraded 2-core windows runner - the same
    // slow-I/O flake class the CI-wide 30s default retired, but this test
    // owns an explicit timeout, which takes precedence. Not a hang: the
    // run completes and the assertions are shape checks, not perf gates.
  }, 180_000);
});
