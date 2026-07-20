/**
 * Deterministic, offline bag-of-words hash embedder for eval
 * harnesses. Moved out of the LongMemEval bench runner
 * (deep-retest-0.13.6 P2-Q) so every harness exposes the same
 * `--embedder fake` axis instead of shipping local twins.
 *
 * @packageDocumentation
 */

import type { EmbedderProvider } from '@graphorin/core';

/**
 * Deterministic, offline bag-of-words hash embedder (evals-01). Not a
 * real semantic model - it exists so the VECTOR leg of hybrid search
 * (and the reconcile / graph / HyDE paths that ride it) can be
 * exercised and A/B-compared in CI without a model download. Real
 * embedding quality needs a real embedder.
 *
 * @stable
 */
export function createFakeEmbedder(dim = 64): EmbedderProvider {
  function embedOne(text: string): Float32Array {
    const vec = new Float32Array(dim);
    const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    for (const token of tokens) {
      let hash = 0x811c9dc5;
      for (let i = 0; i < token.length; i++) {
        hash ^= token.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
      }
      const slot = (hash >>> 0) % dim;
      vec[slot] = (vec[slot] ?? 0) + 1;
    }
    let norm = 0;
    for (const v of vec) norm += v * v;
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < dim; i++) vec[i] = (vec[i] ?? 0) / norm;
    }
    return vec;
  }
  return {
    id: () => `fake:bow-${dim}`,
    dim: () => dim,
    configHash: () => `fake-bow-${dim}`,
    embed: async (texts) => texts.map((t) => embedOne(t)),
  };
}
