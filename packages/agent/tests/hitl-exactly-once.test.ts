/**
 * agent-02 / agent-07 / tools-02 regression: durable-HITL exactly-once
 * and approval-on-validated-input semantics.
 *
 * Pre-fix, the ONLY checkpoint the runtime ever wrote was the suspend
 * snapshot — the journal entry for the approved call was created during
 * the resume and never persisted, so an operator queue re-delivering the
 * resume against the stored snapshot double-fired the side effect
 * (empirically confirmed in the 2026-07 audit). Partial approval
 * directives silently DISCARDED granted calls (removed from
 * `pendingApprovals`, never dispatched — the suspended-guard returned
 * before the dispatch). And gated calls with schema-invalid args
 * suspended anyway, asking a human to approve args that could later be
 * rewritten by the repair hook behind the grant.
 */
import type {
  AgentEvent,
  Checkpoint,
  CheckpointMetadata,
  CheckpointStore,
  ProviderEvent,
  Tool,
} from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent, runStateFromJSON, runStateToJSON } from '../src/index.js';
import {
  createMockProvider,
  type MockProviderScript,
  textOnlyScript,
} from './fixtures/mock-provider.js';

/** Provider script emitting the given tool calls inside a single step. */
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

/** Append-only in-memory CheckpointStore capturing every put. */
function createMemoryCheckpointStore(): CheckpointStore & {
  readonly puts: Array<{ checkpoint: Checkpoint; metadata: CheckpointMetadata }>;
} {
  const puts: Array<{ checkpoint: Checkpoint; metadata: CheckpointMetadata }> = [];
  return {
    puts,
    async put(_threadId, _namespace, checkpoint, metadata) {
      puts.push({ checkpoint, metadata });
      return checkpoint.id;
    },
    async putWrites() {},
    async getTuple() {
      const last = puts[puts.length - 1];
      return last === undefined ? null : { checkpoint: last.checkpoint, metadata: last.metadata };
    },
    async *list() {
      for (let i = puts.length - 1; i >= 0; i--) {
        const entry = puts[i];
        if (entry !== undefined) yield { checkpoint: entry.checkpoint, metadata: entry.metadata };
      }
    },
    async deleteThread() {},
  };
}

const validatingSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => {
    const record = v as { readonly to?: unknown };
    if (typeof record?.to === 'string' && record.to.length > 0) {
      return { success: true as const, data: v };
    }
    return {
      success: false as const,
      error: {
        name: 'SchemaError',
        message: "field 'to' must be a non-empty string",
        issues: [{ path: ['to'], message: 'must be a non-empty string' }],
      },
    };
  },
  toJSON: (): Record<string, unknown> => ({
    type: 'object',
    properties: { to: { type: 'string' } },
    required: ['to'],
  }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

function gatedTool(name: string, fired: Record<string, number>): Tool<unknown, unknown, unknown> {
  return {
    name,
    description: `${name} (requires approval)`,
    inputSchema: validatingSchema,
    needsApproval: true,
    sideEffectClass: 'external-stateful',
    async execute() {
      fired[name] = (fired[name] ?? 0) + 1;
      return `${name}-sent`;
    },
  } as unknown as Tool<unknown, unknown, unknown>;
}

async function drain(stream: AsyncIterable<AgentEvent>): Promise<AgentEvent[]> {
  const events: AgentEvent[] = [];
  for await (const ev of stream) events.push(ev);
  return events;
}

const endOf = (events: AgentEvent[]) => {
  const end = events.find((e) => e.type === 'agent.end');
  if (end?.type !== 'agent.end') throw new Error('expected agent.end');
  return end.result;
};

describe('agent-02: checkpointed resume is exactly-once', () => {
  it('persists intent + dispatched checkpoints and a re-delivered resume does not double-fire', async () => {
    const fired: Record<string, number> = {};
    const store = createMemoryCheckpointStore();
    const makeAgent = (scripts: MockProviderScript[]) =>
      createAgent({
        name: 'payments',
        instructions: 'noop',
        provider: createMockProvider({ modelId: 'mock', scripts }),
        tools: [gatedTool('send_payment', fired)],
        checkpointStore: store,
      });

    // 1. Run to suspension.
    const events1 = await drain(
      makeAgent([
        multiToolCallScript([
          { toolCallId: 'tc-pay', toolName: 'send_payment', args: { to: 'acct-1' } },
        ]),
      ]).stream('pay'),
    );
    const suspended = endOf(events1);
    expect(suspended.status).toBe('awaiting_approval');
    expect(store.puts.map((p) => p.metadata.nodeName)).toEqual(['agent.run']);

    // 2. Resume with a grant — the side effect fires exactly once, and the
    //    runtime persists a write-ahead intent + the journaled post-dispatch
    //    state (pre-fix: NOTHING was persisted after the suspend snapshot).
    const directive = { approvals: [{ toolCallId: 'tc-pay', granted: true as const }] };
    const events2 = await drain(
      makeAgent([textOnlyScript('paid', 4)]).stream(
        runStateFromJSON(runStateToJSON(suspended.state)),
        { directive },
      ),
    );
    expect(endOf(events2).status).toBe('completed');
    expect(fired).toEqual({ send_payment: 1 });
    const nodeNames = store.puts.map((p) => p.metadata.nodeName);
    expect(nodeNames).toContain('agent.resume.intent');
    expect(nodeNames).toContain('agent.resume.dispatched');
    const intent = store.puts.find((p) => p.metadata.nodeName === 'agent.resume.intent');
    expect(intent?.metadata.status).toBe('suspended');
    // The intent state keeps the grant re-dispatchable: the approval is
    // still pending there, so a crash-retry against it re-executes (the
    // documented at-most-one-re-execution bound), never strands the call.
    const intentState = runStateFromJSON(JSON.stringify(intent?.checkpoint.state));
    expect(intentState.pendingApprovals.map((a) => a.toolCallId)).toEqual(['tc-pay']);
    expect(intentState.status).toBe('awaiting_approval');

    // 3. Queue re-delivery: load the LATEST checkpoint (the journaled
    //    post-dispatch state) and resume it with the SAME directive.
    const dispatched = store.puts.filter((p) => p.metadata.nodeName === 'agent.resume.dispatched');
    expect(dispatched).toHaveLength(1);
    const latest = runStateFromJSON(JSON.stringify(dispatched[0]?.checkpoint.state));
    expect(latest.pendingApprovals).toHaveLength(0);
    const events3 = await drain(
      makeAgent([textOnlyScript('idempotent', 4)]).stream(latest, { directive }),
    );
    // No approval left to grant, no second execution.
    expect(fired).toEqual({ send_payment: 1 });
    expect(events3.some((e) => e.type === 'tool.approval.granted')).toBe(false);
  });

  it('re-resuming the RESULT state of a resume (manual JSON flow) does not double-fire', async () => {
    const fired: Record<string, number> = {};
    const makeAgent = (scripts: MockProviderScript[]) =>
      createAgent({
        name: 'payments',
        instructions: 'noop',
        provider: createMockProvider({ modelId: 'mock', scripts }),
        tools: [gatedTool('send_payment', fired)],
      });

    const suspended = endOf(
      await drain(
        makeAgent([
          multiToolCallScript([
            { toolCallId: 'tc-pay', toolName: 'send_payment', args: { to: 'acct-1' } },
          ]),
        ]).stream('pay'),
      ),
    );
    const directive = { approvals: [{ toolCallId: 'tc-pay', granted: true as const }] };
    const afterResume = endOf(
      await drain(
        makeAgent([textOnlyScript('paid', 4)]).stream(
          runStateFromJSON(runStateToJSON(suspended.state)),
          { directive },
        ),
      ),
    );
    expect(fired).toEqual({ send_payment: 1 });

    // The operational contract: persist `result.state` after each resume.
    // Re-delivering the directive against THAT state cannot double-fire.
    const events = await drain(
      makeAgent([textOnlyScript('follow-up', 4)]).stream(
        runStateFromJSON(runStateToJSON(afterResume.state)),
        { directive },
      ),
    );
    expect(fired).toEqual({ send_payment: 1 });
    expect(events.some((e) => e.type === 'tool.approval.granted')).toBe(false);
  });
});

describe('agent-07: partial approval directives', () => {
  it('executes the granted call, re-suspends with the remainder, and completes on the second grant', async () => {
    const fired: Record<string, number> = {};
    const makeAgent = (scripts: MockProviderScript[]) =>
      createAgent({
        name: 'partial',
        instructions: 'noop',
        provider: createMockProvider({ modelId: 'mock', scripts }),
        tools: [gatedTool('wire_a', fired), gatedTool('wire_b', fired)],
      });

    const suspended = endOf(
      await drain(
        makeAgent([
          multiToolCallScript([
            { toolCallId: 'tc-a', toolName: 'wire_a', args: { to: 'x' } },
            { toolCallId: 'tc-b', toolName: 'wire_b', args: { to: 'y' } },
          ]),
        ]).stream('wire both'),
      ),
    );
    expect(suspended.state.pendingApprovals.map((a) => a.toolCallId)).toEqual(['tc-a', 'tc-b']);

    // Grant ONLY tc-a. Pre-fix: tc-a was removed from pendingApprovals,
    // emitted tool.approval.granted, and then NEVER executed (the
    // suspended-guard returned before the dispatch) — gone forever.
    const partial = endOf(
      await drain(
        makeAgent([textOnlyScript('unused', 4)]).stream(
          runStateFromJSON(runStateToJSON(suspended.state)),
          { directive: { approvals: [{ toolCallId: 'tc-a', granted: true }] } },
        ),
      ),
    );
    expect(fired).toEqual({ wire_a: 1 });
    expect(partial.status).toBe('awaiting_approval');
    expect(partial.state.pendingApprovals.map((a) => a.toolCallId)).toEqual(['tc-b']);
    // The granted call's result is journaled in the re-suspended state.
    expect(partial.state.messages.some((m) => m.role === 'tool' && m.toolCallId === 'tc-a')).toBe(
      true,
    );

    // Grant the remainder — run completes; nothing fired twice.
    const final = endOf(
      await drain(
        makeAgent([textOnlyScript('done', 4)]).stream(
          runStateFromJSON(runStateToJSON(partial.state)),
          { directive: { approvals: [{ toolCallId: 'tc-b', granted: true }] } },
        ),
      ),
    );
    expect(final.status).toBe('completed');
    expect(fired).toEqual({ wire_a: 1, wire_b: 1 });
  });
});

describe('tools-02 (agent mirror): approval gating on validated input', () => {
  it('fails a gated call with schema-invalid args fast — no approval requested, run does not suspend', async () => {
    const fired: Record<string, number> = {};
    const agent = createAgent({
      name: 'gate-validate',
      instructions: 'noop',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          multiToolCallScript([
            // Missing required 'to' — must never reach a human.
            { toolCallId: 'tc-bad', toolName: 'send_payment', args: {} },
          ]),
          textOnlyScript('recovered', 4),
        ],
      }),
      tools: [gatedTool('send_payment', fired)],
    });
    const events = await drain(agent.stream('pay'));
    expect(events.some((e) => e.type === 'tool.approval.requested')).toBe(false);
    const error = events.find((e) => e.type === 'tool.execute.error');
    expect(error?.type).toBe('tool.execute.error');
    if (error?.type === 'tool.execute.error') {
      expect(error.error.kind).toBe('invalid_input');
    }
    // The run recovered (model saw the error and answered) — no suspend.
    expect(endOf(events).status).toBe('completed');
    expect(fired).toEqual({});
  });
});
