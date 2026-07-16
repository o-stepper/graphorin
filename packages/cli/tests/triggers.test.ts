import { execFile } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { createSqliteStore } from '@graphorin/store-sqlite';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
// `test` dependsOn `build` in turbo.json, so the CLI dist is present here.
const BIN = fileURLToPath(new URL('../dist/bin/graphorin.js', import.meta.url));

import {
  runTriggersDisable,
  runTriggersFire,
  runTriggersList,
  runTriggersPrune,
  runTriggersStatus,
} from '../src/commands/triggers.js';

async function fixture(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-trig-'));
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

// W-068: EVERY triggers subcommand runs with migrationPolicy 'check'
// and never migrates - initialize the schema the way a deployment
// would.
async function migratedFixture(): Promise<string> {
  const cfg = await fixture();
  const dbPath = JSON.parse(await (await import('node:fs/promises')).readFile(cfg, 'utf8')).storage
    .path as string;
  const store = await createSqliteStore({ path: dbPath, mode: 'lib', skipSqliteVec: true });
  await store.init();
  await store.close();
  return cfg;
}

describe('graphorin triggers', () => {
  it('list reports an empty registry on a fresh (migrated) DB', async () => {
    const cfg = await migratedFixture();
    const lines: string[] = [];
    const list = await runTriggersList({ config: cfg, print: (l) => lines.push(l) });
    expect(list).toEqual([]);
    expect(lines.some((l) => l.includes('no triggers'))).toBe(true);
  });

  it('status returns null on an unknown id (with a migrated DB)', async () => {
    const cfg = await migratedFixture();
    const state = await runTriggersStatus({
      config: cfg,
      id: 'missing',
      print: () => undefined,
    });
    expect(state).toBeNull();
  });

  it('disable + fire refuse on a non-existent trigger', async () => {
    const cfg = await migratedFixture();
    await expect(
      runTriggersDisable({ config: cfg, id: 'missing', print: () => undefined }),
    ).rejects.toThrow(/not found/);
    await expect(
      runTriggersFire({ config: cfg, id: 'missing', print: () => undefined }),
    ).rejects.toThrow(/not found/);
  });

  it('prune is a no-op on a fresh (migrated) DB', async () => {
    const cfg = await migratedFixture();
    const out = await runTriggersPrune({ config: cfg, print: () => undefined });
    expect(out.removed).toEqual([]);
  });
});

describe('W-068 - no triggers subcommand auto-migrates a behind-schema DB', () => {
  async function expectRefusalWithoutMigration(
    run: (cfg: string) => Promise<unknown>,
  ): Promise<void> {
    const cfg = await fixture();
    // NOT migrated: every bundled migration is pending.
    await expect(run(cfg)).rejects.toThrow(/graphorin migrate/);
    // The refused command changed nothing: schema_migrations does not exist.
    const dbPath = JSON.parse(await (await import('node:fs/promises')).readFile(cfg, 'utf8'))
      .storage.path as string;
    const store = await createSqliteStore({ path: dbPath, mode: 'lib', skipSqliteVec: true });
    const row = store.connection.get<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'",
    );
    await store.close();
    expect(row).toBeUndefined();
  }

  it('status refuses', async () => {
    await expectRefusalWithoutMigration((cfg) =>
      runTriggersStatus({ config: cfg, id: 'ghost', print: () => undefined }),
    );
  });

  it('fire refuses', async () => {
    await expectRefusalWithoutMigration((cfg) =>
      runTriggersFire({ config: cfg, id: 'ghost', print: () => undefined }),
    );
  });

  it('disable refuses', async () => {
    await expectRefusalWithoutMigration((cfg) =>
      runTriggersDisable({ config: cfg, id: 'ghost', print: () => undefined }),
    );
  });

  it('prune refuses', async () => {
    await expectRefusalWithoutMigration((cfg) =>
      runTriggersPrune({ config: cfg, print: () => undefined }),
    );
  });
});

describe('IP-4 - fire reports UNSUPPORTED honestly', () => {
  it('an existing trigger is NOT silently "queued" - unsupported + exit code 2', async () => {
    const cfg = await fixture();
    const { runTriggersStatus: _s } = await import('../src/commands/triggers.js');
    // register a trigger row via the store context the commands share
    const { openStoreContext } = await import('../src/internal/store-context.js');
    const ctx = await openStoreContext({ config: cfg });
    await ctx.store.triggers.upsert({
      id: 'fireable',
      kind: 'interval',
      spec: '60000',
      callbackRef: 'fireable',
      missedFires: 0,
      disabled: false,
      catchupPolicy: 'none',
      maxCatchupRuns: 1,
      catchupWindowMs: 1000,
      createdAt: new Date().toISOString(),
    });
    await ctx.close();
    const before = process.exitCode;
    const out = await runTriggersFire({ config: cfg, id: 'fireable', print: () => undefined });
    expect(out.fired).toBe(false);
    expect(out.unsupported).toBe(true);
    expect(process.exitCode).toBe(2);
    process.exitCode = before;
  });
});

// OPERATOR-01: the `prune` help claimed a bare invocation would "drop every
// disabled row", but the epoch-0 default made it a no-op for every dated row.
// `--before` is now required (mirroring `audit prune` / `traces prune`) and the
// help text no longer makes the false promise.
describe('graphorin triggers prune --before contract (OPERATOR-01)', () => {
  it('requires --before instead of silently no-opping', async () => {
    const cfg = await fixture();
    await expect(
      execFileAsync('node', [BIN, 'triggers', 'prune', '--config', cfg]),
    ).rejects.toMatchObject({
      code: expect.any(Number),
      stderr: expect.stringMatching(/required option.*--before/i),
    });
  });

  it('help text no longer promises to "drop every disabled row"', async () => {
    const { stdout } = await execFileAsync('node', [BIN, 'triggers', 'prune', '--help']);
    expect(stdout).not.toContain('drop every disabled row');
    expect(stdout).toContain('before this are dropped');
  });
});
