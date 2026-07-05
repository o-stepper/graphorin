import type { AgentEvent } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { createMockProvider, errorScript, textOnlyScript } from './fixtures/mock-provider.js';

describe('Agent - prepareStep precedence over fallback chain (RB-48)', () => {
  it('uses the prepareStep override and does NOT consult fallbackModels on its failure', async () => {
    const fallback = createMockProvider({
      modelId: 'haiku',
      scripts: [textOnlyScript('fallback would have answered', 6)],
    });
    const overrideProvider = createMockProvider({
      modelId: 'opus',
      scripts: [errorScript({ kind: 'rate-limit' })],
    });
    const defaultProvider = createMockProvider({
      modelId: 'sonnet',
      scripts: [textOnlyScript('default answer', 6)],
    });
    const agent = createAgent({
      name: 'ps',
      instructions: 'noop',
      provider: defaultProvider,
      fallbackModels: [fallback],
      prepareStep: () => ({ provider: overrideProvider }),
    });
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('hi')) {
      events.push(ev);
    }
    // The prepareStep override returned the rate-limited Opus.
    // Because the fallback chain is suppressed, we expect:
    //  - NO `agent.model.fellback` event (the chain was skipped)
    //  - The run surfaces an `agent.error` rather than handing
    //    off to the Haiku fallback.
    expect(events.some((e) => e.type === 'agent.model.fellback')).toBe(false);
    expect(events.some((e) => e.type === 'agent.error')).toBe(true);
    // The default Sonnet provider was never consulted either.
    expect(events.some((e) => e.type === 'text.complete')).toBe(false);
  });
});
