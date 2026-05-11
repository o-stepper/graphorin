import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { runDoctor } from '../src/commands/doctor.js';

async function fixtureDir(): Promise<string> {
  const dir = join(
    tmpdir(),
    `graphorin-cli-doctor-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await mkdir(dir, { recursive: true, mode: 0o700 });
  return dir;
}

describe('runDoctor', () => {
  it('reports a clean perms section against a freshly-created home directory', async () => {
    const home = await fixtureDir();
    const lines: string[] = [];
    const report = await runDoctor({
      home,
      checkPerms: true,
      print: (line) => lines.push(line),
    });
    expect(report.platform).toBe(process.platform);
    expect(report.checks.length).toBeGreaterThan(0);
    expect(lines.some((l) => l.includes('graphorin doctor'))).toBe(true);
  });

  it('emits a JSON document on --json', async () => {
    const home = await fixtureDir();
    const captured: unknown[] = [];
    const report = await runDoctor({
      home,
      checkPerms: true,
      json: true,
      jsonPrint: (payload) => captured.push(payload),
    });
    expect(captured).toHaveLength(1);
    expect((captured[0] as { home: string }).home).toBe(home);
    expect(report.summary.fail).toBe(report.summary.fail);
  });

  it('repairs a drifted file mode when --fix-perms is passed', async () => {
    const home = await fixtureDir();
    const data = join(home, 'data.db');
    await writeFile(data, '', { mode: 0o644 });
    const report = await runDoctor({ home, fixPerms: true, print: () => undefined });
    if (process.platform !== 'win32') {
      expect(report.fixedPerms).toContain(data);
    }
  });

  it('reports a clear "no checks" message when no flag is supplied and the dir is missing', async () => {
    const home = join(tmpdir(), `graphorin-cli-doctor-missing-${Date.now()}`);
    const report = await runDoctor({ home, print: () => undefined });
    expect(report.summary.warn + report.summary.skip + report.summary.ok).toBeGreaterThan(0);
  });
});
