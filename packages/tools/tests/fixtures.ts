/**
 * Test fixtures shared across executor / built-in test suites.
 *
 * Provides a minimal stand-in for the agent runtime's `RunContext`
 * so tests can exercise the executor without a full agent stack.
 */

import type {
  AISpan,
  RunContext,
  RunState,
  Tracer,
  Usage,
  UsageAccumulator,
  UsageSnapshot,
} from '@graphorin/core';
import { NOOP_TRACER, zeroUsage } from '@graphorin/core';

const noopUsage: UsageAccumulator = {
  total: zeroUsage(),
  byModel: new Map(),
  add(_modelId: string, _usage: Usage): void {},
  reset(): void {},
  snapshot(): UsageSnapshot {
    return Object.freeze({ total: zeroUsage(), byModel: [] });
  },
};

export function makeRunContext(
  opts: {
    readonly runId?: string;
    readonly sessionId?: string;
    readonly signal?: AbortSignal;
    readonly tracer?: Tracer;
  } = {},
): RunContext {
  const ac = new AbortController();
  const signal = opts.signal ?? ac.signal;
  const tracer: Tracer = opts.tracer ?? NOOP_TRACER;
  void undefined as unknown as AISpan; // ts-only reference
  const state: RunState = {
    id: opts.runId ?? 'run-fixture',
    agentId: 'agent-fixture',
    currentAgentId: 'agent-fixture',
    sessionId: opts.sessionId ?? 'session-fixture',
    status: 'running',
    steps: [],
    messages: [],
    pendingApprovals: [],
    handoffs: [],
    usage: zeroUsage(),
    startedAt: new Date().toISOString(),
  };
  return {
    runId: opts.runId ?? 'run-fixture',
    sessionId: opts.sessionId ?? 'session-fixture',
    agentId: 'agent-fixture',
    deps: {},
    tracer,
    signal,
    usage: noopUsage,
    stepNumber: 1,
    messages: [],
    state,
  };
}
