import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
});
