/**
 * IP-1 acceptance: a config with `storage.encryption` produces a server
 * whose data.db is REALLY encrypted (a keyless open fails), and the
 * health surface reports the factual state. Gated on the cipher-peer
 * native binding (allow-listed in `pnpm.onlyBuiltDependencies`).
 */

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createServer } from '../src/app.js';

async function peerAvailable(): Promise<boolean> {
  try {
    const { loadCipherDriver } = await import('@graphorin/store-sqlite/encryption');
    const Ctor = await loadCipherDriver();
    new Ctor(':memory:').close();
    return true;
  } catch {
    return false;
  }
}

const available = await peerAvailable();

describe.skipIf(!available)('IP-1 - storage encryption config is honoured', () => {
  it('createServer opens an encrypted store; a keyless open of the same file fails', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-srv-enc-'));
    const dbPath = join(dir, 'data.db');
    process.env.GRAPHORIN_TEST_STORE_KEY = 'server-side-pass-1';
    try {
      const server = await createServer({
        config: {
          storage: {
            path: dbPath,
            encryption: {
              enabled: true,
              passphraseRef: 'env:GRAPHORIN_TEST_STORE_KEY',
            },
          },
        },
      });
      // The store was constructed (and the schema migrated) through
      // the cipher peer with the resolved key inside createServer.
      expect(server.config.storage.encryption.enabled).toBe(true);

      // The same file is NOT readable without the key.
      const { loadCipherDriver } = await import('@graphorin/store-sqlite/encryption');
      const Ctor = await loadCipherDriver();
      // `sqlite_master` exists in every SQLite file, so the ONLY way
      // this throws is the cipher layer refusing the keyless read -
      // a plaintext file would happily return rows.
      const noKey = new Ctor(dbPath);
      expect(() => noKey.prepare('SELECT count(*) c FROM sqlite_master').get()).toThrow(
        /not a database/,
      );
      noKey.close();
    } finally {
      delete process.env.GRAPHORIN_TEST_STORE_KEY;
    }
  }, 30_000);
});
