import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createTransformersJsEmbedder } from '../src/index.js';

/**
 * Network-gated tests - exercise the real Hugging Face model download
 * path. Skipped by default; run explicitly with:
 *
 *   RUN_NETWORK_TESTS=1 pnpm test
 *
 * Two outcomes are verified:
 *   1. The model downloads on the first `embed(...)` call.
 *   2. A second `embed(...)` against a fresh embedder (same cache dir)
 *      hits the cache instead of re-downloading.
 */
const enabled = process.env.RUN_NETWORK_TESTS === '1';

describe.skipIf(!enabled)('transformersjs embedder - network-gated', () => {
  it('downloads the default model on first use and reuses the cache on second use', async () => {
    const cacheDir = await mkdtemp(join(tmpdir(), 'graphorin-tjs-network-'));
    process.env.GRAPHORIN_CACHE_DIR = cacheDir;
    try {
      const first = createTransformersJsEmbedder({
        model: 'Xenova/multilingual-e5-small',
      });
      const t1 = Date.now();
      const out1 = await first.embed(['hello']);
      const elapsedFirst = Date.now() - t1;
      expect(out1[0]?.length).toBe(384);

      const second = createTransformersJsEmbedder({
        model: 'Xenova/multilingual-e5-small',
      });
      const t2 = Date.now();
      const out2 = await second.embed(['hello']);
      const elapsedSecond = Date.now() - t2;
      expect(out2[0]?.length).toBe(384);

      // Cache hit should be at least 3x faster than initial download.
      // The actual ratio is much larger in practice (~20x); 3x leaves
      // plenty of headroom for slow CI hardware.
      expect(elapsedSecond * 3).toBeLessThan(elapsedFirst);
    } finally {
      delete process.env.GRAPHORIN_CACHE_DIR;
    }
  }, 120_000);
});
