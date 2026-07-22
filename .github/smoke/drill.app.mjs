/**
 * CI crash-resume drill compose module (docker-smoke.yml).
 *
 * Registers one two-step workflow, `crash-drill`, whose single node
 * parks on a durable 15s timer (`sleepFor` persists `wakeAt` on the
 * checkpoint). The drill starts a run, hard-kills the server
 * (`docker kill`, SIGKILL - no shutdown hooks) mid-sleep, restarts on
 * the same data volume, and asserts the run completes with NO
 * operator action: the workflow timer daemon's post-boot sweep reads
 * the due `wakeAt` back from SQLite and ticks the thread to
 * completion. That is the "graceful shutdown and recovery of
 * partially executed workflows" proof from the 0.13.12 assessment,
 * block 4 - for the crash case, which subsumes the graceful one.
 *
 * Mounted into the container at /app/packages/cli/drill.app.mjs so
 * bare `@graphorin/*` imports resolve through the CLI's production
 * node_modules; referenced by the absolute `app` path in
 * drill-config.json.
 */
import { resolve } from 'node:path';

import { WorkflowRegistry } from '@graphorin/server';
import { createSqliteStore } from '@graphorin/store-sqlite';
import {
  createNode,
  createTimerDriver,
  createWorkflow,
  latestValue,
  sleepFor,
} from '@graphorin/workflow';

/**
 * Long enough that the kill lands mid-sleep even on a slow runner,
 * short enough that the post-restart poll stays inside the smoke's
 * step budget.
 */
const HOLD_MS = 15_000;

export default async function createApp({ config, configDir }) {
  const store = await createSqliteStore({
    path: config.storage.path === ':memory:' ? ':memory:' : resolve(configDir, config.storage.path),
    mode: config.storage.mode,
  });
  await store.init();

  const workflow = createWorkflow({
    name: 'crash-drill',
    channels: {
      completedAt: latestValue({ default: '' }),
    },
    nodes: {
      hold: createNode({
        name: 'hold',
        run: () => {
          // First pass: suspends with wakeAt = now + HOLD_MS persisted
          // on the checkpoint (this is what must survive the SIGKILL).
          // Post-restart pass: the satisfied timer replays and the node
          // completes.
          sleepFor(HOLD_MS);
          return { completedAt: new Date().toISOString() };
        },
      }),
    },
    edges: [
      { from: '__start__', to: 'hold' },
      { from: 'hold', to: '__end__' },
    ],
    checkpointStore: store.checkpoints,
  });

  const workflows = new WorkflowRegistry();
  workflows.register({
    id: 'crash-drill',
    workflow,
    description: 'docker-smoke crash-resume drill (durable 15s timer)',
  });

  return {
    store,
    workflows,
    // The timer daemon is what makes recovery OPERATOR-FREE: its first
    // sweep runs immediately on boot, so a wakeAt that came due while
    // the server was dead fires right after restart.
    workflowTimers: {
      driver: createTimerDriver({
        workflows: [{ workflow, checkpointStore: store.checkpoints }],
      }),
    },
    close: async () => {
      await store.close();
    },
  };
}
