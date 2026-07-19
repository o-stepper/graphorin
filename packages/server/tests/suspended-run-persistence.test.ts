/**
 * Migration 038 unit surface: the tracker's suspended-run persistence
 * hooks and the SQLite-backed delegate built by
 * `createSuspendedRunPersistence`.
 *
 * The invariants under test:
 *  - `suspend` / `registerSuspended` mirror the park into the delegate;
 *  - `complete()` after a resume drops the row, a plain completion
 *    never touches it;
 *  - `abort()` deliberately does NOT drop rows (the graceful-shutdown
 *    force-abort must not erase restart-surviving parks);
 *  - the delegate serializes through the OWNING agent's codec, passes
 *    hydrated string states through verbatim, skips workflow runs, and
 *    warns (once per agent) when no codec exists.
 */

import type { Mock } from 'vitest';
import { describe, expect, it, vi } from 'vitest';
import { AgentRegistry } from '../src/registry/index.js';
import type { RunDescriptor } from '../src/runtime/run-state.js';
import { RunStateTracker } from '../src/runtime/run-state.js';
import { createSuspendedRunPersistence } from '../src/runtime/suspended-run-persistence.js';

type SuspendedMock = Mock<(runId: string, descriptor: RunDescriptor, state: unknown) => void>;
type SettledMock = Mock<(runId: string) => void>;

function trackerWith(hooks: { suspended?: SuspendedMock; settled?: SettledMock }): {
  runs: RunStateTracker;
  suspended: SuspendedMock;
  settled: SettledMock;
} {
  const suspended =
    hooks.suspended ?? vi.fn<(runId: string, descriptor: RunDescriptor, state: unknown) => void>();
  const settled = hooks.settled ?? vi.fn<(runId: string) => void>();
  const runs = new RunStateTracker({ now: () => 1_000 });
  runs.setSuspendedRunPersistence({ suspended, settled });
  return { runs, suspended, settled };
}

describe('RunStateTracker suspended-run persistence hooks', () => {
  it('suspend() and registerSuspended() mirror the park', () => {
    const { runs, suspended } = trackerWith({});
    runs.start('r1', { kind: 'agent', agentId: 'a', sessionId: 's1' });
    runs.suspend('r1', { id: 'r1' });
    expect(suspended).toHaveBeenCalledWith(
      'r1',
      { kind: 'agent', agentId: 'a', sessionId: 's1' },
      { id: 'r1' },
    );

    runs.registerSuspended('r2', { kind: 'agent', agentId: 'b' }, 'raw-json');
    expect(suspended).toHaveBeenCalledWith('r2', { kind: 'agent', agentId: 'b' }, 'raw-json');
  });

  it('a resumed park that settles fires settled(); a plain run never does', () => {
    const { runs, settled } = trackerWith({});
    // Plain lifecycle: start -> complete. No park, no settle hook.
    runs.start('plain', { kind: 'agent', agentId: 'a' });
    runs.complete('plain', 'completed');
    expect(settled).not.toHaveBeenCalled();

    // Park -> resume (re-start keeps the retained state) -> complete.
    runs.start('parked', { kind: 'agent', agentId: 'a' });
    runs.suspend('parked', { id: 'parked' });
    runs.start('parked', { kind: 'agent', agentId: 'a' });
    runs.complete('parked', 'completed');
    expect(settled).toHaveBeenCalledTimes(1);
    expect(settled).toHaveBeenCalledWith('parked');

    // A failed resume also settles - a consumed suspension must not be
    // replayable from a stale durable row.
    runs.start('failing', { kind: 'agent', agentId: 'a' });
    runs.suspend('failing', { id: 'failing' });
    runs.start('failing', { kind: 'agent', agentId: 'a' });
    runs.complete('failing', 'failed', new Error('boom'));
    expect(settled).toHaveBeenCalledTimes(2);
  });

  it('abort() keeps the durable row (shutdown force-abort protection)', () => {
    const { runs, settled } = trackerWith({});
    runs.start('r1', { kind: 'agent', agentId: 'a' });
    runs.suspend('r1', { id: 'r1' });
    runs.abortAll(new Error('SIGTERM'));
    expect(runs.snapshot('r1')?.status).toBe('aborted');
    expect(settled).not.toHaveBeenCalled();
  });

  it('a throwing delegate never breaks the tracker', () => {
    const runs = new RunStateTracker();
    runs.setSuspendedRunPersistence({
      suspended: () => {
        throw new Error('sidecar down');
      },
      settled: () => {
        throw new Error('sidecar down');
      },
    });
    runs.start('r1', { kind: 'agent', agentId: 'a' });
    expect(() => runs.suspend('r1', { id: 'r1' })).not.toThrow();
    runs.start('r1', { kind: 'agent', agentId: 'a' });
    expect(() => runs.complete('r1', 'completed')).not.toThrow();
    expect(runs.snapshot('r1')?.status).toBe('completed');
  });
});

function makeDelegate(overrides?: {
  put?: (record: unknown) => Promise<void>;
  del?: (runId: string) => Promise<void>;
  warn?: (message: string) => void;
}) {
  const agents = new AgentRegistry();
  const puts: Array<Record<string, unknown>> = [];
  const deletes: string[] = [];
  const warnings: string[] = [];
  const hooks = createSuspendedRunPersistence({
    agents,
    store: {
      put:
        (overrides?.put as never) ??
        (async (record: never) => {
          puts.push(record);
        }),
      delete:
        (overrides?.del as never) ??
        (async (runId: string) => {
          deletes.push(runId);
        }),
    },
    now: () => 42,
    warn: overrides?.warn ?? ((m) => warnings.push(m)),
  });
  return { agents, hooks, puts, deletes, warnings };
}

describe('createSuspendedRunPersistence delegate', () => {
  it('serializes through the owning agent codec and forwards descriptor fields', () => {
    const { agents, hooks, puts } = makeDelegate();
    agents.register({
      id: 'coder',
      agent: {
        id: 'coder',
        run: async () => 'x',
        serializeState: (state: unknown) => `ser:${(state as { id: string }).id}`,
      },
    });
    hooks.suspended(
      'r1',
      { kind: 'agent', agentId: 'coder', sessionId: 's1', userId: 'u1' },
      { id: 'live-state' },
    );
    expect(puts).toEqual([
      {
        runId: 'r1',
        agentId: 'coder',
        sessionId: 's1',
        userId: 'u1',
        stateJson: 'ser:live-state',
        suspendedAt: 42,
      },
    ]);
  });

  it('persists hydrated string states verbatim without touching the codec', () => {
    const { agents, hooks, puts } = makeDelegate();
    const serializeState = vi.fn(() => 'should-not-be-called');
    agents.register({
      id: 'coder',
      agent: { id: 'coder', run: async () => 'x', serializeState },
    });
    hooks.suspended('r1', { kind: 'agent', agentId: 'coder' }, '{"raw":"row"}');
    expect(serializeState).not.toHaveBeenCalled();
    expect(puts[0]).toMatchObject({ stateJson: '{"raw":"row"}' });
  });

  it('skips workflow runs (durable through their own CheckpointStore)', () => {
    const { hooks, puts } = makeDelegate();
    hooks.suspended('w1', { kind: 'workflow', workflowId: 'wf' }, { id: 'x' });
    expect(puts).toEqual([]);
  });

  it('warns once per codec-less agent and persists nothing', () => {
    const { agents, hooks, puts, warnings } = makeDelegate();
    agents.register({ id: 'plain', agent: { id: 'plain', run: async () => 'x' } });
    hooks.suspended('r1', { kind: 'agent', agentId: 'plain' }, { id: 'a' });
    hooks.suspended('r2', { kind: 'agent', agentId: 'plain' }, { id: 'b' });
    expect(puts).toEqual([]);
    expect(warnings.filter((w) => w.includes('serializeState'))).toHaveLength(1);
  });

  it('a rejected put/delete surfaces as a WARN, never a throw', async () => {
    const warnings: string[] = [];
    const { agents, hooks } = makeDelegate({
      put: async () => {
        throw new Error('disk full');
      },
      del: async () => {
        throw new Error('disk full');
      },
      warn: (m) => warnings.push(m),
    });
    agents.register({
      id: 'coder',
      agent: { id: 'coder', run: async () => 'x', serializeState: () => '{}' },
    });
    expect(() => hooks.suspended('r1', { kind: 'agent', agentId: 'coder' }, {})).not.toThrow();
    expect(() => hooks.settled('r1')).not.toThrow();
    await vi.waitFor(() => {
      expect(warnings.some((w) => w.includes('persist suspended run'))).toBe(true);
      expect(warnings.some((w) => w.includes('settled suspended-run row'))).toBe(true);
    });
  });
});
