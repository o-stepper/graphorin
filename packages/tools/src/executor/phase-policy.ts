/**
 * Tool-argument policy phase (Progent-style): forbid-before-allow rules
 * over the validated args, evaluated after approval and before the
 * data-flow sink gate.
 *
 * @packageDocumentation
 */

import type {
  CompletedToolCall,
  ResolvedTool,
  RunContext,
  ToolCall,
  ToolError,
} from '@graphorin/core';

import { incrementCounter } from '../audit/index.js';
import { emitErrorAudit, frozenCompleted } from './outcome.js';
import type { ExecutorRuntime } from './types.js';

// D4 Progent tool-argument policy: deny-before-allow rules over the
// validated args, evaluated after approval and before the sink gate.
// A deny verdict is a deterministic pre-execution block - the
// preventive complement to the (detective) data-flow gate. E1: when the
// guard exposes the four-value `decide`, `ask`/`defer` verdicts pass on
// a pre-approved replay (the durable-HITL grant is their resolution)
// and fail CLOSED otherwise - this surface cannot suspend (N-9); the
// agent pre-screen resolves them before dispatch.
export function runArgumentPolicyPhase(
  rt: ExecutorRuntime,
  input: {
    readonly call: ToolCall;
    readonly tool: ResolvedTool;
    readonly runContext: RunContext;
    readonly stepNumber: number;
    readonly validatedInput: unknown;
    readonly preApproved?: boolean;
  },
): CompletedToolCall | null {
  const { call, tool, runContext, stepNumber, validatedInput } = input;
  const guard = rt.options.argumentPolicy;
  if (guard === undefined) return null;
  const facts = {
    toolName: tool.name,
    sideEffectClass: tool.__sideEffectClass,
    sensitive: tool.sensitivity === 'secret',
    trustClass: tool.__trustClass,
    args: validatedInput,
  } as const;
  const blockWith = (
    kind: ToolError['kind'],
    message: string,
    reason: string,
  ): CompletedToolCall => {
    const error: ToolError = {
      toolCallId: call.toolCallId,
      toolName: tool.name,
      kind,
      message,
      hint: reason,
    };
    incrementCounter('tool.executor.policy-blocked.total', { toolName: tool.name });
    emitErrorAudit(rt, error, runContext, stepNumber);
    return frozenCompleted(call, error, stepNumber);
  };
  if (guard.decide !== undefined) {
    const decision = guard.decide(facts);
    if (decision.effect === 'allow') return null;
    if (decision.effect === 'deny') {
      return blockWith(
        'capability_blocked',
        `Blocked by tool-argument policy: ${decision.reason}`,
        decision.reason,
      );
    }
    // 'ask' | 'defer'
    if (input.preApproved === true) return null;
    return blockWith(
      'approval_denied',
      `Tool-argument policy returned '${decision.effect}' (${decision.reason}), but this ` +
        'execution surface cannot suspend for approval - the call is refused (fail-closed). ' +
        'Re-issue the call; an approval-capable harness will request the decision.',
      decision.reason,
    );
  }
  const decision = guard.evaluate(facts);
  if (decision.effect === 'forbid') {
    return blockWith(
      'capability_blocked',
      `Blocked by tool-argument policy: ${decision.reason}`,
      decision.reason,
    );
  }
  return null;
}
