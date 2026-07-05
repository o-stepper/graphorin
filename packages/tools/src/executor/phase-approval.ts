/**
 * Approval phase: evaluate `needsApproval` on the VALIDATED input and,
 * when it fires, suspend into the configured `ApprovalGate` - emitting
 * the `tool:approval:requested` / `denied` / `granted` audit rows.
 *
 * @packageDocumentation
 */

import type {
  CompletedToolCall,
  ResolvedTool,
  RunContext,
  ToolApproval,
  ToolCall,
  ToolError,
} from '@graphorin/core';
import type { SandboxTrustLevel } from '@graphorin/security/sandbox';

import { frozenCompleted } from './outcome.js';
import { prepareCallContext } from './phase-context.js';
import type { ExecutorRuntime } from './types.js';

/** Outcome of {@link runApprovalPhase}. */
export type ApprovalPhaseOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly completed: CompletedToolCall };

// Approval flow - evaluated on the validated input.
export async function runApprovalPhase(
  rt: ExecutorRuntime,
  input: {
    readonly call: ToolCall;
    readonly tool: ResolvedTool;
    readonly runContext: RunContext;
    readonly stepNumber: number;
    readonly trustLevel: SandboxTrustLevel;
    readonly validatedInput: unknown;
    /** Post-repair raw-shaped args carried on the approval record. */
    readonly effectiveArgs: unknown;
  },
): Promise<ApprovalPhaseOutcome> {
  const { call, tool, runContext, stepNumber, trustLevel, validatedInput, effectiveArgs } = input;
  if (tool.needsApproval === undefined) return { ok: true };

  // TL-11: a static `needsApproval: true` needs no context at all;
  // the function form gets one that is DISPOSED right after the
  // predicate - previously both forms eagerly built a full per-call
  // context (sandbox resolve + streaming channel + abort listener)
  // that was thrown away while its run-signal listener lived on.
  let needsApproval: boolean;
  if (typeof tool.needsApproval === 'function') {
    const predicateCtx = await prepareCallContext(
      rt,
      call,
      tool,
      runContext,
      stepNumber,
      trustLevel,
      validatedInput,
    );
    try {
      needsApproval = await tool.needsApproval(predicateCtx.input, predicateCtx.ctx);
    } finally {
      predicateCtx.channel.abort('finished');
      predicateCtx.linkedAbort.release();
    }
  } else {
    needsApproval = tool.needsApproval;
  }
  if (needsApproval) {
    const approval: ToolApproval = {
      toolCallId: call.toolCallId,
      toolName: tool.name,
      args: effectiveArgs,
      requestedAt: new Date().toISOString(),
    };
    rt.emit({
      action: 'tool:approval:requested',
      actor: { kind: 'tool', id: tool.name },
      target: tool.name,
      decision: 'success',
      ts: Date.now(),
      context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
    });
    const decision = (await rt.options.approvalGate?.request(call, approval)) ?? {
      granted: false,
      reason: 'no-approval-gate-configured',
    };
    if (!decision.granted) {
      rt.emit({
        action: 'tool:approval:denied',
        actor: { kind: 'tool', id: tool.name },
        target: tool.name,
        decision: 'denied',
        ts: Date.now(),
        context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
        ...(decision.reason !== undefined ? { metadata: { reason: decision.reason } } : {}),
      });
      const error: ToolError = {
        toolCallId: call.toolCallId,
        toolName: tool.name,
        kind: 'approval_denied',
        message: `Tool execution denied${decision.reason ? `: ${decision.reason}` : ''}.`,
        ...(decision.reason !== undefined ? { hint: decision.reason } : {}),
      };
      return { ok: false, completed: frozenCompleted(call, error, stepNumber) };
    }
    rt.emit({
      action: 'tool:approval:granted',
      actor: { kind: 'tool', id: tool.name },
      target: tool.name,
      decision: 'success',
      ts: Date.now(),
      context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
    });
  }
  return { ok: true };
}
