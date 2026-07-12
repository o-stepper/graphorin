/**
 * B3 (item 15) - the per-turn verdict sidecar. Gates stamp
 * `RunState.verdicts` (plain object keyed `'<step>:<offset>'`), the
 * result surfaces them, serialization round-trips them, and merging
 * is widen-only.
 */
import type { RunState } from '@graphorin/core';
import { defineInputGuardrail, defineOutputGuardrail } from '@graphorin/security/guardrails';
import { describe, expect, it } from 'vitest';
import { createAgent, deserializeRunState, serializeRunState } from '../src/index.js';
import { stampTurnVerdict } from '../src/runtime/run-gates.js';
import type { MutableRunState } from '../src/runtime/run-input.js';
import { createMockProvider, textOnlyScript } from './fixtures/mock-provider.js';

describe('stampTurnVerdict - widen-only merge', () => {
  function freshState(): MutableRunState & RunState {
    return {
      id: 'run-x',
      agentId: 'a',
      currentAgentId: 'a',
      sessionId: 's',
      status: 'running',
      steps: [],
      messages: [],
      pendingApprovals: [],
      handoffs: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      startedAt: new Date().toISOString(),
    } as unknown as MutableRunState & RunState;
  }

  it("'block' beats 'rewrite' and flags accumulate", () => {
    const state = freshState();
    stampTurnVerdict(state, 2, 0, { guardrail: 'rewrite', dataflowFlags: ['a'] });
    stampTurnVerdict(state, 2, 0, { guardrail: 'block', dataflowFlags: ['b'] });
    stampTurnVerdict(state, 2, 0, { guardrail: 'rewrite' });
    expect(state.verdicts?.['2:0']).toEqual({
      guardrail: 'block',
      dataflowFlags: ['a', 'b'],
    });
  });

  it('lateralLeak latches and distinct positions stay independent', () => {
    const state = freshState();
    stampTurnVerdict(state, 1, 0, { lateralLeak: true });
    stampTurnVerdict(state, 1, 0, {});
    stampTurnVerdict(state, 3, 0, { guardrail: 'rewrite' });
    expect(state.verdicts?.['1:0']).toEqual({ lateralLeak: true });
    expect(state.verdicts?.['3:0']).toEqual({ guardrail: 'rewrite' });
  });
});

describe('gate stamping through a real run', () => {
  it('an input guardrail block stamps the pre-step position and surfaces on the result', async () => {
    const provider = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('never')] });
    const agent = createAgent({
      name: 'verdict-input',
      instructions: 'reply',
      provider,
      guardrails: {
        input: [
          defineInputGuardrail<string>({
            name: 'no-ssn',
            check: (value) =>
              value.includes('ssn') ? { ok: false, action: 'block', message: 'PII' } : { ok: true },
          }),
        ],
      },
    });
    const result = await agent.run('my ssn is 123');
    expect(result.status).toBe('failed');
    const entries = Object.entries(result.verdicts ?? {});
    expect(entries).toHaveLength(1);
    const [key, verdict] = entries[0] as [string, { guardrail?: string }];
    expect(key.startsWith('0:')).toBe(true);
    expect(verdict.guardrail).toBe('block');
    expect(result.state.verdicts).toEqual(result.verdicts);
  });

  it('an output guardrail rewrite stamps the final step turn', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('the secret is swordfish')],
    });
    const agent = createAgent({
      name: 'verdict-output',
      instructions: 'reply',
      provider,
      guardrails: {
        output: [
          defineOutputGuardrail<string>({
            name: 'mask-secret',
            check: (value) =>
              typeof value === 'string' && value.includes('swordfish')
                ? {
                    ok: false,
                    action: 'rewrite',
                    message: 'masked secret',
                    rewrite: value.replace('swordfish', '[redacted]'),
                  }
                : { ok: true },
          }),
        ],
      },
    });
    const result = await agent.run('go');
    expect(result.status).toBe('completed');
    expect(result.output).toContain('[redacted]');
    expect(result.verdicts?.['1:0']).toEqual({ guardrail: 'rewrite' });
  });

  it('a clean run carries no verdicts field at all', async () => {
    const provider = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('hi')] });
    const agent = createAgent({ name: 'verdict-clean', instructions: 'reply', provider });
    const result = await agent.run('hello');
    expect(result.verdicts).toBeUndefined();
    expect(result.state.verdicts).toBeUndefined();
  });
});

describe('serialization round-trip', () => {
  it('verdicts survive serialize -> JSON -> deserialize and malformed entries are dropped', () => {
    const provider = createMockProvider({ modelId: 'mock', scripts: [] });
    void provider;
    const state = {
      id: 'run-ser',
      agentId: 'a',
      currentAgentId: 'a',
      sessionId: 's',
      status: 'completed',
      steps: [],
      messages: [],
      pendingApprovals: [],
      handoffs: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      verdicts: {
        '0:1': { guardrail: 'rewrite' },
        '2:0': { lateralLeak: true, dataflowFlags: ['untrusted-to-sink'] },
      },
      startedAt: new Date().toISOString(),
    } as unknown as RunState;
    const serialized = serializeRunState(state);
    const rehydrated = deserializeRunState(JSON.parse(JSON.stringify(serialized)));
    expect(rehydrated.verdicts).toEqual(state.verdicts);

    // Defensive rebuild: junk shapes are dropped, valid ones kept.
    const tampered = JSON.parse(JSON.stringify(serialized)) as {
      verdicts: Record<string, unknown>;
    };
    tampered.verdicts['9:9'] = 'nonsense';
    tampered.verdicts['8:8'] = { guardrail: 'explode', lateralLeak: 'yes' };
    const repaired = deserializeRunState(tampered as never);
    expect(repaired.verdicts?.['9:9']).toBeUndefined();
    expect(repaired.verdicts?.['8:8']).toBeUndefined();
    expect(repaired.verdicts?.['0:1']).toEqual({ guardrail: 'rewrite' });
  });
});
