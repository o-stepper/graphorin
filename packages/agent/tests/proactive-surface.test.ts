import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { createMockProvider, errorScript, textOnlyScript } from './fixtures/mock-provider.js';

/**
 * C1/C2 agent surface for the proactive package: the public busy
 * signal (`Agent.isBusy()`) and the fail-closed per-run model pin
 * (`AgentCallOptions.pinnedProvider`).
 */

describe('C1: Agent.isBusy()', () => {
  it('reports false when idle, true while a run is in flight, false after', async () => {
    const provider = createMockProvider({
      modelId: 'mock-busy',
      scripts: [textOnlyScript('done', 4)],
    });
    const agent = createAgent({ name: 'busy-probe', instructions: 'x', provider });
    expect(agent.isBusy()).toBe(false);

    let observedDuringRun = false;
    const stream = agent.stream('go');
    for await (const _ev of stream) {
      observedDuringRun = agent.isBusy();
    }
    expect(observedDuringRun).toBe(true);
    expect(agent.isBusy()).toBe(false);
  });
});

describe('C2: pinnedProvider - fail-closed per-run model pin', () => {
  it('every step resolves to the pinned provider; config provider and fallbacks never called', async () => {
    const configured = createMockProvider({
      modelId: 'configured',
      scripts: [textOnlyScript('from-configured', 4)],
    });
    const fallback = createMockProvider({
      modelId: 'fallback',
      scripts: [textOnlyScript('from-fallback', 4)],
    });
    const pinned = createMockProvider({
      modelId: 'pinned-cheap',
      scripts: [textOnlyScript('from-pinned', 4)],
    });
    const agent = createAgent({
      name: 'pinned-run',
      instructions: 'x',
      provider: configured,
      fallbackModels: [fallback],
    });
    const result = await agent.run('go', { pinnedProvider: pinned });
    expect(result.output).toBe('from-pinned');
    expect(pinned.scriptsConsumed()).toBe(1);
    expect(configured.scriptsConsumed()).toBe(0);
    expect(fallback.scriptsConsumed()).toBe(0);
  });

  it('a pinned run does NOT fall back on provider error - fail-closed', async () => {
    const pinned = createMockProvider({
      modelId: 'pinned-failing',
      scripts: [errorScript({ kind: 'rate-limit' })],
    });
    const fallback = createMockProvider({
      modelId: 'fallback',
      scripts: [textOnlyScript('recovered', 4)],
    });
    const configured = createMockProvider({
      modelId: 'configured',
      scripts: [textOnlyScript('from-configured', 4)],
    });
    const agent = createAgent({
      name: 'pinned-fail',
      instructions: 'x',
      provider: configured,
      fallbackModels: [fallback],
    });
    const result = await agent.run('go', { pinnedProvider: pinned });
    expect(result.status).toBe('failed');
    expect(fallback.scriptsConsumed()).toBe(0);
    expect(configured.scriptsConsumed()).toBe(0);
  });

  it('the pin wins over a prepareStep provider override', async () => {
    const configured = createMockProvider({
      modelId: 'configured',
      scripts: [textOnlyScript('from-configured', 4)],
    });
    const stepOverride = createMockProvider({
      modelId: 'step-override',
      scripts: [textOnlyScript('from-override', 4)],
    });
    const pinned = createMockProvider({
      modelId: 'pinned',
      scripts: [textOnlyScript('from-pinned', 4)],
    });
    const agent = createAgent({
      name: 'pinned-vs-prepare',
      instructions: 'x',
      provider: configured,
      prepareStep: () => ({ provider: stepOverride }),
    });
    const result = await agent.run('go', { pinnedProvider: pinned });
    expect(result.output).toBe('from-pinned');
    expect(stepOverride.scriptsConsumed()).toBe(0);
  });
});
