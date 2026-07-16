import type { AgentEvent, Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { createMockProvider, textOnlyScript, toolCallScript } from './fixtures/mock-provider.js';

describe('Agent - CausalityMonitor wired into the loop (RB-55)', () => {
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

// --- AG-10 - detect-and-block actually blocks; per-run chain reset ------------

describe('AG-10 - detect-and-block blocks; chain resets per run', () => {
  const passthroughSchema = {
    parse: (v: unknown) => v,
    safeParse: (v: unknown) => ({ success: true as const, data: v }),
    toJSON: (): Record<string, unknown> => ({ type: 'object' }),
  } as Tool<unknown, unknown, unknown>['inputSchema'];

  /** A tool whose name matches the custom denial pattern and which fails. */
  const denyingTool: Tool<unknown, unknown, unknown> = {
    name: 'guard-denied-xyz',
    description: 'always denied',
    inputSchema: passthroughSchema,
    sideEffectClass: 'pure',
    execute: async () => {
      throw new Error('access denied by guard');
    },
  } as Tool<unknown, unknown, unknown>;

  const LEAKING_TEXT = 'the call failed with denied-xyz so I will route around the guard';

  function makeAgent() {
    const provider = createMockProvider({
      modelId: 'm',
      scripts: [
        toolCallScript({ toolCallId: 'tc-1', toolName: 'guard-denied-xyz', args: {} }),
        textOnlyScript(LEAKING_TEXT, 6),
        textOnlyScript('clean second-run answer mentioning denied-xyz', 6),
      ],
    });
    return createAgent({
      name: 'blocker',
      instructions: 'noop',
      provider,
      tools: [denyingTool],
      causalityMonitor: {
        strictness: 'detect-and-block',
        denialPatterns: [/denied-xyz/i],
      },
    });
  }

  it('keeps blocked commentary out of the durable history and suppresses text.complete', async () => {
    const agent = makeAgent();
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('do the thing')) events.push(ev);

    const leak = events.find((e) => e.type === 'agent.lateral-leak.detected');
    expect(leak).toBeDefined();
    if (leak?.type !== 'agent.lateral-leak.detected') throw new Error('unreachable');
    expect(leak.decision).toBe('block');

    const endEv = events.find((e) => e.type === 'agent.end');
    if (endEv?.type !== 'agent.end') throw new Error('expected agent.end');
    const persisted = endEv.result.state.messages;
    // The laundered commentary never lands in the durable history -
    // i.e. it cannot reach any subsequent provider request.
    expect(
      persisted.some(
        (m) =>
          m.role === 'assistant' &&
          typeof m.content === 'string' &&
          m.content.includes('route around'),
      ),
    ).toBe(false);
    // ...and it is not the run's final output either.
    expect(String(endEv.result.output ?? '')).not.toContain('route around');
    expect(events.some((e) => e.type === 'text.complete' && e.text === LEAKING_TEXT)).toBe(false);
  });

  it('two sequential runs do not share the denial chain (reset on run boundary)', async () => {
    const agent = makeAgent();
    // Run 1 poisons the chain (tool error) and trips the block.
    for await (const _ of agent.stream('one')) {
      // drain
    }
    // Run 2 mentions the pattern but has NO denial in ITS chain - a
    // shared (un-reset) monitor would false-positive here.
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('two')) events.push(ev);
    expect(events.some((e) => e.type === 'agent.lateral-leak.detected')).toBe(false);
    expect(events.some((e) => e.type === 'text.complete')).toBe(true);
  });
});

// --- LATERAL-L-01 - the DEFAULT catalogue fires on a real tool error ----------

describe('LATERAL-L-01 - default denial catalogue is not inert', () => {
  const passthroughSchema = {
    parse: (v: unknown) => v,
    safeParse: (v: unknown) => ({ success: true as const, data: v }),
    toJSON: (): Record<string, unknown> => ({ type: 'object' }),
  } as Tool<unknown, unknown, unknown>['inputSchema'];

  it('detects a leak when a tool fails with a default-catalogue denial identity', async () => {
    const vaultTool: Tool<unknown, unknown, unknown> = {
      name: 'vault-read',
      description: 'reads a secret',
      inputSchema: passthroughSchema,
      sideEffectClass: 'pure',
      execute: async () => {
        // The failure identity (SecretAccessDenied) is a DEFAULT pattern; the
        // runtime used to record only `tool.error:vault-read` (the tool name),
        // so no chain entry could match and the default catalogue was inert.
        const err = new Error('SecretAccessDenied: policy forbids reading db-password');
        err.name = 'SecretAccessDenied';
        throw err;
      },
    } as Tool<unknown, unknown, unknown>;
    const leakingText =
      'vault-read failed with SecretAccessDenied, so I will fetch the value another way';
    const provider = createMockProvider({
      modelId: 'm',
      scripts: [
        toolCallScript({ toolCallId: 'tc-1', toolName: 'vault-read', args: {} }),
        textOnlyScript(leakingText, 6),
      ],
    });
    const agent = createAgent({
      name: 'default-catalogue',
      instructions: 'noop',
      provider,
      tools: [vaultTool],
      // NO custom denialPatterns - relying on DEFAULT_DENIAL_PATTERNS.
      causalityMonitor: { strictness: 'detect-and-flag' },
    });
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('read the vault')) events.push(ev);
    expect(events.some((e) => e.type === 'agent.lateral-leak.detected')).toBe(true);
  });
});
