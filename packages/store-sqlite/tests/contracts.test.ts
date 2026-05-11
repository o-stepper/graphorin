import { mkdtemp } from 'node:fs/promises';
import type {
  AuthTokenStore,
  CheckpointStore,
  MemoryStore,
  OAuthServerStore,
  SessionStore,
  TriggerStore,
} from '@graphorin/core/contracts';
import { describe, expect, it } from 'vitest';
import {
  createSqliteStore,
  type IdempotencyStore,
  SqliteAuthTokenStore,
  SqliteCheckpointStore,
  SqliteIdempotencyStore,
  SqliteMemoryStore,
  SqliteOAuthServerStore,
  SqliteSessionStore,
  SqliteTriggerStore,
} from '../src/index.js';

/**
 * Compile-time + runtime conformance: every concrete store class must
 * be assignable to the corresponding `@graphorin/core/contracts`
 * interface. The `satisfies` check below fails to typecheck if the
 * surface drifts; the runtime assertions verify each method is
 * actually present on the prototype.
 */
describe('contract conformance (DoD #16)', () => {
  it('SqliteMemoryStore satisfies MemoryStore', async () => {
    const dir = await mkdtemp('/tmp/graphorin-contract-mem-');
    const store = await createSqliteStore({
      path: `${dir}/db.sqlite`,
      skipSqliteVec: true,
    });
    await store.init();
    const memory: MemoryStore = store.memory;
    expect(memory).toBeInstanceOf(SqliteMemoryStore);
    expect(memory.working).toBeDefined();
    expect(memory.session).toBeDefined();
    expect(memory.episodic).toBeDefined();
    expect(memory.semantic).toBeDefined();
    expect(memory.procedural).toBeDefined();
    expect(memory.shared).toBeDefined();
    expect(typeof memory.init).toBe('function');
    expect(typeof memory.close).toBe('function');
    await store.close();
  });

  it('SqliteCheckpointStore satisfies CheckpointStore', async () => {
    const dir = await mkdtemp('/tmp/graphorin-contract-cp-');
    const store = await createSqliteStore({
      path: `${dir}/db.sqlite`,
      skipSqliteVec: true,
    });
    await store.init();
    const checkpoints: CheckpointStore = store.checkpoints;
    expect(checkpoints).toBeInstanceOf(SqliteCheckpointStore);
    for (const m of ['put', 'putWrites', 'getTuple', 'list', 'deleteThread'] as const) {
      expect(typeof checkpoints[m]).toBe('function');
    }
    await store.close();
  });

  it('SqliteSessionStore satisfies SessionStore', async () => {
    const dir = await mkdtemp('/tmp/graphorin-contract-sess-');
    const store = await createSqliteStore({
      path: `${dir}/db.sqlite`,
      skipSqliteVec: true,
    });
    await store.init();
    const sessions: SessionStore = store.sessions;
    expect(sessions).toBeInstanceOf(SqliteSessionStore);
    for (const m of [
      'createSession',
      'getSession',
      'listSessions',
      'updateSession',
      'closeSession',
      'registerAgent',
      'retireAgent',
      'resolveAgent',
      'appendHandoff',
      'listHandoffs',
      'attachWorkflowRun',
      'listWorkflowRuns',
    ] as const) {
      expect(typeof sessions[m]).toBe('function');
    }
    await store.close();
  });

  it('SqliteTriggerStore satisfies TriggerStore', async () => {
    const dir = await mkdtemp('/tmp/graphorin-contract-trig-');
    const store = await createSqliteStore({
      path: `${dir}/db.sqlite`,
      skipSqliteVec: true,
    });
    await store.init();
    const triggers: TriggerStore = store.triggers;
    expect(triggers).toBeInstanceOf(SqliteTriggerStore);
    for (const m of ['upsert', 'get', 'list', 'remove', 'recordFire'] as const) {
      expect(typeof triggers[m]).toBe('function');
    }
    await store.close();
  });

  it('SqliteAuthTokenStore satisfies AuthTokenStore', async () => {
    const dir = await mkdtemp('/tmp/graphorin-contract-tok-');
    const store = await createSqliteStore({
      path: `${dir}/db.sqlite`,
      skipSqliteVec: true,
    });
    await store.init();
    const auth: AuthTokenStore = store.authTokens;
    expect(auth).toBeInstanceOf(SqliteAuthTokenStore);
    for (const m of ['put', 'get', 'list', 'revoke', 'recordUse'] as const) {
      expect(typeof auth[m]).toBe('function');
    }
    await store.close();
  });

  it('SqliteOAuthServerStore satisfies OAuthServerStore', async () => {
    const dir = await mkdtemp('/tmp/graphorin-contract-oauth-');
    const store = await createSqliteStore({
      path: `${dir}/db.sqlite`,
      skipSqliteVec: true,
    });
    await store.init();
    const oauth: OAuthServerStore = store.oauthServers;
    expect(oauth).toBeInstanceOf(SqliteOAuthServerStore);
    for (const m of ['put', 'get', 'list', 'update', 'delete'] as const) {
      expect(typeof oauth[m]).toBe('function');
    }
    await store.close();
  });

  it('SqliteIdempotencyStore satisfies the IdempotencyStore contract', async () => {
    const dir = await mkdtemp('/tmp/graphorin-contract-idem-');
    const store = await createSqliteStore({
      path: `${dir}/db.sqlite`,
      skipSqliteVec: true,
    });
    await store.init();
    const idem: IdempotencyStore = store.idempotency;
    expect(idem).toBeInstanceOf(SqliteIdempotencyStore);
    for (const m of ['put', 'get', 'delete', 'prune'] as const) {
      expect(typeof idem[m]).toBe('function');
    }
    await store.close();
  });
});
