import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createSqliteStore } from '@graphorin/store-sqlite';
import { describe, expect, it } from 'vitest';

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

describe('graphorin triggers', () => {
  it('list reports an empty registry on a fresh (migrated) DB', async () => {
    const cfg = await fixture();
    // W-068: `triggers list` runs with migrationPolicy 'check' and never
    // migrates - initialize the schema the way a deployment would.
    {
      const dbPath = JSON.parse(await (await import('node:fs/promises')).readFile(cfg, 'utf8'))
        .storage.path as string;
      const store = await createSqliteStore({ path: dbPath, mode: 'lib', skipSqliteVec: true });
      await store.init();
      await store.close();
    }
    const lines: string[] = [];
    const list = await runTriggersList({ config: cfg, print: (l) => lines.push(l) });
    expect(list).toEqual([]);
    expect(lines.some((l) => l.includes('no triggers'))).toBe(true);
  });

  it('status returns null on an unknown id (with a fresh DB)', async () => {
    const cfg = await fixture();
    const state = await runTriggersStatus({
      config: cfg,
      id: 'missing',
      print: () => undefined,
    });
    expect(state).toBeNull();
  });

  it('disable + fire refuse on a non-existent trigger', async () => {
    const cfg = await fixture();
    await expect(
      runTriggersDisable({ config: cfg, id: 'missing', print: () => undefined }),
    ).rejects.toThrow(/not found/);
    await expect(
      runTriggersFire({ config: cfg, id: 'missing', print: () => undefined }),
    ).rejects.toThrow(/not found/);
  });

  it('prune is a no-op on a fresh DB', async () => {
    const cfg = await fixture();
    const out = await runTriggersPrune({ config: cfg, print: () => undefined });
    expect(out.removed).toEqual([]);
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
