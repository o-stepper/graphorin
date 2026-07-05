import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  runStorageCleanupBackups,
  runStorageEncrypt,
  runStorageStatus,
} from '../src/commands/storage.js';

async function fixture(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-storage-'));
  const cfg = join(dir, 'graphorin.config.json');
  await writeFile(
    cfg,
    JSON.stringify({
      storage: { path: join(dir, 'data.db'), mode: 'lib' },
      auth: { kind: 'none' },
    }),
    'utf8',
  );
  return cfg;
}

async function fixtureWithDb(): Promise<{ cfg: string; dbPath: string }> {
  const cfg = await fixture();
  const dbPath = JSON.parse(await import('node:fs/promises').then((m) => m.readFile(cfg, 'utf8')))
    .storage.path as string;
  await writeFile(dbPath, 'unencrypted-bytes');
  return { cfg, dbPath };
}

describe('graphorin storage status', () => {
  it('reports the path + cipher peer state', async () => {
    const cfg = await fixture();
    const lines: string[] = [];
    const out = await runStorageStatus({ config: cfg, print: (l) => lines.push(l) });
    expect(out.path.endsWith('data.db')).toBe(true);
    expect(out.encryption.enabled).toBe(false);
    expect(typeof out.cipherPeer.installed).toBe('boolean');
    expect(lines.some((l) => l.includes('storage status'))).toBe(true);
  });

  it('resolves a relative storage.path against the CWD, not the config-file dir (IP-20)', async () => {
    // The config lives in a temp dir that is NOT process.cwd(); a relative
    // storage.path must resolve against the CWD — the same rule the server
    // (createServer → createSqliteStore) and openStoreContext use — so every
    // command + the server inspect ONE database from any working directory.
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-ip20-'));
    const cfg = join(dir, 'graphorin.config.json');
    await writeFile(
      cfg,
      JSON.stringify({ storage: { path: 'data.db', mode: 'lib' }, auth: { kind: 'none' } }),
      'utf8',
    );
    const out = await runStorageStatus({ config: cfg, print: () => {} });
    expect(out.path).toBe(resolve(process.cwd(), 'data.db'));
    // Must NOT resolve against the config-file directory (the old behaviour).
    expect(out.path).not.toBe(resolve(dir, 'data.db'));
  });
});

describe('graphorin storage encrypt', () => {
  it('surfaces a clear error when the passphrase SecretRef cannot be resolved', async () => {
    const { cfg } = await fixtureWithDb();
    delete process.env.GRAPHORIN_TEST_NEVER_SET;
    await expect(
      runStorageEncrypt({
        config: cfg,
        passphraseFrom: 'env:GRAPHORIN_TEST_NEVER_SET',
        print: () => undefined,
      }),
    ).rejects.toThrow(/storage passphrase/);
  });

  it('rejects when the source DB is missing', async () => {
    const cfg = await fixture();
    process.env.GRAPHORIN_TEST_PASSPHRASE = 'p4ssphrase-for-tests';
    try {
      await expect(
        runStorageEncrypt({
          config: cfg,
          passphraseFrom: 'env:GRAPHORIN_TEST_PASSPHRASE',
          print: () => undefined,
        }),
      ).rejects.toThrow(/source DB not found/);
    } finally {
      delete process.env.GRAPHORIN_TEST_PASSPHRASE;
    }
  });
});

describe('graphorin storage cleanup-backups', () => {
  it('reports an empty result when no backups exist', async () => {
    const cfg = await fixture();
    const out = await runStorageCleanupBackups({
      config: cfg,
      dryRun: true,
      print: () => undefined,
    });
    expect(out.removed).toEqual([]);
  });

  it('finds stale backups next to the DB on every platform (E6)', async () => {
    // Regression: the base name used to come from dbPath.split('/'), which on
    // Windows (backslash separators) yielded the WHOLE path, so no readdir
    // entry ever matched and cleanup-backups was a silent no-op. node:path
    // basename makes this test pass on win32 too.
    const { cfg, dbPath } = await fixtureWithDb();
    await writeFile(`${dbPath}.bak`, 'stale');
    await writeFile(`${dbPath}.bak.1712000000`, 'stale');
    await writeFile(`${dbPath}.tmp.42`, 'stale');
    await writeFile(`${dbPath}.other`, 'not a backup');
    const out = await runStorageCleanupBackups({
      config: cfg,
      dryRun: true,
      print: () => undefined,
    });
    const names = out.removed.map((p) => p.slice(p.lastIndexOf('data.db')));
    expect(names.sort()).toEqual(['data.db.bak', 'data.db.bak.1712000000', 'data.db.tmp.42']);
    // dry-run must not delete anything
    const { readFile } = await import('node:fs/promises');
    await expect(readFile(`${dbPath}.bak`, 'utf8')).resolves.toBe('stale');
  });
});
