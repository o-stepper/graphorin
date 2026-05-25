/**
 * Graphorin v0.4.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Deterministic stub embedder used by the `document-pipeline` example.
 * `embed(text)` returns an 8-dim L2-normalised vector derived from a
 * pair of FNV-1a-style hashes folded over the input bytes; pure JS,
 * zero dependencies, no network, and the same input always yields the
 * same vector so the smoke-test assertions stay byte-stable.
 */

/** Vector arity — kept tiny so the example does not allocate big arrays. */
export const STUB_EMBEDDING_DIM = 8 as const;

/**
 * Hash `text` into a deterministic L2-normalised 8-dim vector. The
 * pipeline calls this from the `embed-chunks` node so the workflow
 * stays hermetic; swap in `@graphorin/embedder-transformersjs` or an
 * Ollama-backed embedder for production use.
 */
export function embed(text: string): ReadonlyArray<number> {
  const out = new Array<number>(STUB_EMBEDDING_DIM).fill(0);
  let h1 = 0x811c9dc5;
  let h2 = 0xdeadbeef;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x85ebca6b) >>> 0;
  }
  for (let i = 0; i < STUB_EMBEDDING_DIM; i += 1) {
    const seed = i % 2 === 0 ? h1 : h2;
    const slot = (seed >>> ((i * 4) % 32)) & 0xff;
    out[i] = (slot / 255) * 2 - 1;
  }
  out[0] = Math.min(text.length, 4_096) / 4_096;
  let norm = 0;
  for (let i = 0; i < STUB_EMBEDDING_DIM; i += 1) {
    const v = out[i] ?? 0;
    norm += v * v;
  }
  const denom = Math.sqrt(norm) || 1;
  for (let i = 0; i < STUB_EMBEDDING_DIM; i += 1) {
    out[i] = (out[i] ?? 0) / denom;
  }
  return Object.freeze(out);
}
