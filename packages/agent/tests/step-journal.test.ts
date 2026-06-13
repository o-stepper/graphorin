/**
 * Step-journal durability (closes AG-1 systemically). A resumed approved tool
 * call must execute **exactly once** across re-resumes: if a prior resume
 * already ran it and journaled the completed call into `RunState.steps`, a
 * second resume of the same (still-pending) state must REPLAY the journaled
 * result, not run the side effect again. Bounds the damage of a crash mid-resume
 * to at most one re-execution.
 */

import type { AgentEvent, Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent, runStateFromJSON } from '../src/index.js';
import { createMockProvider, textOnlyScript } from './fixtures/mock-provider.js';

/** A `send_email` tool whose `execute` counts its real side effects. */
function buildCountingEmailTool(counter: { runs: number }): Tool<unknown, unknown, unknown> {
  return {
    name: 'send_email',
    description: 'Send an email (requires approval).',
    inputSchema: {
      parse: (v: unknown) => v,
      safeParse: (v: unknown) => ({ success: true as const, data: v }),
      toJSON: () => ({ type: 'object', properties: { to: { type: 'string' } } }),
    },
    needsApproval: true,
    sideEffectClass: 'external-stateful',
    async execute(input: { readonly to: string }) {
      counter.runs += 1;
      return `sent:${input.to}`;
    },
  } as unknown as Tool<unknown, unknown, unknown>;
}

const NOW = new Date().toISOString();

function suspendedState(agentId: string, opts: { readonly journaled: boolean }): unknown {
  const completedStep = {
    stepNumber: 0,
    startedAt: NOW,
    endedAt: NOW,
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    agentId,
    toolCalls: [
      {
        call: { toolCallId: 'tc-email', toolName: 'send_email', args: { to: 'a@b.c' } },
        outcome: {
          toolCallId: 'tc-email',
          toolName: 'send_email',
          output: 'sent:a@b.c',
          durationMs: 1,
        },
        stepNumber: 0,
      },
    ],
  };
  return {
    version: 'graphorin-run-state/1.1',
    id: 'run-journal',
    agentId,
    currentAgentId: agentId,
    sessionId: 's',
    status: 'awaiting_approval',
    // When journaled, the approved call already ran on a prior resume.
    steps: opts.journaled ? [completedStep] : [],
    messages: opts.journaled
      ? [
          { role: 'user', content: 'email Alice' },
          { role: 'tool', toolCallId: 'tc-email', content: 'sent:a@b.c' },
        ]
      : [{ role: 'user', content: 'email Alice' }],
    pendingApprovals: [
      { toolCallId: 'tc-email', toolName: 'send_email', args: { to: 'a@b.c' }, requestedAt: NOW },
    ],
    handoffs: [],
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    startedAt: NOW,
  };
}

describe('step-journal: exactly-once approved-call execution across re-resumes', () => {
  it('does NOT re-execute an approved call already journaled in steps', async () => {
    const counter = { runs: 0 };
    const agent = createAgent({
      name: 'mailer',
      instructions: 'noop',
      provider: createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('done', 4)] }),
      tools: [buildCountingEmailTool(counter)],
    });
    const state = suspendedState(agent.id, { journaled: true });
    const events: AgentEvent<unknown>[] = [];
    for await (const ev of agent.stream(runStateFromJSON(JSON.stringify(state)), {
      directive: { approvals: [{ toolCallId: 'tc-email', granted: true }] },
    })) {
      events.push(ev);
    }
    // Already executed + journaled ⇒ replayed, not re-run.
    expect(counter.runs).toBe(0);
    expect(events.filter((e) => e.type === 'tool.execute.end')).toHaveLength(0);
  });

  it('DOES execute an approved call that is not yet journaled (control)', async () => {
    const counter = { runs: 0 };
    const agent = createAgent({
      name: 'mailer',
      instructions: 'noop',
      provider: createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('done', 4)] }),
      tools: [buildCountingEmailTool(counter)],
    });
    const state = suspendedState(agent.id, { journaled: false });
    for await (const ev of agent.stream(runStateFromJSON(JSON.stringify(state)), {
      directive: { approvals: [{ toolCallId: 'tc-email', granted: true }] },
    })) {
      void ev;
    }
    expect(counter.runs).toBe(1);
  });
});
