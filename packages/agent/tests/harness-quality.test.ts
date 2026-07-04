/**
 * C3 — agent harness quality:
 * - tool errors reach the model with the typed kind + recovery envelope
 * - empty tool outputs are rendered as an explicit success marker
 * - the verifier seam feeds deterministic feedback back before completion
 * - provider responses journal onto RunState and replay deterministically
 */
import type { AgentEvent, Message, Provider, Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent, createReplayProvider } from '../src/index.js';
import { createMockProvider, textOnlyScript, toolCallScript } from './fixtures/mock-provider.js';

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
};

function makeTool(
  name: string,
  execute: Tool<unknown, unknown, unknown>['execute'],
  extra: Partial<Tool<unknown, unknown, unknown>> = {},
): Tool<unknown, unknown, unknown> {
  return {
    name,
    description: `${name} tool`,
    inputSchema: passthroughSchema,
    sideEffectClass: 'read-only',
    execute,
    ...extra,
  } as Tool<unknown, unknown, unknown>;
}

async function drain(agent: {
  stream: (input: string) => AsyncIterable<AgentEvent>;
}): Promise<AgentEvent[]> {
  const events: AgentEvent[] = [];
  for await (const ev of agent.stream('go')) events.push(ev);
  return events;
}

function finalState(events: AgentEvent[]) {
  const end = events.find((e) => e.type === 'agent.end');
  if (end === undefined || end.type !== 'agent.end') throw new Error('no agent.end');
  return end.result;
}

describe('C3 — recovery envelope reaches the model', () => {
  it('renders kind + recoverable + suggested action into the tool error message', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({ toolCallId: 'tc-1', toolName: 'broken', args: {} }),
        textOnlyScript('done', 4),
      ],
    });
    const agent = createAgent({
      name: 'envelope',
      instructions: 'noop',
      provider,
      tools: [
        makeTool('broken', async () => {
          throw new Error('backend exploded');
        }),
      ],
    });
    const events = await drain(agent);
    const result = finalState(events);
    const toolMsg = result.state.messages.find((m: Message) => m.role === 'tool');
    expect(toolMsg?.content).toContain('Error: backend exploded');
    expect(toolMsg?.content).toContain('kind: execution_failed');
    expect(toolMsg?.content).toContain('recoverable: no');
    expect(toolMsg?.content).toContain('suggested action: try_alternative');
  });

  it('renders an explicit marker for empty tool output (ACI)', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({ toolCallId: 'tc-1', toolName: 'silent', args: {} }),
        textOnlyScript('done', 4),
      ],
    });
    const agent = createAgent({
      name: 'aci',
      instructions: 'noop',
      provider,
      tools: [makeTool('silent', async () => '')],
    });
    const events = await drain(agent);
    const result = finalState(events);
    const toolMsg = result.state.messages.find((m: Message) => m.role === 'tool');
    expect(toolMsg?.content).toBe('(tool ran successfully with no output)');
  });
});

describe('C3 — verifier seam', () => {
  it('feeds failing-verifier feedback back and completes on the improved round', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('draft answer', 6), textOnlyScript('final answer', 6)],
    });
    const agent = createAgent({
      name: 'verified',
      instructions: 'noop',
      provider,
      verifiers: [
        {
          id: 'must-say-final',
          verify: ({ output }) =>
            output.includes('final')
              ? { ok: true }
              : { ok: false, feedback: 'the answer must include the word "final"' },
        },
      ],
    });
    const events = await drain(agent);
    const result = finalState(events);
    expect(result.output).toBe('final answer');

    const verifierEvents = events.filter((e) => e.type === 'verifier.result');
    expect(verifierEvents.map((e) => (e.type === 'verifier.result' ? e.ok : undefined))).toEqual([
      false,
      true,
    ]);
    const feedback = result.state.messages.find(
      (m: Message) => m.role === 'user' && String(m.content).includes('[verifier:must-say-final]'),
    );
    expect(feedback).toBeDefined();
  });

  it('caps verifier rounds and completes with the last output when they run out', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('attempt 1', 6), textOnlyScript('attempt 2', 6)],
    });
    const agent = createAgent({
      name: 'capped',
      instructions: 'noop',
      provider,
      maxVerifierRounds: 1,
      verifiers: [{ id: 'never-happy', verify: () => ({ ok: false, feedback: 'nope' }) }],
    });
    const events = await drain(agent);
    const result = finalState(events);
    // One extra round only; the run still completes.
    expect(result.status).toBe('completed');
    expect(result.output).toBe('attempt 2');
    expect(events.filter((e) => e.type === 'verifier.result')).toHaveLength(2);
  });

  it('treats a throwing verifier as passed (never fails the run)', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('answer', 6)],
    });
    const agent = createAgent({
      name: 'crashy-verifier',
      instructions: 'noop',
      provider,
      verifiers: [
        {
          id: 'buggy',
          verify: () => {
            throw new Error('verifier bug');
          },
        },
      ],
    });
    const events = await drain(agent);
    const result = finalState(events);
    expect(result.status).toBe('completed');
    const ev = events.find((e) => e.type === 'verifier.result');
    expect(ev !== undefined && ev.type === 'verifier.result' && ev.ok).toBe(true);
  });
});

describe('C3 — provider-response journaling + deterministic replay', () => {
  it('journals each step and replays the run without live calls', async () => {
    let toolRuns = 0;
    const tools = [
      makeTool('lookup', async () => {
        toolRuns += 1;
        return 'sunny';
      }),
    ];
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({ toolCallId: 'tc-1', toolName: 'lookup', args: { city: 'kyiv' } }),
        textOnlyScript('it is sunny', 6),
      ],
    });
    const original = createAgent({
      name: 'recorded',
      instructions: 'noop',
      provider,
      tools,
      recordProviderResponses: true,
    });
    const originalResult = finalState(await drain(original));
    expect(originalResult.output).toBe('it is sunny');
    expect(toolRuns).toBe(1);

    const recorded = originalResult.state.steps.map((s) => s.providerResponse);
    expect(recorded).toHaveLength(2);
    expect(recorded[0]?.toolCalls?.[0]?.toolName).toBe('lookup');
    expect(recorded[1]?.text).toBe('it is sunny');

    // Replay: same tools, zero live model calls, identical outcome.
    const replayAgent = createAgent({
      name: 'replayed',
      instructions: 'noop',
      provider: createReplayProvider(originalResult.state),
      tools,
    });
    const replayResult = finalState(await drain(replayAgent));
    expect(replayResult.output).toBe('it is sunny');
    expect(toolRuns).toBe(2);
    expect(replayResult.state.messages.filter((m: Message) => m.role === 'tool')).toHaveLength(1);
  });

  it('does not journal by default (opt-in flag)', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('hi', 4)],
    });
    const agent = createAgent({ name: 'not-recorded', instructions: 'noop', provider });
    const result = finalState(await drain(agent));
    expect(result.state.steps.every((s) => s.providerResponse === undefined)).toBe(true);
  });

  it('createReplayProvider refuses a state with no journaled responses', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('hi', 4)],
    });
    const agent = createAgent({ name: 'bare', instructions: 'noop', provider });
    const result = finalState(await drain(agent));
    expect(() => createReplayProvider(result.state)).toThrow(/recordProviderResponses/);
  });
});
