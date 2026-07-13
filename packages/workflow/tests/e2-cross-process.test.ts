/**
 * E2 (item 16 tail) - the cross-process durability e2e (the
 * durable-execution invariant): a workflow suspends on a persisted
 * approval inside a CHILD process holding live SQLite handles; the
 * child is SIGKILLed mid-life (a crash, not a shutdown); a FRESH
 * process (this test) opens the same database, reads the suspended
 * thread, resolves the approval and drives the thread to completion.
 * Multi-driver safety on the resume path rides the store-level
 * checkpoint CAS (WF-12, pinned in durable-core.test.ts); this test
 * pins the process-boundary half.
 */

import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { CheckpointStore } from '@graphorin/core';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { describe, expect, it } from 'vitest';

import {
  createNode,
  createWorkflow,
  latestValue,
  readThreadState,
  requestApproval,
} from '../src/index.js';

const CHILD = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'cross-process-child.mjs');

/** Rebuild the child's workflow definition against a fresh store. */
function rebuildWorkflow(checkpointStore: CheckpointStore) {
  return createWorkflow<{ decision: unknown }>({
    name: 'xproc',
    channels: { decision: latestValue<unknown>() as never },
    nodes: {
      park: createNode<{ decision: unknown }>({
        name: 'park',
        run: () => ({ decision: requestApproval('xproc-gate', { what: 'deploy' }) }),
      }),
    },
    edges: [
      { from: '__start__', to: 'park' },
      { from: 'park', to: '__end__' },
    ],
    checkpointStore,
  });
}

describe('E2 - kill during approval, resume from SQLite in a fresh process', () => {
  it('survives a SIGKILL mid-approval and completes after a cross-process resolve', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-xproc-'));
    const dbPath = join(dir, 'wf.sqlite');
    const threadId = 'xproc-thread-1';

    // 1. The child runs to the durable suspend and reports it.
    const child = spawn(process.execPath, [CHILD, dbPath, threadId], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`child never suspended; stdout=${stdout} stderr=${stderr}`));
      }, 20_000);
      const probe = setInterval(() => {
        if (stdout.includes('SUSPENDED')) {
          clearTimeout(timer);
          clearInterval(probe);
          resolve();
        }
      }, 25);
      child.on('exit', (code) => {
        clearTimeout(timer);
        clearInterval(probe);
        reject(new Error(`child exited early (code ${code}); stderr=${stderr}`));
      });
    });

    // 2. Crash the LIVE process (open DB handles and all).
    child.removeAllListeners('exit');
    child.kill('SIGKILL');
    await new Promise<void>((resolve) => child.on('exit', () => resolve()));

    // 3. A fresh process opens the same database and sees the park.
    const store = await createSqliteStore({ path: dbPath });
    await store.init();
    try {
      const snapshot = await readThreadState(store.checkpoints, 'xproc', threadId);
      expect(snapshot?.status).toBe('suspended');
      expect(snapshot?.pendingPauses[0]?.name).toBe('xproc-gate');

      // 4. Resolve the approval here - the thread completes with the
      //    decision the fresh process delivered.
      const wf = rebuildWorkflow(store.checkpoints);
      for await (const _event of wf.approve(threadId, 'xproc-gate', { ok: true })) {
        // drain
      }
      const after = await wf.getState(threadId);
      expect(after.status).toBe('completed');
      expect((after.state as { decision: unknown }).decision).toEqual({ ok: true });
    } finally {
      await store.close();
    }
  }, 30_000);
});
