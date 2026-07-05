/**
 * W-011 integration: worker threads emulate two server PROCESSES
 * contending on one real audit.db file. better-sqlite3 blocks
 * synchronously on the write lock, so each contender needs its own
 * thread + event loop (two handles on ONE thread would deadlock: the
 * lock holder cannot drain its microtasks while the other handle spins
 * inside sqlite3_step). With the BEGIN IMMEDIATE transact fence, no
 * append is lost and no prune leaves a permanent chain break.
 */

import { once } from 'node:events';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { resolveSecret } from '@graphorin/security';
import { appendAudit, openAuditDb, pruneAudit, verifyAuditChain } from '@graphorin/security/audit';
import { describe, expect, it } from 'vitest';
import { ensureStoreAuditBinding } from '../src/app-audit-binding.js';

const WORKER_PATH = fileURLToPath(new URL('./fixtures/audit-append-worker.mjs', import.meta.url));
const PASS_ENV_VAR = 'GRAPHORIN_TEST_AUDIT_FENCE_PASS';

function spawnAppendWorker(path: string, n: number, tag: string): Promise<unknown> {
  const worker = new Worker(WORKER_PATH, {
    workerData: { path, n, tag, passEnvVar: PASS_ENV_VAR },
  });
  return Promise.race([
    once(worker, 'exit').then(([code]) => {
      if (code !== 0) throw new Error(`${tag} worker exited with code ${code}`);
    }),
    once(worker, 'error').then(([err]) => {
      throw err;
    }),
  ]);
}

async function freshAuditPath(): Promise<string> {
  process.env[PASS_ENV_VAR] = 'fence-passphrase-1234567890';
  ensureStoreAuditBinding();
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-audit-fencing-'));
  return join(dir, 'audit.db');
}

describe('W-011 - cross-thread contention on one audit.db', () => {
  it('two writer threads: no entry lost, chain verifies', { timeout: 60_000 }, async () => {
    const path = await freshAuditPath();
    const passphrase0 = await resolveSecret(`env:${PASS_ENV_VAR}`);
    // Initialize the encrypted file + schema once BEFORE the workers
    // attach - two connections racing to CREATE an encrypted database
    // is a bootstrap problem (SQLITE_NOTADB), not the append race
    // under test; in production the file exists before a second
    // process starts.
    await (await openAuditDb({ path, passphrase: passphrase0 })).close();
    const N = 10;
    await Promise.all([
      spawnAppendWorker(path, N, 'writer-a'),
      spawnAppendWorker(path, N, 'writer-b'),
    ]);
    const passphrase = await resolveSecret(`env:${PASS_ENV_VAR}`);
    const db = await openAuditDb({ path, passphrase });
    expect(await db.count()).toBe(2 * N);
    const verdict = await verifyAuditChain(db);
    expect(verdict.ok).toBe(true);
    await db.close();
  });

  it('pruneAudit racing a live writer thread leaves no permanent break', {
    timeout: 60_000,
  }, async () => {
    const path = await freshAuditPath();
    const passphrase = await resolveSecret(`env:${PASS_ENV_VAR}`);
    const seedDb = await openAuditDb({ path, passphrase });
    for (let i = 0; i < 10; i += 1) {
      await appendAudit(seedDb, {
        actor: { kind: 'system', id: 'seed' },
        action: 'secrets:read',
        target: `seed:${i}`,
        decision: 'success',
        ts: 1000 + i,
      });
    }
    await seedDb.close();

    // Race: a worker thread appends while this thread prunes.
    const pruneDb = await openAuditDb({ path, passphrase });
    const writer = spawnAppendWorker(path, 8, 'live');
    const pruneResult = await pruneAudit(pruneDb, { before: 1005, retain: 1 });
    expect(pruneResult.deleted).toBeGreaterThan(0);
    await writer;

    const verdict = await verifyAuditChain(pruneDb);
    expect(verdict.ok).toBe(true);
    const total = await pruneDb.count();
    // Every live append survived: 10 seeds - deleted + 8 live.
    expect(total).toBe(10 - pruneResult.deleted + 8);
    await pruneDb.close();
  });
});
