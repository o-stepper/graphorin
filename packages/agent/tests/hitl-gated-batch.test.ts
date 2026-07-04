/**
 * agent-01 regression: tool calls batched with an approval-gated call in
 * the SAME model step must not be dropped.
 *
 * Pre-fix, the pre-screen returned `finishRun` on the FIRST gated call:
 * every later call in the step was never executed, never got an approval
 * request, and never got a `tool` message — the persisted assistant
 * message still announced all of them, so the resumed provider request
 * carried dangling `tool_use` ids that real providers 400 on. A second
 * gated call in the same step was dropped with no approval ever
 * requested.
 *
 * The mock provider asserts transcript well-formedness on every request,
 * so a regression fails loudly here.
 */
import type { AgentEvent, ProviderEvent, Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent, runStateFromJSON, runStateToJSON } from '../src/index.js';
import {
  createMockProvider,
  type MockProviderScript,
  textOnlyScript,
} from './fixtures/mock-provider.js';

/** Provider script emitting several tool calls inside a single step. */
function multiToolCallScript(
  calls: ReadonlyArray<{ readonly toolCallId: string; readonly toolName: string }>,
): MockProviderScript {
  const events: ProviderEvent[] = [
    { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
  ];
  for (const c of calls) {
    events.push(
      { type: 'tool-call-start', toolCallId: c.toolCallId, toolName: c.toolName },
      { type: 'tool-call-input-delta', toolCallId: c.toolCallId, argsDelta: '{}' },
      { type: 'tool-call-end', toolCallId: c.toolCallId, finalArgs: {} },
    );
  }
  events.push({
    type: 'finish',
    finishReason: 'tool-calls',
    usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
  });
  return { events };
}

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

function countingTool(
  name: string,
  ran: Record<string, number>,
  extra: Partial<Tool<unknown, unknown, unknown>> = {},
): Tool<unknown, unknown, unknown> {
  return {
    name,
    description: `${name} tool`,
    inputSchema: passthroughSchema,
    sideEffectClass: 'read-only',
    async execute() {
      ran[name] = (ran[name] ?? 0) + 1;
      return `${name}-ok`;
    },
    ...extra,
  } as Tool<unknown, unknown, unknown>;
}

const toolMessageIds = (state: { readonly messages: ReadonlyArray<unknown> }): string[] =>
  (state.messages as Array<{ role: string; toolCallId?: string }>)
    .filter((m) => m.role === 'tool')
    .map((m) => m.toolCallId ?? '');

describe('agent-01: gated call batched with other calls in one step', () => {
  it('executes the non-gated remainder before suspending and resumes without dangling tool_use', async () => {
    const ran: Record<string, number> = {};
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        multiToolCallScript([
          { toolCallId: 'tc-a', toolName: 'plain_a' },
          { toolCallId: 'tc-g', toolName: 'gated' },
          { toolCallId: 'tc-c', toolName: 'plain_c' },
        ]),
      ],
    });
    const agent = createAgent({
      name: 'gated-batch',
      instructions: 'noop',
      provider,
      tools: [
        countingTool('plain_a', ran),
        countingTool('gated', ran, { needsApproval: true, sideEffectClass: 'external-stateful' }),
        countingTool('plain_c', ran),
      ],
    });

    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('go')) events.push(ev);

    const end = events.find((e) => e.type === 'agent.end');
    expect(end?.type).toBe('agent.end');
    if (end?.type !== 'agent.end') return;
    expect(end.result.status).toBe('awaiting_approval');

    // The non-gated remainder ran BEFORE the suspend; the gated call did not.
    expect(ran).toEqual({ plain_a: 1, plain_c: 1 });

    // Exactly one pending approval — the gated call — and the persisted
    // transcript already has tool messages for both plain calls.
    const state = end.result.state;
    expect(state.pendingApprovals.map((a) => a.toolCallId)).toEqual(['tc-g']);
    expect(toolMessageIds(state).sort()).toEqual(['tc-a', 'tc-c']);

    // Resume from the persisted JSON with a grant. The mock provider
    // asserts transcript well-formedness, so a dangling tc-c would throw.
    const provider2 = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('done', 4)],
    });
    const resumeAgent = createAgent({
      name: 'gated-batch',
      instructions: 'noop',
      provider: provider2,
      tools: [
        countingTool('plain_a', ran),
        countingTool('gated', ran, { needsApproval: true, sideEffectClass: 'external-stateful' }),
        countingTool('plain_c', ran),
      ],
    });
    const rehydrated = runStateFromJSON(runStateToJSON(state));
    const events2: AgentEvent[] = [];
    for await (const ev of resumeAgent.stream(rehydrated, {
      directive: { approvals: [{ toolCallId: 'tc-g', granted: true }] },
    })) {
      events2.push(ev);
    }

    const end2 = events2.find((e) => e.type === 'agent.end');
    expect(end2?.type).toBe('agent.end');
    if (end2?.type !== 'agent.end') return;
    expect(end2.result.status).toBe('completed');
    // The approved call ran exactly once; the plain calls did NOT re-run.
    expect(ran).toEqual({ plain_a: 1, plain_c: 1, gated: 1 });
    // Every announced toolCallId now has a tool message.
    expect(toolMessageIds(end2.result.state).sort()).toEqual(['tc-a', 'tc-c', 'tc-g']);
  });

  it('collects EVERY gated call in the step into pendingApprovals', async () => {
    const ran: Record<string, number> = {};
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        multiToolCallScript([
          { toolCallId: 'tc-g1', toolName: 'gated_one' },
          { toolCallId: 'tc-mid', toolName: 'plain_mid' },
          { toolCallId: 'tc-g2', toolName: 'gated_two' },
        ]),
      ],
    });
    const agent = createAgent({
      name: 'gated-two',
      instructions: 'noop',
      provider,
      tools: [
        countingTool('gated_one', ran, { needsApproval: true }),
        countingTool('plain_mid', ran),
        countingTool('gated_two', ran, { needsApproval: true }),
      ],
    });

    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('go')) events.push(ev);
    const end = events.find((e) => e.type === 'agent.end');
    if (end?.type !== 'agent.end') throw new Error('expected agent.end');

    // Both gated calls are pending (pre-fix: only the first, the second
    // was silently dropped); the plain call between them already ran.
    expect(end.result.state.pendingApprovals.map((a) => a.toolCallId)).toEqual(['tc-g1', 'tc-g2']);
    expect(
      events
        .filter((e) => e.type === 'tool.approval.requested')
        .map((e) => (e.type === 'tool.approval.requested' ? e.toolCallId : '')),
    ).toEqual(['tc-g1', 'tc-g2']);
    expect(ran).toEqual({ plain_mid: 1 });

    // Granting both on resume executes both and completes cleanly.
    const provider2 = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('done', 4)],
    });
    const resumeAgent = createAgent({
      name: 'gated-two',
      instructions: 'noop',
      provider: provider2,
      tools: [
        countingTool('gated_one', ran, { needsApproval: true }),
        countingTool('plain_mid', ran),
        countingTool('gated_two', ran, { needsApproval: true }),
      ],
    });
    const rehydrated = runStateFromJSON(runStateToJSON(end.result.state));
    const events2: AgentEvent[] = [];
    for await (const ev of resumeAgent.stream(rehydrated, {
      directive: {
        approvals: [
          { toolCallId: 'tc-g1', granted: true },
          { toolCallId: 'tc-g2', granted: true },
        ],
      },
    })) {
      events2.push(ev);
    }
    const end2 = events2.find((e) => e.type === 'agent.end');
    if (end2?.type !== 'agent.end') throw new Error('expected agent.end');
    expect(end2.result.status).toBe('completed');
    expect(ran).toEqual({ plain_mid: 1, gated_one: 1, gated_two: 1 });
    expect(toolMessageIds(end2.result.state).sort()).toEqual(['tc-g1', 'tc-g2', 'tc-mid']);
  });
});
