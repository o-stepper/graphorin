/**
 * E2 (item 16 tail) - fork with a channel-level state patch ("branch
 * here, but with these corrected values") and the read-only
 * thread-inspection helpers (`readThreadState` /
 * `listThreadCheckpoints`) the operator CLI builds on.
 */

import { collect } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import {
  createNode,
  createWorkflow,
  InMemoryCheckpointStore,
  latestValue,
  listThreadCheckpoints,
  readThreadState,
  requestApproval,
} from '../src/index.js';

interface CounterState {
  value: number;
  label: string;
}

function counterWorkflow(store: InMemoryCheckpointStore) {
  return createWorkflow<CounterState>({
    name: 'fork-patch',
    channels: {
      value: latestValue<number>({ default: 0 }),
      label: latestValue<string>({ default: 'none' }),
    },
    nodes: {
      a: createNode<CounterState>({ name: 'a', run: () => ({ value: 1 }) }),
      b: createNode<CounterState>({ name: 'b', run: (s) => ({ value: s.value + 1 }) }),
    },
    edges: [
      { from: '__start__', to: 'a' },
      { from: 'a', to: 'b' },
      { from: 'b', to: '__end__' },
    ],
    checkpointStore: store,
  });
}

describe('E2 - fork with a state patch', () => {
  it('merges patched channels into the forked root; the source stays untouched', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = counterWorkflow(store);
    await collect(wf.execute({}, { threadId: 'src-1' }));
    const source = await wf.getState('src-1');
    expect((source.state as CounterState).value).toBe(2);

    const { newThreadId } = await wf.fork('src-1', source.checkpointId, {
      patch: { value: 41, label: 'patched' },
    });
    const forked = await wf.getState(newThreadId);
    expect((forked.state as CounterState).value).toBe(41);
    expect((forked.state as CounterState).label).toBe('patched');
    // Unpatched channels ride along; the source timeline is untouched.
    const sourceAfter = await wf.getState('src-1');
    expect((sourceAfter.state as CounterState).value).toBe(2);
    expect((sourceAfter.state as CounterState).label).toBe('none');
  });

  it('rejects a patch key that names no declared channel', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = counterWorkflow(store);
    await collect(wf.execute({}, { threadId: 'src-2' }));
    const source = await wf.getState('src-2');
    await expect(
      wf.fork('src-2', source.checkpointId, { patch: { typo_channel: 1 } }),
    ).rejects.toThrow(/does not name a declared channel/);
  });

  it('re-runs the JSON-safety guard over the merged state', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = counterWorkflow(store);
    await collect(wf.execute({}, { threadId: 'src-3' }));
    const source = await wf.getState('src-3');
    await expect(
      wf.fork('src-3', source.checkpointId, { patch: { label: new Map() } }),
    ).rejects.toThrow(/not JSON-serializable|Map/);
  });
});

describe('E2 - read-only thread inspection over a bare store', () => {
  it('readThreadState decodes status, state and the pending-pause frontier by workflow name', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ decision: unknown }>({
      name: 'inspectable',
      channels: { decision: latestValue<unknown>() as never },
      nodes: {
        park: createNode<{ decision: unknown }>({
          name: 'park',
          run: () => ({
            decision: requestApproval('gate-1', { what: 'deploy' }, { timeoutAt: 4102444800000 }),
          }),
        }),
      },
      edges: [
        { from: '__start__', to: 'park' },
        { from: 'park', to: '__end__' },
      ],
      checkpointStore: store,
    });
    await collect(wf.execute({}, { threadId: 'th-1' }));

    const snapshot = await readThreadState(store, 'inspectable', 'th-1');
    expect(snapshot).not.toBeNull();
    expect(snapshot?.namespace).toBe('workflow/inspectable');
    expect(snapshot?.status).toBe('suspended');
    expect(snapshot?.pendingPauses[0]?.name).toBe('gate-1');
    expect(snapshot?.pendingPauses[0]?.wakeAt).toBe(4102444800000);
    // Wrong name / unknown thread read as null, never throw.
    expect(await readThreadState(store, 'other-workflow', 'th-1')).toBeNull();
    expect(await readThreadState(store, 'inspectable', 'missing')).toBeNull();

    // The same decode the Workflow handle produces.
    const viaHandle = await wf.getState('th-1');
    expect(snapshot?.checkpointId).toBe(viaHandle.checkpointId);
    expect(snapshot?.stepNumber).toBe(viaHandle.stepNumber);
    expect(snapshot?.state).toEqual(viaHandle.state);
  });

  it('listThreadCheckpoints summarises the full timeline', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = counterWorkflow(store);
    await collect(wf.execute({}, { threadId: 'th-2' }));
    const rows = await listThreadCheckpoints(store, 'fork-patch', 'th-2');
    expect(rows.length).toBeGreaterThanOrEqual(2);
    const viaHandle = await wf.listCheckpoints('th-2');
    expect(rows.map((r) => r.checkpointId).sort()).toEqual(viaHandle.map((c) => c.id).sort());
    expect(await listThreadCheckpoints(store, 'fork-patch', 'missing')).toHaveLength(0);
  });
});
