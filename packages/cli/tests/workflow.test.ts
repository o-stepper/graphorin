/**
 * E2 - `graphorin workflow inspect|checkpoints`: read-only thread
 * inspection over the checkpoint store, keyed by workflow name (the
 * CLI has no node graph to rebuild a Workflow handle from).
 */

import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createSqliteStore } from '@graphorin/store-sqlite';
import { createNode, createWorkflow, latestValue, requestApproval } from '@graphorin/workflow';
import { describe, expect, it } from 'vitest';

import { runWorkflowCheckpoints, runWorkflowInspect } from '../src/commands/workflow.js';

async function fixture(): Promise<{ cfg: string; dbPath: string }> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-wf-'));
  const cfg = join(dir, 'graphorin.config.json');
  const dbPath = join(dir, 'data.db');
  await writeFile(
    cfg,
    JSON.stringify({
      storage: { path: dbPath, mode: 'lib' },
      auth: { kind: 'none' },
    }),
    'utf8',
  );
  return { cfg, dbPath };
}

/** Migrate the DB and park one durable approval under workflow 'ops'. */
async function seededFixture(): Promise<string> {
  const { cfg } = await fixture();
  const dbPath = (JSON.parse(await readFile(cfg, 'utf8')) as { storage: { path: string } }).storage
    .path;
  const store = await createSqliteStore({ path: dbPath, mode: 'lib', skipSqliteVec: true });
  await store.init();
  const wf = createWorkflow<{ decision: unknown }>({
    name: 'ops',
    channels: { decision: latestValue<unknown>() as never },
    nodes: {
      park: createNode<{ decision: unknown }>({
        name: 'park',
        run: () => ({ decision: requestApproval('ops-gate', { what: 'deploy' }) }),
      }),
    },
    edges: [
      { from: '__start__', to: 'park' },
      { from: 'park', to: '__end__' },
    ],
    checkpointStore: store.checkpoints,
  });
  for await (const _event of wf.execute({}, { threadId: 'th-ops-1' })) {
    // drain to the durable suspend
  }
  await store.close();
  return cfg;
}

describe('graphorin workflow inspect', () => {
  it('reports the suspended thread with its pending approval', async () => {
    const cfg = await seededFixture();
    const lines: string[] = [];
    const snapshot = await runWorkflowInspect({
      config: cfg,
      workflow: 'ops',
      threadId: 'th-ops-1',
      print: (l) => lines.push(l),
    });
    expect(snapshot?.status).toBe('suspended');
    expect(snapshot?.pendingPauses[0]?.name).toBe('ops-gate');
    expect(lines.some((l) => l.includes('status: suspended'))).toBe(true);
    expect(lines.some((l) => l.includes('name=ops-gate'))).toBe(true);
    expect(lines.some((l) => l.includes('state keys:'))).toBe(true);
  });

  it('returns null (exit 1) for an unknown thread or wrong workflow name', async () => {
    const cfg = await seededFixture();
    const missing = await runWorkflowInspect({
      config: cfg,
      workflow: 'ops',
      threadId: 'nope',
      print: () => undefined,
    });
    expect(missing).toBeNull();
    process.exitCode = 0;
    const wrongName = await runWorkflowInspect({
      config: cfg,
      workflow: 'not-ops',
      threadId: 'th-ops-1',
      print: () => undefined,
    });
    expect(wrongName).toBeNull();
    process.exitCode = 0;
  });
});

describe('graphorin workflow checkpoints', () => {
  it('lists the persisted timeline for the thread', async () => {
    const cfg = await seededFixture();
    const lines: string[] = [];
    const rows = await runWorkflowCheckpoints({
      config: cfg,
      workflow: 'ops',
      threadId: 'th-ops-1',
      print: (l) => lines.push(l),
    });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(lines.some((l) => l.includes('checkpoint(s) for thread th-ops-1'))).toBe(true);
    process.exitCode = 0;
  });

  it('reports an empty timeline (exit 1) for an unknown thread', async () => {
    const cfg = await seededFixture();
    const rows = await runWorkflowCheckpoints({
      config: cfg,
      workflow: 'ops',
      threadId: 'missing',
      print: () => undefined,
    });
    expect(rows).toHaveLength(0);
    process.exitCode = 0;
  });
});
