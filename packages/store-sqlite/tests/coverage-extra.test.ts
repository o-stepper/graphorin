import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CipherPeerMissingError,
  createSqliteStore,
  type GraphorinSqliteStore,
  openAuditDatabase,
} from '../src/index.js';

async function makeStore(): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-extra-'));
  const store = await createSqliteStore({
    path: `${dir}/db.sqlite`,
    skipSqliteVec: true,
  });
  await store.init();
  return store;
}

describe('extra coverage', () => {
  it('audit-db: rejects encryption.enabled = false', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-audit-'));
    await expect(
      openAuditDatabase({
        path: `${dir}/audit.db`,
        encryption: { enabled: false } as never,
      }),
    ).rejects.toThrow(/encryption\.enabled = true/);
  });

  it('audit-db: opens with a stub driver and applies pragma key + WAL', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-audit-ok-'));
    const calls: string[] = [];
    class FakeDriver {
      open = true;
      inTransaction = false;
      constructor(public readonly path: string) {}
      pragma(stmt: string): unknown {
        calls.push(stmt);
        return null;
      }
      exec(): void {}
      prepare() {
        return {
          run: () => ({ changes: 0, lastInsertRowid: 0 }),
          get: () => undefined,
          all: () => [],
          iterate: () => [].values() as IterableIterator<unknown>,
          pluck() {
            return this;
          },
          raw() {
            return this;
          },
          expand() {
            return this;
          },
          bind() {
            return this;
          },
        };
      }
      transaction<T extends (...args: unknown[]) => unknown>(fn: T): T {
        return fn;
      }
      close(): void {
        this.open = false;
      }
      loadExtension(): void {}
    }
    const handle = await openAuditDatabase({
      path: `${dir}/audit.db`,
      encryption: {
        enabled: true,
        passphraseResolver: async () => 'secret',
      },
      driver: FakeDriver as never,
    });
    expect(handle.path).toMatch(/audit\.db$/);
    expect(calls.find((c) => c.startsWith('key ='))).toBe("key = 'secret'");
    expect(calls).toContain('journal_mode = WAL');
    expect(calls).toContain('foreign_keys = ON');
    handle.close();
  });

  it('CipherPeerMissingError preserves cause', () => {
    const cause = new Error('inner');
    const err = new CipherPeerMissingError('outer', { cause });
    expect(err.cause).toBe(cause);
  });

  it('checkpoints: putWrites + getTuple surfaces pending writes', async () => {
    const store = await makeStore();
    const cp = {
      id: 'cp-1',
      threadId: 't1',
      namespace: 'ns',
      state: { x: 1 },
      channelVersions: { x: 1 },
      stepNumber: 1,
      createdAt: new Date().toISOString(),
    };
    await store.checkpoints.put('t1', 'ns', cp, { source: 'sync', status: 'running' });
    await store.checkpoints.putWrites(
      't1',
      'ns',
      'cp-1',
      [
        { taskId: 'task-A', index: 0, channel: 'state', value: 1 },
        { taskId: 'task-A', index: 1, channel: 'logs', value: 'hello' },
      ],
      'task-A',
    );
    const tuple = await store.checkpoints.getTuple('t1', 'ns');
    expect(tuple?.pendingWrites?.length).toBe(2);
  });

  it('checkpoints: list with status filter', async () => {
    const store = await makeStore();
    for (let i = 1; i <= 3; i++) {
      await store.checkpoints.put(
        't1',
        'ns',
        {
          id: `cp-${i}`,
          threadId: 't1',
          namespace: 'ns',
          state: {},
          channelVersions: {},
          stepNumber: i,
          createdAt: new Date(i * 1000).toISOString(),
        },
        { source: 'sync', status: i === 2 ? 'completed' : 'running' },
      );
    }
    const tuples: unknown[] = [];
    for await (const t of store.checkpoints.list('t1', 'ns', { status: 'completed' })) {
      tuples.push(t);
    }
    expect(tuples.length).toBe(1);
  });

  it('sessions: updateSession + closeSession + listSessions filtering', async () => {
    const store = await makeStore();
    const created = new Date().toISOString();
    await store.sessions.createSession({
      id: 's1',
      userId: 'u1',
      agentId: 'a',
      title: 'first',
      createdAt: created,
    });
    await store.sessions.updateSession('s1', { title: 'second', tags: ['x'] });
    const got = await store.sessions.getSession('s1');
    expect(got?.title).toBe('second');
    expect(got?.tags).toEqual(['x']);
    await store.sessions.closeSession('s1', new Date().toISOString());
    expect((await store.sessions.getSession('s1'))?.closedAt).toBeDefined();
    const list = await store.sessions.listSessions({ userId: 'u1', agentId: 'a' });
    expect(list.length).toBe(1);
  });

  it('sessions: retireAgent and attach/list workflow runs', async () => {
    const store = await makeStore();
    const t = new Date().toISOString();
    await store.sessions.registerAgent({
      id: 'r1',
      displayName: 'Retired',
      registeredAt: t,
    });
    await store.sessions.retireAgent('r1', new Date().toISOString());
    expect((await store.sessions.resolveAgent('r1'))?.retiredAt).toBeDefined();
    await store.sessions.attachWorkflowRun({
      sessionId: 's1',
      workflowId: 'wf-1',
      threadId: 'th-1',
      status: 'running',
      attachedAt: t,
    });
    const runs = await store.sessions.listWorkflowRuns('s1');
    expect(runs.length).toBe(1);
  });

  it('triggers: list returns rows + roundtrip preserves catchup options', async () => {
    const store = await makeStore();
    await store.triggers.upsert({
      id: 't1',
      kind: 'interval',
      spec: '60000',
      callbackRef: 'tools.poll',
      missedFires: 0,
      disabled: false,
      catchupPolicy: 'all',
      maxCatchupRuns: 10,
      catchupWindowMs: 3600000,
      tags: ['demo'],
      createdAt: new Date().toISOString(),
    });
    const got = await store.triggers.get('t1');
    expect(got?.catchupPolicy).toBe('all');
    expect(got?.maxCatchupRuns).toBe(10);
    expect(got?.tags).toEqual(['demo']);
    const list = await store.triggers.list();
    expect(list.length).toBe(1);
  });

  it('embedder registry: registerOrReturn is idempotent for matching configHash', async () => {
    const store = await makeStore();
    const first = store.embeddings.registerOrReturn({
      id: 'transformersjs:m@8',
      embedderKind: 'transformersjs',
      model: 'm',
      dim: 8,
      configHash: 'cfg',
    });
    const second = store.embeddings.registerOrReturn({
      id: 'transformersjs:m@8',
      embedderKind: 'transformersjs',
      model: 'm',
      dim: 8,
      configHash: 'cfg',
    });
    expect(second.id).toBe(first.id);
    expect(store.embeddings.listAll().length).toBe(1);
  });

  it('embedder registry: rejects same id with different configHash', async () => {
    const store = await makeStore();
    store.embeddings.registerOrReturn({
      id: 'transformersjs:m@8',
      embedderKind: 'transformersjs',
      model: 'm',
      dim: 8,
      configHash: 'cfg',
    });
    expect(() =>
      store.embeddings.registerOrReturn({
        id: 'transformersjs:m@8',
        embedderKind: 'transformersjs',
        model: 'm',
        dim: 8,
        configHash: 'different',
      }),
    ).toThrow(/different configHash/);
  });

  it('embedder registry: retire marks embedder retired', async () => {
    const store = await makeStore();
    store.embeddings.registerOrReturn({
      id: 'transformersjs:r@8',
      embedderKind: 'transformersjs',
      model: 'r',
      dim: 8,
      configHash: 'cfg',
    });
    store.embeddings.retire('transformersjs:r@8');
    expect(store.embeddings.listActive().length).toBe(0);
  });

  it('idempotency: prune returns 0 when nothing matches', async () => {
    const store = await makeStore();
    expect(await store.idempotency.prune(0)).toBe(0);
  });
});
