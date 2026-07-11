/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Deterministic stub `EmbedderProvider` for the personal-assistant-cli
 * `'stub'` recipe and its smoke test. Returns an 8-dim vector derived
 * from the input text length and an FNV-1a hash, so vector queries do
 * not blow up but the embedder can still run inside CI without the
 * transformers.js model download. Never opens a socket, never reads
 * from disk, and emits the same vector for the same input every time
 * so snapshot tests are stable.
 */

import { createHash } from 'node:crypto';
import type { EmbedderProvider } from '@graphorin/core';

const STUB_DIM = 8;

/** Build the deterministic stub embedder. */
export function createStubEmbedder(): EmbedderProvider {
  const id = `stub-assistant:8`;
  const cfg = createHash('sha256').update(`stub-assistant-embedder:${STUB_DIM}`).digest('hex');
  return {
    id(): string {
      return id;
    },
    dim(): number {
      return STUB_DIM;
    },
    configHash(): string {
      return cfg;
    },
    async embed(texts: ReadonlyArray<string>): Promise<ReadonlyArray<Float32Array>> {
      return texts.map((text) => embedOne(text));
    },
  };
}

function embedOne(text: string): Float32Array {
  const out = new Float32Array(STUB_DIM);
  const lengthScalar = Math.min(text.length, 4_096) / 4_096;
  let h1 = 0x811c9dc5;
  let h2 = 0xdeadbeef;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x85ebca6b) >>> 0;
  }
  for (let i = 0; i < STUB_DIM; i += 1) {
    const seed = i % 2 === 0 ? h1 : h2;
    const slot = (seed >>> (i * 4)) & 0xff;
    out[i] = (slot / 255) * 2 - 1;
  }
  out[0] = lengthScalar;
  let norm = 0;
  for (let i = 0; i < STUB_DIM; i += 1) {
    const v = out[i] ?? 0;
    norm += v * v;
  }
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < STUB_DIM; i += 1) {
    out[i] = (out[i] ?? 0) / norm;
  }
  return out;
}
