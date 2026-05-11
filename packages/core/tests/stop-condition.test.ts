import { describe, expect, it } from 'vitest';

import type { RunState } from '../src/types/run.js';
import { and, hasToolCall, isStepCount, isTerminal, not, or } from '../src/types/stop-condition.js';

function mkState(overrides: Partial<RunState> = {}): RunState {
  return {
    id: 'r1',
    agentId: 'a',
    currentAgentId: 'a',
    sessionId: 's',
    status: 'running',
    steps: [],
    messages: [],
    pendingApprovals: [],
    handoffs: [],
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    startedAt: new Date(0).toISOString(),
    ...overrides,
  };
}

describe('isStepCount', () => {
  it('rejects non-positive n', () => {
    expect(() => isStepCount(0)).toThrow(RangeError);
    expect(() => isStepCount(-3)).toThrow(RangeError);
    expect(() => isStepCount(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it('matches once steps reach n', () => {
    const cond = isStepCount(2);
    expect(cond.check(mkState({ steps: [] }))).toBe(false);
    expect(
      cond.check(
        mkState({
          steps: [
            { stepNumber: 0, startedAt: '', toolCalls: [], agentId: 'a' },
            { stepNumber: 1, startedAt: '', toolCalls: [], agentId: 'a' },
          ],
        }),
      ),
    ).toBe(true);
  });
});

describe('hasToolCall', () => {
  it('matches the latest assistant message', () => {
    const cond = hasToolCall('search');
    expect(
      cond.check(
        mkState({
          messages: [
            {
              role: 'assistant',
              content: '',
              toolCalls: [{ toolCallId: 't1', toolName: 'search', args: {} }],
            },
          ],
        }),
      ),
    ).toBe(true);
  });

  it('does not match prior assistant messages', () => {
    const cond = hasToolCall('search');
    expect(
      cond.check(
        mkState({
          messages: [
            {
              role: 'assistant',
              content: '',
              toolCalls: [{ toolCallId: 't1', toolName: 'search', args: {} }],
            },
            { role: 'assistant', content: 'just talking' },
          ],
        }),
      ),
    ).toBe(false);
  });
});

describe('isTerminal', () => {
  it('matches terminal statuses', () => {
    expect(isTerminal.check(mkState({ status: 'completed' }))).toBe(true);
    expect(isTerminal.check(mkState({ status: 'failed' }))).toBe(true);
    expect(isTerminal.check(mkState({ status: 'aborted' }))).toBe(true);
    expect(isTerminal.check(mkState({ status: 'running' }))).toBe(false);
    expect(isTerminal.check(mkState({ status: 'awaiting_approval' }))).toBe(false);
  });
});

describe('combinators', () => {
  const truthy = { description: 't', check: () => true };
  const falsy = { description: 'f', check: () => false };

  it('or returns true when any is truthy', () => {
    expect(or(falsy, truthy).check(mkState())).toBe(true);
    expect(or(falsy, falsy).check(mkState())).toBe(false);
  });

  it('and returns true only when all are truthy', () => {
    expect(and(truthy, truthy).check(mkState())).toBe(true);
    expect(and(truthy, falsy).check(mkState())).toBe(false);
  });

  it('not negates', () => {
    expect(not(truthy).check(mkState())).toBe(false);
    expect(not(falsy).check(mkState())).toBe(true);
  });
});
