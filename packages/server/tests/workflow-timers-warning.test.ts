/**
 * A3 (item 16 tail): a server with registered workflows but no
 * durable-timer driver must warn loudly at start - suspended threads
 * with due timers would otherwise sleep forever with zero signal.
 */

import { _resetResolversForTesting, installBuiltinResolvers } from '@graphorin/security/secrets';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, describe, expect, it } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';
import { WorkflowRegistry } from '../src/registry/index.js';

async function setupStore() {
  return createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
}

const NOOP_WORKFLOW = {
  name: 'sleepy',
  async *execute(): AsyncIterable<unknown> {
    yield { type: 'workflow.completed' };
  },
};

function captureStderr(): { readonly lines: string[]; restore: () => void } {
  const lines: string[] = [];
  const original = process.stderr.write.bind(process.stderr);
  process.stderr.write = ((chunk: string | Uint8Array) => {
    lines.push(String(chunk));
    return true;
  }) as typeof process.stderr.write;
  return {
    lines,
    restore: () => {
      process.stderr.write = original;
    },
  };
}

let active: GraphorinServer | undefined;

afterEach(async () => {
  if (active !== undefined) {
    await active.stop();
    active = undefined;
  }
});

describe('workflow timers deployment gap (A3)', () => {
  it('warns at start when workflows are registered without a timer driver', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    const store = await setupStore();
    const workflows = new WorkflowRegistry();
    workflows.register({ id: 'sleepy', workflow: NOOP_WORKFLOW });
    const server = await createServer({
      store,
      workflows,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'none' },
        storage: { path: ':memory:', mode: 'lib' },
      },
    });
    active = server;
    const captured = captureStderr();
    try {
      await server.start();
    } finally {
      captured.restore();
    }
    const all = captured.lines.join('');
    expect(all).toContain('no durable-timer driver is wired');
    expect(all).toContain('workflowTimers');
  });

  it('stays silent when a timer driver is wired', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    const store = await setupStore();
    const workflows = new WorkflowRegistry();
    workflows.register({ id: 'sleepy', workflow: NOOP_WORKFLOW });
    const driver = {
      start() {},
      stop() {},
      status() {
        return { running: true, sweeps: 0, fired: 0, errors: 0 };
      },
      async sweep() {
        return 0;
      },
    };
    const server = await createServer({
      store,
      workflows,
      workflowTimers: { driver },
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'none' },
        storage: { path: ':memory:', mode: 'lib' },
      },
    });
    active = server;
    const captured = captureStderr();
    try {
      await server.start();
    } finally {
      captured.restore();
    }
    expect(captured.lines.join('')).not.toContain('no durable-timer driver is wired');
  });
});
