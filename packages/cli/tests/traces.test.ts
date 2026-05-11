import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { runTracesPrune, runTracesStatus } from '../src/commands/traces.js';

async function fixture(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-tr-'));
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

describe('graphorin traces', () => {
  it('status reports an absent traces table on a fresh DB', async () => {
    const cfg = await fixture();
    const out = await runTracesStatus({ config: cfg, print: () => undefined });
    expect(out.tableExists).toBe(false);
    expect(out.rows).toBe(0);
  });

  it('prune is a no-op on a fresh DB', async () => {
    const cfg = await fixture();
    const out = await runTracesPrune({
      config: cfg,
      before: new Date().toISOString(),
      print: () => undefined,
    });
    expect(out.removed).toBe(0);
  });

  it('prune rejects an unparseable cutoff', async () => {
    const cfg = await fixture();
    await expect(
      runTracesPrune({
        config: cfg,
        before: 'not-a-date',
        print: () => undefined,
      }),
    ).rejects.toThrow(/not a valid/);
  });
});
