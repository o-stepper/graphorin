import type { AgentEvent, Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent, runStateFromJSON, runStateToJSON } from '../src/index.js';
import { createMockProvider, textOnlyScript, toolCallScript } from './fixtures/mock-provider.js';

const buildSendEmailTool = (): Tool<unknown, unknown, unknown> =>
  ({
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
    async execute(input: { readonly to: string; readonly body: string }) {
      return `sent:${input.to}`;
    },
  }) as unknown as Tool<unknown, unknown, unknown>;

describe('Agent - HITL approval flow', () => {
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

    // First run - capture the suspended RunState by walking the stream.
    const events1: AgentEvent[] = [];
    for await (const ev of agent.stream('email Alice')) {
      events1.push(ev);
      if (ev.type === 'tool.approval.requested') {
        // `agent.run(...)` now returns the suspended RunState directly
        // (`result.state`, AG-9 - covered in agent-result.test.ts); this
        // test keeps the synthetic-state path to pin the serialized
        // wire format a durable store would rehydrate from.
      }
    }
    // The suspended run still ends with a terminal `agent.end` (AG-20) -
    // its result carries status 'awaiting_approval', which is how stream
    // consumers (e.g. an SSE bridge) learn the stream is over but resumable.
    const end1 = events1.find((e) => e.type === 'agent.end');
    expect(end1).toBeDefined();
    if (end1?.type === 'agent.end') {
      expect(end1.result.status).toBe('awaiting_approval');
      expect(end1.result.state.pendingApprovals.length).toBeGreaterThan(0);
    }
    expect(events1.some((e) => e.type === 'tool.approval.requested')).toBe(true);

    // Build a synthetic RunState representing the suspended run
    // (the tool was approval-gated; pendingApprovals has one entry).
    const suspendedState: unknown = {
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

    // Resume with a granted directive - the loop emits
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

  it('executes the approved tool on resume - real side effect, exactly once (AG-1)', async () => {
    const provider = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('done', 4)] });
    const agent = createAgent({
      name: 'mailer',
      instructions: 'noop',
      provider,
      tools: [buildSendEmailTool()],
    });
    const suspended = {
      version: 'graphorin-run-state/1.0',
      id: 'run-ag1',
      agentId: agent.id,
      currentAgentId: agent.id,
      sessionId: 's',
      status: 'awaiting_approval',
      steps: [],
      messages: [{ role: 'user', content: 'email Alice' }],
      pendingApprovals: [
        {
          toolCallId: 'tc-email',
          toolName: 'send_email',
          args: { to: 'a@b.c', body: 'hi' },
          requestedAt: new Date().toISOString(),
        },
      ],
      handoffs: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      startedAt: new Date().toISOString(),
    } as const;
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream(runStateFromJSON(JSON.stringify(suspended)), {
      directive: { approvals: [{ toolCallId: 'tc-email', granted: true }] },
    })) {
      events.push(ev);
    }
    // The approved tool actually ran - exactly once - and its real result (not a
    // placeholder) reached the message buffer.
    const execEnds = events.filter((e) => e.type === 'tool.execute.end');
    expect(execEnds).toHaveLength(1);
    const end = execEnds[0];
    if (end?.type === 'tool.execute.end') {
      expect(end.result).toBe('sent:a@b.c');
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

  it('resuming an awaiting-approval run WITHOUT a directive stays suspended - no provider call (AG-14)', async () => {
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
    // Still suspended - the loop never re-issued the dangling tool_use.
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

describe('W-035 - stepNumber stays monotonic across suspend/resume', () => {
  it('two suspend/resume cycles yield strictly unique, continuing step numbers', async () => {
    const spanStepNumbers: number[] = [];
    const startSpan = (opts: { type: string; attrs?: Record<string, unknown> }) => {
      const record = (a: Record<string, unknown>) => {
        const n = a['graphorin.step.number'];
        if (opts.type === 'agent.step' && typeof n === 'number') spanStepNumbers.push(n);
      };
      record({ ...(opts.attrs ?? {}) });
      return {
        type: opts.type,
        id: 'x',
        traceId: 't',
        setAttributes: (a: Record<string, unknown>) => record(a),
        addEvent() {},
        recordException() {},
        setStatus() {},
        end() {},
      };
    };
    const tracer = {
      startSpan,
      async span(opts: { type: string }, fn: (s: unknown) => unknown) {
        return fn(startSpan(opts));
      },
      async shutdown() {},
    } as never;
    const agent = createAgent({
      name: 'mailer',
      instructions: 'noop',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({
            toolCallId: 'tc-1',
            toolName: 'send_email',
            args: { to: 'a@b.c', body: 'one' },
            totalTokens: 10,
          }),
          toolCallScript({
            toolCallId: 'tc-2',
            toolName: 'send_email',
            args: { to: 'a@b.c', body: 'two' },
            totalTokens: 10,
          }),
          textOnlyScript('all sent', 6),
        ],
      }),
      tools: [buildSendEmailTool()],
      tracer,
    });

    const run1 = await agent.run('email Alice twice');
    expect(run1.status).toBe('awaiting_approval');
    const run2 = await agent.run(run1.state, {
      directive: { approvals: [{ toolCallId: 'tc-1', granted: true }] },
    });
    expect(run2.status).toBe('awaiting_approval');
    const run3 = await agent.run(run2.state, {
      directive: { approvals: [{ toolCallId: 'tc-2', granted: true }] },
    });
    expect(run3.status).toBe('completed');

    const numbers = run3.state.steps.map((s) => s.stepNumber);
    // Strictly unique: no resume step aliases 0 and no post-resume step
    // collides with a pre-suspend one.
    expect(new Set(numbers).size).toBe(numbers.length);
    // The journal numbering continues: every resume-dispatch step is
    // max-so-far + 1, so the sequence is strictly increasing.
    for (let i = 1; i < numbers.length; i++) {
      expect(numbers[i]).toBeGreaterThan(numbers[i - 1] as number);
    }
    expect(numbers[0]).toBe(1);
    expect(Math.min(...numbers)).toBeGreaterThan(0);
    // Span attribution mirrors the journal: unique step numbers only.
    expect(new Set(spanStepNumbers).size).toBe(spanStepNumbers.length);
  });

  it('resume-dispatch step events continue the numbering (no step 0)', async () => {
    const agent = createAgent({
      name: 'mailer',
      instructions: 'noop',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({
            toolCallId: 'tc-email',
            toolName: 'send_email',
            args: { to: 'a@b.c', body: 'hi' },
            totalTokens: 10,
          }),
          textOnlyScript('sent', 4),
        ],
      }),
      tools: [buildSendEmailTool()],
    });
    const suspended = await agent.run('email Alice');
    expect(suspended.status).toBe('awaiting_approval');
    expect(suspended.state.steps.map((s) => s.stepNumber)).toEqual([1]);
    const resumed = await agent.run(suspended.state, {
      directive: { approvals: [{ toolCallId: 'tc-email', granted: true }] },
    });
    expect(resumed.status).toBe('completed');
    const numbers = resumed.state.steps.map((s) => s.stepNumber);
    expect(numbers).toEqual([1, 2, 3]);
  });
});
