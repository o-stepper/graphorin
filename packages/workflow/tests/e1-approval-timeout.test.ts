/**
 * E1 (item 11, defer leg) - approvals with a durable deadline:
 * `requestApproval(name, payload, { timeoutAt })` stamps `wakeAt` onto
 * the pending pause (joining the timer enumeration the daemon sweeps),
 * `tick` resolves a due approval with its timeout decision (auto-deny
 * by default, fail-closed), and a human decision before the deadline
 * wins exactly like a plain approval.
 */

import { DEFAULT_APPROVAL_TIMEOUT_DECISION, type WorkflowEvent } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import {
  createNode,
  createWorkflow,
  InMemoryCheckpointStore,
  latestValue,
  requestApproval,
} from '../src/index.js';

async function drain<T>(events: AsyncIterable<WorkflowEvent<T>>): Promise<WorkflowEvent<T>[]> {
  const out: WorkflowEvent<T>[] = [];
  for await (const ev of events) out.push(ev);
  return out;
}

interface S {
  decision: { granted: boolean; reason?: string } | null;
}

function deferWorkflow(deadline: number, timeoutDecision?: unknown) {
  return createWorkflow<S>({
    name: 'defer-approval',
    channels: { decision: latestValue<S['decision']>() as never },
    nodes: {
      park: createNode<S>({
        name: 'park',
        run: () => {
          const decision = requestApproval<{ granted: boolean; reason?: string }>(
            'perm:send_money',
            { toolCallId: 'c1' },
            {
              timeoutAt: deadline,
              ...(timeoutDecision !== undefined ? { timeoutDecision } : {}),
            },
          );
          return { decision };
        },
      }),
    },
    edges: [
      { from: '__start__', to: 'park' },
      { from: 'park', to: '__end__' },
    ],
    checkpointStore: new InMemoryCheckpointStore(),
  });
}

describe('E1 - requestApproval with a durable deadline', () => {
  it('stamps name AND wakeAt on the pending pause; an early tick does not fire', async () => {
    const deadline = Date.now() + 60_000;
    const wf = deferWorkflow(deadline);
    await drain(wf.execute({}, { threadId: 'defer-1' }));
    const state = await wf.getState('defer-1');
    const pending = state.pendingPauses?.[0];
    expect(pending?.name).toBe('perm:send_money');
    expect(pending?.wakeAt).toBe(deadline);

    const early = await wf.tick('defer-1', { now: deadline - 1000 });
    expect(early.fired).toBe(false);
    expect(early.nextWakeAt).toBe(deadline);
    // Still parked.
    expect((await wf.getState('defer-1')).status).toBe('suspended');
  });

  it('a human decision before the deadline wins', async () => {
    const deadline = Date.now() + 60_000;
    const wf = deferWorkflow(deadline);
    await drain(wf.execute({}, { threadId: 'defer-2' }));
    const events = await drain(
      wf.approve('defer-2', 'perm:send_money', { granted: true, reason: 'looks fine' }),
    );
    expect(events[events.length - 1]?.type).toBe('workflow.end');
    const after = await wf.getState('defer-2');
    expect(after.status).toBe('completed');
    expect((after.state as S).decision).toEqual({ granted: true, reason: 'looks fine' });
  });

  it('a due tick auto-resolves with the default deny (fail-closed)', async () => {
    const deadline = Date.now() - 1;
    const wf = deferWorkflow(deadline);
    await drain(wf.execute({}, { threadId: 'defer-3' }));
    const ticked = await wf.tick('defer-3');
    expect(ticked.fired).toBe(true);
    const after = await wf.getState('defer-3');
    expect(after.status).toBe('completed');
    expect((after.state as S).decision).toEqual(DEFAULT_APPROVAL_TIMEOUT_DECISION);
    expect((after.state as S).decision?.granted).toBe(false);
  });

  it('a caller-supplied timeoutDecision is delivered instead of the default', async () => {
    const deadline = Date.now() - 1;
    const wf = deferWorkflow(deadline, { granted: false, reason: 'escalate to owner' });
    await drain(wf.execute({}, { threadId: 'defer-4' }));
    const ticked = await wf.tick('defer-4');
    expect(ticked.fired).toBe(true);
    const after = await wf.getState('defer-4');
    expect((after.state as S).decision).toEqual({ granted: false, reason: 'escalate to owner' });
  });

  it('an approval WITHOUT a deadline never joins the timer enumeration', async () => {
    const wf = createWorkflow<S>({
      name: 'plain-approval',
      channels: { decision: latestValue<S['decision']>() as never },
      nodes: {
        park: createNode<S>({
          name: 'park',
          run: () => ({
            decision: requestApproval<S['decision']>('perm:plain', { toolCallId: 'c9' }),
          }),
        }),
      },
      edges: [
        { from: '__start__', to: 'park' },
        { from: 'park', to: '__end__' },
      ],
      checkpointStore: new InMemoryCheckpointStore(),
    });
    await drain(wf.execute({}, { threadId: 'plain-1' }));
    const state = await wf.getState('plain-1');
    expect(state.pendingPauses?.[0]?.name).toBe('perm:plain');
    expect(state.pendingPauses?.[0]?.wakeAt).toBeUndefined();
    const ticked = await wf.tick('plain-1');
    expect(ticked.fired).toBe(false);
    expect(ticked.nextWakeAt).toBeNull();
  });
});
