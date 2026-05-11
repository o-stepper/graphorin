import { describe, expect, it } from 'vitest';
import {
  addModelUsage,
  aggregateUsageFromByModel,
  createInitialRunState,
  deserializeRunState,
  RUN_STATE_SCHEMA_VERSION,
  RunStateMalformedError,
  RunStateVersionUnsupportedError,
  runStateFromJSON,
  runStateToJSON,
} from '../src/index.js';

describe('createInitialRunState', () => {
  it('produces a fresh, zeroed RunState', () => {
    const state = createInitialRunState({ id: 'run-1', agentId: 'a-1', sessionId: 's-1' });
    expect(state.id).toBe('run-1');
    expect(state.status).toBe('running');
    expect(state.steps).toEqual([]);
    expect(state.usage.totalTokens).toBe(0);
  });
});

describe('runStateToJSON / runStateFromJSON', () => {
  it('round-trips an empty fresh state', () => {
    const original = createInitialRunState({
      id: 'run-1',
      agentId: 'a-1',
      sessionId: 's-1',
      userId: 'u-1',
    });
    const serialized = runStateToJSON(original);
    const round = runStateFromJSON(serialized);
    expect(round.id).toBe('run-1');
    expect(round.userId).toBe('u-1');
    expect(round.usage.totalTokens).toBe(0);
  });

  it('rejects future-major versions', () => {
    const tooNew = JSON.stringify({
      version: 'graphorin-run-state/9.0',
      id: 'r',
      agentId: 'a',
      currentAgentId: 'a',
      sessionId: 's',
      status: 'running',
      steps: [],
      messages: [],
      pendingApprovals: [],
      handoffs: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      startedAt: 'now',
    });
    expect(() => runStateFromJSON(tooNew)).toThrowError(RunStateVersionUnsupportedError);
  });

  it('rejects malformed JSON', () => {
    expect(() => runStateFromJSON('{')).toThrowError(RunStateMalformedError);
  });

  it('rejects payloads missing the version field', () => {
    expect(() => deserializeRunState({})).toThrowError(RunStateMalformedError);
  });

  it('synthesizes usageByModel from a v0.1-alpha-style state', () => {
    const alpha = {
      version: RUN_STATE_SCHEMA_VERSION,
      id: 'r',
      agentId: 'a',
      currentAgentId: 'a',
      sessionId: 's',
      status: 'running',
      steps: [],
      messages: [],
      pendingApprovals: [],
      handoffs: [],
      usage: { promptTokens: 5, completionTokens: 7, totalTokens: 12 },
      startedAt: 'now',
    };
    const r = deserializeRunState(alpha);
    expect(r.usageByModel?.a).toBeDefined();
    expect(r.usageByModel?.a?.totalTokens).toBe(12);
    expect(r.usageByModel?.a?.attemptCount).toBe(1);
  });
});

describe('addModelUsage / aggregateUsageFromByModel', () => {
  it('accumulates entries per model with attemptCount', () => {
    const state = createInitialRunState({ id: 'r', agentId: 'a', sessionId: 's' });
    addModelUsage(state, 'haiku-4.5', { promptTokens: 1, completionTokens: 2, totalTokens: 3 });
    addModelUsage(state, 'haiku-4.5', { promptTokens: 4, completionTokens: 5, totalTokens: 9 });
    expect(state.usageByModel?.['haiku-4.5']?.attemptCount).toBe(2);
    expect(state.usageByModel?.['haiku-4.5']?.totalTokens).toBe(12);
  });

  it('aggregateUsageFromByModel sums across models', () => {
    const state = createInitialRunState({ id: 'r', agentId: 'a', sessionId: 's' });
    addModelUsage(state, 'sonnet', { promptTokens: 1, completionTokens: 2, totalTokens: 3 });
    addModelUsage(state, 'haiku', { promptTokens: 1, completionTokens: 2, totalTokens: 3 });
    const sum = aggregateUsageFromByModel(state.usageByModel);
    expect(sum.totalTokens).toBe(6);
  });
});
