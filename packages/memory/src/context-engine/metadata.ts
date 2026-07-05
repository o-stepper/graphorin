/**
 * `gatherMemoryMetadata(...)` - implements the
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
 * Build the {@link MemoryMetadata} block. Pure async - no side
 * effects beyond the storage reads.
 *
 * @stable
 */
export async function gatherMemoryMetadata(
  scope: SessionScope,
  deps: MemoryMetadataDeps,
): Promise<MemoryMetadata> {
  // CE-5 / MST-6: real `COUNT(*)` surfaces per tier - the old
  // `search({ query: '*', topK: 1 })` probe was capped at 1 and matched zero
  // rows on real SQLite (`escapeFtsQuery('*')` tokenises to nothing), so a
  // production deploy told the model "Facts: 0" regardless of content. Counts
  // never materialise rows; `messageCount` no longer lists up to 1000 messages.
  const [blocks, rules, episodeCount, messageCount, factCount, status] = await Promise.all([
    deps.store.working.list(scope),
    deps.store.procedural.list(scope),
    countOrZero(deps.store.episodic, scope),
    countOrZero(deps.store.session, scope),
    countOrZero(deps.store.semantic, scope),
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
    factCount,
    episodeCount,
    messageCount,
    // MST-6: "Active rules" excludes still-quarantined (e.g. induced) rules.
    activeRuleCount: rules.filter((rule) => rule.status !== 'quarantined').length,
    workingBlockCount: blocks.length,
    ...(status.lastRunAt !== undefined ? { lastConsolidatedAt: status.lastRunAt } : {}),
    tags: Object.freeze(tags),
  };
  return Object.freeze(meta);
}

/**
 * Read a tier's `count(scope)` when the adapter exposes it (CE-5), degrading to
 * `0` for adapters that do not - honest, and never the old 0/1 probe.
 */
async function countOrZero(
  store: { count?(scope: SessionScope): Promise<number> },
  scope: SessionScope,
): Promise<number> {
  if (typeof store.count !== 'function') return 0;
  try {
    return await store.count(scope);
  } catch {
    return 0;
  }
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
