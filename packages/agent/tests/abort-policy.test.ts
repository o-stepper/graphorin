/**
 * W-038 - the `onPendingApprovals` abort policy is reachable and safe:
 * an abort that races the durable-HITL suspend applies the policy to
 * the just-collected approvals instead of parking them behind a stale
 * 'awaiting_approval' checkpoint; 'fail' fires only with live
 * approvals; 'deny' leaves no dangling tool_use; 'hold' survives to a
 * directive-driven resume.
 */
import type { AgentEvent, Checkpoint, CheckpointMetadata, Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { createMockProvider, textOnlyScript, toolCallScript } from './fixtures/mock-provider.js';

const gatedTool = (): Tool<unknown, unknown, unknown> =>
  ({
    name: 'send_email',
    description: 'Send an email (requires approval).',
    inputSchema: {
      parse: (v: unknown) => v,
      safeParse: (v: unknown) => ({ success: true as const, data: v }),
      toJSON: (): Record<string, unknown> => ({ type: 'object' }),
    } as never,
    needsApproval: true,
    sideEffectClass: 'external-stateful',
    async execute(input: { readonly to?: string }) {
      return `sent:${input.to ?? '?'}`;
    },
  }) as unknown as Tool<unknown, unknown, unknown>;

function recordingCheckpointStore() {
  const puts: Array<{ checkpoint: Checkpoint; metadata: CheckpointMetadata }> = [];
  return {
    puts,
    store: {
      async put(
        _threadId: string,
        _namespace: string,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
      ) {
        puts.push({ checkpoint, metadata });
      },
      async putWrites() {},
      async getTuple() {
        return null;
      },
      async *list() {},
      async delete() {},
    },
  };
}

function gatedAgent(policyAgentName: string, store?: ReturnType<typeof recordingCheckpointStore>) {
  return createAgent({
    name: policyAgentName,
    instructions: 'noop',
    provider: createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({
          toolCallId: 'tc-email',
          toolName: 'send_email',
          args: { to: 'a@b.c' },
          totalTokens: 8,
        }),
        textOnlyScript('done', 4),
      ],
    }),
    tools: [gatedTool()],
    ...(store !== undefined ? { checkpointStore: store.store as never } : {}),
  });
}

async function abortOnApprovalRequested(
  agent: ReturnType<typeof gatedAgent>,
  policy: 'deny' | 'hold' | 'fail',
) {
  const events: AgentEvent[] = [];
  for await (const ev of agent.stream('email Alice')) {
    events.push(ev);
    if (ev.type === 'tool.approval.requested') {
      agent.abort({ onPendingApprovals: policy });
    }
  }
  const end = events.at(-1);
  if (end?.type !== 'agent.end') throw new Error('missing agent.end');
  return { events, result: end.result };
}

describe('W-038 - abort racing the suspend applies the policy', () => {
  it("'deny' drains approvals and commits a tool message per drained call", async () => {
    const { events, result } = await abortOnApprovalRequested(gatedAgent('deny-agent'), 'deny');
    expect(result.status).toBe('aborted');
    expect(result.state.pendingApprovals).toHaveLength(0);
    expect(events.some((e) => e.type === 'tool.approval.denied')).toBe(true);
    // Transcript hygiene: every announced toolCallId is answered.
    const announced = result.state.messages
      .filter((m) => m.role === 'assistant')
      .flatMap((m) => (m.role === 'assistant' ? (m.toolCalls ?? []) : []))
      .map((c) => c.toolCallId);
    for (const id of announced) {
      expect(result.state.messages.some((m) => m.role === 'tool' && m.toolCallId === id)).toBe(
        true,
      );
    }
  });

  it("'deny' with a checkpointStore persists the FINAL state, never a stale suspend", async () => {
    const store = recordingCheckpointStore();
    const { result } = await abortOnApprovalRequested(gatedAgent('deny-ckpt', store), 'deny');
    expect(result.status).toBe('aborted');
    expect(store.puts.length).toBeGreaterThan(0);
    const last = store.puts.at(-1);
    expect(last?.metadata.status).toBe('aborted');
    const persisted = last?.checkpoint.state as {
      status?: string;
      pendingApprovals?: unknown[];
    };
    expect(persisted.status).toBe('aborted');
    expect(persisted.pendingApprovals).toHaveLength(0);
    // No checkpoint in the whole trail parked the aborted run as suspended.
    expect(store.puts.every((p) => p.metadata.status !== 'suspended')).toBe(true);
  });

  it("'hold' keeps approvals; bare run(state) stays parked; a directive resumes", async () => {
    const store = recordingCheckpointStore();
    const agent = gatedAgent('hold-agent', store);
    const { result } = await abortOnApprovalRequested(agent, 'hold');
    expect(result.status).toBe('aborted');
    expect(result.state.pendingApprovals).toHaveLength(1);
    const last = store.puts.at(-1);
    expect(last?.metadata.status).toBe('aborted');
    expect(
      (last?.checkpoint.state as { pendingApprovals?: unknown[] }).pendingApprovals,
    ).toHaveLength(1);

    // Bare resume: the held state must NOT re-enter the provider loop
    // (its pending approval is a dangling tool_use).
    const resumeAgent = createAgent({
      name: 'hold-agent',
      instructions: 'noop',
      provider: createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('never', 4)] }),
      tools: [gatedTool()],
    });
    const bare = await resumeAgent.run(result.state);
    expect(bare.status).toBe('aborted');
    expect(bare.state.pendingApprovals).toHaveLength(1);

    // Directive resume: grant executes the gated call and completes.
    const resumed = await resumeAgent.run(result.state, {
      directive: { approvals: [{ toolCallId: 'tc-email', granted: true }] },
    });
    expect(resumed.status).toBe('completed');
    expect(
      resumed.state.messages.some(
        (m) => m.role === 'tool' && m.toolCallId === 'tc-email' && m.content === 'sent:a@b.c',
      ),
    ).toBe(true);
  });

  it("'fail' WITH pending approvals fails the run with code run-aborted", async () => {
    const { result } = await abortOnApprovalRequested(gatedAgent('fail-agent'), 'fail');
    expect(result.status).toBe('failed');
    expect(result.error?.code).toBe('run-aborted');
  });
});

describe("W-038 - 'fail' with an empty queue aborts plainly", () => {
  it('mid-stream abort with zero approvals ends aborted, not failed', async () => {
    const agent = createAgent({
      name: 'plain',
      instructions: 'noop',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [textOnlyScript('a long answer that streams', 8), textOnlyScript('next', 4)],
      }),
    });
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('go')) {
      events.push(ev);
      if (ev.type === 'text.delta') agent.abort({ onPendingApprovals: 'fail' });
    }
    const end = events.at(-1);
    if (end?.type !== 'agent.end') throw new Error('missing agent.end');
    expect(end.result.status).toBe('aborted');
  });

  it('loop-top abort with zero approvals ends aborted under fail', async () => {
    const agent = createAgent({
      name: 'plain2',
      instructions: 'noop',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [textOnlyScript('turn one', 4), textOnlyScript('never', 4)],
      }),
      // Keep the loop alive after the first turn so the loop-top abort
      // check actually runs on the next iteration.
      verifiers: [{ id: 'nag', verify: async () => ({ ok: false, feedback: 'again' }) }],
    });
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('go')) {
      events.push(ev);
      if (ev.type === 'text.complete') agent.abort({ onPendingApprovals: 'fail' });
    }
    const end = events.at(-1);
    if (end?.type !== 'agent.end') throw new Error('missing agent.end');
    expect(end.result.status).toBe('aborted');
  });

  it('regression: an aborted state WITHOUT approvals still resumes normally', async () => {
    const agent = createAgent({
      name: 'plain3',
      instructions: 'noop',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [textOnlyScript('interrupted', 4)],
      }),
    });
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('go')) {
      events.push(ev);
      if (ev.type === 'text.delta') agent.abort();
    }
    const end = events.at(-1);
    if (end?.type !== 'agent.end' || end.result.status !== 'aborted') {
      throw new Error('setup: expected an aborted run');
    }
    const resumeAgent = createAgent({
      name: 'plain3',
      instructions: 'noop',
      provider: createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('finished', 4)] }),
    });
    const resumed = await resumeAgent.run(end.result.state);
    expect(resumed.status).toBe('completed');
    expect(resumed.output).toBe('finished');
  });
});
