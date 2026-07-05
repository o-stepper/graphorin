import { collect } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { createNode, createWorkflow, InMemoryCheckpointStore, latestValue } from '../src/index.js';

describe('durability modes', () => {
  it('persists every step in `sync` mode (default)', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ value: number }>({
      name: 'sync-mode',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        a: createNode<{ value: number }>({
          name: 'a',
          run: () => ({ value: 1 }),
        }),
        b: createNode<{ value: number }>({
          name: 'b',
          run: (state) => ({ value: state.value + 1 }),
        }),
      },
      edges: [
        { from: '__start__', to: 'a' },
        { from: 'a', to: 'b' },
        { from: 'b', to: '__end__' },
      ],
      checkpointStore: store,
    });
    await collect(wf.execute({}, { threadId: 'sync-1' }));
    expect(store.size()).toBeGreaterThan(0);
  });

  it('coerces the removed `async` mode to `sync` with a one-time warning (WF-7)', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ value: number }>({
      name: 'async-mode',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        a: createNode<{ value: number }>({
          name: 'a',
          run: () => ({ value: 1 }),
        }),
        b: createNode<{ value: number }>({
          name: 'b',
          run: (state) => ({ value: state.value + 1 }),
        }),
      },
      edges: [
        { from: '__start__', to: 'a' },
        { from: 'a', to: 'b' },
        { from: 'b', to: '__end__' },
      ],
      checkpointStore: store,
      // Legacy mode removed by WF-7 - runtime coerces it to 'sync'.
      durability: 'async' as unknown as import('../src/types.js').DurabilityMode,
    });
    const warnings: string[] = [];
    const original = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: string | Uint8Array): boolean => {
      warnings.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;
    try {
      await collect(wf.execute({}, { threadId: 'async-1' }));
    } finally {
      process.stderr.write = original;
    }
    // Coerced to 'sync': every step checkpoint persisted, with a warn.
    expect(store.size()).toBeGreaterThan(1);
    expect(warnings.join('')).toContain("'async'");
  });

  it('only writes a terminal checkpoint in `exit` mode', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ value: number }>({
      name: 'exit-mode',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        a: createNode<{ value: number }>({
          name: 'a',
          run: () => ({ value: 1 }),
        }),
        b: createNode<{ value: number }>({
          name: 'b',
          run: (state) => ({ value: state.value + 1 }),
        }),
        c: createNode<{ value: number }>({
          name: 'c',
          run: (state) => ({ value: state.value + 1 }),
        }),
      },
      edges: [
        { from: '__start__', to: 'a' },
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
        { from: 'c', to: '__end__' },
      ],
      checkpointStore: store,
      durability: 'exit',
    });
    await collect(wf.execute({}, { threadId: 'exit-1' }));
    expect(store.size()).toBe(1);
  });
});
