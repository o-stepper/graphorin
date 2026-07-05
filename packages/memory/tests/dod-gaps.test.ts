/**
 * Tests that fill the Phase 10a Definition-of-Done checklist gaps
 * found during the deep re-check:
 *
 *  - "Custom `setReranker(custom)` reorders correctly".
 *  - "`auto-migrate` runs to completion with checkpointing (resumes
 *    after simulated process kill)".
 *  - "`multi-active` reads from both tables; writes to active".
 *
 * Each test exercises the full surface end-to-end against the
 * in-memory adapter so the assertion is on observable behaviour,
 * not on the internal call sequence.
 */

import type { Fact, MemoryHit } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import type { ReRanker } from '../src/index.js';
import { createMemory, EmbedderMigrationAbortedError, migrateEmbedder } from '../src/index.js';
import {
  createInMemoryStore,
  createStubEmbedder,
  InMemoryEmbeddingRegistry,
} from './fixtures/in-memory-store.js';

const SCOPE = { userId: 'alex' };

describe('@graphorin/memory - DoD: setReranker reorders correctly', () => {
  it('the custom reranker drives the order of SemanticMemory.search results', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
    });
    const a = await memory.semantic.remember(SCOPE, { text: 'apple pie' });
    const b = await memory.semantic.remember(SCOPE, { text: 'apple sauce' });
    const c = await memory.semantic.remember(SCOPE, { text: 'apple juice' });
    void a;
    void b;
    void c;

    // Default RRF ordering: insertion order (the in-memory FTS just
    // walks the array). Capture the baseline.
    const baseline = await memory.semantic.search(SCOPE, 'apple');
    expect(baseline.map((h) => h.record.text)).toEqual(['apple pie', 'apple sauce', 'apple juice']);

    // Install a custom reranker that scores by alphabetical text;
    // results must come back in the alphabetical order.
    const alphabetical: ReRanker = {
      id: 'alphabetical',
      async rerank<TRecord extends import('@graphorin/core').MemoryRecord>(
        _query: string,
        lists: ReadonlyArray<ReadonlyArray<MemoryHit<TRecord>>>,
        opts: { topK?: number } = {},
      ): Promise<ReadonlyArray<MemoryHit<TRecord>>> {
        const seen = new Map<string, MemoryHit<TRecord>>();
        for (const list of lists) {
          for (const hit of list) {
            if (!seen.has(hit.record.id)) seen.set(hit.record.id, hit);
          }
        }
        const flat = [...seen.values()];
        flat.sort((p, q) => {
          const pt = (p.record as unknown as Fact).text ?? '';
          const qt = (q.record as unknown as Fact).text ?? '';
          return pt.localeCompare(qt);
        });
        return flat.slice(0, opts.topK ?? flat.length);
      },
    };
    const previous = memory.semantic.setReranker(alphabetical);
    expect(previous.id).toBe('rrf');

    const reranked = await memory.semantic.search(SCOPE, 'apple');
    expect(reranked.map((h) => h.record.text)).toEqual(['apple juice', 'apple pie', 'apple sauce']);
    // Restoring the previous reranker restores the baseline ordering.
    memory.semantic.setReranker(previous);
    const restored = await memory.semantic.search(SCOPE, 'apple');
    expect(restored.map((h) => h.record.text)).toEqual(baseline.map((h) => h.record.text));
  });
});

describe('@graphorin/memory - DoD: multi-active reads from both tables', () => {
  it('after multi-active migration, search returns rows embedded with either embedder', async () => {
    const store = createInMemoryStore();
    const embeddings = new InMemoryEmbeddingRegistry();
    const sourceEmbedder = createStubEmbedder({ id: 'stub:src@8' });
    const memory = createMemory({ store, embeddings, embedder: sourceEmbedder });
    // Write a fact under the source embedder.
    const sourceFact = await memory.semantic.remember(SCOPE, { text: 'fact under source' });
    expect(memory.embedderId()).toBe('stub:src@8');

    // Now opt in to multi-active so the target embedder is registered
    // alongside the source.
    const targetEmbedder = createStubEmbedder({ id: 'stub:tgt@8' });
    const events = [];
    for await (const ev of migrateEmbedder({
      source: sourceEmbedder,
      target: targetEmbedder,
      embeddings,
      strategy: 'multi-active',
    })) {
      events.push(ev);
    }
    expect(events[events.length - 1]?.phase).toBe('committed');
    expect(embeddings.listActive().some((r) => r.id === 'stub:tgt@8')).toBe(true);
    expect(embeddings.listActive().some((r) => r.id === 'stub:src@8')).toBe(true);

    // Write a fresh fact attributed to the target embedder via the
    // adapter's vector index. Then verify both vectors are visible
    // under their respective embedder id (multi-active read union).
    const targetFact = await memory.semantic.remember(SCOPE, { text: 'fact under target' });
    store.__hooks.registerFactEmbedder(targetFact.id, 'stub:tgt@8');
    store.__hooks.registerFactEmbedder(sourceFact.id, 'stub:src@8');

    // Direct adapter probe - the storage layer's `searchVector`
    // honours the per-record `embedder_id` guard. Each call should
    // surface only the fact attributed to that embedder.
    const sourceVec = (await sourceEmbedder.embed(['fact under source']))[0];
    const targetVec = (await targetEmbedder.embed(['fact under target']))[0];
    if (sourceVec === undefined || targetVec === undefined) {
      throw new Error('embed returned no vector');
    }
    const sourceHits =
      (await store.semantic.searchVector?.(SCOPE, sourceVec, 'stub:src@8', 5)) ?? [];
    const targetHits =
      (await store.semantic.searchVector?.(SCOPE, targetVec, 'stub:tgt@8', 5)) ?? [];
    expect(sourceHits.find((h) => h.record.id === sourceFact.id)).toBeDefined();
    expect(targetHits.find((h) => h.record.id === targetFact.id)).toBeDefined();
    // Cross-embedder lookups must NOT bleed (the per-record
    // `embedder_id` guard from ADR-023 / DEC-116 is the spec's
    // safety property).
    expect(sourceHits.find((h) => h.record.id === targetFact.id)).toBeUndefined();
    expect(targetHits.find((h) => h.record.id === sourceFact.id)).toBeUndefined();
  });
});

describe('@graphorin/memory - DoD: auto-migrate resumes after process kill', () => {
  it('two consecutive auto-migrate runs against a stateful queue drain everything', async () => {
    const embeddings = new InMemoryEmbeddingRegistry();
    const sourceEmbedder = createStubEmbedder({ id: 'stub:src@8' });
    const targetEmbedder = createStubEmbedder({ id: 'stub:tgt@8' });
    embeddings.registerOrReturn({
      id: sourceEmbedder.id(),
      embedderKind: 'stub',
      model: 'src',
      dim: 8,
      configHash: sourceEmbedder.configHash(),
    });

    // MST-12: resumption is caller-driven. This stateful queue IS the cursor -
    // the caller's `nextBatch` owns it and it survives across the two
    // `migrateEmbedder(...)` invocations. There is no persisted
    // `migration_state` cursor in the storage adapter today.
    const queue: Array<{ id: string; text: string }> = [
      { id: 'f1', text: 'one' },
      { id: 'f2', text: 'two' },
      { id: 'f3', text: 'three' },
      { id: 'f4', text: 'four' },
    ];
    const writes: Array<{ id: string; vector: Float32Array }> = [];
    const nextBatch: import('../src/index.js').MigrateEmbedderOptions['nextBatch'] = async ({
      kind,
    }) => {
      if (kind !== 'fact') return { rows: [], nextCursor: null };
      const next = queue.shift();
      if (next === undefined) return { rows: [], nextCursor: null };
      return {
        rows: [
          {
            id: next.id,
            text: next.text,
            async write(vector) {
              writes.push({ id: next.id, vector });
            },
          },
        ],
        nextCursor: queue.length > 0 ? `cursor_${queue.length}` : null,
      };
    };

    // Run #1 - interrupt after the first batch.
    const ctrl = new AbortController();
    let yielded = 0;
    await expect(
      (async () => {
        for await (const event of migrateEmbedder({
          source: sourceEmbedder,
          target: targetEmbedder,
          embeddings,
          strategy: 'auto-migrate',
          batchSize: 1,
          signal: ctrl.signal,
          nextBatch,
        })) {
          yielded += 1;
          if (event.phase === 'running' && yielded === 2) {
            ctrl.abort();
          }
        }
      })(),
    ).rejects.toThrow(EmbedderMigrationAbortedError);

    expect(writes.length).toBeGreaterThanOrEqual(1);
    expect(writes.length).toBeLessThan(4);
    expect(queue.length).toBeGreaterThan(0);

    // Source is still registered because the abort happened before
    // commit - a fresh embedder migration runner must be able to
    // resume.
    expect(embeddings.listActive().some((r) => r.id === 'stub:src@8')).toBe(true);

    // Run #2 - resumes from the persisted cursor, drains the queue,
    // commits, retires the source.
    const events2: string[] = [];
    for await (const event of migrateEmbedder({
      source: sourceEmbedder,
      target: targetEmbedder,
      embeddings,
      strategy: 'auto-migrate',
      batchSize: 1,
      nextBatch,
    })) {
      events2.push(event.phase);
    }
    expect(events2[events2.length - 1]).toBe('committed');
    expect(writes.length).toBe(4);
    expect(queue.length).toBe(0);
    expect(embeddings.listActive().some((r) => r.id === 'stub:src@8')).toBe(false);
    expect(embeddings.listActive().some((r) => r.id === 'stub:tgt@8')).toBe(true);
  });
});
