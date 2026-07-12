import { createAgent } from '@graphorin/agent';
import type { DeliveryPayload } from '@graphorin/channels';
import {
  createAccessController,
  createChannelGateway,
  createIdentityRouter,
} from '@graphorin/channels';
import { createLoopbackAdapter } from '@graphorin/channels/testkit';
import type { ProactiveOutcome, Tool } from '@graphorin/core';
import { parseAwakeableRef } from '@graphorin/workflow';
import { describe, expect, it, vi } from 'vitest';
import {
  createProactiveCronTask,
  outcomeToDelivery,
  parseApprovalRef,
  workflowAwakeableOutcome,
} from '../src/index.js';
import { createMockProvider, createStubScheduler, textScript, toolCallScript } from './helpers.js';

const silentWarn = (): void => {};

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

describe('C3: outcomeToDelivery', () => {
  const identity = { channelId: 'loopback', accountId: 'acct', peerId: 'owner' };

  it('is structurally assignable to the channels DeliveryPayload', () => {
    const notify: ProactiveOutcome = {
      kind: 'notify',
      taskId: 't',
      firedAt: '2026-07-12T08:00:00.000Z',
      text: 'All quiet except one overdue reminder.',
    };
    // Compile-time pin: the structural mirror stays compatible with
    // the real channels SPI (this assignment fails typecheck on drift).
    const payload: DeliveryPayload = outcomeToDelivery(notify, identity);
    expect(payload.question).toBeUndefined();
    expect(payload.text).toContain('overdue');
  });

  it('question/review outcomes carry the HITL question block with the ref', () => {
    const review: ProactiveOutcome = {
      kind: 'review',
      taskId: 't',
      firedAt: '2026-07-12T08:00:00.000Z',
      text: 'Approval needed: send_report.',
      ref: 'run:run_1:tc-1',
      options: [
        { label: 'Yes', value: 'y' },
        { label: 'No', value: 'n' },
      ],
    };
    const payload: DeliveryPayload = outcomeToDelivery(review, identity);
    expect(payload.question?.ref).toBe('run:run_1:tc-1');
    expect(payload.question?.options.map((o) => o.value)).toEqual(['y', 'n']);

    const question: ProactiveOutcome = {
      kind: 'question',
      taskId: 't',
      firedAt: '2026-07-12T08:00:00.000Z',
      text: 'Which city for the weather brief?',
      ref: 'wf:w:t:city',
    };
    const q = outcomeToDelivery(question, identity);
    // Default approve/deny keyboard when the outcome carries none.
    expect(q.question?.options.length).toBe(2);
  });
});

describe('C3: workflowAwakeableOutcome', () => {
  it('serializes the awakeable triple as the resolve ref (D-1/A3 roundtrip)', () => {
    const outcome = workflowAwakeableOutcome({
      kind: 'question',
      taskId: 'travel',
      workflowId: 'trip-planner',
      threadId: 'thread-42',
      name: 'destination',
      text: 'Where to?',
    });
    expect(outcome.kind).toBe('question');
    expect(parseAwakeableRef(outcome.ref)).toEqual({
      workflowId: 'trip-planner',
      threadId: 'thread-42',
      name: 'destination',
    });
  });
});

describe('C3 e2e: question delivered over a loopback channel, resolve continues the run', () => {
  it('cron fire parks -> review outcome -> gateway delivery -> ref resolve -> gated tool runs', async () => {
    const gatedExecute = vi.fn(async () => 'sent');
    const gated = {
      name: 'send_digest',
      description: 'send the digest (gated)',
      inputSchema: passthroughSchema,
      sideEffectClass: 'side-effecting',
      needsApproval: true,
      execute: gatedExecute,
    } as Tool<unknown, unknown, unknown>;
    const provider = createMockProvider({
      modelId: 'ladder-e2e',
      scripts: [
        toolCallScript({ toolCallId: 'tc-digest', toolName: 'send_digest', args: {} }),
        textScript('Digest sent after your approval.'),
      ],
    });
    const agent = createAgent({
      name: 'ladder-agent',
      instructions: 'x',
      provider,
      tools: [gated],
    });

    // The messenger bridge stub - what GraphorinServer.runs satisfies.
    const registered: Array<{ runId: string; agentId: string; state: unknown }> = [];
    const outcomes: ProactiveOutcome[] = [];
    const task = createProactiveCronTask({
      id: 'weekly-digest',
      agent,
      scheduler: createStubScheduler(),
      schedule: { cron: '0 9 * * 1' },
      prompt: 'send the weekly digest',
      provider,
      grant: 'review',
      suspendedRuns: {
        registerSuspended: (runId, descriptor, state) => {
          registered.push({ runId, agentId: descriptor.agentId, state });
        },
      },
      onOutcome: (o) => {
        outcomes.push(o);
      },
      warn: silentWarn,
    });

    const fireResult = await task.fire();
    expect(fireResult.outcome?.kind).toBe('review');
    expect(registered.length).toBe(1);
    expect(registered[0]?.agentId).toBe('proactive-weekly-digest');

    // Deliver the outcome through a REAL channel gateway to a loopback
    // adapter - the messenger-side of the ladder.
    const adapter = createLoopbackAdapter();
    const gateway = createChannelGateway({
      adapters: [adapter],
      router: createIdentityRouter({ routes: [{ agentId: 'assistant' }] }),
      access: createAccessController({ policy: { kind: 'open' } }),
      onMessage: async () => undefined,
      warn: silentWarn,
    });
    await gateway.start();
    const outcome = outcomes[0] as ProactiveOutcome;
    await gateway.deliver(
      outcomeToDelivery(outcome, { channelId: adapter.id, accountId: 'acct', peerId: 'owner' }),
    );
    await gateway.stop();

    const delivered = adapter.deliveries[0];
    expect(delivered?.question?.ref).toBeDefined();
    expect(delivered?.text).toContain('Approval needed');

    // The messenger posts the callback-data back; the bot parses the
    // ref and resolves through the retained state (the REST route does
    // exactly this in-process - pinned by the server test suite).
    const parsed = parseApprovalRef(delivered?.question?.ref as string);
    expect(parsed?.toolCallId).toBe('tc-digest');
    const suspended = registered[0]?.state;
    const resumed = await agent.run(suspended as never, {
      directive: { approvals: [{ toolCallId: parsed?.toolCallId as string, granted: true }] },
    });
    expect(resumed.status).toBe('completed');
    expect(String(resumed.output)).toContain('after your approval');
    expect(gatedExecute).toHaveBeenCalledTimes(1);
  });
});
