import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createSqliteStore } from '@graphorin/store-sqlite';
import { describe, expect, it } from 'vitest';

import {
  runConsolidatorDlqClear,
  runConsolidatorDlqList,
  runConsolidatorSetTier,
  runConsolidatorStatus,
  runConsolidatorStop,
} from '../src/commands/consolidator.js';

async function fixture(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-cons-'));
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

describe('graphorin consolidator', () => {
  it('status returns zeroed counters on a fresh (migrated) DB', async () => {
    const cfg = await fixture();
    // W-068: `consolidator status` runs with migrationPolicy 'check' and
    // never migrates - initialize the schema first.
    {
      const dbPath = JSON.parse(await (await import('node:fs/promises')).readFile(cfg, 'utf8'))
        .storage.path as string;
      const store = await createSqliteStore({ path: dbPath, mode: 'lib', skipSqliteVec: true });
      await store.init();
      await store.close();
    }
    const out = await runConsolidatorStatus({ config: cfg, print: () => undefined });
    expect(out.recentRuns).toBe(0);
    expect(out.dlqSize).toBe(0);
  });

  it('status counts the statuses the runtime actually writes (MCON-5)', async () => {
    const cfg = await fixture();
    const dbPath = JSON.parse(await (await import('node:fs/promises')).readFile(cfg, 'utf8'))
      .storage.path as string;
    // Seed rows exactly as SqliteConsolidatorStateStore writes them:
    // recordRunStart → 'running', recordRunFinish → 'completed' |
    // 'failed' | 'partial' | 'deferred'. Pending conflict work lives in
    // conflict_check_pending (resolved_at IS NULL), not consolidator_runs.
    const store = await createSqliteStore({ path: dbPath, mode: 'lib', skipSqliteVec: true });
    await store.init();
    const now = Date.now();
    const insert = (id: string, status: string) =>
      store.connection.run(
        `INSERT INTO consolidator_runs (
           id, scope_user_id, scope_session_id, trigger_kind, phase, started_at, status
         ) VALUES (?, 'alex', NULL, 'manual', 'standard', ?, ?)`,
        [id, now, status],
      );
    insert('r-ok', 'completed');
    insert('r-ok2', 'completed');
    insert('r-bad', 'failed');
    insert('r-part', 'partial');
    insert('r-live', 'running');
    store.connection.run(
      `INSERT INTO conflict_check_pending (
         scope_user_id, fact_id, candidate_text, stage, enqueued_at
       ) VALUES ('alex', 'f1', 'candidate', 'defer-to-deep', ?)`,
      [now],
    );
    await store.close();

    const out = await runConsolidatorStatus({ config: cfg, print: () => undefined });
    expect(out.recentRuns).toBe(5);
    expect(out.successfulRuns).toBe(2);
    expect(out.failedRuns).toBe(1);
    expect(out.pendingConflicts).toBe(1);
  });

  it('set-tier reports UNSUPPORTED honestly - no phantom persistence (IP-4)', async () => {
    const cfg = await fixture();
    const before = process.exitCode;
    const out = await runConsolidatorSetTier({
      config: cfg,
      tier: 'cheap',
      print: () => undefined,
    });
    expect(out.applied).toBe(false);
    expect(out.unsupported).toBe(true);
    expect(process.exitCode).toBe(2);
    process.exitCode = before;
  });

  it('rejects an invalid tier value', async () => {
    const cfg = await fixture();
    await expect(
      runConsolidatorSetTier({
        config: cfg,
        tier: 'super-special' as 'free',
        print: () => undefined,
      }),
    ).rejects.toThrow(/invalid tier/);
  });

  it('stop reports UNSUPPORTED honestly - never claims the daemon stopped (IP-4)', async () => {
    const cfg = await fixture();
    const before = process.exitCode;
    const out = await runConsolidatorStop({ config: cfg, print: () => undefined });
    expect(out.stopped).toBe(false);
    expect(out.unsupported).toBe(true);
    expect(process.exitCode).toBe(2);
    process.exitCode = before;
  });
});

describe('graphorin consolidator dlq (W-065)', () => {
  async function dlqFixture(): Promise<string> {
    const cfg = await fixture();
    const dbPath = JSON.parse(await (await import('node:fs/promises')).readFile(cfg, 'utf8'))
      .storage.path as string;
    const store = await createSqliteStore({ path: dbPath, mode: 'lib', skipSqliteVec: true });
    await store.init();
    const insert = (
      id: string,
      userId: string,
      nextRetryAt: number | null,
      failedAt: number,
    ): void => {
      store.connection.run(
        `INSERT INTO consolidator_failed_batches (
           id, consolidator_run_id, scope_user_id, message_ids_json, error_kind,
           error_message, failed_at, next_retry_at, retry_count, phase
         ) VALUES (?, NULL, ?, '["m1"]', 'llm_error', 'boom', ?, ?, 3, 'deep')`,
        [id, userId, failedAt, nextRetryAt],
      );
    };
    insert('b-exhausted-alex', 'alex', null, Date.now() - 60_000);
    insert('b-retrying-alex', 'alex', Date.now() + 60_000, Date.now() - 60_000);
    insert('b-exhausted-kim', 'kim', null, Date.now() - 60_000);
    await store.close();
    return cfg;
  }

  it('dlq list shows batches across users with the exhausted flag; --user narrows', async () => {
    const cfg = await dlqFixture();
    const all = await runConsolidatorDlqList({ config: cfg, print: () => undefined });
    expect(all.length).toBe(3);
    const exhausted = all.filter((e) => e.exhausted).map((e) => e.id);
    expect(exhausted.sort()).toEqual(['b-exhausted-alex', 'b-exhausted-kim']);
    const alexOnly = await runConsolidatorDlqList({
      config: cfg,
      user: 'alex',
      print: () => undefined,
    });
    expect(alexOnly.map((e) => e.userId)).toEqual(['alex', 'alex']);
  });

  it('dlq clear defaults to exhausted-only and leaves batches awaiting retry', async () => {
    const cfg = await dlqFixture();
    const out = await runConsolidatorDlqClear({ config: cfg, print: () => undefined });
    expect(out.removed).toBe(2);
    const left = await runConsolidatorDlqList({ config: cfg, print: () => undefined });
    expect(left.map((e) => e.id)).toEqual(['b-retrying-alex']);
  });

  it('dlq clear --id removes one batch; --user narrows the sweep', async () => {
    const cfg = await dlqFixture();
    const one = await runConsolidatorDlqClear({
      config: cfg,
      id: 'b-exhausted-kim',
      print: () => undefined,
    });
    expect(one.removed).toBe(1);
    const scoped = await runConsolidatorDlqClear({
      config: cfg,
      user: 'alex',
      exhaustedOnly: false,
      print: () => undefined,
    });
    expect(scoped.removed).toBe(2);
    const left = await runConsolidatorDlqList({ config: cfg, print: () => undefined });
    expect(left).toEqual([]);
  });
});
