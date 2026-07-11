/**
 * E-21 (S-24/16): `stop()` must only close stores the server created
 * itself. A caller-injected store is caller-owned - closing it broke
 * the documented shared-store restartFactory pattern (the second
 * `createServer({ store })` crashed with 'The database connection is
 * not open').
 *
 * The module mock wraps `createSqliteStore` so the test can reach the
 * store `createServer` builds internally and observe its closure.
 */

import type { GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';

const captured = vi.hoisted(() => ({ stores: [] as unknown[] }));

vi.mock('@graphorin/store-sqlite', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@graphorin/store-sqlite')>();
  const wrapped: typeof actual.createSqliteStore = async (options) => {
    const store = await actual.createSqliteStore(options);
    captured.stores.push(store);
    return store;
  };
  return { ...actual, createSqliteStore: wrapped };
});

// The mocked module re-exports the wrapped factory, so this import
// resolves to the capture-aware version.
import { createSqliteStore } from '@graphorin/store-sqlite';

let server: GraphorinServer | undefined;

afterEach(async () => {
  if (server !== undefined) {
    await server.stop().catch(() => {});
    server = undefined;
  }
  for (const store of captured.stores as GraphorinSqliteStore[]) {
    await store.close().catch(() => {});
  }
  captured.stores.length = 0;
});

const BASE_CONFIG = {
  auth: { kind: 'none' },
  server: {
    rateLimit: { enabled: false },
    csrf: { enabled: false },
    ws: { enabled: false },
    sse: { enabled: false },
  },
} as const;

describe('store ownership across stop() (E-21)', () => {
  it('leaves a caller-injected store open after stop()', async () => {
    const store = await createSqliteStore({
      path: ':memory:',
      mode: 'lib',
      skipSqliteVec: true,
      disableWalHardening: true,
    });
    await store.init();

    server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: { ...BASE_CONFIG, storage: { path: ':memory:', mode: 'lib' } },
    });
    await server.start();
    await server.stop();
    server = undefined;

    // Regression: stop() used to close the injected store here.
    expect(store.connection.get('SELECT 1 AS ok')).toEqual({ ok: 1 });

    // The documented restart pattern: the same store boots a second server.
    server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: { ...BASE_CONFIG, storage: { path: ':memory:', mode: 'lib' } },
    });
    await server.start();
    await server.stop();
    server = undefined;
    expect(store.connection.get('SELECT 1 AS ok')).toEqual({ ok: 1 });
  });

  it('closes a server-created store on stop()', async () => {
    const before = captured.stores.length;
    server = await createServer({
      skipHardening: true,
      skipListen: true,
      config: { ...BASE_CONFIG, storage: { path: ':memory:', mode: 'lib' } },
    });
    expect(captured.stores.length).toBe(before + 1);
    const owned = captured.stores[before] as GraphorinSqliteStore;

    await server.start();
    expect(owned.connection.get('SELECT 1 AS ok')).toEqual({ ok: 1 });
    await server.stop();
    server = undefined;

    expect(() => owned.connection.get('SELECT 1 AS ok')).toThrow(/not open/i);
  });
});
