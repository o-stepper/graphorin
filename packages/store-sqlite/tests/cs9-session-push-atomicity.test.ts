import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { createSqliteStore, type GraphorinSqliteStore } from '../src/index.js';

/**
 * CS-9 - `session_messages.push` must be atomic (the message row and its FTS
 * row commit together or not at all) and `(scope_session_id, sequence)` must be
 * unique so two processes can't silently mint duplicate sequences.
 */
async function makeStore(): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cs9-'));
  const store = await createSqliteStore({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
  await store.init();
  return store;
}

const scope = { userId: 'alex', sessionId: 's1' };

describe('CS-9 - session push atomicity + sequence uniqueness', () => {
  it('rolls the message back when the FTS insert fails (no committed message without FTS)', async () => {
    const store = await makeStore();
    const realRun = store.connection.run.bind(store.connection);
    // Inject a failure into the FTS insert leg of push.
    (store.connection as { run: typeof store.connection.run }).run = (
      sql: string,
      params?: ReadonlyArray<unknown>,
    ) => {
      if (sql.includes('session_messages_fts')) throw new Error('boom: fts insert failed');
      return realRun(sql, params);
    };

    await expect(
      store.memory.session.push(scope, { role: 'user', content: 'searchable text' }),
    ).rejects.toThrow('boom');

    (store.connection as { run: typeof store.connection.run }).run = realRun;
    const count = store.connection.get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM session_messages WHERE scope_session_id = ?',
      ['s1'],
    );
    expect(count?.n).toBe(0); // the message row was rolled back with the FTS failure
    await store.close();
  });

  it('rejects a duplicate (scope_session_id, sequence) at the schema level', async () => {
    const store = await makeStore();
    await store.memory.session.push(scope, { role: 'user', content: 'first' });
    await store.memory.session.push(scope, { role: 'assistant', content: 'second' });
    // A second process racing MAX+1 could compute sequence 1 again - the schema
    // must reject the duplicate instead of silently storing it.
    expect(() =>
      store.connection.run(
        `INSERT INTO session_messages (id, scope_user_id, scope_session_id, role, content_json, sequence, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['dup', 'alex', 's1', 'user', '"dup"', 1, Date.now()],
      ),
    ).toThrow(/UNIQUE|constraint/i);
    await store.close();
  });
});
