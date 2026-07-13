/**
 * E1 (item 11) end-to-end through the agent run loop: the four-value
 * permission pre-screen (hook + policy) - deny fails fast, ask/defer
 * durably suspend with `ToolApproval.mode`, a granted resume executes
 * through the pre-approved dispatch, an allowed rewrite is what runs
 * and what an approval record carries - plus deny-by-name across all
 * three surfaces (advertised catalogue, fabricated executor call,
 * inline sub-agent call) and the sub-agent ask projection (W-001).
 */

import type { Provider, ProviderEvent, ProviderRequest, Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import {
  type MockProviderScript,
  textOnlyScript,
  toolCallScript,
} from './fixtures/mock-provider.js';

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

function tool(
  name: string,
  sideEffectClass: 'read-only' | 'side-effecting' | 'external-stateful',
  state: { ran: boolean; lastInput?: unknown },
): Tool<unknown, unknown, unknown> {
  return {
    name,
    description: `${name} tool`,
    inputSchema: passthroughSchema,
    sideEffectClass,
    execute: async (input: unknown) => {
      state.ran = true;
      state.lastInput = input;
      return 'ok';
    },
  } as Tool<unknown, unknown, unknown>;
}

function provider(
  scripts: ReadonlyArray<MockProviderScript>,
  seenToolNames?: string[][],
): Provider {
  let cursor = 0;
  return {
    name: 'mock',
    modelId: 'mock',
    capabilities: {
      streaming: true,
      toolCalling: true,
      parallelToolCalls: true,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: 200_000,
      maxOutput: 8192,
    },
    async *stream(req: ProviderRequest): AsyncIterable<ProviderEvent> {
      seenToolNames?.push((req.tools ?? []).map((t) => t.name));
      const script = scripts[cursor++];
      if (script === undefined) {
        yield { type: 'error', error: { kind: 'unknown', message: 'no script' } };
        return;
      }
      for (const ev of script.events) yield ev;
    },
    async generate() {
      throw new Error('mock: generate not implemented');
    },
  };
}

describe('E1 - permission pre-screen in the run loop', () => {
  it('hook deny fails the call fast; the run completes without executing it', async () => {
    const state = { ran: false };
    const agent = createAgent({
      name: 'perm-deny',
      instructions: 'act',
      provider: provider([
        toolCallScript({ toolCallId: 'c1', toolName: 'send_email', args: { to: 'x@y.z' } }),
        textOnlyScript('done'),
      ]),
      tools: [tool('send_email', 'external-stateful', state)],
      permissionHook: () => ({ decision: 'deny', reason: 'no outbound email' }),
    });
    const result = await agent.run('go');
    expect(result.status).toBe('completed');
    expect(state.ran).toBe(false);
    expect(result.state.pendingApprovals).toHaveLength(0);
    const outcome = result.state.steps.flatMap((s) => s.toolCalls)[0]?.outcome;
    expect(outcome !== undefined && 'kind' in outcome ? outcome.kind : null).toBe(
      'capability_blocked',
    );
    expect(outcome !== undefined && 'message' in outcome ? outcome.message : '').toContain(
      'no outbound email',
    );
  });

  it("hook ask suspends durably with mode 'ask'; a granted resume executes", async () => {
    const state = { ran: false };
    const agent = createAgent({
      name: 'perm-ask',
      instructions: 'act',
      provider: provider([
        toolCallScript({ toolCallId: 'c1', toolName: 'send_email', args: { to: 'x@y.z' } }),
        textOnlyScript('done'),
      ]),
      tools: [tool('send_email', 'external-stateful', state)],
      permissionHook: ({ toolName }) =>
        toolName === 'send_email'
          ? { decision: 'ask', reason: 'outbound needs sign-off' }
          : { decision: 'allow' },
    });
    const events: Array<{ type: string; mode?: string }> = [];
    let suspended: Awaited<ReturnType<typeof agent.run>> | undefined;
    for await (const ev of agent.stream('go')) {
      events.push(ev as { type: string; mode?: string });
      if (ev.type === 'agent.end') suspended = ev.result as typeof suspended;
    }
    expect(suspended?.status).toBe('awaiting_approval');
    const approval = suspended?.state.pendingApprovals[0];
    expect(approval?.mode).toBe('ask');
    expect(approval?.reason).toBe('outbound needs sign-off');
    const requested = events.find((e) => e.type === 'tool.approval.requested');
    expect(requested?.mode).toBe('ask');
    expect(state.ran).toBe(false);

    const resumed = await agent.run(suspended!.state, {
      directive: { approvals: [{ toolCallId: 'c1', granted: true }] },
    });
    expect(resumed.status).toBe('completed');
    expect(state.ran).toBe(true);
  });

  it("policy defer suspends with mode 'defer'; a denied resume keeps the tool unrun", async () => {
    const state = { ran: false };
    const agent = createAgent({
      name: 'perm-defer',
      instructions: 'act',
      provider: provider([
        toolCallScript({ toolCallId: 'c1', toolName: 'send_money', args: { amount: 10 } }),
        textOnlyScript('done'),
      ]),
      tools: [tool('send_money', 'external-stateful', state)],
      toolPolicy: {
        rules: [{ effect: 'defer', tool: 'send_money', reason: 'park for async sign-off' }],
      },
    });
    const suspended = await agent.run('go');
    expect(suspended.status).toBe('awaiting_approval');
    expect(suspended.state.pendingApprovals[0]?.mode).toBe('defer');
    expect(state.ran).toBe(false);

    const resumed = await agent.run(suspended.state, {
      directive: {
        approvals: [{ toolCallId: 'c1', granted: false, reason: 'defer-timeout' }],
      },
    });
    expect(resumed.status).toBe('completed');
    expect(state.ran).toBe(false);
    const denialMessage = resumed.state.messages.find(
      (m) => m.role === 'tool' && m.toolCallId === 'c1',
    );
    expect(
      denialMessage !== undefined && 'content' in denialMessage
        ? String(denialMessage.content)
        : '',
    ).toContain('denied');
  });

  it('an allowed rewrite executes AND is what a needsApproval record carries (W-118)', async () => {
    const state: { ran: boolean; lastInput?: unknown } = { ran: false };
    const gated = {
      ...tool('send_email', 'external-stateful', state),
      needsApproval: true,
    } as Tool<unknown, unknown, unknown>;
    const agent = createAgent({
      name: 'perm-rewrite',
      instructions: 'act',
      provider: provider([
        toolCallScript({ toolCallId: 'c1', toolName: 'send_email', args: { to: 'ceo@corp' } }),
        textOnlyScript('done'),
      ]),
      tools: [gated],
      permissionHook: () => ({
        decision: 'allow',
        updatedInput: { to: 'sandbox@test' },
      }),
    });
    const suspended = await agent.run('go');
    expect(suspended.status).toBe('awaiting_approval');
    // The human is shown what will actually run - the rewrite.
    expect(suspended.state.pendingApprovals[0]?.args).toEqual({ to: 'sandbox@test' });

    const resumed = await agent.run(suspended.state, {
      directive: { approvals: [{ toolCallId: 'c1', granted: true }] },
    });
    expect(resumed.status).toBe('completed');
    expect(state.ran).toBe(true);
    expect(state.lastInput).toEqual({ to: 'sandbox@test' });
  });
});

describe('E1 - deny-by-name across the three surfaces', () => {
  it('removes the tool from the advertised catalogue and blocks a fabricated call', async () => {
    const state = { ran: false };
    const seenToolNames: string[][] = [];
    const agent = createAgent({
      name: 'deny-name',
      instructions: 'act',
      provider: provider(
        [
          // The model fabricates a call to the unadvertised name anyway.
          toolCallScript({ toolCallId: 'c1', toolName: 'schedule_cron', args: {} }),
          textOnlyScript('done'),
        ],
        seenToolNames,
      ),
      tools: [
        tool('schedule_cron', 'side-effecting', state),
        tool('read_file', 'read-only', { ran: false }),
      ],
      toolPolicy: {
        rules: [{ effect: 'deny', tool: 'schedule_*', reason: 'no recursive scheduling' }],
      },
    });
    const result = await agent.run('go');
    expect(result.status).toBe('completed');
    // Advertise half: never offered to the model.
    expect(seenToolNames[0]).not.toContain('schedule_cron');
    expect(seenToolNames[0]).toContain('read_file');
    // Enforce half: the fabricated call is blocked, the tool never ran.
    expect(state.ran).toBe(false);
    const outcome = result.state.steps.flatMap((s) => s.toolCalls)[0]?.outcome;
    expect(outcome !== undefined && 'kind' in outcome ? outcome.kind : null).toBe(
      'capability_blocked',
    );
  });

  it('blocks a denied sub-agent tool call on the inline path', async () => {
    const childRan = { ran: false };
    const child = createAgent({
      name: 'researcher',
      instructions: 'research',
      provider: provider([textOnlyScript('child done')]),
      tools: [tool('noop', 'read-only', childRan)],
    });
    const agent = createAgent({
      name: 'deny-subagent',
      instructions: 'delegate',
      provider: provider([
        toolCallScript({ toolCallId: 'c1', toolName: 'ask_researcher', args: { input: 'hi' } }),
        textOnlyScript('done'),
      ]),
      tools: [child.toTool({ name: 'ask_researcher', description: 'delegate to researcher' })],
      toolPolicy: { rules: [{ effect: 'deny', tool: 'ask_researcher', reason: 'no delegation' }] },
    });
    const result = await agent.run('go');
    expect(result.status).toBe('completed');
    expect(childRan.ran).toBe(false);
    const outcome = result.state.steps.flatMap((s) => s.toolCalls)[0]?.outcome;
    expect(outcome !== undefined && 'kind' in outcome ? outcome.kind : null).toBe(
      'capability_blocked',
    );
  });
});

describe('E1 - sub-agent ask projection (W-001)', () => {
  it("a child's ask parks on the parent with mode + subRunToolCallId and resumes through it", async () => {
    const childState = { ran: false };
    const child = createAgent({
      name: 'worker',
      instructions: 'work',
      provider: provider([
        toolCallScript({ toolCallId: 'child-c1', toolName: 'deploy', args: {} }),
        textOnlyScript('child done'),
      ]),
      tools: [tool('deploy', 'external-stateful', childState)],
      permissionHook: ({ toolName }) =>
        toolName === 'deploy'
          ? { decision: 'ask', reason: 'deploys need sign-off' }
          : { decision: 'allow' },
    });
    const parent = createAgent({
      name: 'lead',
      instructions: 'lead',
      provider: provider([
        toolCallScript({ toolCallId: 'p1', toolName: 'ask_worker', args: { input: 'deploy it' } }),
        textOnlyScript('parent done'),
      ]),
      tools: [child.toTool({ name: 'ask_worker', description: 'delegate to worker' })],
    });
    const suspended = await parent.run('go');
    expect(suspended.status).toBe('awaiting_approval');
    const approval = suspended.state.pendingApprovals[0];
    expect(approval?.toolCallId).toBe('child-c1');
    expect(approval?.subRunToolCallId).toBe('p1');
    expect(approval?.mode).toBe('ask');

    const resumed = await parent.run(suspended.state, {
      directive: {
        approvals: [{ toolCallId: 'child-c1', granted: true, subRunToolCallId: 'p1' }],
      },
    });
    expect(resumed.status).toBe('completed');
    expect(childState.ran).toBe(true);
  });
});
