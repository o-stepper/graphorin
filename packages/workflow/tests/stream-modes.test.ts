import { collect } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import {
  createNode,
  createWorkflow,
  InMemoryCheckpointStore,
  latestValue,
  type StreamMode,
  type WorkflowEvent,
} from '../src/index.js';

interface State {
  value: number;
  message: string;
}

function buildWorkflow(store: InMemoryCheckpointStore) {
  return createWorkflow<State>({
    name: 'stream-modes',
    channels: {
      value: latestValue<number>({ default: 0 }),
      message: latestValue<string>({ default: '' }),
    },
    nodes: {
      a: createNode<State>({
        name: 'a',
        run: async (_state, ctx) => {
          ctx.emit('node-a-started', { ts: 1 });
          return { value: 1, message: 'hello' };
        },
      }),
      b: createNode<State>({
        name: 'b',
        run: async (state) => ({ value: state.value + 1 }),
      }),
    },
    edges: [
      { from: '__start__', to: 'a' },
      { from: 'a', to: 'b' },
      { from: 'b', to: '__end__' },
    ],
    checkpointStore: store,
  });
}

async function run(mode: StreamMode): Promise<WorkflowEvent<State>[]> {
  const store = new InMemoryCheckpointStore();
  const wf = buildWorkflow(store);
  return collect(wf.execute({}, { threadId: `mode-${mode}`, stream: mode }));
}

describe('stream modes', () => {
  it('`values` includes step boundaries but not channel updates / checkpoints', async () => {
    const events = await run('values');
    const types = new Set(events.map((e) => e.type));
    expect(types.has('workflow.step.start')).toBe(true);
    expect(types.has('workflow.step.end')).toBe(true);
    expect(types.has('workflow.channel.update')).toBe(false);
    expect(types.has('workflow.checkpoint.written')).toBe(false);
    expect(types.has('workflow.custom')).toBe(false);
  });

  it('`updates` adds channel.update emits', async () => {
    const events = await run('updates');
    const types = new Set(events.map((e) => e.type));
    expect(types.has('workflow.channel.update')).toBe(true);
    expect(types.has('workflow.checkpoint.written')).toBe(false);
  });

  it('`messages` behaves like `updates` (placeholder for the future LLM-bound channel)', async () => {
    const events = await run('messages');
    const types = new Set(events.map((e) => e.type));
    expect(types.has('workflow.channel.update')).toBe(true);
  });

  it('`tasks` emits per-task lifecycle events', async () => {
    const events = await run('tasks');
    const types = new Set(events.map((e) => e.type));
    expect(types.has('workflow.task.start')).toBe(true);
    expect(types.has('workflow.task.end')).toBe(true);
    expect(types.has('workflow.checkpoint.written')).toBe(false);
  });

  it('`checkpoints` emits checkpoint lifecycle events', async () => {
    const events = await run('checkpoints');
    const types = new Set(events.map((e) => e.type));
    expect(types.has('workflow.checkpoint.written')).toBe(true);
    expect(types.has('workflow.step.start')).toBe(false);
  });

  it('`debug` emits every event kind', async () => {
    const events = await run('debug');
    const types = new Set(events.map((e) => e.type));
    expect(types.has('workflow.step.start')).toBe(true);
    expect(types.has('workflow.task.start')).toBe(true);
    expect(types.has('workflow.channel.update')).toBe(true);
    expect(types.has('workflow.checkpoint.written')).toBe(true);
    expect(types.has('workflow.custom')).toBe(true);
  });

  it('`custom` includes ctx.emit() events', async () => {
    const events = await run('custom');
    const custom = events.find((e) => e.type === 'workflow.custom');
    expect(custom).toBeDefined();
    if (custom?.type === 'workflow.custom') {
      expect(custom.name).toBe('node-a-started');
      expect(custom.payload).toEqual({ ts: 1 });
    }
  });
});
