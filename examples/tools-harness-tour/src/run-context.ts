/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Minimal stand-in for the agent runtime's `RunContext`, mirroring the
 * fixture the framework's own executor tests use. The tour drives
 * `createToolExecutor(...)` directly (no model, no agent loop), so it
 * supplies the per-run context the executor would normally receive from
 * `agent.run(...)`: a stable `runId` (spill handles are scoped to it), a
 * tracer, an abort signal, and a read-only run-state snapshot.
 */

import type {
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

/** Options for {@link makeTourRunContext}. */
export interface MakeTourRunContextOptions {
  readonly runId: string;
  readonly tracer?: Tracer;
}

/** Build the per-run context the tour threads through every tool call. */
export function makeTourRunContext(options: MakeTourRunContextOptions): RunContext {
  const tracer = options.tracer ?? NOOP_TRACER;
  const state: RunState = {
    id: options.runId,
    agentId: 'tools-harness-tour',
    currentAgentId: 'tools-harness-tour',
    sessionId: 'tour-session',
    status: 'running',
    steps: [],
    messages: [],
    pendingApprovals: [],
    handoffs: [],
    usage: zeroUsage(),
    startedAt: new Date().toISOString(),
  };
  return {
    runId: options.runId,
    sessionId: 'tour-session',
    agentId: 'tools-harness-tour',
    deps: {},
    tracer,
    signal: new AbortController().signal,
    usage: noopUsage,
    stepNumber: 1,
    messages: [],
    state,
  };
}
