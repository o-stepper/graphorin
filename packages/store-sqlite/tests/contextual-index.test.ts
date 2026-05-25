/**
 * Tests for contextual retrieval at the storage layer (P1-3). The
 * `rememberWithEmbedding({ indexText })` option must index the FTS5 row
 * against the context-prepended text while persisting the canonical
 * `facts.text` (the value shown to the user / audit trail) unchanged, so
 * a terse fact becomes findable by a token that only appears in its
 * situating context.
 */

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Fact, SessionScope } from '@graphorin/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { openConnection } from '../src/connection.js';
import { EmbeddingMetaRepository } from '../src/embedding-meta-repo.js';
import { SqliteMemoryStore } from '../src/memory-store.js';
import { runMigrations } from '../src/migrations/runner.js';

const SCOPE: SessionScope = { userId: 'alex', sessionId: 's1' };

async function makeStore(): Promise<SqliteMemoryStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-ctxidx-'));
  const conn = await openConnection({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
  runMigrations(conn);
  const store = new SqliteMemoryStore(conn, new EmbeddingMetaRepository(conn, 'multi-active'));
  await store.init();
  return store;
}

let counter = 0;
function mkFact(over: Partial<Fact> = {}): Fact {
  counter += 1;
  const now = new Date().toISOString();
  return {
    id: `fact_${counter}`,
    kind: 'semantic',
    userId: SCOPE.userId,
    sessionId: SCOPE.sessionId,
    sensitivity: 'internal',
    text: 'moved there in March',
    validFrom: now,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    ...over,
  };
}

describe('contextual retrieval — storage layer (P1-3)', () => {
  let store: SqliteMemoryStore;
  beforeEach(async () => {
    store = await makeStore();
  });

  it('indexes the FTS row against indexText while persisting canonical text', async () => {
    const fact = mkFact({
      id: 'fact_ctx',
      text: 'moved there in March',
    });
    await store.semantic.rememberWithEmbedding(fact, {
      indexText: '[Context: Anna relocation] moved there in March',
    });

    // The contextual token ("Anna") is findable even though it is absent
    // from the canonical text.
    const byContext = await store.semantic.search(SCOPE, { query: 'Anna', topK: 5 });
    expect(byContext.map((h) => h.record.id)).toContain('fact_ctx');

    // The canonical text token still matches.
    const byText = await store.semantic.search(SCOPE, { query: 'March', topK: 5 });
    expect(byText.map((h) => h.record.id)).toContain('fact_ctx');

    // …but the stored / returned text is the canonical one, never the prefix.
    const got = await store.semantic.get('fact_ctx');
    expect(got?.text).toBe('moved there in March');
    expect(byContext[0]?.record.text).toBe('moved there in March');
  });

  it('without indexText the bare text is indexed (pre-P1-3 behaviour)', async () => {
    const fact = mkFact({ id: 'fact_plain', text: 'moved there in March' });
    await store.semantic.rememberWithEmbedding(fact);

    const byContext = await store.semantic.search(SCOPE, { query: 'Anna', topK: 5 });
    expect(byContext.map((h) => h.record.id)).not.toContain('fact_plain');

    const byText = await store.semantic.search(SCOPE, { query: 'March', topK: 5 });
    expect(byText.map((h) => h.record.id)).toContain('fact_plain');
  });

  it('remember() (no options) indexes the canonical text', async () => {
    const fact = mkFact({ id: 'fact_remember', text: 'enjoys hiking on weekends' });
    await store.semantic.remember(fact);
    const hit = await store.semantic.search(SCOPE, { query: 'hiking', topK: 5 });
    expect(hit.map((h) => h.record.id)).toContain('fact_remember');
  });
});
