import type { EmbedderProvider } from '@graphorin/core';
import type { EmbeddingMetaRegistryLike } from './storage-adapter.js';

/**
 * Infer the canonical adapter family from the embedder id. The
 * canonical id format is `'<adapter>:<model>@<dim>'`; we slice the
 * adapter name off the front so the registry can index by family
 * without needing the embedder to expose an extra property.
 *
 * @internal
 */
export function inferAdapterKind(id: string): string {
  const colonIndex = id.indexOf(':');
  if (colonIndex < 0) return 'custom';
  return id.slice(0, colonIndex);
}

/**
 * Infer the model id portion of a canonical embedder id.
 *
 * @internal
 */
export function inferModelName(id: string): string {
  const colonIndex = id.indexOf(':');
  const atIndex = id.lastIndexOf('@');
  if (colonIndex < 0) return id;
  if (atIndex < 0 || atIndex < colonIndex) return id.slice(colonIndex + 1);
  return id.slice(colonIndex + 1, atIndex);
}

/**
 * Register the supplied embedder with the storage layer's
 * `embedding_meta` registry. Returns the canonical id surfaced to the
 * memory writers. Idempotent - a registry that already knows the id
 * with a matching `configHash` returns the existing row.
 *
 * @internal
 */
export function bindEmbedder(
  embedder: EmbedderProvider,
  registry: EmbeddingMetaRegistryLike,
): string {
  const id = embedder.id();
  registry.registerOrReturn({
    id,
    embedderKind: inferAdapterKind(id),
    model: inferModelName(id),
    dim: embedder.dim(),
    configHash: embedder.configHash(),
    distanceMetric: 'cosine',
  });
  return id;
}
