/**
 * Integration test against the real `@graphorin/store-sqlite` adapter.
 *
 * Phase 10a's contract is structural: any storage adapter that
 * implements `MemoryStoreAdapter` works. The DoD calls for a smoke
 * round-trip across every tier so that we know the package wires
 * cleanly with the production adapter, not just the in-memory test
 * fixture.
 *
 * The tests use `:memory:` SQLite databases + `skipSqliteVec: true`
 * so they run without the native `sqlite-vec` build (the FTS5 path
 * + every CRUD surface still works end-to-end).
 */

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { describe, expect, it } from 'vitest';
import { createMemory, defineBlock } from '../src/index.js';
import { createStubEmbedder } from './fixtures/in-memory-store.js';

const SCOPE = { userId: 'alex', sessionId: 's1' };

async function makeStore(opts: { withVec?: boolean } = {}): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-memory-integration-'));
  const store = await createSqliteStore({
    path: `${dir}/db.sqlite`,
    skipSqliteVec: opts.withVec !== true,
  });
  await store.init();
  return store;
}

describe('@graphorin/memory <> @graphorin/store-sqlite — integration', () => {
  it('createMemory wires every tier against the production sqlite adapter', async () => {
    const sqlite = await makeStore();
    try {
      const memory = createMemory({
        store: sqlite.memory,
        embeddings: sqlite.embeddings,
      });
      memory.working.define(defineBlock({ label: 'persona', charLimit: 200 }));
      await memory.working.write(SCOPE, 'persona', 'Friendly tone, succinct replies.');
      expect(await memory.working.read(SCOPE, 'persona')).toBe('Friendly tone, succinct replies.');

      await memory.session.push(SCOPE, { role: 'user', content: 'planning a hike this weekend' });
      const list = await memory.session.list(SCOPE);
      expect(list.length).toBe(1);

      const factA = await memory.semantic.remember(SCOPE, { text: 'enjoys mountain hiking' });
      const factB = await memory.semantic.remember(SCOPE, { text: 'allergic to peanuts' });
      const fetched = await memory.semantic.get(SCOPE, factA.id);
      expect(fetched?.text).toBe('enjoys mountain hiking');

      const hits = await memory.semantic.search(SCOPE, 'hiking');
      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0]?.signals?.rrf).toBeGreaterThan(0);

      await memory.episodic.record(SCOPE, {
        summary: 'Walked the riverside trail at dawn.',
        startedAt: new Date(0).toISOString(),
        endedAt: new Date(60_000).toISOString(),
        importance: 0.5,
      });
      const epi = await memory.episodic.search(SCOPE, 'riverside');
      expect(epi.length).toBe(1);

      await memory.procedural.define(SCOPE, { text: 'Greet the user by name on the first turn.' });
      expect((await memory.procedural.list(SCOPE)).length).toBe(1);

      // Forget vs purge: forget soft-deletes, purge hard-deletes.
      await memory.semantic.forget(SCOPE, factB.id);
      await memory.semantic.purge(SCOPE, factA.id);
      expect(await memory.semantic.get(SCOPE, factA.id)).toBeNull();
      expect(await memory.semantic.get(SCOPE, factB.id)).toBeNull();
    } finally {
      await sqlite.close();
    }
  });

  it('compile + metadata produce the deterministic minimum-viable rendering', async () => {
    const sqlite = await makeStore();
    try {
      const memory = createMemory({
        store: sqlite.memory,
        embeddings: sqlite.embeddings,
        workingBlocks: [defineBlock({ label: 'persona', charLimit: 200 })],
      });
      await memory.working.write(SCOPE, 'persona', 'Friendly');
      await memory.procedural.define(SCOPE, {
        text: 'Always cite sources when answering factual questions.',
        priority: 90,
      });
      const blocks = await memory.compile(SCOPE);
      expect(blocks.workingBlocks).toContain('label="persona"');
      expect(blocks.rules).toContain('Always cite sources');
      expect(blocks.metadata).toContain('Active rules: 1');
      const meta = await memory.metadata(SCOPE);
      expect(meta.workingBlockCount).toBe(1);
      expect(meta.activeRuleCount).toBe(1);
    } finally {
      await sqlite.close();
    }
  });

  it('embedded writes pass the per-record embedder_id through to the adapter', async () => {
    const sqlite = await makeStore({ withVec: true });
    try {
      const embedder = createStubEmbedder({ id: 'stub:hash@8', dim: 8 });
      const memory = createMemory({
        store: sqlite.memory,
        embeddings: sqlite.embeddings,
        embedder,
      });
      const fact = await memory.semantic.remember(SCOPE, { text: 'embedded fact' });
      // The semantic.get path round-trips through the adapter — proves
      // the embedded write succeeded without raising the unknown-id
      // guard.
      const fetched = await memory.semantic.get(SCOPE, fact.id);
      expect(fetched?.text).toBe('embedded fact');
      const allEmbedders = sqlite.embeddings.listAll();
      expect(allEmbedders.find((r) => r.id === 'stub:hash@8')).toBeDefined();
    } finally {
      await sqlite.close();
    }
  });

  it('session.shouldCompact consults totalCachedTokens on the sqlite adapter', async () => {
    const sqlite = await makeStore();
    try {
      const memory = createMemory({
        store: sqlite.memory,
        embeddings: sqlite.embeddings,
      });
      const r = await memory.session.push(SCOPE, { role: 'user', content: 'hi' });
      // Manually populate the token-count cache via a direct SQL
      // update — the adapter exposes the cache column per DEC-131
      // even though the public push() call leaves it null.
      sqlite.connection.run('UPDATE session_messages SET token_count = ? WHERE id = ?', [
        95,
        r.messageId,
      ]);
      expect(await memory.session.shouldCompact(SCOPE, 100)).toBe(true);
      sqlite.connection.run('UPDATE session_messages SET token_count = ? WHERE id = ?', [
        5,
        r.messageId,
      ]);
      expect(await memory.session.shouldCompact(SCOPE, 100)).toBe(false);
    } finally {
      await sqlite.close();
    }
  });

  it('phase 10b: pipeline writes audit rows + pending queue against the sqlite adapter', async () => {
    const sqlite = await makeStore({ withVec: true });
    try {
      const embedder = createStubEmbedder({ id: 'stub:hash@8', dim: 8 });
      const memory = createMemory({
        store: sqlite.memory,
        embeddings: sqlite.embeddings,
        embedder,
      });
      const a = await memory.semantic.rememberWithDecision(SCOPE, {
        text: 'Lives in Boston.',
      });
      expect(a.decision.kind).toBe('admit');
      const b = await memory.semantic.rememberWithDecision(SCOPE, {
        text: 'I just moved to Seattle for the new job.',
      });
      expect(b.decision.kind === 'supersede' || b.decision.kind === 'pending').toBe(true);
      // The store-side conflict surface persisted both decisions.
      const recent = await sqlite.memory.conflicts.listRecentDecisions(SCOPE, 10);
      expect(recent.length).toBeGreaterThanOrEqual(2);
      // Every recorded row carries the canonical pipeline stage labels.
      expect(
        recent.every((row) =>
          [
            'exact-dedup',
            'embedding-three-zone',
            'heuristic-regex',
            'subject-predicate',
            'defer-to-deep',
          ].includes(row.stage),
        ),
      ).toBe(true);
    } finally {
      await sqlite.close();
    }
  });

  it('the eleven memory tools register with stable names and metadata', async () => {
    const sqlite = await makeStore();
    try {
      const memory = createMemory({
        store: sqlite.memory,
        embeddings: sqlite.embeddings,
        resolveScope: () => SCOPE,
      });
      expect(memory.tools.length).toBe(11);
      const names = memory.tools.map((t) => t.name);
      expect(names).toEqual([
        'block_append',
        'block_replace',
        'block_rethink',
        'fact_remember',
        'fact_search',
        'fact_supersede',
        'fact_forget',
        'recall_episodes',
        'conversation_search',
        'fact_history',
        'fact_validate',
      ]);
      // Memory-modification guard tier annotation per DEC-153.
      const byName = Object.fromEntries(memory.tools.map((t) => [t.name, t]));
      expect(byName.fact_remember?.memoryGuardTier).toBe('memory-aware');
      expect(byName.fact_search?.memoryGuardTier).toBe('pure');
      expect(byName.fact_history?.memoryGuardTier).toBe('pure');
      expect(byName.fact_validate?.memoryGuardTier).toBe('memory-aware');
    } finally {
      await sqlite.close();
    }
  });
});
