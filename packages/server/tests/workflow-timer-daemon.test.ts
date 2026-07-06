/**
 * W-032: the workflow durable-timer daemon binds to the server
 * lifecycle (started on start, stopped on stop) and surfaces its
 * status through /v1/health.
 */
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, describe, expect, it } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';
import { collectHealth } from '../src/health/checks.js';
import {
  createWorkflowTimerDaemon,
  type WorkflowTimerDriverLike,
} from '../src/workflows/timer-daemon.js';

let store: GraphorinSqliteStore | undefined;
let server: GraphorinServer | undefined;

afterEach(async () => {
  if (server !== undefined) {
    await server.stop().catch(() => {});
    server = undefined;
  }
  if (store !== undefined) {
    await store.close().catch(() => {});
    store = undefined;
  }
});

function fakeDriver(): WorkflowTimerDriverLike & {
  readonly calls: string[];
} {
  const calls: string[] = [];
  let running = false;
  return {
    calls,
    start() {
      running = true;
      calls.push('start');
    },
    stop() {
      running = false;
      calls.push('stop');
    },
    status() {
      return { running, sweeps: 3, fired: 2, errors: 0, lastSweepAt: 1_700_000_000_000 };
    },
    async sweep() {
      calls.push('sweep');
      return 0;
    },
  };
}

describe('W-032 - workflow timer daemon lifecycle', () => {
  it('createServer({ workflowTimers: { driver } }) starts and stops the driver with the server', async () => {
    store = await createSqliteStore({
      path: ':memory:',
      mode: 'lib',
      skipSqliteVec: true,
      disableWalHardening: true,
    });
    const driver = fakeDriver();
    server = await createServer({
      store,
      skipHardening: true,
      config: {
        auth: { kind: 'none' },
        storage: { path: ':memory:', mode: 'lib' },
        server: { port: 0 },
      },
      workflowTimers: { driver },
    });
    expect(server.workflowTimers).toBeDefined();
    await server.start();
    expect(driver.calls).toContain('start');
    expect((await server.workflowTimers?.status())?.running).toBe(true);
    await server.stop();
    expect(driver.calls).toContain('stop');
  });

  it('collectHealth reports the daemon status under checks.workflowTimers', async () => {
    const daemon = createWorkflowTimerDaemon({ driver: fakeDriver() });
    await daemon.start();
    const health = await collectHealth({ workflowTimers: daemon });
    expect(health.checks.workflowTimers).toMatchObject({
      status: 'ok',
      running: true,
      sweeps: 3,
      fired: 2,
      errors: 0,
    });
    expect(health.checks.workflowTimers?.lastSweepAt).toBe(
      new Date(1_700_000_000_000).toISOString(),
    );
  });
});
