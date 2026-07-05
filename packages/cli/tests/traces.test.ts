import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { runTracesPrune, runTracesStatus } from '../src/commands/traces.js';
import { openStoreContext } from '../src/internal/store-context.js';

async function fixture(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-tr-'));
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

async function insertSpan(cfg: string, spanId: string, endEpochMs: number): Promise<void> {
  const ctx = await openStoreContext({ config: cfg });
  try {
    ctx.store.connection.run(
      `INSERT INTO spans (span_id, trace_id, parent_id, type, name, start_unix_nano, end_unix_nano, status, attributes_json, events_json, session_id)
       VALUES (?, 'tr', NULL, 'agent.run', 'agent.run', ?, ?, 'ok', '{}', '[]', NULL)`,
      [spanId, (endEpochMs - 5) * 1e6, endEpochMs * 1e6],
    );
  } finally {
    await ctx.close();
  }
}

describe('graphorin traces (W-007: targets the real spans table)', () => {
  it('status sees the spans table on a fresh, migrated DB', async () => {
    const cfg = await fixture();
    const out = await runTracesStatus({ config: cfg, print: () => undefined });
    // Migrations create `spans` - the eternal "table not found" no-op
    // is gone.
    expect(out.tableExists).toBe(true);
    expect(out.rows).toBe(0);
  });

  it('status reports row count and ISO time range from start_unix_nano', async () => {
    const cfg = await fixture();
    const t = Date.parse('2026-01-02T03:04:05.000Z');
    await insertSpan(cfg, 'sp-1', t);
    const out = await runTracesStatus({ config: cfg, print: () => undefined });
    expect(out.rows).toBe(1);
    expect(out.oldestStartedAt).toBe(new Date(t - 5).toISOString());
    expect(out.newestStartedAt).toBe(new Date(t - 5).toISOString());
  });

  it('prune is a no-op on a fresh DB', async () => {
    const cfg = await fixture();
    const out = await runTracesPrune({
      config: cfg,
      before: new Date().toISOString(),
      print: () => undefined,
    });
    expect(out.removed).toBe(0);
  });

  it('prune actually deletes spans that finished before the cutoff', async () => {
    const cfg = await fixture();
    const cutoff = Date.now();
    await insertSpan(cfg, 'sp-old', cutoff - 60_000);
    await insertSpan(cfg, 'sp-new', cutoff + 60_000);
    const out = await runTracesPrune({
      config: cfg,
      before: new Date(cutoff).toISOString(),
      print: () => undefined,
    });
    expect(out.removed).toBe(1);
    const status = await runTracesStatus({ config: cfg, print: () => undefined });
    expect(status.rows).toBe(1);
  });

  it('prune rejects an unparseable cutoff', async () => {
    const cfg = await fixture();
    await expect(
      runTracesPrune({
        config: cfg,
        before: 'not-a-date',
        print: () => undefined,
      }),
    ).rejects.toThrow(/not a valid/);
  });
});
