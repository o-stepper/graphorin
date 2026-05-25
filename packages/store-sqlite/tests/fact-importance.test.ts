import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Fact, SessionScope } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createSqliteStore, type GraphorinSqliteStore } from '../src/index.js';

const SCOPE: SessionScope = { userId: 'alex' };

async function makeStore(): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-importance-'));
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

interface DecayExt {
  get(id: string): Promise<Fact | null>;
  listForDecay(
    scope: SessionScope,
    limit?: number,
  ): Promise<
    ReadonlyArray<{
      readonly id: string;
      readonly importance: number | null;
      readonly status: string;
      readonly provenance: string | null;
      readonly archived: boolean;
    }>
  >;
  archiveFact(id: string, reason?: string): Promise<void>;
}

// Narrow cast to reach the X-1 decay extensions on the concrete adapter.
function decayExt(store: GraphorinSqliteStore): DecayExt {
  return store.memory.semantic as unknown as DecayExt;
}

describe('fact importance + decay row (X-1, migration 015)', () => {
  it('round-trips an importance hint through insert → get', async () => {
    const store = await makeStore();
    await store.memory.semantic.remember(fact('f1', 'likes climbing', { importance: 0.8 }));
    const got = await decayExt(store).get('f1');
    expect(got?.importance).toBeCloseTo(0.8, 5);
    await store.close();
  });

  it('leaves importance unset when no hint is supplied', async () => {
    const store = await makeStore();
    await store.memory.semantic.remember(fact('f2', 'no score'));
    const got = await decayExt(store).get('f2');
    expect(got?.importance).toBeUndefined();
    const [row] = await decayExt(store).listForDecay(SCOPE, 10);
    expect(row?.importance).toBeNull();
    await store.close();
  });

  it('surfaces importance / status / provenance on the decay row', async () => {
    const store = await makeStore();
    await store.memory.semantic.remember(
      fact('f3', 'tool-sourced detail', {
        importance: 0.3,
        status: 'quarantined',
        provenance: 'tool',
      }),
    );
    const rows = await decayExt(store).listForDecay(SCOPE, 10);
    const row = rows.find((r) => r.id === 'f3');
    expect(row?.importance).toBeCloseTo(0.3, 5);
    expect(row?.status).toBe('quarantined');
    expect(row?.provenance).toBe('tool');
    expect(row?.archived).toBe(false);
    await store.close();
  });

  it('archiveFact is recoverable — flags archived without deleting the row', async () => {
    const store = await makeStore();
    await store.memory.semantic.remember(fact('f4', 'soon archived'));
    await decayExt(store).archiveFact('f4', 'capacity_exceeded');

    const row = (await decayExt(store).listForDecay(SCOPE, 10)).find((r) => r.id === 'f4');
    expect(row?.archived).toBe(true);
    // Soft archive, not a purge: the row survives and is still fetchable.
    expect(await decayExt(store).get('f4')).not.toBeNull();
    await store.close();
  });
});
