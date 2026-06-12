import { _resetResolversForTesting, installBuiltinResolvers } from '@graphorin/security/secrets';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { createScheduler } from '@graphorin/triggers';
import { afterEach, describe, expect, it } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';
import type { ConsolidatorLike, ConsolidatorStatusLike } from '../src/consolidator/daemon.js';
import {
  LifecycleDoubleStartError,
  LifecycleNotStartedError,
  PrebindEncryptionPeerMissingError,
  PrebindEncryptionRequiredError,
  PrebindPepperMissingError,
  PrebindSecretUnresolvableError,
} from '../src/errors/index.js';

let store: GraphorinSqliteStore | undefined;
let server: GraphorinServer | undefined;

afterEach(async () => {
  if (server !== undefined) {
    await server.stop().catch(() => {});
    server = undefined;
  }
  if (store !== undefined) {
    await store.close().catch(() => {});
    store = undefined;
  }
});

async function buildStore(): Promise<GraphorinSqliteStore> {
  return await createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
}

describe('Lifecycle pre-bind fail-fast', () => {
  it('rejects when auth.pepperRef is unresolvable', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    store = await buildStore();
    server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'token', pepperRef: 'env:DEFINITELY_DOES_NOT_EXIST_PEPPER_3729' },
        storage: { path: ':memory:', mode: 'lib' },
      },
    });
    await expect(server.start()).rejects.toBeInstanceOf(PrebindSecretUnresolvableError);
  });

  it('rejects when auth.pepperRef is empty', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    store = await buildStore();
    server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'token' },
        storage: { path: ':memory:', mode: 'lib' },
      },
    });
    await expect(server.start()).rejects.toBeInstanceOf(PrebindPepperMissingError);
  });

  it('rejects when storage.encryption.enabled = true but no passphraseRef', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    store = await buildStore();
    server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'none' },
        storage: { path: ':memory:', mode: 'lib', encryption: { enabled: true } },
      },
    });
    await expect(server.start()).rejects.toBeInstanceOf(PrebindEncryptionRequiredError);
  });

  it('rejects when audit.enabled = true but no passphraseRef', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    store = await buildStore();
    server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'none' },
        storage: { path: ':memory:', mode: 'lib' },
        audit: { enabled: true },
      },
    });
    await expect(server.start()).rejects.toBeInstanceOf(PrebindEncryptionRequiredError);
  });

  it('rejects when the cipher peer probe fails', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env.GRAPHORIN_LIFECYCLE_PEPPER = 'lifecycle-pepper-bytes-9XaQ7uvP';
    process.env.GRAPHORIN_LIFECYCLE_PASSPHRASE = 'lifecycle-passphrase-2pKqM';
    store = await buildStore();
    server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      probeCipherPeer: async () => {
        throw new Error('cipher peer not installed');
      },
      config: {
        auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_LIFECYCLE_PEPPER' },
        storage: {
          path: ':memory:',
          mode: 'lib',
          encryption: { enabled: true, passphraseRef: 'env:GRAPHORIN_LIFECYCLE_PASSPHRASE' },
        },
      },
    });
    await expect(server.start()).rejects.toBeInstanceOf(PrebindEncryptionPeerMissingError);
    delete process.env.GRAPHORIN_LIFECYCLE_PEPPER;
    delete process.env.GRAPHORIN_LIFECYCLE_PASSPHRASE;
  });

  it('Pre-bind errors carry an actionable hint pointing at graphorin doctor', () => {
    const a = new PrebindPepperMissingError();
    expect(a.hint).toContain('graphorin doctor');
    const b = new PrebindSecretUnresolvableError(['auth', 'pepperRef'], 'env:X');
    expect(b.hint).toContain('graphorin doctor');
  });
});

describe('Lifecycle hooks order', () => {
  it('fires beforeStart -> pre-bind -> migrations -> bind -> onReady', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env.GRAPHORIN_HOOKS_PEPPER = 'hooks-pepper-bytes-9XaQ7uvPyR';
    const calls: string[] = [];
    store = await buildStore();
    server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      hooks: {
        beforeStart: () => {
          calls.push('beforeStart');
        },
        onReady: () => {
          calls.push('onReady');
        },
      },
      config: {
        auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_HOOKS_PEPPER' },
        storage: { path: ':memory:', mode: 'lib' },
      },
    });
    await server.start();
    expect(calls).toEqual(['beforeStart', 'onReady']);
    expect(store.appliedMigrations.length).toBeGreaterThan(0);
    delete process.env.GRAPHORIN_HOOKS_PEPPER;
  });

  it('fires beforeShutdown on stop()', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env.GRAPHORIN_SHUTDOWN_PEPPER = 'shutdown-pepper-bytes-99vK';
    const calls: string[] = [];
    store = await buildStore();
    server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      hooks: {
        beforeShutdown: ({ inflight, drainTimeoutMs }) => {
          calls.push(`beforeShutdown:inflight=${inflight}:drain=${drainTimeoutMs}`);
        },
      },
      config: {
        auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_SHUTDOWN_PEPPER' },
        storage: { path: ':memory:', mode: 'lib' },
      },
    });
    await server.start();
    await server.stop();
    expect(calls.length).toBe(1);
    expect(calls[0]).toMatch(/^beforeShutdown:inflight=0:drain=/);
    delete process.env.GRAPHORIN_SHUTDOWN_PEPPER;
  });

  it('rejects double-start with LifecycleDoubleStartError', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env.GRAPHORIN_DOUBLE_PEPPER = 'double-pepper-bytes-9XaQ';
    store = await buildStore();
    server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_DOUBLE_PEPPER' },
        storage: { path: ':memory:', mode: 'lib' },
      },
    });
    await server.start();
    await expect(server.start()).rejects.toBeInstanceOf(LifecycleDoubleStartError);
    delete process.env.GRAPHORIN_DOUBLE_PEPPER;
  });

  it('rejects stop() when start() never resolved', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    store = await buildStore();
    server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'none' },
        storage: { path: ':memory:', mode: 'lib' },
      },
    });
    await expect(server.stop()).rejects.toBeInstanceOf(LifecycleNotStartedError);
  });
});

describe('Real listener boot', () => {
  it('binds an actual port, serves /v1/health, then drains on stop()', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env.GRAPHORIN_REAL_PEPPER = 'real-pepper-bytes-9XaQ7uvPyR4';
    store = await buildStore();
    server = await createServer({
      store,
      skipHardening: true,
      config: {
        auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_REAL_PEPPER' },
        storage: { path: ':memory:', mode: 'lib' },
        server: {
          host: '127.0.0.1',
          port: 0, // bind any free port
          rateLimit: { enabled: false },
          csrf: { enabled: false },
        },
      },
    });
    const { host, port } = await server.start();
    expect(port).toBeGreaterThan(0);
    const res = await fetch(`http://${host}:${port}/v1/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('ok');
    await server.stop();
    delete process.env.GRAPHORIN_REAL_PEPPER;
  });
});

describe('Consolidator trigger bridge (MCON-4)', () => {
  function spyConsolidator(): { consolidator: ConsolidatorLike; registeredWith: () => unknown } {
    let registeredWith: unknown = null;
    const status = async (): Promise<ConsolidatorStatusLike> => ({
      tier: 'free',
      running: false,
      paused: false,
      queueDepth: 0,
      dlqSize: 0,
      deferredRuns: 0,
      emptyExtractions: 0,
      budget: {
        tokensUsedToday: 0,
        costUsedToday: 0,
        tokensRemaining: 0,
        costRemaining: 0,
        resetAt: new Date(0).toISOString(),
      },
    });
    return {
      consolidator: {
        async start() {},
        async stop() {},
        status,
        async registerWithScheduler(scheduler) {
          registeredWith = scheduler;
          return { registered: [], skipped: [] };
        },
      },
      registeredWith: () => registeredWith,
    };
  }

  it('start() registers the consolidator on the triggers scheduler — no manual wiring (MCON-4)', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env.GRAPHORIN_HOOKS_PEPPER = 'hooks-pepper-bytes-9XaQ7uvPyR';
    store = await buildStore();
    const scheduler = createScheduler({ store: store.triggers, mode: 'server' });
    const spy = spyConsolidator();
    server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      triggers: { scheduler },
      consolidator: spy.consolidator,
      config: {
        auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_HOOKS_PEPPER' },
        storage: { path: ':memory:', mode: 'lib' },
      },
    });
    await server.start();
    // The server bridged the consolidator onto the scheduler in beforeStart.
    // Without it, nothing pipes triggers into the consolidator and background
    // consolidation never fires in server mode (the pre-fix bug).
    expect(spy.registeredWith()).toBe(scheduler);
    delete process.env.GRAPHORIN_HOOKS_PEPPER;
  });
});
