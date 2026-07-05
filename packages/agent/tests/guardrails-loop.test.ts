import type { AgentEvent, Provider, ProviderRequest } from '@graphorin/core';
import { defineInputGuardrail, defineOutputGuardrail } from '@graphorin/security/guardrails';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { createMockProvider, textOnlyScript } from './fixtures/mock-provider.js';

/** Wrap the mock provider so every ProviderRequest is captured. */
function capturingProvider(base: ReturnType<typeof createMockProvider>): {
  readonly provider: Provider;
  readonly requests: ProviderRequest[];
} {
  const requests: ProviderRequest[] = [];
  const provider: Provider = {
    ...base,
    stream(req: ProviderRequest) {
      requests.push(req);
      return base.stream(req);
    },
  };
  return { provider, requests };
}

describe('AgentConfig.guardrails - loop wiring (AG-2 / SDF-4)', () => {
  it('a blocking input guardrail fails the run BEFORE any provider call, with guardrail.tripped', async () => {
    const base = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('never', 4)] });
    const agent = createAgent({
      name: 'guarded',
      instructions: 'reply',
      provider: base,
      guardrails: {
        input: [
          defineInputGuardrail<string>({
            name: 'no-ssn',
            check: (value) =>
              value.includes('ssn')
                ? { ok: false, action: 'block', message: 'PII detected: ssn' }
                : { ok: true },
          }),
        ],
      },
    });
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('my ssn is 123-45-6789')) {
      events.push(ev);
    }
    const tripped = events.find((e) => e.type === 'guardrail.tripped');
    expect(tripped).toBeDefined();
    if (tripped?.type === 'guardrail.tripped') {
      expect(tripped.guardrailName).toBe('no-ssn');
      expect(tripped.phase).toBe('input');
    }
    const end = events.at(-1);
    expect(end?.type).toBe('agent.end');
    if (end?.type === 'agent.end') {
      expect(end.result.status).toBe('failed');
      expect(end.result.error?.code).toBe('guardrail-blocked');
    }
    // The provider was never reached.
    expect(base.scriptsConsumed()).toBe(0);
  });

  it('a rewriting input guardrail masks the seed before the provider sees it', async () => {
    const base = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('ok', 4)] });
    const { provider, requests } = capturingProvider(base);
    const agent = createAgent({
      name: 'guarded',
      instructions: 'reply',
      provider,
      guardrails: {
        input: [
          defineInputGuardrail<string>({
            name: 'mask-card',
            check: (value) =>
              value.includes('4111')
                ? {
                    ok: false,
                    action: 'rewrite',
                    message: 'card masked',
                    rewrite: value.replaceAll('4111111111111111', '[card]'),
                  }
                : { ok: true },
          }),
        ],
      },
    });
    const result = await agent.run('charge 4111111111111111 please');
    expect(result.status).toBe('completed');
    expect(requests.length).toBe(1);
    const sentUser = requests[0]?.messages.find((m) => m.role === 'user');
    expect(typeof sentUser?.content === 'string' && sentUser.content).toContain('[card]');
    expect(JSON.stringify(requests[0])).not.toContain('4111111111111111');
    // The rewrite is mirrored into the persisted RunState too.
    expect(JSON.stringify(result.state.messages)).not.toContain('4111111111111111');
  });

  it('a blocking output guardrail fails the run with phase "output"', async () => {
    const base = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('the secret launch code is 0000', 6)],
    });
    const agent = createAgent({
      name: 'guarded',
      instructions: 'reply',
      provider: base,
      guardrails: {
        output: [
          defineOutputGuardrail<string>({
            name: 'no-launch-codes',
            check: (value) =>
              value.includes('launch code')
                ? { ok: false, action: 'block', message: 'classified output' }
                : { ok: true },
          }),
        ],
      },
    });
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('hi')) {
      events.push(ev);
    }
    const tripped = events.find((e) => e.type === 'guardrail.tripped');
    expect(tripped).toBeDefined();
    if (tripped?.type === 'guardrail.tripped') {
      expect(tripped.guardrailName).toBe('no-launch-codes');
      expect(tripped.phase).toBe('output');
    }
    const end = events.at(-1);
    if (end?.type === 'agent.end') {
      expect(end.result.status).toBe('failed');
      expect(end.result.error?.code).toBe('guardrail-blocked');
    }
  });

  it('a rewriting output guardrail replaces the final output (result.output)', async () => {
    const base = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('raw with email a@b.c', 6)],
    });
    const agent = createAgent({
      name: 'guarded',
      instructions: 'reply',
      provider: base,
      guardrails: {
        output: [
          defineOutputGuardrail<string>({
            name: 'mask-email',
            check: (value) =>
              value.includes('@')
                ? {
                    ok: false,
                    action: 'rewrite',
                    message: 'email masked',
                    rewrite: value.replace(/\S+@\S+/g, '[email]'),
                  }
                : { ok: true },
          }),
        ],
      },
    });
    const result = await agent.run('hi');
    expect(result.status).toBe('completed');
    expect(result.output).toBe('raw with email [email]');
  });

  it('a warn-action guardrail does not stop the run', async () => {
    const base = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('done', 4)] });
    const agent = createAgent({
      name: 'guarded',
      instructions: 'reply',
      provider: base,
      guardrails: {
        input: [
          defineInputGuardrail<string>({
            name: 'advisory',
            check: () => ({ ok: false, action: 'warn', message: 'heads up' }),
          }),
        ],
      },
    });
    const result = await agent.run('hi');
    expect(result.status).toBe('completed');
    expect(result.output).toBe('done');
  });
});
