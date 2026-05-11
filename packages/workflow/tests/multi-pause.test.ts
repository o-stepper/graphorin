import { collect } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import {
  CHECKPOINT_SCHEMA_VERSION,
  createNode,
  createWorkflow,
  Directive,
  InMemoryCheckpointStore,
  latestValue,
  pause,
} from '../src/index.js';

interface State {
  step1?: string;
  step2?: string;
  status: 'idle' | 'phase-1' | 'phase-2' | 'done';
}

describe('multi-step HITL', () => {
  it('two distinct pause nodes round-trip correctly', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<State>({
      name: 'multi-pause',
      channels: {
        step1: latestValue<string>(),
        step2: latestValue<string>(),
        status: latestValue<State['status']>({ default: 'idle' }),
      },
      nodes: {
        first: createNode<State>({
          name: 'first',
          run: () => {
            const decision = pause<{ kind: 'phase-1' }, string>({ kind: 'phase-1' });
            return { step1: decision, status: 'phase-1' };
          },
        }),
        second: createNode<State>({
          name: 'second',
          run: () => {
            const decision = pause<{ kind: 'phase-2' }, string>({ kind: 'phase-2' });
            return { step2: decision, status: 'phase-2' };
          },
        }),
        finish: createNode<State>({
          name: 'finish',
          run: () => ({ status: 'done' }),
        }),
      },
      edges: [
        { from: '__start__', to: 'first' },
        { from: 'first', to: 'second' },
        { from: 'second', to: 'finish' },
        { from: 'finish', to: '__end__' },
      ],
      checkpointStore: store,
    });

    const initial = await collect(wf.execute({}, { threadId: 'multi-1' }));
    expect(initial[initial.length - 1]?.type).toBe('workflow.suspended');

    const after1 = await collect(wf.resume('multi-1', new Directive({ resume: 'first-ok' })));
    expect(after1[after1.length - 1]?.type).toBe('workflow.suspended');

    const after2 = await collect(wf.resume('multi-1', new Directive({ resume: 'second-ok' })));
    const final = after2[after2.length - 1];
    expect(final?.type).toBe('workflow.end');
    if (final?.type === 'workflow.end') {
      expect(final.state.step1).toBe('first-ok');
      expect(final.state.step2).toBe('second-ok');
      expect(final.state.status).toBe('done');
    }
  });
});

describe('checkpoint schema versioning', () => {
  it('exposes a stable schema version constant', () => {
    expect(CHECKPOINT_SCHEMA_VERSION).toBe('graphorin-workflow-checkpoint/1.0');
  });

  it('persists state inside a versioned envelope and unwraps on read', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ value: number }>({
      name: 'envelope',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        a: createNode<{ value: number }>({
          name: 'a',
          run: () => ({ value: 7 }),
        }),
      },
      edges: [
        { from: '__start__', to: 'a' },
        { from: 'a', to: '__end__' },
      ],
      checkpointStore: store,
    });
    await collect(wf.execute({}, { threadId: 'env-1' }));
    const tuple = await store.getTuple('env-1', 'workflow/envelope');
    expect(tuple).not.toBeNull();
    const raw = tuple?.checkpoint.state as { schema: string; state: { value: number } };
    expect(raw.schema).toBe(CHECKPOINT_SCHEMA_VERSION);
    expect(raw.state.value).toBe(7);

    const snapshot = await wf.getState('env-1');
    expect(snapshot.state.value).toBe(7);
  });

  it('still reads alpha checkpoints written without the envelope wrapper', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ value: number }>({
      name: 'alpha-compat',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        a: createNode<{ value: number }>({
          name: 'a',
          run: (state) => ({ value: state.value + 1 }),
        }),
      },
      edges: [
        { from: '__start__', to: 'a' },
        { from: 'a', to: '__end__' },
      ],
      checkpointStore: store,
    });
    await store.put(
      'compat-1',
      'workflow/alpha-compat',
      {
        id: 'cp-alpha',
        threadId: 'compat-1',
        namespace: 'workflow/alpha-compat',
        state: { value: 41 },
        channelVersions: { value: 1 },
        stepNumber: 0,
        createdAt: new Date(0).toISOString(),
      },
      { source: 'sync', status: 'completed' },
    );
    const snapshot = await wf.getState('compat-1');
    expect(snapshot.state.value).toBe(41);
  });
});
