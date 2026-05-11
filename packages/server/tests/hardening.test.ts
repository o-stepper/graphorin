import { _resetHardeningStatusForTesting, getHardeningStatus } from '@graphorin/security/hardening';
import { _resetResolversForTesting, installBuiltinResolvers } from '@graphorin/security/secrets';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, describe, expect, it } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';

const PEPPER_ENV = 'GRAPHORIN_HARDEN_TEST_PEPPER';

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
  delete process.env[PEPPER_ENV];
  _resetHardeningStatusForTesting();
});

describe('Process hardening (DEC-135)', () => {
  it('createServer({}).start() invokes applyProcessHardening in beforeStart', async () => {
    _resetHardeningStatusForTesting();
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env[PEPPER_ENV] = 'harden-test-pepper-bytes-9XaQ7uvP';
    store = await createSqliteStore({
      path: ':memory:',
      mode: 'lib',
      skipSqliteVec: true,
      disableWalHardening: true,
    });
    expect(getHardeningStatus()).toBeUndefined();
    server = await createServer({
      store,
      // Note: skipHardening is NOT set; the default path runs.
      skipListen: true,
      config: {
        auth: { kind: 'token', pepperRef: `env:${PEPPER_ENV}` },
        storage: { path: ':memory:', mode: 'lib' },
        // Disable refuse-as-root so test users that happen to be root in
        // CI sandboxes don't trip the guard. Real production deploys
        // keep the documented `refuseRoot: true` default.
        hardening: { refuseRoot: false },
      },
    });
    await server.start();
    const status = getHardeningStatus();
    expect(status).toBeDefined();
    expect(status?.applied).toBe(true);
    expect(status?.umask).toBe(0o077);
  });

  it('skipHardening: true bypasses the helper for tests', async () => {
    _resetHardeningStatusForTesting();
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env[PEPPER_ENV] = 'harden-test-pepper-bytes-9XaQ7uvP';
    store = await createSqliteStore({
      path: ':memory:',
      mode: 'lib',
      skipSqliteVec: true,
      disableWalHardening: true,
    });
    server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'token', pepperRef: `env:${PEPPER_ENV}` },
        storage: { path: ':memory:', mode: 'lib' },
      },
    });
    await server.start();
    expect(getHardeningStatus()).toBeUndefined();
  });
});
