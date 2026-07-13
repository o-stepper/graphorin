/**
 * Child process for the E2 cross-process durability e2e. Runs a
 * one-node workflow against a FILE-backed SQLite store until it
 * suspends on a persisted approval, prints the `SUSPENDED` marker on
 * stdout, then idles - the parent test SIGKILLs it mid-life and proves
 * the thread resumes from SQLite in a fresh process (the
 * durable-execution invariant).
 *
 * Imports resolve through the workspace's built dists, so the runner
 * must build before spawning (turbo `test` depends on `^build`).
 */

import { createSqliteStore } from '@graphorin/store-sqlite';
import { createNode, createWorkflow, latestValue, requestApproval } from '@graphorin/workflow';

const [dbPath, threadId] = process.argv.slice(2);
if (!dbPath || !threadId) {
  console.error('usage: cross-process-child.mjs <dbPath> <threadId>');
  process.exit(2);
}

const store = await createSqliteStore({ path: dbPath });
await store.init();

const wf = createWorkflow({
  name: 'xproc',
  channels: { decision: latestValue() },
  nodes: {
    park: createNode({
      name: 'park',
      run: () => ({ decision: requestApproval('xproc-gate', { what: 'deploy' }) }),
    }),
  },
  edges: [
    { from: '__start__', to: 'park' },
    { from: 'park', to: '__end__' },
  ],
  checkpointStore: store.checkpoints,
});

for await (const _event of wf.execute({}, { threadId })) {
  // Drain to the durable suspend; 'sync' durability persists the
  // checkpoint before the iterator ends.
}

console.log('SUSPENDED');

// Stay alive so the parent can SIGKILL a LIVE process holding the DB
// handles - the crash case, not a clean shutdown.
setInterval(() => {}, 1_000);
