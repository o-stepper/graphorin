/**
 * W-009: InMemoryCheckpointStore parity for the CheckpointStoreExt
 * retention primitives + the engine-level guarantee that a workflow
 * still resumes after compactThread(keepLast=1).
 */

import { collect } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import {
  createNode,
  createWorkflow,
  Directive,
  InMemoryCheckpointStore,
  latestValue,
  pause,
} from '../src/index.js';

function seed(
  store: InMemoryCheckpointStore,
  threadId: string,
  namespace: string,
  args: {
    readonly steps?: number;
    readonly status: 'running' | 'suspended' | 'completed' | 'failed' | 'aborted';
    readonly ageMs: number;
  },
): Promise<void> {
  const steps = args.steps ?? 1;
  const puts: Promise<unknown>[] = [];
  for (let step = 1; step <= steps; step += 1) {
    puts.push(
      store.put(
        threadId,
        namespace,
        {
          id: `${threadId}:${namespace}:cp-${step}`,
          threadId,
          namespace,
          state: { step },
          channelVersions: {},
          stepNumber: step,
          createdAt: new Date(Date.now() - args.ageMs).toISOString(),
        },
        { source: 'sync', status: step === steps ? args.status : 'running' },
      ),
    );
  }
  return Promise.all(puts).then(() => undefined);
}

const HOUR = 3_600_000;

describe('InMemoryCheckpointStore retention parity (W-009)', () => {
  it('pruneThreads: terminal-old pruned, suspended and fresh kept; namespace-scoped on a shared threadId', async () => {
    const store = new InMemoryCheckpointStore();
    await seed(store, 'shared', 'workflow/a', { status: 'completed', ageMs: 2 * HOUR });
    await seed(store, 'shared', 'workflow/b', { status: 'suspended', ageMs: 2 * HOUR });
    await seed(store, 'fresh', 'workflow/a', { status: 'completed', ageMs: 0 });

    const pruned = await store.pruneThreads({ beforeEpochMs: Date.now() - HOUR });
    expect(pruned).toBe(1);
    expect(await store.getTuple('shared', 'workflow/a')).toBeNull();
    expect(await store.getTuple('shared', 'workflow/b')).not.toBeNull();
    expect(await store.getTuple('fresh', 'workflow/a')).not.toBeNull();

    const hard = await store.pruneThreads({
      beforeEpochMs: Date.now() - HOUR,
      onlyTerminal: false,
    });
    expect(hard).toBe(1);
    expect(await store.getTuple('shared', 'workflow/b')).toBeNull();
  });

  it('compactThread keeps the newest keepLast of one pair only', async () => {
    const store = new InMemoryCheckpointStore();
    await seed(store, 't', 'ns-a', { steps: 5, status: 'suspended', ageMs: 0 });
    await seed(store, 't', 'ns-b', { steps: 3, status: 'suspended', ageMs: 0 });
    const deleted = await store.compactThread('t', 'ns-a', 1);
    expect(deleted).toBe(4);
    const latest = await store.getTuple('t', 'ns-a');
    expect(latest?.checkpoint.stepNumber).toBe(5);
    const bTuples = await collect(store.list('t', 'ns-b'));
    expect(bTuples).toHaveLength(3);
  });
});

interface Snapshot {
  status: 'pending' | 'awaiting' | 'done';
  decision?: 'yes' | 'no';
}

function buildWorkflow(store: InMemoryCheckpointStore) {
  return createWorkflow<Snapshot>({
    name: 'retention-resume',
    channels: {
      status: latestValue<Snapshot['status']>({ default: 'pending' }),
      decision: latestValue<Snapshot['decision']>(),
    },
    nodes: {
      enter: createNode<Snapshot>({
        name: 'enter',
        run: async () => ({ status: 'awaiting' }),
      }),
      hold: createNode<Snapshot>({
        name: 'hold',
        run: async () => {
          const decision = pause<{ kind: 'awaiting' }, 'yes' | 'no'>({ kind: 'awaiting' });
          return { decision, status: 'done' };
        },
      }),
    },
    edges: [
      { from: '__start__', to: 'enter' },
      { from: 'enter', to: 'hold' },
      { from: 'hold', to: '__end__' },
    ],
    checkpointStore: store,
  });
}

describe('engine resume after compaction (W-009)', () => {
  it('a suspended workflow compacted to keepLast=1 still reports state and resumes', async () => {
    const store = new InMemoryCheckpointStore();
    const writer = buildWorkflow(store);
    await collect(writer.execute({}, { threadId: 'compact-resume' }));
    const namespace = 'workflow/retention-resume';

    const deleted = await store.compactThread('compact-resume', namespace, 1);
    expect(deleted).toBeGreaterThanOrEqual(0);
    const remaining = await collect(store.list('compact-resume', namespace));
    expect(remaining).toHaveLength(1);

    const reader = buildWorkflow(store);
    const snapshot = await reader.getState('compact-resume');
    expect(snapshot.status).toBe('suspended');
    const resumed = await collect(
      reader.resume('compact-resume', new Directive({ resume: 'yes' })),
    );
    const final = resumed[resumed.length - 1];
    expect(final?.type).toBe('workflow.end');
    if (final?.type === 'workflow.end') {
      expect(final.state.decision).toBe('yes');
    }
  });
});
