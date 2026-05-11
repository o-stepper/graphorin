import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
  it('list reports an empty registry on a fresh DB', async () => {
    const cfg = await fixture();
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
