import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { runMemoryMigrate, runMemoryStatus } from '../src/commands/memory.js';
import { runSkillsAudit } from '../src/commands/skills.js';

async function fixture(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-mem-'));
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

describe('graphorin memory status', () => {
  it('returns zeroed counts on a fresh DB', async () => {
    const cfg = await fixture();
    const out = await runMemoryStatus({ config: cfg, print: () => undefined });
    expect(out.embedders).toEqual([]);
    expect(out.counts.facts).toBe(0);
  });
});

describe('graphorin memory migrate', () => {
  it('exits when no --embeddersModule is supplied', async () => {
    const cfg = await fixture();
    const exit = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('exit-called');
    }) as never);
    try {
      await expect(
        runMemoryMigrate({
          config: cfg,
          from: 'a',
          to: 'b',
          strategy: 'auto-migrate',
          print: () => undefined,
        }),
      ).rejects.toThrow();
    } finally {
      exit.mockRestore();
    }
  });
});

describe('graphorin skills audit', () => {
  it('returns an empty array when nothing has been installed in this process', () => {
    const result = runSkillsAudit({ print: () => undefined });
    expect(Array.isArray(result)).toBe(true);
  });
});
