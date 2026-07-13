/**
 * E1 defer-bridge composition e2e: an agent whose permission policy
 * DEFERS a tool call suspends durably; the harness parks the deferred
 * decision as a workflow `requestApproval` with a durable deadline
 * (addressable through the A3 awakeable-ref for messenger callback
 * data); the decision - a human resolve before the deadline, or the
 * timer daemon's auto-deny after it - maps back onto the agent's
 * resume directive. This is the documented framework composition for
 * `defer`; the timeout VALUE is caller policy.
 */

import { createAgent } from '@graphorin/agent';
import type { Provider, ProviderEvent, Tool, WorkflowEvent } from '@graphorin/core';
import { DEFAULT_APPROVAL_TIMEOUT_DECISION } from '@graphorin/core';
import {
  createNode,
  createWorkflow,
  InMemoryCheckpointStore,
  latestValue,
  parseAwakeableRef,
  requestApproval,
  serializeAwakeableRef,
} from '@graphorin/workflow';
import { describe, expect, it } from 'vitest';
import { createMockProvider, type MockScript, textScript } from './helpers.js';

function toolCallScript(args: {
  readonly toolCallId: string;
  readonly toolName: string;
  readonly args: unknown;
}): MockScript {
  const events: ProviderEvent[] = [
    { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
    { type: 'tool-call-start', toolCallId: args.toolCallId, toolName: args.toolName },
    {
      type: 'tool-call-input-delta',
      toolCallId: args.toolCallId,
      argsDelta: JSON.stringify(args.args),
    },
    { type: 'tool-call-end', toolCallId: args.toolCallId, finalArgs: args.args },
    {
      type: 'finish',
      finishReason: 'tool-calls',
      usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
    },
  ];
  return { events };
}

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

function buildDeferringAgent(state: { ran: boolean }, provider: Provider) {
  return createAgent({
    name: 'treasurer',
    instructions: 'manage money',
    provider,
    tools: [
      {
        name: 'send_money',
        description: 'send money to a recipient',
        inputSchema: passthroughSchema,
        sideEffectClass: 'external-stateful',
        execute: async () => {
          state.ran = true;
          return 'sent';
        },
      } as Tool<unknown, unknown, unknown>,
    ],
    toolPolicy: {
      rules: [{ effect: 'defer', tool: 'send_money', reason: 'async owner sign-off' }],
    },
  });
}

interface ParkState {
  decision: { granted: boolean; reason?: string } | null;
}

function buildParkWorkflow(approvalName: string, deadline: number) {
  return createWorkflow<ParkState>({
    name: 'permission-park',
    channels: { decision: latestValue<ParkState['decision']>() as never },
    nodes: {
      park: createNode<ParkState>({
        name: 'park',
        run: () => ({
          decision: requestApproval<ParkState['decision']>(
            approvalName,
            { kind: 'deferred-permission' },
            { timeoutAt: deadline },
          ),
        }),
      }),
    },
    edges: [
      { from: '__start__', to: 'park' },
      { from: 'park', to: '__end__' },
    ],
    checkpointStore: new InMemoryCheckpointStore(),
  });
}

async function drain<T>(events: AsyncIterable<WorkflowEvent<T>>): Promise<void> {
  for await (const _ of events) {
    // drained
  }
}

describe('E1 - defer bridge (agent suspend -> workflow park -> resume directive)', () => {
  it('timeout leg: the durable deadline auto-denies and the agent resume denies the call', async () => {
    const state = { ran: false };
    const agent = buildDeferringAgent(
      state,
      createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({ toolCallId: 'c1', toolName: 'send_money', args: { amount: 100 } }),
          textScript('acknowledged the denial'),
        ],
      }),
    );

    // 1. The agent defers - durable suspend with mode 'defer'.
    const suspended = await agent.run('pay the invoice');
    expect(suspended.status).toBe('awaiting_approval');
    const approval = suspended.state.pendingApprovals[0];
    expect(approval?.mode).toBe('defer');

    // 2. The harness parks the decision as a workflow approval with a
    //    deadline; the A3 ref round-trips as messenger callback data.
    const threadId = 'park-timeout';
    const approvalName = `perm:${approval?.toolCallId}`;
    const wf = buildParkWorkflow(approvalName, Date.now() - 1);
    await drain(wf.execute({}, { threadId }));
    const ref = serializeAwakeableRef({
      workflowId: 'permission-park',
      threadId,
      name: approvalName,
    });
    expect(parseAwakeableRef(ref)).toEqual({
      workflowId: 'permission-park',
      threadId,
      name: approvalName,
    });

    // 3. The deadline passed - the sweep tick auto-denies (fail-closed).
    const ticked = await wf.tick(threadId);
    expect(ticked.fired).toBe(true);
    const parked = await wf.getState(threadId);
    const decision = (parked.state as ParkState).decision;
    expect(decision).toEqual(DEFAULT_APPROVAL_TIMEOUT_DECISION);

    // 4. The decision maps onto the agent's resume directive.
    const resumed = await agent.run(suspended.state, {
      directive: {
        approvals: [
          {
            toolCallId: approval?.toolCallId ?? '',
            granted: decision?.granted ?? false,
            ...(decision?.reason !== undefined ? { reason: decision.reason } : {}),
          },
        ],
      },
    });
    expect(resumed.status).toBe('completed');
    expect(state.ran).toBe(false);
  });

  it('human leg: a resolve before the deadline grants and the tool executes on resume', async () => {
    const state = { ran: false };
    const agent = buildDeferringAgent(
      state,
      createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({ toolCallId: 'c2', toolName: 'send_money', args: { amount: 5 } }),
          textScript('sent'),
        ],
      }),
    );
    const suspended = await agent.run('pay');
    const approval = suspended.state.pendingApprovals[0];
    expect(approval?.mode).toBe('defer');

    const threadId = 'park-human';
    const approvalName = `perm:${approval?.toolCallId}`;
    const wf = buildParkWorkflow(approvalName, Date.now() + 60_000);
    await drain(wf.execute({}, { threadId }));

    // The human resolves through the awakeable address before expiry.
    const ref = parseAwakeableRef(
      serializeAwakeableRef({ workflowId: 'permission-park', threadId, name: approvalName }),
    );
    await drain(wf.approve(ref?.threadId ?? '', ref?.name ?? '', { granted: true }));
    const parked = await wf.getState(threadId);
    const decision = (parked.state as ParkState).decision;
    expect(decision?.granted).toBe(true);

    const resumed = await agent.run(suspended.state, {
      directive: {
        approvals: [{ toolCallId: approval?.toolCallId ?? '', granted: true }],
      },
    });
    expect(resumed.status).toBe('completed');
    expect(state.ran).toBe(true);
  });
});
