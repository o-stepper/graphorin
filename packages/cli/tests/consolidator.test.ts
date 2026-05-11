import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  runConsolidatorSetTier,
  runConsolidatorStatus,
  runConsolidatorStop,
} from '../src/commands/consolidator.js';

async function fixture(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-cons-'));
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

describe('graphorin consolidator', () => {
  it('status returns zeroed counters on a fresh DB', async () => {
    const cfg = await fixture();
    const out = await runConsolidatorStatus({ config: cfg, print: () => undefined });
    expect(out.recentRuns).toBe(0);
    expect(out.dlqSize).toBe(0);
  });

  it('set-tier persists the chosen tier hint', async () => {
    const cfg = await fixture();
    await runConsolidatorSetTier({ config: cfg, tier: 'cheap', print: () => undefined });
    const after = await runConsolidatorStatus({ config: cfg, print: () => undefined });
    expect(after.tierHint).toBe('cheap');
  });

  it('rejects an invalid tier value', async () => {
    const cfg = await fixture();
    await expect(
      runConsolidatorSetTier({
        config: cfg,
        tier: 'super-special' as 'free',
        print: () => undefined,
      }),
    ).rejects.toThrow(/invalid tier/);
  });

  it('stop persists the pause flag', async () => {
    const cfg = await fixture();
    const out = await runConsolidatorStop({ config: cfg, print: () => undefined });
    expect(out.stopped).toBe(true);
  });
});
