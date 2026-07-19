/**
 * Permission phase: the caller-supplied
 * {@link PermissionHook} evaluated on the VALIDATED input, after the
 * validate phase and BEFORE the approval phase.
 *
 * Decision semantics at this surface (the executor cannot suspend a
 * run):
 *
 * - `'allow'`  - proceed; an `updatedInput` rewrite is re-validated and
 *   replaces both the validated input and the effective args, so the
 *   approval gate / argument policy / data-flow gate all see what will
 * actually run.
 * - `'deny'`   - deterministic block (`capability_blocked`).
 * - `'ask'` / `'defer'` - fail closed (`approval_denied`) unless the
 *   batch is pre-approved: only the agent pre-screen can durably
 *   suspend, and it resolves these verdicts BEFORE dispatch. On a
 *   pre-approved replay the human's grant IS the resolution, so the
 *   verdict passes - but a rewrite of the granted args fails the call
 *   (never execute a payload nobody saw).
 * - a THROWING hook fails the call closed (`capability_blocked`).
 *
 * @packageDocumentation
 */

import type { CompletedToolCall, ResolvedTool, RunContext, ToolCall } from '@graphorin/core';

import { incrementCounter } from '../audit/index.js';
import { describe, failWith } from './outcome.js';
import type { ExecutorRuntime, PermissionHookResult } from './types.js';

/** Outcome of {@link runPermissionPhase}. */
export type PermissionPhaseOutcome =
  | {
      readonly ok: true;
      /** Possibly hook-rewritten validated input. */
      readonly validatedInput: unknown;
      /** Possibly hook-rewritten raw-shaped effective args. */
      readonly effectiveArgs: unknown;
    }
  | { readonly ok: false; readonly completed: CompletedToolCall };

export async function runPermissionPhase(
  rt: ExecutorRuntime,
  input: {
    readonly call: ToolCall;
    readonly tool: ResolvedTool;
    readonly runContext: RunContext;
    readonly stepNumber: number;
    readonly validatedInput: unknown;
    readonly effectiveArgs: unknown;
    readonly preApproved: boolean;
  },
): Promise<PermissionPhaseOutcome> {
  const { call, tool, runContext, stepNumber, preApproved } = input;
  const hook = rt.options.permissionHook;
  if (hook === undefined) {
    return { ok: true, validatedInput: input.validatedInput, effectiveArgs: input.effectiveArgs };
  }

  let verdict: PermissionHookResult;
  try {
    verdict = await Promise.resolve(
      hook({
        call,
        validatedInput: input.validatedInput,
        toolName: tool.name,
        sideEffectClass: tool.__sideEffectClass,
        trustClass: tool.__trustClass,
        ...(tool.sensitivity !== undefined ? { sensitivity: tool.sensitivity } : {}),
        runContext,
      }),
    );
  } catch (cause) {
    // Fail closed: a broken permission layer must never fail open.
    incrementCounter('tool.executor.permission-hook-failed.total', { toolName: tool.name });
    return {
      ok: false,
      completed: failWith(
        rt,
        call,
        tool,
        'capability_blocked',
        `Permission hook failed (fail-closed): ${describe(cause)}`,
        runContext,
        stepNumber,
      ),
    };
  }

  if (verdict.decision === 'deny') {
    incrementCounter('tool.executor.permission-blocked.total', { toolName: tool.name });
    return {
      ok: false,
      completed: failWith(
        rt,
        call,
        tool,
        'capability_blocked',
        `Blocked by permission hook${verdict.reason ? `: ${verdict.reason}` : ''}`,
        runContext,
        stepNumber,
      ),
    };
  }

  // tools-02 (hook mirror of disableRepair): a human granted exactly
  // these args - a differing rewrite on the replay path must fail
  // rather than execute. Args are JSON-safe on the wire, so a
  // stringified comparison is a faithful identity check.
  if (preApproved && verdict.updatedInput !== undefined) {
    if (JSON.stringify(verdict.updatedInput) !== JSON.stringify(input.effectiveArgs)) {
      incrementCounter('tool.executor.permission-replay-rewrite.total', { toolName: tool.name });
      return {
        ok: false,
        completed: failWith(
          rt,
          call,
          tool,
          'invalid_input',
          'Permission hook attempted to rewrite pre-approved args on a resume replay - ' +
            'the grant covered the original payload, so the rewrite is refused.',
          runContext,
          stepNumber,
        ),
      };
    }
    return { ok: true, validatedInput: input.validatedInput, effectiveArgs: input.effectiveArgs };
  }

  if (verdict.decision === 'ask' || verdict.decision === 'defer') {
    if (preApproved) {
      // The durable-HITL grant is the resolution of this ask/defer.
      return { ok: true, validatedInput: input.validatedInput, effectiveArgs: input.effectiveArgs };
    }
    // The executor cannot suspend (N-9) - fail closed. The agent
    // pre-screen resolves ask/defer BEFORE dispatch; a call landing
    // here unresolved (e.g. its args only became schema-valid through
    // the in-executor repair hook) surfaces as a denial the model can
    // retry with explicit args.
    incrementCounter('tool.executor.permission-unresolvable.total', { toolName: tool.name });
    return {
      ok: false,
      completed: failWith(
        rt,
        call,
        tool,
        'approval_denied',
        `Permission hook returned '${verdict.decision}'${
          verdict.reason ? ` (${verdict.reason})` : ''
        }, but this execution surface cannot suspend for approval - the call is refused ` +
          '(fail-closed). Re-issue the call; an approval-capable harness will request the decision.',
        runContext,
        stepNumber,
      ),
    };
  }

  // 'allow' with an optional rewrite.
  if (verdict.updatedInput === undefined) {
    return { ok: true, validatedInput: input.validatedInput, effectiveArgs: input.effectiveArgs };
  }
  const reparsed = tool.inputSchema.safeParse(verdict.updatedInput);
  if (!reparsed.success) {
    return {
      ok: false,
      completed: failWith(
        rt,
        call,
        tool,
        'invalid_input',
        `Permission hook rewrite failed schema re-validation: ${reparsed.error.message}`,
        runContext,
        stepNumber,
      ),
    };
  }
  incrementCounter('tool.executor.permission-rewritten.total', { toolName: tool.name });
  rt.emit({
    action: 'tool:permission:rewritten',
    actor: { kind: 'tool', id: tool.name },
    target: tool.name,
    decision: 'success',
    ts: Date.now(),
    context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
    ...(verdict.reason !== undefined ? { metadata: { reason: verdict.reason } } : {}),
  });
  return { ok: true, validatedInput: reparsed.data, effectiveArgs: verdict.updatedInput };
}
