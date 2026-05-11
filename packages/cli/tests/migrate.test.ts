import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { runMigrate } from '../src/commands/migrate.js';

async function fixtureDir(): Promise<string> {
  return await mkdtemp(join(tmpdir(), 'graphorin-cli-migrate-'));
}

describe('runMigrate', () => {
  it('runs every migration once and reports them via the print sink', async () => {
    const dir = await fixtureDir();
    const dbPath = join(dir, 'data.db');
    const cfg = join(dir, 'graphorin.config.json');
    await writeFile(
      cfg,
      JSON.stringify({
        storage: { path: dbPath, mode: 'lib' },
        auth: { kind: 'none' },
      }),
      'utf8',
    );
    const lines: string[] = [];
    const result = await runMigrate({
      config: cfg,
      print: (line) => {
        lines.push(line);
      },
    });
    expect(result.applied.length).toBeGreaterThan(0);
    expect(lines.some((l) => l.includes('applied'))).toBe(true);
    // Re-run is idempotent.
    const second = await runMigrate({
      config: cfg,
      print: () => {},
    });
    expect(second.applied.length).toBe(0);
  });
});
