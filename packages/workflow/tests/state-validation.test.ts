import { collect } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { createNode, createWorkflow, InMemoryCheckpointStore, latestValue } from '../src/index.js';

describe('createWorkflow - validateState hook', () => {
  it('rejects an invalid post-step state and emits workflow.error', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ value: number }>({
      name: 'validated',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        a: createNode<{ value: number }>({
          name: 'a',
          run: () => ({ value: -1 }),
        }),
      },
      edges: [
        { from: '__start__', to: 'a' },
        { from: 'a', to: '__end__' },
      ],
      checkpointStore: store,
      validateState: (state) => {
        if (state.value < 0) throw new Error('value must be non-negative');
      },
    });
    const events = await collect(wf.execute({}, { threadId: 'val-1' }));
    const error = events.find((e) => e.type === 'workflow.error');
    expect(error).toBeDefined();
    if (error?.type === 'workflow.error') {
      expect(error.error.code).toBe('state-validation-failed');
    }
  });

  it('passes the validator and lets the run reach completion', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ value: number }>({
      name: 'validated-ok',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        a: createNode<{ value: number }>({
          name: 'a',
          run: () => ({ value: 1 }),
        }),
      },
      edges: [
        { from: '__start__', to: 'a' },
        { from: 'a', to: '__end__' },
      ],
      checkpointStore: store,
      validateState: () => {},
    });
    const events = await collect(wf.execute({}, { threadId: 'val-2' }));
    expect(events[events.length - 1]?.type).toBe('workflow.end');
  });
});

describe('maxSteps safeguard', () => {
  it('aborts an infinite loop with a structured error', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ ticks: number }>({
      name: 'infinite',
      channels: { ticks: latestValue<number>({ default: 0 }) },
      nodes: {
        loop: createNode<{ ticks: number }>({
          name: 'loop',
          run: (state) => ({ ticks: state.ticks + 1 }),
        }),
      },
      edges: [
        { from: '__start__', to: 'loop' },
        { from: 'loop', to: 'loop' },
      ],
      checkpointStore: store,
      maxSteps: 5,
    });
    const events = await collect(wf.execute({}, { threadId: 'inf-1' }));
    const error = events.find((e) => e.type === 'workflow.error');
    expect(error).toBeDefined();
    if (error?.type === 'workflow.error') {
      expect(error.error.code).toBe('max-steps-exceeded');
      expect(error.error.message).toMatch(/maxSteps/);
    }
  });
});

describe('node-error propagation', () => {
  it('records the failed checkpoint and emits workflow.error', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ value: number }>({
      name: 'failing-node',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        a: createNode<{ value: number }>({
          name: 'a',
          run: () => {
            throw new Error('node-bug');
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'a' },
        { from: 'a', to: '__end__' },
      ],
      checkpointStore: store,
    });
    const events = await collect(wf.execute({}, { threadId: 'fail-1' }));
    const error = events.find((e) => e.type === 'workflow.error');
    expect(error).toBeDefined();
    if (error?.type === 'workflow.error') {
      expect(error.error.code).toBe('node-execution-failed');
    }
    const tuple = await store.getTuple('fail-1', 'workflow/failing-node');
    expect(tuple?.metadata.status).toBe('failed');
    expect(tuple?.metadata.nodeName).toBe('a');
  });
});
