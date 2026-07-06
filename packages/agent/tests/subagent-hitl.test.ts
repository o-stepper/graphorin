/**
 * W-001 - durable HITL composes across the sub-agent boundary: a child
 * (handoff target or toTool sub-agent) that suspends on an
 * approval-gated tool PARKS on the parent (`RunState.pendingSubRuns`),
 * the parent suspends, and the parent's resume directive routes
 * decisions back into the child by the composite key
 * (toolCallId, subRunToolCallId). Nested parks route recursively via
 * the `/`-separated path.
 */
import type { AgentEvent, ProviderEvent, Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import {
  createAgent,
  deserializeRunState,
  RUN_STATE_SCHEMA_VERSION,
  SubAgentResumeTargetNotFoundError,
  serializeRunState,
} from '../src/index.js';
import {
  createMockProvider,
  type MockProviderScript,
  textOnlyScript,
  toolCallScript,
} from './fixtures/mock-provider.js';

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

function gatedTool(name: string, ran: Record<string, number>): Tool<unknown, unknown, unknown> {
  return {
    name,
    description: `${name} (requires approval)`,
    inputSchema: passthroughSchema,
    needsApproval: true,
    sideEffectClass: 'external-stateful',
    async execute() {
      ran[name] = (ran[name] ?? 0) + 1;
      return `${name}-done`;
    },
  } as Tool<unknown, unknown, unknown>;
}

/** Provider script emitting several tool calls inside a single step. */
function multiToolCallScript(
  calls: ReadonlyArray<{
    readonly toolCallId: string;
    readonly toolName: string;
    readonly args?: unknown;
  }>,
): MockProviderScript {
  const events: ProviderEvent[] = [
    { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
  ];
  for (const c of calls) {
    events.push(
      { type: 'tool-call-start', toolCallId: c.toolCallId, toolName: c.toolName },
      {
        type: 'tool-call-input-delta',
        toolCallId: c.toolCallId,
        argsDelta: JSON.stringify(c.args ?? {}),
      },
      { type: 'tool-call-end', toolCallId: c.toolCallId, finalArgs: c.args ?? {} },
    );
  }
  events.push({
    type: 'finish',
    finishReason: 'tool-calls',
    usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
  });
  return { events };
}

/** Parent+child pair where the handoff child suspends on a gated call. */
function handoffFixture(ran: Record<string, number>) {
  const child = createAgent({
    name: 'specialist',
    instructions: 'x',
    provider: createMockProvider({
      modelId: 'mock-child',
      scripts: [
        toolCallScript({
          toolCallId: 'tc-child-email',
          toolName: 'send_email',
          args: { to: 'a@b.c' },
          totalTokens: 10,
        }),
        textOnlyScript('child says done', 6),
      ],
    }),
    tools: [gatedTool('send_email', ran)],
  });
  const parent = createAgent({
    name: 'router',
    instructions: 'route',
    provider: createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({
          toolCallId: 'h1',
          toolName: 'transfer_to_specialist',
          args: {},
          totalTokens: 8,
        }),
        textOnlyScript('parent done', 4),
      ],
    }),
    handoffs: [child],
  });
  return { parent, child };
}

describe('W-001 (a,b) - handoff child parks and resumes through the parent', () => {
  it('parks the suspended child, suspends the parent, and a grant completes end-to-end', async () => {
    const ran: Record<string, number> = {};
    const { parent } = handoffFixture(ran);

    const events: AgentEvent[] = [];
    for await (const ev of parent.stream('help')) events.push(ev);
    const end = events.at(-1);
    if (end?.type !== 'agent.end') throw new Error('missing agent.end');
    const suspended = end.result;

    // (a) parent suspended; approval mirrored with the routing key.
    expect(suspended.status).toBe('awaiting_approval');
    expect(events.some((e) => e.type === 'tool.approval.requested')).toBe(true);
    expect(suspended.state.pendingApprovals).toHaveLength(1);
    expect(suspended.state.pendingApprovals[0]?.toolCallId).toBe('tc-child-email');
    expect(suspended.state.pendingApprovals[0]?.subRunToolCallId).toBe('h1');
    expect(suspended.state.pendingSubRuns).toHaveLength(1);
    expect(suspended.state.pendingSubRuns?.[0]?.toolName).toBe('transfer_to_specialist');
    expect(ran.send_email).toBeUndefined();

    // (b) grant via the parent's resume directive on the SAME instance.
    const resumed = await parent.run(suspended.state, {
      directive: {
        approvals: [{ toolCallId: 'tc-child-email', subRunToolCallId: 'h1', granted: true }],
      },
    });
    expect(resumed.status).toBe('completed');
    expect(resumed.output).toBe('parent done');
    expect(ran.send_email).toBe(1);
    // The child's output landed as the parent's tool message for h1.
    expect(
      resumed.state.messages.some(
        (m) => m.role === 'tool' && m.toolCallId === 'h1' && m.content === 'child says done',
      ),
    ).toBe(true);
    expect(resumed.state.pendingSubRuns).toBeUndefined();
    expect(resumed.state.pendingApprovals).toHaveLength(0);
    // W-033 composes: the child's tokens folded into the parent.
    expect(resumed.state.usageByModel?.['mock-child']?.totalTokens).toBe(16);
  });

  it('(c) a denied child approval completes the child with the denial, parent continues', async () => {
    const ran: Record<string, number> = {};
    const { parent } = handoffFixture(ran);
    const suspended = await parent.run('help');
    expect(suspended.status).toBe('awaiting_approval');
    const resumed = await parent.run(suspended.state, {
      directive: {
        approvals: [
          { toolCallId: 'tc-child-email', subRunToolCallId: 'h1', granted: false, reason: 'no' },
        ],
      },
    });
    expect(resumed.status).toBe('completed');
    expect(resumed.output).toBe('parent done');
    expect(ran.send_email).toBeUndefined();
    // The child finished (its model consumed the denial and produced its
    // final text), and that text is the parent's tool message.
    expect(
      resumed.state.messages.some(
        (m) => m.role === 'tool' && m.toolCallId === 'h1' && m.content === 'child says done',
      ),
    ).toBe(true);
  });
});

describe('W-001 (d,h) - partial grant re-suspends; a re-delivered grant is exactly-once', () => {
  it('grants one of two child approvals, re-suspends with the remainder, settles on the second resume', async () => {
    const ran: Record<string, number> = {};
    const child = createAgent({
      name: 'specialist',
      instructions: 'x',
      provider: createMockProvider({
        modelId: 'mock-child',
        scripts: [
          multiToolCallScript([
            { toolCallId: 'tc-1', toolName: 'send_email', args: { n: 1 } },
            { toolCallId: 'tc-2', toolName: 'send_sms', args: { n: 2 } },
          ]),
          textOnlyScript('child finished', 6),
        ],
      }),
      tools: [gatedTool('send_email', ran), gatedTool('send_sms', ran)],
    });
    const parent = createAgent({
      name: 'router',
      instructions: 'route',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({
            toolCallId: 'h1',
            toolName: 'transfer_to_specialist',
            args: {},
            totalTokens: 8,
          }),
          textOnlyScript('parent done', 4),
        ],
      }),
      handoffs: [child],
    });

    const suspended = await parent.run('go');
    expect(suspended.status).toBe('awaiting_approval');
    expect(suspended.state.pendingApprovals).toHaveLength(2);

    // Partial grant: only tc-1.
    const second = await parent.run(suspended.state, {
      directive: {
        approvals: [{ toolCallId: 'tc-1', subRunToolCallId: 'h1', granted: true }],
      },
    });
    expect(second.status).toBe('awaiting_approval');
    expect(ran.send_email).toBe(1);
    expect(ran.send_sms).toBeUndefined();
    // Re-suspended with the remainder, park refreshed.
    expect(second.state.pendingApprovals).toHaveLength(1);
    expect(second.state.pendingApprovals[0]?.toolCallId).toBe('tc-2');
    expect(second.state.pendingApprovals[0]?.subRunToolCallId).toBe('h1');
    expect(second.state.pendingSubRuns).toHaveLength(1);

    // (h) Re-deliver the ALREADY-CONSUMED tc-1 grant together with tc-2:
    // the stale decision matches nothing (its approval is gone), the
    // child's journal replays tc-1 instead of re-executing it.
    const third = await parent.run(second.state, {
      directive: {
        approvals: [
          { toolCallId: 'tc-1', subRunToolCallId: 'h1', granted: true },
          { toolCallId: 'tc-2', subRunToolCallId: 'h1', granted: true },
        ],
      },
    });
    expect(third.status).toBe('completed');
    expect(ran.send_email).toBe(1);
    expect(ran.send_sms).toBe(1);
    expect(
      third.state.messages.some(
        (m) => m.role === 'tool' && m.toolCallId === 'h1' && m.content === 'child finished',
      ),
    ).toBe(true);
  });
});

describe('W-001 (e) - two-level nesting routes through the composed path', () => {
  it('grandchild approval parks up two levels and a path-routed grant executes it once', async () => {
    const ran: Record<string, number> = {};
    const grandchild = createAgent({
      name: 'grandchild',
      instructions: 'x',
      provider: createMockProvider({
        modelId: 'mock-gc',
        scripts: [
          toolCallScript({
            toolCallId: 'tc-gc',
            toolName: 'send_email',
            args: {},
            totalTokens: 10,
          }),
          textOnlyScript('gc done', 4),
        ],
      }),
      tools: [gatedTool('send_email', ran)],
    });
    const child = createAgent({
      name: 'child',
      instructions: 'x',
      provider: createMockProvider({
        modelId: 'mock-child',
        scripts: [
          toolCallScript({
            toolCallId: 'h-gc',
            toolName: 'transfer_to_grandchild',
            args: {},
            totalTokens: 8,
          }),
          textOnlyScript('child done', 4),
        ],
      }),
      handoffs: [grandchild],
    });
    const parent = createAgent({
      name: 'parent',
      instructions: 'x',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({
            toolCallId: 'h-child',
            toolName: 'transfer_to_child',
            args: {},
            totalTokens: 8,
          }),
          textOnlyScript('parent done', 4),
        ],
      }),
      handoffs: [child],
    });

    const suspended = await parent.run('go');
    expect(suspended.status).toBe('awaiting_approval');
    const approval = suspended.state.pendingApprovals[0];
    expect(approval?.toolCallId).toBe('tc-gc');
    expect(approval?.subRunToolCallId).toBe('h-child/h-gc');
    // The child's own park (of the grandchild) rides inside its snapshot.
    expect(suspended.state.pendingSubRuns?.[0]?.state.pendingSubRuns).toHaveLength(1);

    const resumed = await parent.run(suspended.state, {
      directive: {
        approvals: [{ toolCallId: 'tc-gc', subRunToolCallId: 'h-child/h-gc', granted: true }],
      },
    });
    expect(resumed.status).toBe('completed');
    expect(resumed.output).toBe('parent done');
    expect(ran.send_email).toBe(1);
    expect(resumed.state.pendingSubRuns).toBeUndefined();
  });
});

describe('W-001 (f) - toTool parks via the inline walk and resumes via SUBAGENT_TOOL', () => {
  it('a toTool child suspends the parent and a grant completes through the registry refs', async () => {
    const ran: Record<string, number> = {};
    const child = createAgent({
      name: 'worker',
      instructions: 'x',
      provider: createMockProvider({
        modelId: 'mock-child',
        scripts: [
          toolCallScript({
            toolCallId: 'tc-w',
            toolName: 'send_email',
            args: {},
            totalTokens: 10,
          }),
          textOnlyScript('worker done', 4),
        ],
      }),
      tools: [gatedTool('send_email', ran)],
    });
    const parent = createAgent({
      name: 'boss',
      instructions: 'delegate',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({
            toolCallId: 'tc-sub',
            toolName: 'subagent_worker',
            args: { input: 'do it' },
            totalTokens: 8,
          }),
          textOnlyScript('boss done', 4),
        ],
      }),
      tools: [child.toTool() as never],
    });

    const suspended = await parent.run('go');
    expect(suspended.status).toBe('awaiting_approval');
    expect(suspended.state.pendingApprovals[0]?.subRunToolCallId).toBe('tc-sub');
    expect(suspended.state.pendingSubRuns?.[0]?.toolName).toBe('subagent_worker');

    const resumed = await parent.run(suspended.state, {
      directive: {
        approvals: [{ toolCallId: 'tc-w', subRunToolCallId: 'tc-sub', granted: true }],
      },
    });
    expect(resumed.status).toBe('completed');
    expect(resumed.output).toBe('boss done');
    expect(ran.send_email).toBe(1);
    expect(
      resumed.state.messages.some(
        (m) => m.role === 'tool' && m.toolCallId === 'tc-sub' && m.content === 'worker done',
      ),
    ).toBe(true);
  });
});

describe('W-001 (g) - serialization round-trips parked children', () => {
  it('nested snapshots carry their own version and pass secret redaction', async () => {
    const ran: Record<string, number> = {};
    const child = createAgent({
      name: 'specialist',
      instructions: 'x',
      provider: createMockProvider({
        modelId: 'mock-child',
        scripts: [
          toolCallScript({
            toolCallId: 'tc-child-email',
            toolName: 'send_email',
            args: { to: 'a@b.c', apiKey: 'sk-child-secret-123' },
            totalTokens: 10,
          }),
        ],
      }),
      tools: [gatedTool('send_email', ran)],
    });
    const parent = createAgent({
      name: 'router',
      instructions: 'route',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({
            toolCallId: 'h1',
            toolName: 'transfer_to_specialist',
            args: {},
            totalTokens: 8,
          }),
        ],
      }),
      handoffs: [child],
    });
    const suspended = await parent.run('go');
    expect(suspended.status).toBe('awaiting_approval');

    const serialized = serializeRunState(suspended.state, { stripTracingApiKey: true });
    const sub = serialized.pendingSubRuns?.[0];
    expect(sub?.state.version).toBe(RUN_STATE_SCHEMA_VERSION);
    expect(sub?.targetAgentName).toBe('specialist');
    // The child's secret-named arg was redacted recursively.
    expect(JSON.stringify(serialized)).not.toContain('sk-child-secret-123');

    const rehydrated = deserializeRunState(JSON.parse(JSON.stringify(serialized)));
    expect(rehydrated.pendingSubRuns).toHaveLength(1);
    expect(rehydrated.pendingSubRuns?.[0]?.state.pendingApprovals[0]?.toolCallId).toBe(
      'tc-child-email',
    );
    expect(rehydrated.pendingApprovals[0]?.subRunToolCallId).toBe('h1');
  });
});

describe('W-001 (i,j) - resolution errors and colliding child-local ids', () => {
  it('(i) resuming on an instance without the target throws the typed error', async () => {
    const ran: Record<string, number> = {};
    const { parent } = handoffFixture(ran);
    const suspended = await parent.run('help');
    const stranger = createAgent({
      name: 'router',
      instructions: 'route',
      provider: createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('x', 4)] }),
    });
    await expect(
      stranger.run(suspended.state, {
        directive: {
          approvals: [{ toolCallId: 'tc-child-email', subRunToolCallId: 'h1', granted: true }],
        },
      }),
    ).rejects.toThrow(SubAgentResumeTargetNotFoundError);
  });

  it('(j) colliding child-local toolCallIds route by the composite key only', async () => {
    const ran: Record<string, number> = {};
    const mkChild = (name: string) =>
      createAgent({
        name,
        instructions: 'x',
        provider: createMockProvider({
          modelId: `mock-${name}`,
          scripts: [
            toolCallScript({
              // BOTH children announce the same child-local id.
              toolCallId: 'tc-dup',
              toolName: 'send_email',
              args: { from: name },
              totalTokens: 10,
            }),
            textOnlyScript(`${name} done`, 4),
          ],
        }),
        tools: [gatedTool('send_email', ran)],
      });
    const childA = mkChild('alpha');
    const childB = mkChild('beta');
    const parent = createAgent({
      name: 'boss',
      instructions: 'x',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          multiToolCallScript([
            { toolCallId: 'h-a', toolName: 'subagent_alpha', args: { input: 'a' } },
            { toolCallId: 'h-b', toolName: 'subagent_beta', args: { input: 'b' } },
          ]),
          textOnlyScript('boss done', 4),
        ],
      }),
      tools: [childA.toTool() as never, childB.toTool() as never],
    });

    const suspended = await parent.run('go');
    expect(suspended.status).toBe('awaiting_approval');
    expect(suspended.state.pendingApprovals).toHaveLength(2);
    expect(suspended.state.pendingSubRuns).toHaveLength(2);

    // A decision WITHOUT subRunToolCallId matches neither parked approval.
    const noRoute = await parent.run(suspended.state, {
      directive: { approvals: [{ toolCallId: 'tc-dup', granted: true }] },
    });
    expect(noRoute.status).toBe('awaiting_approval');
    expect(ran.send_email).toBeUndefined();

    // Composite-keyed decisions: grant alpha's, deny beta's - exactly one
    // side effect, no cross-application.
    const resumed = await parent.run(noRoute.state, {
      directive: {
        approvals: [
          { toolCallId: 'tc-dup', subRunToolCallId: 'h-a', granted: true },
          { toolCallId: 'tc-dup', subRunToolCallId: 'h-b', granted: false },
        ],
      },
    });
    expect(resumed.status).toBe('completed');
    expect(ran.send_email).toBe(1);
    expect(
      resumed.state.messages.some(
        (m) => m.role === 'tool' && m.toolCallId === 'h-a' && m.content === 'alpha done',
      ),
    ).toBe(true);
    expect(
      resumed.state.messages.some(
        (m) => m.role === 'tool' && m.toolCallId === 'h-b' && m.content === 'beta done',
      ),
    ).toBe(true);
  });
});
