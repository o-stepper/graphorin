/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Deterministic in-example stub embedder. Mirrors the test-suite
 * fixture idiom (`packages/memory/tests/fixtures/in-memory-store.ts`):
 * each text is hashed (FNV-1a) and expanded into a `dim`-component
 * unit vector whose components are seeded from (text-hash,
 * dimension-index) and centered around zero, so unrelated texts
 * produce nearly-orthogonal vectors. That keeps the conflict
 * pipeline's cosine-similarity zones quiet (no spurious dedups) while
 * still exercising the full embedding write + KNN read path - fully
 * offline, no transformersjs, no network, byte-stable across runs.
 *
 * The canonical id format is `'<adapter>:<model>@<dim>'`; the memory
 * facade's embedder binding derives the `embedding_meta` registry row
 * (`registerOrReturn`) from it.
 */

import type { EmbedderProvider } from '@graphorin/core';

/** Canonical id the stub registers under (`'<adapter>:<model>@<dim>'`). */
export const STUB_EMBEDDER_ID = 'stub:hash@32';

/** Output dimensionality of {@link createStubEmbedder} vectors. */
export const STUB_EMBEDDER_DIM = 32;

/** Stable config hash for the stub (nothing is configurable). */
export const STUB_EMBEDDER_CONFIG_HASH = 'stub-config';

/**
 * Build the deterministic hash-based embedder. Same inputs always
 * produce the same `Float32Array`s, so every run of the example is
 * reproducible without any model download.
 */
export function createStubEmbedder(): EmbedderProvider {
  return {
    id() {
      return STUB_EMBEDDER_ID;
    },
    dim() {
      return STUB_EMBEDDER_DIM;
    },
    configHash() {
      return STUB_EMBEDDER_CONFIG_HASH;
    },
    async embed(texts) {
      return texts.map((text) => textToUnitVector(text, STUB_EMBEDDER_DIM));
    },
  };
}

function textToUnitVector(text: string, dim: number): Float32Array {
  const out = new Float32Array(dim);
  const baseHash = fnv1a(text);
  for (let i = 0; i < dim; i++) {
    const seed = (baseHash ^ Math.imul(i + 1, 2654435761)) >>> 0;
    out[i] = mulberryUnit(seed);
  }
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    const v = out[i] ?? 0;
    norm += v * v;
  }
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < dim; i++) {
    out[i] = (out[i] ?? 0) / norm;
  }
  return out;
}

function fnv1a(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberryUnit(seed: number): number {
  // Map a 32-bit seed to (-1, 1) using a single mulberry-style step.
  let s = (seed + 0x6d2b79f5) >>> 0;
  s = Math.imul(s ^ (s >>> 15), s | 1);
  s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
  const r = ((s ^ (s >>> 14)) >>> 0) / 0x100000000;
  return r * 2 - 1;
}
