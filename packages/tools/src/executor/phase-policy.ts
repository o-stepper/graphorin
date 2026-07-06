/**
 * Tool-argument policy phase (D4 / Progent): forbid-before-allow rules
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

// D4 Progent tool-argument policy: forbid-before-allow rules over the
// validated args, evaluated after approval and before the sink gate.
// A forbid verdict is a deterministic pre-execution block - the
// preventive complement to the (detective) data-flow gate.
export function runArgumentPolicyPhase(
  rt: ExecutorRuntime,
  input: {
    readonly call: ToolCall;
    readonly tool: ResolvedTool;
    readonly runContext: RunContext;
    readonly stepNumber: number;
    readonly validatedInput: unknown;
  },
): CompletedToolCall | null {
  const { call, tool, runContext, stepNumber, validatedInput } = input;
  if (rt.options.argumentPolicy === undefined) return null;
  const decision = rt.options.argumentPolicy.evaluate({
    toolName: tool.name,
    sideEffectClass: tool.__sideEffectClass,
    sensitive: tool.sensitivity === 'secret',
    trustClass: tool.__trustClass,
    args: validatedInput,
  });
  if (decision.effect === 'forbid') {
    const error: ToolError = {
      toolCallId: call.toolCallId,
      toolName: tool.name,
      kind: 'capability_blocked',
      message: `Blocked by tool-argument policy: ${decision.reason}`,
      hint: decision.reason,
    };
    incrementCounter('tool.executor.policy-blocked.total', { toolName: tool.name });
    emitErrorAudit(rt, error, runContext, stepNumber);
    return frozenCompleted(call, error, stepNumber);
  }
  return null;
}
