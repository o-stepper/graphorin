import type { WorkflowEvent } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { createNode, createWorkflow, InMemoryCheckpointStore, latestValue } from '../src/index.js';

describe('WF-15 — task/custom events stream live, not batched at step settle', () => {
  it('workflow.task.start is observable while the node is still running', {
    timeout: 10_000,
  }, async () => {
    let releaseNode: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      releaseNode = resolve;
    });
    const wf = createWorkflow<{ value: number }>({
      name: 'live-tasks',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        slow: createNode<{ value: number }>({
          name: 'slow',
          // Completes ONLY after the consumer observed task.start — a
          // batched emitter deadlocks here, a live one sails through.
          run: async () => {
            await gate;
            return { value: 1 };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'slow' },
        { from: 'slow', to: '__end__' },
      ],
      checkpointStore: new InMemoryCheckpointStore(),
    });

    const seen: string[] = [];
    for await (const ev of wf.execute({}, { threadId: 'live-1', stream: 'tasks' })) {
      seen.push(ev.type);
      if (ev.type === 'workflow.task.start') releaseNode?.();
    }
    expect(seen).toContain('workflow.task.start');
    expect(seen).toContain('workflow.task.end');
    expect(seen).toContain('workflow.end');
  });

  it('ctx.emit custom events are observable while the node is still running', {
    timeout: 10_000,
  }, async () => {
    let releaseNode: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      releaseNode = resolve;
    });
    const wf = createWorkflow<{ value: number }>({
      name: 'live-custom',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        emitter: createNode<{ value: number }>({
          name: 'emitter',
          run: async (_state, ctx) => {
            ctx.emit('progress', { pct: 50 });
            await gate;
            return { value: 1 };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'emitter' },
        { from: 'emitter', to: '__end__' },
      ],
      checkpointStore: new InMemoryCheckpointStore(),
    });

    const seen: WorkflowEvent<{ value: number }>[] = [];
    for await (const ev of wf.execute({}, { threadId: 'live-2', stream: 'custom' })) {
      seen.push(ev);
      if (ev.type === 'workflow.custom' && ev.name === 'progress') releaseNode?.();
    }
    expect(seen.some((e) => e.type === 'workflow.custom')).toBe(true);
    expect(seen.some((e) => e.type === 'workflow.end')).toBe(true);
  });
});
