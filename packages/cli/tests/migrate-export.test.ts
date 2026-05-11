import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createBufferSink, createSessionExportWriter } from '@graphorin/sessions';
import { describe, expect, it } from 'vitest';

import { runMigrateExport } from '../src/commands/migrate-export.js';

async function makeExport(dir: string): Promise<string> {
  const path = join(dir, 'session.jsonl');
  const buffer = createBufferSink();
  const writer = createSessionExportWriter(buffer.sink, { writer: 'graphorin-cli-test' });
  await writer.writeRecord({
    kind: 'session',
    id: 's-1',
    title: 'Test session',
    createdAt: new Date().toISOString(),
    user: { id: 'u-1' },
  });
  await writer.close();
  await writeFile(path, buffer.toString(), 'utf8');
  return path;
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
});
