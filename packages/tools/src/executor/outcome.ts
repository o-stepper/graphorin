/**
 * Completion / error funnel shared by every executor phase: the frozen
 * `CompletedToolCall` factory (which stamps the recovery envelope),
 * the `tool:execute:error` audit + counter emitter, the `failWith`
 * error path, and the `tool.execute.*` streaming-event mappers.
 *
 * @packageDocumentation
 */

import type {
  CompletedToolCall,
  RecoveryHint,
  ResolvedTool,
  RunContext,
  ToolCall,
  ToolError,
  ToolErrorKind,
  ToolExecuteEndEvent,
  ToolExecuteErrorEvent,
  ToolExecuteStartEvent,
  ToolOutcome,
} from '@graphorin/core';

import { incrementCounter } from '../audit/index.js';
import type { ExecutorRuntime } from './types.js';

/**
 * Derive the recoverable flag + model-facing recovery hint from the
 * error kind. Central so every error path (failWith, inline sites,
 * synthesizeFailure) carries the envelope without per-site bookkeeping.
 */
export function recoveryForKind(kind: ToolErrorKind): {
  readonly recoverable: boolean;
  readonly recoveryHint?: RecoveryHint;
} {
  switch (kind) {
    case 'rate_limited':
    case 'timeout':
      return { recoverable: true, recoveryHint: 'retry_later' };
    case 'invalid_input':
      return { recoverable: false, recoveryHint: 'check_input' };
    case 'invalid_output':
    case 'unknown_tool':
    case 'execution_failed':
      return { recoverable: false, recoveryHint: 'try_alternative' };
    case 'approval_denied':
    case 'sandbox_violation':
    case 'inbound_sanitization_blocked':
    case 'dataflow_policy_blocked':
    case 'capability_blocked':
      return { recoverable: false, recoveryHint: 'report_to_user' };
    default:
      return { recoverable: false };
  }
}

export function frozenCompleted(
  call: ToolCall,
  outcome: ToolOutcome,
  stepNumber: number,
  durationMs?: number,
): CompletedToolCall {
  void durationMs;
  // C3: stamp the recovery envelope on every error outcome at the single
  // completion funnel (explicit per-site values win when already set).
  const finalized: ToolOutcome =
    'kind' in outcome ? { ...recoveryForKind(outcome.kind), ...outcome } : outcome;
  return Object.freeze({
    call: Object.freeze({ ...call }),
    outcome: Object.freeze({ ...finalized }) as ToolOutcome,
    stepNumber,
  });
}

export function describe(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

export function emitErrorAudit(
  rt: ExecutorRuntime,
  error: ToolError,
  runContext: RunContext,
  stepNumber: number,
  reason?: string,
): void {
  rt.emit({
    action: 'tool:execute:error',
    actor: { kind: 'tool', id: error.toolName },
    target: error.toolName,
    decision: 'error',
    ts: Date.now(),
    context: { runId: runContext.runId, stepNumber, toolCallId: error.toolCallId },
    metadata: {
      kind: error.kind,
      ...(reason !== undefined ? { reason } : {}),
    },
  });
  incrementCounter('tool.executor.errors.total', { toolName: error.toolName, kind: error.kind });
}

export function failWith(
  rt: ExecutorRuntime,
  call: ToolCall,
  tool: ResolvedTool,
  kind: ToolErrorKind,
  message: string,
  runContext: RunContext,
  stepNumber: number,
  durationMs?: number,
): CompletedToolCall {
  const error: ToolError = {
    toolCallId: call.toolCallId,
    toolName: tool.name,
    kind,
    message,
  };
  emitErrorAudit(rt, error, runContext, stepNumber);
  rt.options.streamingSink?.(toErrorEvent(call, error));
  return frozenCompleted(call, error, stepNumber, durationMs);
}

export function toStartEvent(call: ToolCall): ToolExecuteStartEvent {
  return { type: 'tool.execute.start', toolCallId: call.toolCallId };
}

export function toEndEvent(
  call: ToolCall,
  result: unknown,
  durationMs: number,
): ToolExecuteEndEvent {
  return { type: 'tool.execute.end', toolCallId: call.toolCallId, result, durationMs };
}

export function toErrorEvent(call: ToolCall, error: ToolError): ToolExecuteErrorEvent {
  return { type: 'tool.execute.error', toolCallId: call.toolCallId, error };
}
