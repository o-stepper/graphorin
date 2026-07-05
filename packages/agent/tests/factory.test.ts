import { describe, expect, it } from 'vitest';
import { createAgent, InvalidAgentConfigError, InvalidPreferredModelError } from '../src/index.js';
import { createMockProvider, textOnlyScript } from './fixtures/mock-provider.js';

describe('createAgent - construction', () => {
  it('rejects an empty name', () => {
    const provider = createMockProvider({ modelId: 'm', scripts: [] });
    expect(() =>
      createAgent({
        name: '',
        instructions: 'noop',
        provider,
      }),
    ).toThrowError(InvalidAgentConfigError);
  });

  it('rejects a missing provider', () => {
    expect(() =>
      // @ts-expect-error testing runtime guard
      createAgent({ name: 'x', instructions: 'noop' }),
    ).toThrowError(InvalidAgentConfigError);
  });

  it('rejects an invalid preferredModel literal', () => {
    const provider = createMockProvider({ modelId: 'm', scripts: [] });
    expect(() =>
      createAgent({
        name: 'x',
        instructions: 'noop',
        provider,
        // @ts-expect-error testing runtime guard
        preferredModel: 'super-fast',
      }),
    ).toThrowError(InvalidPreferredModelError);
  });

  it('accepts the canonical 3-tier preferredModel literals', () => {
    const provider = createMockProvider({ modelId: 'm', scripts: [] });
    for (const tier of ['fast', 'balanced', 'smart'] as const) {
      const agent = createAgent({
        name: `agent-${tier}`,
        instructions: 'noop',
        provider,
        preferredModel: tier,
      });
      expect(agent.config.preferredModel).toBe(tier);
    }
  });

  it('returns an Agent with stable id and config exposed', () => {
    const provider = createMockProvider({ modelId: 'm', scripts: [] });
    const agent = createAgent({ name: 'helpful', instructions: 'noop', provider });
    expect(agent.id).toMatch(/^agent_/);
    expect(agent.config.name).toBe('helpful');
    expect(typeof agent.stream).toBe('function');
    expect(typeof agent.run).toBe('function');
    expect(typeof agent.steer).toBe('function');
    expect(typeof agent.followUp).toBe('function');
    expect(typeof agent.abort).toBe('function');
    expect(typeof agent.toTool).toBe('function');
    expect(typeof agent.compact).toBe('function');
  });
});

describe('Agent.stream - hello world', () => {
  it('emits agent.start, text deltas, text.complete, step.end, agent.end on a text-only response', async () => {
    const provider = createMockProvider({
      modelId: 'mock-m',
      scripts: [textOnlyScript('hello world', 12)],
    });
    const agent = createAgent({
      name: 'greeter',
      instructions: 'You greet users.',
      provider,
    });
    const events = [];
    for await (const ev of agent.stream('hi')) {
      events.push(ev);
    }
    const types = events.map((e) => e.type);
    expect(types).toEqual([
      'agent.start',
      'step.start',
      'text.delta',
      'text.complete',
      'step.end',
      'agent.end',
    ]);
    const endEv = events.at(-1);
    expect(endEv?.type).toBe('agent.end');
    if (endEv?.type === 'agent.end') {
      expect(endEv.result.status).toBe('completed');
      expect(endEv.result.output).toBe('hello world');
      expect(endEv.runId).toMatch(/^run_/);
    }
    const startEv = events[0];
    if (startEv?.type === 'agent.start') {
      expect(startEv.runId).toMatch(/^run_/);
      expect(startEv.agentId).toMatch(/^agent_/);
    }
    const completeEv = events.find((e) => e.type === 'text.complete');
    expect(completeEv).toBeDefined();
    if (completeEv?.type === 'text.complete') {
      expect(completeEv.text).toBe('hello world');
    }
  });

  it('Agent.run() returns the final result with aggregate usage', async () => {
    const provider = createMockProvider({
      modelId: 'mock-m',
      scripts: [textOnlyScript('done', 8)],
    });
    const agent = createAgent({
      name: 'simple',
      instructions: 'noop',
      provider,
    });
    const result = await agent.run('hello');
    expect(result.output).toBe('done');
    expect(result.usage.totalTokens).toBe(8);
  });
});
