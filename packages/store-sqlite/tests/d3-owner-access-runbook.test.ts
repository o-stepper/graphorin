/**
 * D3 store-level tests: principal/owner dimension (migration 026),
 * the fact retrieval-access counter (migration 027), and the rules
 * FTS runbook index (migration 028).
 */

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Fact, Insight, MemoryHit, MemoryOwner, Rule, SessionScope } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createSqliteStore, type GraphorinSqliteStore } from '../src/index.js';

const SCOPE: SessionScope = { userId: 'alex' };

async function makeStore(): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-d3-'));
  const store = await createSqliteStore({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
  await store.init();
  return store;
}

function fact(id: string, text: string, extra: Partial<Fact> = {}): Fact {
  return {
    id,
    kind: 'semantic',
    userId: 'alex',
    sensitivity: 'internal',
    text,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...extra,
  };
}

function rule(id: string, text: string, extra: Partial<Rule> = {}): Rule {
  return {
    id,
    kind: 'procedural',
    userId: 'alex',
    sensitivity: 'public',
    text,
    priority: 50,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...extra,
  };
}

// Narrow casts to reach the optional storage extensions.
function semanticExt(store: GraphorinSqliteStore): {
  search(
    scope: SessionScope,
    opts: {
      query: string;
      topK?: number;
      owner?: MemoryOwner | ReadonlyArray<MemoryOwner>;
    },
  ): Promise<ReadonlyArray<MemoryHit<Fact>>>;
  get(id: string): Promise<Fact | null>;
  markAccessed(ids: ReadonlyArray<string>, accessedAt?: number): Promise<void>;
  listForDecay(
    scope: SessionScope,
    limit?: number,
  ): Promise<ReadonlyArray<{ id: string; accessCount: number; strength: number }>>;
} {
  return store.memory.semantic as unknown as ReturnType<typeof semanticExt>;
}

function insightsExt(store: GraphorinSqliteStore): {
  insert(insight: Insight): Promise<void>;
  list(
    scope: SessionScope,
    opts?: { includeQuarantined?: boolean },
  ): Promise<ReadonlyArray<Insight>>;
} {
  return (store.memory as unknown as { insights: ReturnType<typeof insightsExt> }).insights;
}

function proceduralExt(store: GraphorinSqliteStore): {
  search(
    scope: SessionScope,
    query: string,
    opts?: { topK?: number; includeQuarantined?: boolean },
  ): Promise<ReadonlyArray<MemoryHit<Rule>>>;
} {
  return store.memory.procedural as unknown as ReturnType<typeof proceduralExt>;
}

describe('D3 owner dimension (migration 026)', () => {
  it('round-trips owner on facts and treats NULL as user at filter time', async () => {
    const store = await makeStore();
    await store.memory.semantic.remember(fact('f-legacy', 'shared project fact alpha'));
    await store.memory.semantic.remember(
      fact('f-user', 'shared project fact beta', { owner: 'user' }),
    );
    await store.memory.semantic.remember(
      fact('f-agent', 'shared project fact gamma', { owner: 'agent' }),
    );

    const unfiltered = await semanticExt(store).search(SCOPE, { query: 'shared project' });
    expect(unfiltered.length).toBe(3);

    const users = await semanticExt(store).search(SCOPE, {
      query: 'shared project',
      owner: 'user',
    });
    // NULL owner (legacy row) is treated as 'user'.
    expect(users.map((h) => h.record.id).sort()).toEqual(['f-legacy', 'f-user']);

    const agents = await semanticExt(store).search(SCOPE, {
      query: 'shared project',
      owner: 'agent',
    });
    expect(agents.map((h) => h.record.id)).toEqual(['f-agent']);
    expect(agents[0]?.record.owner).toBe('agent');

    const both = await semanticExt(store).search(SCOPE, {
      query: 'shared project',
      owner: ['user', 'agent'],
    });
    expect(both.length).toBe(3);
    await store.close();
  });

  it('round-trips owner on episodes, rules, and insights', async () => {
    const store = await makeStore();
    await store.memory.episodic.put({
      id: 'e1',
      kind: 'episodic',
      userId: 'alex',
      sensitivity: 'internal',
      summary: 'weekly planning session',
      startedAt: '2024-01-01T00:00:00.000Z',
      endedAt: '2024-01-01T01:00:00.000Z',
      owner: 'agent',
      createdAt: '2024-01-01T01:00:00.000Z',
    });
    const [episode] = await store.memory.episodic.search(SCOPE, { query: 'planning' });
    expect(episode?.record.owner).toBe('agent');

    await store.memory.procedural.add(
      rule('r1', 'Always confirm before deleting', { owner: 'agent' }),
    );
    const rules = await store.memory.procedural.list(SCOPE);
    expect(rules[0]?.owner).toBe('agent');

    await insightsExt(store).insert({
      id: 'i1',
      kind: 'insight',
      userId: 'alex',
      sensitivity: 'internal',
      text: 'The user prefers evening sessions.',
      cites: ['e1'],
      salience: 2,
      provenance: 'reflection',
      status: 'quarantined',
      owner: 'agent',
      createdAt: '2024-01-01T01:00:00.000Z',
    });
    const insights = await insightsExt(store).list(SCOPE, { includeQuarantined: true });
    expect(insights[0]?.owner).toBe('agent');
    await store.close();
  });
});

describe('D3 fact access counter (migration 027)', () => {
  it('markAccessed increments access_count monotonically past the strength cap', async () => {
    const store = await makeStore();
    await store.memory.semantic.remember(fact('f1', 'access counting fixture'));
    const sem = semanticExt(store);
    for (let i = 0; i < 15; i++) {
      await sem.markAccessed(['f1'], 1_700_000_000_000 + i);
    }
    const [row] = await sem.listForDecay(SCOPE, 10);
    expect(row?.id).toBe('f1');
    // Strength saturates at 2.0 after ten bumps; the counter keeps going.
    expect(row?.strength).toBe(2.0);
    expect(row?.accessCount).toBe(15);
    await store.close();
  });
});

describe('D3 rules FTS runbook search (migration 028)', () => {
  it('matches rule text lexically and returns whole rules', async () => {
    const store = await makeStore();
    await store.memory.procedural.add(
      rule('r-deploy', 'Deploy the docs site\n1. build the site\n2. push to pages', {
        steps: ['build the site', 'push to pages'],
        variables: ['site'],
      }),
    );
    await store.memory.procedural.add(rule('r-other', 'Rotate the signing key quarterly'));

    const hits = await proceduralExt(store).search(SCOPE, 'deploy docs');
    expect(hits.length).toBe(1);
    expect(hits[0]?.record.id).toBe('r-deploy');
    expect(hits[0]?.record.steps).toEqual(['build the site', 'push to pages']);
    await store.close();
  });

  it('excludes quarantined procedures unless the inspector opts in', async () => {
    const store = await makeStore();
    await store.memory.procedural.add(
      rule('r-induced', 'Deploy the docs site via induced flow', {
        provenance: 'induction',
        status: 'quarantined',
      }),
    );
    const gated = await proceduralExt(store).search(SCOPE, 'deploy docs');
    expect(gated.length).toBe(0);
    const inspector = await proceduralExt(store).search(SCOPE, 'deploy docs', {
      includeQuarantined: true,
    });
    expect(inspector.map((h) => h.record.id)).toEqual(['r-induced']);
    await store.close();
  });

  it('does not resurface soft-deleted rules', async () => {
    const store = await makeStore();
    await store.memory.procedural.add(rule('r-gone', 'Deploy the legacy site'));
    await store.memory.procedural.remove('r-gone');
    const hits = await proceduralExt(store).search(SCOPE, 'deploy legacy');
    expect(hits.length).toBe(0);
    await store.close();
  });
});
