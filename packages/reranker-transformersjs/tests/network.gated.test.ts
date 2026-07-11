import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { createCrossEncoderReranker } from '../src/index.js';

import { hit } from './_fixtures.js';

/**
 * Network-gated tests - exercise the real Hugging Face model download
 * and inference path. Skipped by default; run explicitly with:
 *
 *   RUN_NETWORK_TESTS=1 pnpm test
 *
 * Set GRAPHORIN_CACHE_DIR to a pre-warmed Hugging Face cache to skip
 * the ~280 MB download.
 *
 * Two regressions are pinned:
 *   1. N-01/22 - the default (CPU) configuration must LOAD: the old
 *      'fp16' default failed onnxruntime-node session init
 *      (SimplifiedLayerNormFusion cast error) on the default en model.
 *   2. N-01/23 - scores must DISCRIMINATE: the old text-classification
 *      pipeline path softmaxed the model's single logit, scoring every
 *      pair a constant 1.0 (reranking was a no-op).
 */
const enabled = process.env.RUN_NETWORK_TESTS === '1';

describe.skipIf(!enabled)('transformersjs reranker - network-gated', () => {
  it('loads the default en model with all-default options and scores discriminatively', async () => {
    const cacheDir =
      process.env.GRAPHORIN_CACHE_DIR ??
      (await mkdtemp(join(tmpdir(), 'graphorin-tjs-reranker-network-')));
    // Everything except locale/cacheDir stays at package defaults so the
    // documented zero-config path is what gets exercised (N-01/22).
    const reranker = createCrossEncoderReranker({ locale: 'en', cacheDir });

    const query = 'What pet does Alice own?';
    const relevant = hit('rel', 'Alice owns a small tabby cat called Whiskers.', 0.1);
    const irrelevant = hit('irr', 'The weather in Kyiv is sunny with a light breeze.', 0.9);

    // The relevant passage enters LAST with the LOWEST input score, so
    // preserved merge order cannot masquerade as a correct reranking.
    const out = await reranker.rerank(query, [[irrelevant, relevant]], { topK: 2 });
    expect(out).toHaveLength(2);

    const rel = out.find((h) => h.record.id === 'rel');
    const irr = out.find((h) => h.record.id === 'irr');
    expect(rel).toBeDefined();
    expect(irr).toBeDefined();

    // N-01/23: strictly higher, not the constant 1.0 for every pair.
    expect(rel?.score).toBeGreaterThan(irr?.score ?? Number.NaN);
    expect(out[0]?.record.id).toBe('rel');
    expect(rel?.signals?.cross_encoder).toBe(rel?.score);
  }, 600_000);
});
