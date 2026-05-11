/**
 * `gatherMemoryMetadata(...)` — implements the
 * {@link Memory.metadata} surface for Phase 10d. Aggregates
 * per-tier counts + last-consolidation timestamps + active
 * embedder id + active locale.
 *
 * @packageDocumentation
 */

import type { MemoryMetadata, SessionScope } from '@graphorin/core';
import type { Consolidator } from '../consolidator/index.js';
import type { MemoryStoreAdapter } from '../internal/storage-adapter.js';

/**
 * Per-call dependency surface. Mirrors the `Memory` facade fields
 * the metadata gatherer needs without taking a hard dependency on
 * the facade type itself (the facade and the gatherer are
 * mutually-referenced through the engine).
 *
 * @stable
 */
export interface MemoryMetadataDeps {
  readonly store: MemoryStoreAdapter;
  readonly consolidator: Consolidator;
  readonly embedderId: () => string | null;
  readonly localeId: string;
  /** Optional free-form metadata tags surfaced through `MemoryMetadata.tags`. */
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Build the {@link MemoryMetadata} block. Pure async — no side
 * effects beyond the storage reads.
 *
 * @stable
 */
export async function gatherMemoryMetadata(
  scope: SessionScope,
  deps: MemoryMetadataDeps,
): Promise<MemoryMetadata> {
  const [blocks, rules, episodes, messages, facts, status] = await Promise.all([
    deps.store.working.list(scope),
    deps.store.procedural.list(scope),
    deps.store.episodic.search(scope, { query: '*', topK: 1 }).catch(() => []),
    deps.store.session.list(scope, {}).catch(() => []),
    deps.store.semantic.search(scope, { query: '*', topK: 1 }).catch(() => []),
    deps.consolidator.status(),
  ]);
  // The metadata block surfaces the embedder id + active locale so
  // the model can reason about the available embeddings; both are
  // informational tags exposed through the optional `tags` field.
  const embedderId = deps.embedderId();
  const baseTags = deps.tags !== undefined ? [...deps.tags] : [];
  const tags: string[] = [...baseTags, `locale:${deps.localeId}`];
  if (embedderId !== null) tags.push(`embedder:${embedderId}`);

  const meta: MemoryMetadata = {
    factCount: facts.length,
    episodeCount: episodes.length,
    messageCount: messages.length,
    activeRuleCount: rules.length,
    workingBlockCount: blocks.length,
    ...(status.lastRunAt !== undefined ? { lastConsolidatedAt: status.lastRunAt } : {}),
    tags: Object.freeze(tags),
  };
  return Object.freeze(meta);
}

/**
 * Render the {@link MemoryMetadata} block as the `<memory_metadata>`
 * XML fragment used inside Layer 5 of the layered system prompt.
 *
 * @stable
 */
export function renderMetadataBlock(meta: MemoryMetadata): string {
  const lines = [
    '<memory_metadata>',
    `  Working blocks: ${meta.workingBlockCount}`,
    `  Active rules: ${meta.activeRuleCount}`,
    `  Indexed messages: ${meta.messageCount}`,
    `  Episodes: ${meta.episodeCount}`,
    `  Facts: ${meta.factCount}`,
  ];
  if (meta.lastConsolidatedAt !== undefined) {
    lines.push(`  Last consolidation: ${meta.lastConsolidatedAt}`);
  }
  if (meta.tags !== undefined && meta.tags.length > 0) {
    lines.push(`  Tags: ${meta.tags.join(', ')}`);
  }
  lines.push('</memory_metadata>');
  return lines.join('\n');
}
