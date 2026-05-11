import { mkdtemp, readdir, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { getTraceLog, pruneTraces } from '../../src/replay/log.js';

describe('@graphorin/observability/replay — getTraceLog / pruneTraces', () => {
  it('reads JSONL records back', async () => {
    const root = await mkdtemp(join(tmpdir(), 'graphorin-log-read-'));
    const file = join(root, 'one.jsonl');
    await writeFile(
      file,
      [
        JSON.stringify({
          type: 'agent.run',
          id: 'a',
          traceId: 't',
          name: 'agent.run',
          startUnixNano: 1,
          endUnixNano: 2,
          status: 'ok',
          attributes: {},
          events: [],
        }),
        '',
        'malformed-line',
        JSON.stringify({
          type: 'agent.run',
          id: 'b',
          traceId: 't',
          name: 'agent.run',
          startUnixNano: 3,
          endUnixNano: 4,
          status: 'ok',
          attributes: {},
          events: [],
        }),
      ].join('\n'),
    );
    const ids: string[] = [];
    for await (const r of getTraceLog(file)) ids.push(r.id);
    expect(ids).toEqual(['a', 'b']);
  });

  it('pruneTraces removes files older than the retention threshold', async () => {
    const root = await mkdtemp(join(tmpdir(), 'graphorin-log-prune-'));
    const oldFile = join(root, 'old.jsonl');
    await writeFile(oldFile, '');
    const past = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    await utimes(oldFile, past, past);
    const newFile = join(root, 'new.jsonl');
    await writeFile(newFile, '');

    const removed = await pruneTraces({ root, olderThanDays: 30 });
    expect(removed).toContain(oldFile);
    expect(removed).not.toContain(newFile);
    const remaining = await readdir(root);
    expect(remaining).toContain('new.jsonl');
    expect(remaining).not.toContain('old.jsonl');
  });

  it('pruneTraces is a no-op when retention is zero', async () => {
    const root = await mkdtemp(join(tmpdir(), 'graphorin-log-noop-'));
    await writeFile(join(root, 'x.jsonl'), '');
    const removed = await pruneTraces({ root, olderThanDays: 0 });
    expect(removed).toEqual([]);
  });
});
