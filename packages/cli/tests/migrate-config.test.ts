import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { runMigrateConfig } from '../src/commands/migrate-config.js';

async function fixture(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-mc-'));
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

describe('graphorin migrate-config', () => {
  it('writes a normalized JSON next to the input', async () => {
    const cfg = await fixture();
    const result = await runMigrateConfig({ input: cfg, print: () => undefined });
    expect(result.output.endsWith('.migrated.json')).toBe(true);
    const written = await readFile(result.output, 'utf8');
    const parsed = JSON.parse(written) as { storage: { mode: string } };
    expect(parsed.storage.mode).toBe('lib');
  });

  it('refuses to overwrite the input file', async () => {
    const cfg = await fixture();
    await expect(
      runMigrateConfig({ input: cfg, out: cfg, print: () => undefined }),
    ).rejects.toThrow(/refuses to overwrite/);
  });
});
