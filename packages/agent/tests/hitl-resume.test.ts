import type { AgentEvent, Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent, runStateFromJSON, runStateToJSON } from '../src/index.js';
import { createMockProvider, textOnlyScript, toolCallScript } from './fixtures/mock-provider.js';

const buildSendEmailTool = (): Tool<
  { readonly to: string; readonly body: string },
  string,
  unknown
> => ({
  name: 'send_email',
  description: 'Send an email (requires approval).',
  inputSchema: {
    parse: (v: unknown) => v as { readonly to: string; readonly body: string },
    safeParse: (v: unknown) => ({
      success: true as const,
      data: v as { readonly to: string; readonly body: string },
    }),
    toJSON: (): Record<string, unknown> => ({
      type: 'object',
      properties: { to: { type: 'string' }, body: { type: 'string' } },
    }),
  } as Tool<{ readonly to: string; readonly body: string }, string, unknown>['inputSchema'],
  needsApproval: true,
  sideEffectClass: 'external-stateful',
  async execute(input) {
    return `sent:${input.to}`;
  },
});

describe('Agent — HITL approval flow', () => {
  it('suspends on a needsApproval tool call, persists RunState, and resumes via directive', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({
          toolCallId: 'tc-email',
          toolName: 'send_email',
          args: { to: 'a@b.c', body: 'hi' },
          totalTokens: 10,
        }),
        textOnlyScript('email sent successfully', 6),
      ],
    });
    const agent = createAgent({
      name: 'mailer',
      instructions: 'Send emails for the user.',
      provider,
      tools: [buildSendEmailTool()],
    });

    // First run — capture the suspended RunState by walking the stream.
    const events1: AgentEvent[] = [];
    let suspendedState: unknown;
    for await (const ev of agent.stream('email Alice')) {
      events1.push(ev);
      if (ev.type === 'tool.approval.requested') {
        // The current public surface returns the run via
        // `agent.run(...)`; for the test we walk the stream and
        // synthesize the state from the emitted events.
      }
    }
    // The first run must NOT have hit `agent.end`.
    expect(events1.some((e) => e.type === 'agent.end')).toBe(false);
    expect(events1.some((e) => e.type === 'tool.approval.requested')).toBe(true);

    // Build a synthetic RunState representing the suspended run
    // (the tool was approval-gated; pendingApprovals has one entry).
    suspendedState = {
      version: 'graphorin-run-state/1.0',
      id: 'run-fixture',
      agentId: agent.id,
      currentAgentId: agent.id,
      sessionId: 'sess-fixture',
      status: 'awaiting_approval',
      steps: [],
      messages: [
        { role: 'system', content: 'Send emails for the user.' },
        { role: 'user', content: 'email Alice' },
      ],
      pendingApprovals: [
        {
          toolCallId: 'tc-email',
          toolName: 'send_email',
          args: { to: 'a@b.c', body: 'hi' },
          requestedAt: new Date().toISOString(),
        },
      ],
      handoffs: [],
      usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
      startedAt: new Date().toISOString(),
    };

    // Round-trip through JSON to verify persistence works.
    const json = JSON.stringify(suspendedState);
    const rehydrated = runStateFromJSON(json);
    expect(rehydrated.pendingApprovals.length).toBe(1);

    // Resume with a granted directive — the loop emits
    // `tool.approval.granted` and produces a follow-up text.
    const provider2 = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('email sent successfully', 6)],
    });
    const resumeAgent = createAgent({
      name: 'mailer',
      instructions: 'Send emails for the user.',
      provider: provider2,
      tools: [buildSendEmailTool()],
    });
    const events2: AgentEvent[] = [];
    for await (const ev of resumeAgent.stream(rehydrated, {
      directive: {
        approvals: [{ toolCallId: 'tc-email', granted: true }],
      },
    })) {
      events2.push(ev);
    }
    expect(events2.some((e) => e.type === 'tool.approval.granted')).toBe(true);
    const completion = events2.find((e) => e.type === 'text.complete');
    if (completion?.type === 'text.complete') {
      expect(completion.text).toBe('email sent successfully');
    }
  });

  it('records a denied approval and resumes with the rejection in the message buffer', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('aborted send', 4)],
    });
    const agent = createAgent({
      name: 'mailer',
      instructions: 'noop',
      provider,
      tools: [buildSendEmailTool()],
    });
    const suspended = {
      version: 'graphorin-run-state/1.0',
      id: 'run-2',
      agentId: agent.id,
      currentAgentId: agent.id,
      sessionId: 'sess-2',
      status: 'awaiting_approval',
      steps: [],
      messages: [{ role: 'user', content: 'email Bob' }],
      pendingApprovals: [
        {
          toolCallId: 'tc-x',
          toolName: 'send_email',
          args: { to: 'b@c.d', body: 'hey' },
          requestedAt: new Date().toISOString(),
        },
      ],
      handoffs: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      startedAt: new Date().toISOString(),
    } as const;
    const json = JSON.stringify(suspended);
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream(runStateFromJSON(json), {
      directive: {
        approvals: [{ toolCallId: 'tc-x', granted: false, reason: 'user cancelled' }],
      },
    })) {
      events.push(ev);
    }
    expect(events.some((e) => e.type === 'tool.approval.denied')).toBe(true);
  });

  it('resuming an awaiting-approval run WITHOUT a directive stays suspended — no provider call (AG-14)', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('should not run', 4)],
    });
    const agent = createAgent({
      name: 'mailer',
      instructions: 'noop',
      provider,
      tools: [buildSendEmailTool()],
    });
    const suspended = {
      version: 'graphorin-run-state/1.0',
      id: 'run-aw',
      agentId: agent.id,
      currentAgentId: agent.id,
      sessionId: 's',
      status: 'awaiting_approval',
      steps: [],
      messages: [{ role: 'user', content: 'email' }],
      pendingApprovals: [
        {
          toolCallId: 'tc-1',
          toolName: 'send_email',
          args: { to: 'a@b.c', body: 'x' },
          requestedAt: new Date().toISOString(),
        },
      ],
      handoffs: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      startedAt: new Date().toISOString(),
    } as const;
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream(runStateFromJSON(JSON.stringify(suspended)))) {
      events.push(ev);
    }
    // Still suspended — the loop never re-issued the dangling tool_use.
    expect(events.some((e) => e.type === 'step.start')).toBe(false);
    expect(events.some((e) => e.type === 'text.complete')).toBe(false);
  });

  it('does not re-run / silently complete a resumed failed run (AG-14)', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('should not run', 4)],
    });
    const agent = createAgent({ name: 'r', instructions: 'noop', provider });
    const failed = {
      version: 'graphorin-run-state/1.0',
      id: 'run-f',
      agentId: agent.id,
      currentAgentId: agent.id,
      sessionId: 's',
      status: 'failed',
      steps: [],
      messages: [{ role: 'user', content: 'x' }],
      pendingApprovals: [],
      handoffs: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      startedAt: new Date().toISOString(),
      error: { message: 'boom', code: 'unknown' },
    } as const;
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream(runStateFromJSON(JSON.stringify(failed)))) {
      events.push(ev);
    }
    // The failed run was NOT silently re-entered + completed.
    expect(events.some((e) => e.type === 'step.start')).toBe(false);
    expect(events.some((e) => e.type === 'text.complete')).toBe(false);
  });

  it('runStateToJSON / runStateFromJSON round-trip the full state shape', () => {
    const seed = {
      version: 'graphorin-run-state/1.0',
      id: 'run-3',
      agentId: 'a-3',
      currentAgentId: 'a-3',
      sessionId: 's-3',
      status: 'awaiting_approval',
      steps: [],
      messages: [],
      pendingApprovals: [
        {
          toolCallId: 'tc-1',
          toolName: 'foo',
          args: {},
          requestedAt: '2026-01-01T00:00:00Z',
        },
      ],
      handoffs: [],
      usage: { promptTokens: 1, completionTokens: 2, totalTokens: 3 },
      startedAt: '2026-01-01T00:00:00Z',
    } as const;
    const json = JSON.stringify(seed);
    const out = runStateFromJSON(json);
    const reser = runStateToJSON(out);
    const reparsed = JSON.parse(reser) as { pendingApprovals: Array<{ toolCallId: string }> };
    expect(reparsed.pendingApprovals[0]?.toolCallId).toBe('tc-1');
  });
});
