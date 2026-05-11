import type { AgentEvent } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { createMockProvider, textOnlyScript } from './fixtures/mock-provider.js';

describe('Agent — CausalityMonitor wired into the loop (RB-55)', () => {
  it('does not emit lateral-leak events when no monitor is configured', async () => {
    const provider = createMockProvider({
      modelId: 'm',
      scripts: [textOnlyScript('safe answer', 6)],
    });
    const agent = createAgent({ name: 'no-monitor', instructions: 'noop', provider });
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('hi')) {
      events.push(ev);
    }
    expect(events.some((e) => e.type === 'agent.lateral-leak.detected')).toBe(false);
  });

  it('does not flag a benign assistant message even when the monitor is on', async () => {
    const provider = createMockProvider({
      modelId: 'm',
      scripts: [textOnlyScript('the answer is 42', 4)],
    });
    const agent = createAgent({
      name: 'monitor-on',
      instructions: 'noop',
      provider,
      causalityMonitor: { strictness: 'detect-and-flag' },
    });
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('what is the answer')) {
      events.push(ev);
    }
    expect(events.some((e) => e.type === 'agent.lateral-leak.detected')).toBe(false);
    expect(events.some((e) => e.type === 'text.complete')).toBe(true);
  });
});
