/**
 * B3 (item 15): the per-turn security verdict round-trips through the
 * session_messages verdict_json column (migration 035) and degrades
 * to 'no verdict' on malformed rows.
 */
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { RunTurnVerdict } from '@graphorin/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSqliteStore, type GraphorinSqliteStore } from '../src/index.js';

const SCOPE = { userId: 'alex', sessionId: 's1' };

/** The cursor-aware reader is an Ext-level optional; type it structurally. */
type SessionReaderExt = {
  listMessagesSince?(
    scope: typeof SCOPE,
    lastMessageId: string | null,
    limit: number,
  ): Promise<ReadonlyArray<{ readonly verdict?: RunTurnVerdict }>>;
};

async function makeStore(): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-session-verdict-'));
  const store = await createSqliteStore({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
  await store.init();
  return store;
}

describe('session message verdict persistence', () => {
  let store: GraphorinSqliteStore;
  beforeEach(async () => {
    store = await makeStore();
  });

  it('push({ verdict }) round-trips through listMessagesSince', async () => {
    await store.memory.session.push(SCOPE, { role: 'user', content: 'clean turn' });
    await store.memory.session.push(
      SCOPE,
      { role: 'user', content: 'blocked turn' },
      { verdict: { guardrail: 'block', dataflowFlags: ['untrusted-to-sink'] } },
    );
    const session = store.memory.session as typeof store.memory.session & SessionReaderExt;
    expect(session.listMessagesSince).toBeDefined();
    const rows = await session.listMessagesSince?.(SCOPE, null, 10);
    expect(rows).toHaveLength(2);
    expect(rows?.[0]?.verdict).toBeUndefined();
    expect(rows?.[1]?.verdict).toEqual({
      guardrail: 'block',
      dataflowFlags: ['untrusted-to-sink'],
    });
  });

  it('a malformed verdict_json row degrades to no verdict instead of failing the read', async () => {
    const ref = await store.memory.session.push(SCOPE, { role: 'user', content: 'turn' });
    store.connection.run('UPDATE session_messages SET verdict_json = ? WHERE id = ?', [
      '{not json',
      ref.messageId,
    ]);
    const session = store.memory.session as typeof store.memory.session & SessionReaderExt;
    const rows = await session.listMessagesSince?.(SCOPE, null, 10);
    expect(rows).toHaveLength(1);
    expect(rows?.[0]?.verdict).toBeUndefined();
    // Junk shapes are also dropped (not merely unparseable strings).
    store.connection.run('UPDATE session_messages SET verdict_json = ? WHERE id = ?', [
      JSON.stringify({ guardrail: 'explode', lateralLeak: 'yes' }),
      ref.messageId,
    ]);
    const rows2 = await session.listMessagesSince?.(SCOPE, null, 10);
    expect(rows2?.[0]?.verdict).toBeUndefined();
  });
});
