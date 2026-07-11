import { mkdtemp, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  runStorageCleanupBackups,
  runStorageCompact,
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
    // storage.path must resolve against the CWD - the same rule the server
    // (createServer → createSqliteStore) and openStoreContext use - so every
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

  it('S-07/1: the cipherPeer probe agrees with the encrypted sub-pack', async () => {
    // The old probe bare-imported the peer from the CLI's own
    // resolution scope, which fails under pnpm's strict node_modules
    // layout even though encrypt/rekey (loading via the sub-pack)
    // work. status must report what the sub-pack can actually do.
    let subpackLoads = true;
    try {
      const mod = (await import('@graphorin/store-sqlite-encrypted')) as {
        loadCipherPeer: () => Promise<unknown>;
      };
      await mod.loadCipherPeer();
    } catch {
      subpackLoads = false;
    }
    const cfg = await fixture();
    const out = await runStorageStatus({ config: cfg, print: () => {} });
    expect(out.cipherPeer.installed).toBe(subpackLoads);
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

describe('graphorin storage backup', () => {
  it('S-14b: the copy mirrors the source file mode (a 0600 store stays 0600)', async () => {
    const cfg = await fixture();
    const dbPath = join(dirname(cfg), 'data.db');
    const { createSqliteStore } = await import('@graphorin/store-sqlite');
    const store = await createSqliteStore({ path: dbPath, mode: 'lib', skipSqliteVec: true });
    await store.init();
    await store.close();
    const { chmod } = await import('node:fs/promises');
    await chmod(dbPath, 0o600);

    const { runStorageBackup } = await import('../src/commands/storage.js');
    const dest = join(dirname(cfg), 'backup.db');
    const out = await runStorageBackup({ config: cfg, dest, print: () => {} });
    expect(out.dest).toBe(dest);
    // The driver writes the copy with the umask default (0644 on most
    // hosts) - the CLI must not downgrade the live store's posture.
    expect((await stat(dest)).mode & 0o777).toBe(0o600);
  });
});

describe('graphorin storage compact (W-064)', () => {
  it('drains the freelist and shrinks the file on a store created with auto_vacuum=2', async () => {
    const cfg = await fixture();
    const dbPath = join(dirname(cfg), 'data.db');
    const { createSqliteStore } = await import('@graphorin/store-sqlite');
    const store = await createSqliteStore({ path: dbPath, mode: 'lib', skipSqliteVec: true });
    await store.init();
    const pad = 'x'.repeat(2048);
    for (let i = 0; i < 200; i += 1) {
      store.connection.run(
        `INSERT INTO facts (id, scope_user_id, text, sensitivity, created_at)
         VALUES (?, 'u', ?, 'internal', 1)`,
        [`f-${i}`, `${i} ${pad}`],
      );
    }
    store.connection.run("DELETE FROM facts WHERE id != 'f-0'", []);
    await store.close();
    const sizeBefore = (await stat(dbPath)).size;

    const lines: string[] = [];
    const out = await runStorageCompact({ config: cfg, print: (l) => lines.push(l) });
    expect(out.supported).toBe(true);
    expect(out.autoVacuum).toBe(2);
    expect(out.freelistBefore).toBeGreaterThan(0);
    expect(out.freelistAfter).toBe(0);
    expect(out.reclaimedBytes).toBeGreaterThan(0);
    expect((await stat(dbPath)).size).toBeLessThan(sizeBefore);
    expect(lines.some((l) => l.includes('reclaimed'))).toBe(true);
  });

  it('reports the high-water-mark limitation honestly on a pre-auto_vacuum database and leaves it intact', async () => {
    const cfg = await fixture();
    const dbPath = join(dirname(cfg), 'data.db');
    // A database created before this version: node's bundled SQLite
    // defaults to auto_vacuum=0, exactly like our own pre-W-064 stores.
    const { DatabaseSync } = (await import('node:sqlite')) as unknown as {
      DatabaseSync: new (
        p: string,
      ) => {
        exec(q: string): void;
        prepare(q: string): { get(): unknown };
        close(): void;
      };
    };
    const raw = new DatabaseSync(dbPath);
    raw.exec('CREATE TABLE legacy (a TEXT)');
    raw.exec("INSERT INTO legacy VALUES ('keep')");
    raw.close();

    const lines: string[] = [];
    const out = await runStorageCompact({ config: cfg, print: (l) => lines.push(l) });
    expect(out.supported).toBe(false);
    expect(out.autoVacuum).toBe(0);
    expect(out.reclaimedBytes).toBeUndefined();
    expect(lines.some((l) => l.includes('auto_vacuum=0'))).toBe(true);
    expect(lines.some((l) => l.includes('high-water-mark'))).toBe(true);
    // The command modified nothing: the data is still there.
    const check = new DatabaseSync(dbPath);
    const row = check.prepare('SELECT a FROM legacy').get() as { a: string };
    expect(row.a).toBe('keep');
    check.close();
  });
});
