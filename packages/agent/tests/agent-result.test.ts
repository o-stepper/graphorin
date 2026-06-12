import type { Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent, runStateFromJSON, runStateToJSON } from '../src/index.js';
import {
  createMockProvider,
  errorScript,
  textOnlyScript,
  toolCallScript,
} from './fixtures/mock-provider.js';

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

describe('AgentResult surface (AG-9)', () => {
  it('a completed run carries status/state in the result, no error', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('hello there', 8)],
    });
    const agent = createAgent({ name: 'r', instructions: 'reply', provider });
    const result = await agent.run('hi');
    expect(result.output).toBe('hello there');
    expect(result.status).toBe('completed');
    expect(result.error).toBeUndefined();
    expect(result.state.status).toBe('completed');
    expect(result.state.id.length).toBeGreaterThan(0);
    expect(result.state.messages.length).toBeGreaterThan(0);
  });

  it('a failed run resolves (no throw) with status "failed" and the error visible', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [errorScript({ kind: 'unknown', message: 'boom' })],
    });
    const agent = createAgent({ name: 'r', instructions: 'reply', provider });
    const result = await agent.run('hi');
    expect(result.status).toBe('failed');
    expect(result.error).toBeDefined();
    expect(result.error?.message.length).toBeGreaterThan(0);
    expect(result.state.status).toBe('failed');
  });

  it('a suspended run is distinguishable and its state resumes WITHOUT a checkpointStore', async () => {
    const provider1 = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({
          toolCallId: 'tc-1',
          toolName: 'send_email',
          args: { to: 'a@b.c', body: 'hi' },
          totalTokens: 10,
        }),
      ],
    });
    const agent1 = createAgent({
      name: 'mailer',
      instructions: 'send emails',
      provider: provider1,
      tools: [buildSendEmailTool()],
    });
    const r1 = await agent1.run('email Alice');
    expect(r1.status).toBe('awaiting_approval');
    expect(r1.state.pendingApprovals).toHaveLength(1);
    expect(r1.state.pendingApprovals[0]?.toolCallId).toBe('tc-1');

    // Honest pickup: durably round-trip the state FROM THE RESULT,
    // then resume on a fresh agent instance (fresh process story).
    const rehydrated = runStateFromJSON(runStateToJSON(r1.state));
    const provider2 = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('email sent', 6)],
    });
    const agent2 = createAgent({
      name: 'mailer',
      instructions: 'send emails',
      provider: provider2,
      tools: [buildSendEmailTool()],
    });
    const r2 = await agent2.run(rehydrated, {
      directive: { approvals: [{ toolCallId: 'tc-1', granted: true }] },
    });
    expect(r2.status).toBe('completed');
    expect(r2.output).toBe('email sent');
    expect(r2.state.status).toBe('completed');
  });
});
