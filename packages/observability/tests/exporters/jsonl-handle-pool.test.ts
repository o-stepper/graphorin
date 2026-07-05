/**
 * RP-20: the JSONL exporter's file-handle pool keys by `(session, UTC-month)`
 * and was never evicted - one open fd per pair until the process exits. The
 * pool is now LRU-bounded.
 */
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createJSONLExporter } from '../../src/exporters/index.js';
import type { SpanRecord } from '../../src/exporters/types.js';

function rec(sessionId: string): SpanRecord {
  return {
    type: 'agent.run',
    id: `span-${sessionId}`,
    traceId: 't',
    name: 'agent.run',
    startUnixNano: 1,
    endUnixNano: 2,
    status: 'ok',
    attributes: { 'graphorin.session.id': sessionId },
    events: [],
  };
}

describe('JSONL exporter - bounded handle pool (RP-20)', () => {
  it('caps open handles and re-opens an evicted path without losing data', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-jsonl-pool-'));
    const fixedNow = (): Date => new Date('2026-06-13T12:00:00.000Z');
    const exporter = createJSONLExporter({ path: dir, maxOpenHandles: 2, now: fixedNow });

    for (const s of ['s1', 's2', 's3']) await exporter.export(rec(s));
    // The pool never holds more than the cap, even across 3 distinct sessions.
    expect(exporter.openHandleCount()).toBeLessThanOrEqual(2);

    // s1 was the LRU and got evicted; re-touching it re-opens in append mode.
    await exporter.export(rec('s1'));
    expect(exporter.openHandleCount()).toBeLessThanOrEqual(2);

    await exporter.flush();
    await exporter.shutdown();
    expect(exporter.openHandleCount()).toBe(0);

    // Every session's data survived the eviction + re-open cycle.
    for (const s of ['s1', 's2', 's3']) {
      const content = await readFile(join(dir, '2026-06', `${s}.jsonl`), 'utf8');
      expect(content).toContain(`span-${s}`);
    }
  });
});
