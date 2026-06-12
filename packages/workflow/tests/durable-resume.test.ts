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

interface Snapshot {
  status: 'pending' | 'awaiting' | 'done';
  decision?: 'yes' | 'no';
}

function buildWorkflow(store: InMemoryCheckpointStore) {
  return createWorkflow<Snapshot>({
    name: 'durable-resume',
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

describe('durable HITL resume', () => {
  it('round-trips state across two independent Workflow instances', async () => {
    const store = new InMemoryCheckpointStore();
    const writer = buildWorkflow(store);
    const events = await collect(writer.execute({}, { threadId: 'durable-1' }));
    const suspended = events.find((e) => e.type === 'workflow.suspended');
    expect(suspended).toBeDefined();

    const reader = buildWorkflow(store);
    const snapshot = await reader.getState('durable-1');
    expect(snapshot.status).toBe('suspended');
    expect(snapshot.pendingPause?.nodeName).toBe('hold');

    const resumed = await collect(reader.resume('durable-1', new Directive({ resume: 'yes' })));
    const final = resumed[resumed.length - 1];
    expect(final?.type).toBe('workflow.end');
    if (final?.type === 'workflow.end') {
      expect(final.state.decision).toBe('yes');
      expect(final.state.status).toBe('done');
    }
  });

  it('advances the step counter across resume so post-resume checkpoints do not tie (WF-4)', async () => {
    const store = new InMemoryCheckpointStore();
    const writer = buildWorkflow(store);
    await collect(writer.execute({}, { threadId: 'wf4' }));
    const namespace = 'workflow/durable-resume';
    const suspended = await store.getTuple('wf4', namespace);
    const suspendedStep = suspended?.checkpoint.stepNumber ?? -1;
    expect(suspendedStep).toBeGreaterThanOrEqual(0);

    const reader = buildWorkflow(store);
    await collect(reader.resume('wf4', new Directive({ resume: 'yes' })));

    // No post-resume checkpoint may reuse the suspended stepNumber — otherwise a
    // crash-recovery / second pause would tie and `getTuple` could return the
    // stale suspended checkpoint, re-running the pause node.
    const all = await collect(store.list('wf4', namespace));
    const atSuspendedStep = all.filter((t) => t.checkpoint.stepNumber === suspendedStep);
    expect(atSuspendedStep).toHaveLength(1);
  });

  it('rejects concurrent resumes for the same thread', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = buildWorkflow(store);
    await collect(wf.execute({}, { threadId: 'durable-conflict' }));

    const first = collect(wf.resume('durable-conflict', new Directive({ resume: 'yes' })));
    const second = collect(wf.resume('durable-conflict', new Directive({ resume: 'no' })));

    await Promise.allSettled([first, second]);
    const blocked = await second.catch((err) => err);
    expect(blocked).toMatchObject({ code: 'concurrent-resume-rejected' });
  });

  it('rejects resume on a non-existent thread', async () => {
    const wf = buildWorkflow(new InMemoryCheckpointStore());
    const events = await collect(wf.resume('thread-missing', new Directive({ resume: 'yes' })));
    const last = events[events.length - 1];
    expect(last?.type).toBe('workflow.error');
  });

  it('rejects resume on a completed thread', async () => {
    const store = new InMemoryCheckpointStore();
    const lowValue = createWorkflow<Snapshot>({
      name: 'no-pause',
      channels: {
        status: latestValue<Snapshot['status']>({ default: 'pending' }),
        decision: latestValue<Snapshot['decision']>(),
      },
      nodes: {
        finish: createNode<Snapshot>({
          name: 'finish',
          run: async () => ({ status: 'done' }),
        }),
      },
      edges: [
        { from: '__start__', to: 'finish' },
        { from: 'finish', to: '__end__' },
      ],
      checkpointStore: store,
    });
    await collect(lowValue.execute({}, { threadId: 'no-pause-1' }));
    const events = await collect(lowValue.resume('no-pause-1', new Directive({ resume: 'yes' })));
    const error = events.find((e) => e.type === 'workflow.error');
    expect(error).toBeDefined();
    if (error?.type === 'workflow.error') {
      expect(error.error.code).toBe('resume-without-suspension');
    }
  });

  it('honors Directive.update on resume', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ value: string; status: string }>({
      name: 'directive-update',
      channels: {
        value: latestValue<string>({ default: '' }),
        status: latestValue<string>({ default: 'pending' }),
      },
      nodes: {
        wait: createNode<{ value: string; status: string }>({
          name: 'wait',
          run: () => {
            pause<{ kind: 'wait' }, void>({ kind: 'wait' });
            return { status: 'finished' };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'wait' },
        { from: 'wait', to: '__end__' },
      ],
      checkpointStore: store,
    });
    await collect(wf.execute({}, { threadId: 'directive-1' }));
    const events = await collect(
      wf.resume('directive-1', new Directive({ resume: undefined, update: { value: 'injected' } })),
    );
    const final = events[events.length - 1];
    if (final?.type === 'workflow.end') {
      expect(final.state.value).toBe('injected');
      expect(final.state.status).toBe('finished');
    }
  });
});
