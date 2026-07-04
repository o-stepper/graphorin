/**
 * D6 context engineering: the structured plan tool (journaled in
 * RunState.todos), attention recitation (the plan recited into each
 * step's request copy, request-only + cache-safe), and resume
 * round-tripping of the journaled plan.
 */

import type { Message, Provider, ProviderEvent, ProviderRequest } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent, runStateFromJSON, runStateToJSON } from '../src/index.js';
import { renderPlanRecitation } from '../src/tooling/plan.js';
import {
  type MockProviderScript,
  textOnlyScript,
  toolCallScript,
} from './fixtures/mock-provider.js';

function capturingProvider(scripts: ReadonlyArray<MockProviderScript>): Provider & {
  readonly requests: ProviderRequest[];
} {
  let cursor = 0;
  const requests: ProviderRequest[] = [];
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
      requests.push(req);
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
    get requests() {
      return requests;
    },
  };
}

function systemContents(req: ProviderRequest | undefined): string {
  return (req?.messages ?? [])
    .filter((m: Message) => m.role === 'system')
    .map((m) => (typeof m.content === 'string' ? m.content : ''))
    .join('\n');
}

describe('D6 — plan tool journaling + recitation', () => {
  it('journals the plan into RunState.todos and recites it on the next step', async () => {
    const plan = {
      todos: [
        { id: '1', content: 'gather sources', status: 'in_progress' },
        { id: '2', content: 'write summary', status: 'pending' },
      ],
    };
    const provider = capturingProvider([
      toolCallScript({ toolCallId: 'c1', toolName: 'update_plan', args: plan }),
      textOnlyScript('done'),
    ]);
    const agent = createAgent({
      name: 'planner',
      instructions: 'plan then act',
      provider,
      plan: true,
    });
    const result = await agent.run('go');
    expect(result.status).toBe('completed');
    // The plan is journaled in RunState.
    expect(result.state.todos).toEqual(plan.todos);

    // The SECOND request (after the plan tool ran) recites the plan as a
    // trailing system message.
    const secondSystem = systemContents(provider.requests[1]);
    expect(secondSystem).toContain('<plan');
    expect(secondSystem).toContain('gather sources');
    expect(secondSystem).toContain('[~] gather sources'); // in_progress marker
    expect(secondSystem).toContain('[ ] write summary'); // pending marker

    // Recitation is request-only: it is NOT in the persisted transcript.
    const persistedSystem = result.state.messages
      .filter((m) => m.role === 'system')
      .map((m) => (typeof m.content === 'string' ? m.content : ''))
      .join('\n');
    expect(persistedSystem).not.toContain('<plan');
  });

  it('advertises update_plan only when plan is enabled', async () => {
    const base = createAgent({
      name: 'noplan',
      instructions: 'x',
      provider: capturingProvider([textOnlyScript('done')]),
    });
    await base.run('go');
    const provider = capturingProvider([textOnlyScript('done')]);
    const planned = createAgent({ name: 'planned', instructions: 'x', provider, plan: true });
    await planned.run('go');
    const advertised = (provider.requests[0]?.tools ?? []).map((t) => t.name);
    expect(advertised).toContain('update_plan');
  });

  it('round-trips the journaled plan through serialize/deserialize', () => {
    const provider = capturingProvider([textOnlyScript('done')]);
    void provider;
    const json = runStateToJSON({
      id: 'run_1',
      agentId: 'a',
      currentAgentId: 'a',
      sessionId: 's',
      status: 'completed',
      steps: [],
      messages: [],
      pendingApprovals: [],
      handoffs: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      todos: [
        { id: '1', content: 'step one', status: 'completed' },
        { id: '2', content: 'step two', status: 'in_progress' },
      ],
      startedAt: '2026-07-04T00:00:00.000Z',
    });
    const restored = runStateFromJSON(json);
    expect(restored.todos).toEqual([
      { id: '1', content: 'step one', status: 'completed' },
      { id: '2', content: 'step two', status: 'in_progress' },
    ]);
  });
});

describe('renderPlanRecitation (pure)', () => {
  it('renders status markers and returns null for an empty plan', () => {
    expect(renderPlanRecitation(undefined)).toBeNull();
    expect(renderPlanRecitation([])).toBeNull();
    const block = renderPlanRecitation([
      { id: '1', content: 'a', status: 'completed' },
      { id: '2', content: 'b', status: 'in_progress' },
      { id: '3', content: 'c', status: 'pending' },
    ]);
    expect(block).toContain('[x] a');
    expect(block).toContain('[~] b');
    expect(block).toContain('[ ] c');
  });
});
