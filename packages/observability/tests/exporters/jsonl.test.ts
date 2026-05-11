import { mkdtemp, readdir, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createJSONLExporter, type SpanRecord } from '../../src/exporters/index.js';

describe('@graphorin/observability/exporters — JSONL determinism', () => {
  it('produces deterministic output for the same input fixture', async () => {
    const root = await mkdtemp(join(tmpdir(), 'graphorin-jsonl-det-'));
    const fixedDate = new Date(Date.UTC(2026, 0, 15, 10, 0, 0));
    const records: ReadonlyArray<SpanRecord> = [
      makeRecord('span-a', { 'graphorin.session.id': 'sess-1', 'tool.name': 'lookup' }),
      makeRecord('span-b', { 'graphorin.session.id': 'sess-1', 'tool.name': 'compose' }),
    ];

    async function runOnce(): Promise<string> {
      const subdir = await mkdtemp(join(root, 'run-'));
      const exporter = createJSONLExporter({ path: subdir, now: () => fixedDate });
      for (const record of records) await exporter.export(record);
      await exporter.flush();
      await exporter.shutdown();
      const monthDir = join(subdir, '2026-01');
      const file = join(monthDir, 'sess-1.jsonl');
      return readFile(file, 'utf8');
    }

    const a = await runOnce();
    const b = await runOnce();
    expect(a).toBe(b);
    expect(a.split('\n').filter(Boolean)).toHaveLength(2);
  });

  it('partitions output by session id and month', async () => {
    const root = await mkdtemp(join(tmpdir(), 'graphorin-jsonl-part-'));
    const fixedDate = new Date(Date.UTC(2026, 0, 15));
    const exporter = createJSONLExporter({ path: root, now: () => fixedDate });
    await exporter.export(makeRecord('a', { 'graphorin.session.id': 'one' }));
    await exporter.export(makeRecord('b', { 'graphorin.session.id': 'two' }));
    await exporter.shutdown();
    const month = await readdir(join(root, '2026-01'));
    expect(month.sort()).toEqual(['one.jsonl', 'two.jsonl']);
  });

  // POSIX-only: Windows does not honour the `mode` argument to
  // mkdir / chmod the same way (Node returns a default ~0o666 mode
  // regardless of what the application requested). The on-disk
  // confidentiality guarantee on Windows comes from NTFS ACLs +
  // userprofile location, not POSIX bits. Skip the assertion on
  // win32 so cross-platform CI stays green; the Linux / macOS runs
  // continue to enforce the strict 0o700 / 0o600 bits.
  it.skipIf(process.platform === 'win32')(
    'creates the trace directory with restrictive permissions (POSIX-only)',
    async () => {
      const root = await mkdtemp(join(tmpdir(), 'graphorin-jsonl-perm-'));
      const exporter = createJSONLExporter({ path: root });
      await exporter.export(makeRecord('a', { 'graphorin.session.id': 'sess' }));
      await exporter.shutdown();
      const month = (await readdir(root, { withFileTypes: true })).find((e) => e.isDirectory());
      if (month === undefined) throw new Error('no month directory');
      const monthInfo = await stat(join(root, month.name));
      // 0o700 — owner read/write/execute, no group, no world
      expect(monthInfo.mode & 0o777).toBe(0o700);
      const file = (await readdir(join(root, month.name)))[0];
      if (file === undefined) throw new Error('no file');
      const fileInfo = await stat(join(root, month.name, file));
      expect(fileInfo.mode & 0o777).toBe(0o600);
    },
  );
});

function makeRecord(id: string, attrs: Record<string, string>): SpanRecord {
  return {
    type: 'agent.run',
    id,
    traceId: `trace-${id}`,
    name: 'agent.run',
    startUnixNano: 1,
    endUnixNano: 2,
    status: 'ok',
    attributes: attrs,
    events: [],
  };
}
