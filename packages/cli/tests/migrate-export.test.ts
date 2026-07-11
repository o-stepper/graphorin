import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createBufferSink, createSessionExportWriter } from '@graphorin/sessions';
import { describe, expect, it, vi } from 'vitest';

import { runMigrateExport } from '../src/commands/migrate-export.js';

async function makeExport(dir: string, options: { hash?: boolean } = {}): Promise<string> {
  const path = join(dir, 'session.jsonl');
  const buffer = createBufferSink();
  const writer = createSessionExportWriter(buffer.sink, {
    writer: 'graphorin-cli-test',
    ...(options.hash === true ? { hash: true } : {}),
  });
  await writer.writeRecord({
    kind: 'session',
    id: 's-1',
    title: 'Test session',
    createdAt: new Date().toISOString(),
    userId: 'u-1',
    agentId: 'main',
  });
  await writer.close();
  await writeFile(path, buffer.toString(), 'utf8');
  return path;
}

function footerOf(jsonl: string): { checksum?: string } {
  const lines = jsonl.trimEnd().split('\n');
  return JSON.parse(lines[lines.length - 1] as string) as { checksum?: string };
}

describe('graphorin migrate-export', () => {
  it('round-trips a session export through the writer', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-mex-'));
    const input = await makeExport(dir);
    const out = await runMigrateExport({
      input,
      to: join(dir, 'output.jsonl'),
      print: () => undefined,
    });
    expect(out.records).toBeGreaterThan(0);
    const written = await readFile(out.output, 'utf8');
    expect(written.includes('"format":"graphorin-session-export"')).toBe(true);
  });

  it('refuses to overwrite the input', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-mex-'));
    const input = await makeExport(dir);
    await expect(runMigrateExport({ input, to: input, print: () => undefined })).rejects.toThrow(
      /refuses to overwrite/,
    );
  });

  it('S-11: a hashed input keeps its body checksum in the migrated output', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-mex-'));
    const input = await makeExport(dir, { hash: true });
    expect(footerOf(await readFile(input, 'utf8')).checksum).toMatch(/^sha256:/);

    const out = await runMigrateExport({
      input,
      to: join(dir, 'output.jsonl'),
      print: () => undefined,
    });
    // The old writer was created without `hash`, silently dropping the
    // integrity protection from the migrated copy.
    expect(footerOf(await readFile(out.output, 'utf8')).checksum).toMatch(/^sha256:/);
  });

  it('S-11: an unhashed input stays unhashed (no spurious checksum)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-mex-'));
    const input = await makeExport(dir);
    const out = await runMigrateExport({
      input,
      to: join(dir, 'output.jsonl'),
      print: () => undefined,
    });
    expect(footerOf(await readFile(out.output, 'utf8')).checksum).toBeUndefined();
  });

  it('S-11: the unsupported-schema rejection no longer claims a stale version', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-mex-'));
    const input = await makeExport(dir);
    const lines: string[] = [];
    const exit = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('exit-called');
    }) as never);
    try {
      await expect(
        runMigrateExport({
          input,
          to: join(dir, 'output.jsonl'),
          toSchema: '2.0',
          print: (l) => lines.push(l),
        }),
      ).rejects.toThrow('exit-called');
      expect(exit).toHaveBeenCalledWith(2);
      const joined = lines.join('\n');
      expect(joined).toContain('the migrator supports the current schema only');
      expect(joined).not.toContain('v0.1');
    } finally {
      exit.mockRestore();
    }
  });
});
