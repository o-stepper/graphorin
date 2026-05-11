/**
 * Boots a real `@graphorin/server` daemon for integration tests.
 * Lives in a fixture file so the import does not run during unit
 * test collection (the server module pulls in `better-sqlite3` and
 * other Node-only deps that the unit-mode mock-WebSocket suite does
 * not need).
 */

import { _resetResolversForTesting, installBuiltinResolvers } from '@graphorin/security/secrets';
import { createServer, type GraphorinServer } from '@graphorin/server';
import { createSqliteStore } from '@graphorin/store-sqlite';

export interface LiveServerHandle {
  readonly server: GraphorinServer;
  readonly port: number;
  readonly token: string;
  readonly stop: () => Promise<void>;
}

export async function bootLiveServer(scopes: ReadonlyArray<string>): Promise<LiveServerHandle> {
  _resetResolversForTesting();
  installBuiltinResolvers();
  process.env.GRAPHORIN_LIVE_TEST_PEPPER = 'live-test-pepper-with-enough-entropy-XYZ';
  const store = await createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
  const server = await createServer({
    store,
    skipHardening: true,
    config: {
      auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_LIVE_TEST_PEPPER' },
      storage: { path: ':memory:', mode: 'lib' },
      server: {
        host: '127.0.0.1',
        port: 0,
        rateLimit: { enabled: false },
        csrf: { enabled: false },
      },
    },
  });
  const listening = await server.start();

  const { createToken } = await import('@graphorin/security');
  const { resolveSecret } = await import('@graphorin/security/secrets');
  const pepper = await resolveSecret('env:GRAPHORIN_LIVE_TEST_PEPPER');
  const minted = await createToken({
    tokenStore: store.authTokens,
    pepper,
    env: 'live',
    scopes,
  });
  const token = await minted.raw.use((value) => value);

  return {
    server,
    port: listening.port,
    token,
    stop: async () => {
      await server.stop();
      delete process.env.GRAPHORIN_LIVE_TEST_PEPPER;
    },
  };
}
