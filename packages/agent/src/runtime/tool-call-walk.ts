/**
 * The per-step tool-call walk of the agent run loop: batches
 * non-handoff calls for the executor (flushing before a handoff and
 * before each approval-gated call so execution order is kept), executes
 * the ≤1 handoff inline, pre-screens `needsApproval` with validated
 * args (tools-02), collects EVERY gated call (agent-01), and performs
 * the once-per-step durable-HITL suspend with its taint / promotion
 * snapshot + checkpoint (AG-19 / AG-23). Extracted verbatim from
 * `factory.ts` (issue #23); the former inline walk now takes an
 * explicit {@link ToolCallWalkEnv} and returns `{ suspended }` instead
 * of finishing the run itself.
 *
 * @packageDocumentation
 */

import type {
  AgentEvent,
  CompletedToolCall,
  RunContext,
  ToolApproval,
  ToolCall,
  ToolError,
} from '@graphorin/core';
import type { ToolExecutor } from '@graphorin/tools/executor';
import type { ToolRegistry } from '@graphorin/tools/registry';
import { serializeRunState } from '../run-state/index.js';
import type { AgentConfig } from '../types.js';
import { invokeNeedsApproval, safeParseGatedArgs } from './approvals.js';
import type { DispatchBatchFn } from './dispatch.js';
import { executeHandoffToolCall, type HandoffEntry, type HandoffRunEnv } from './handoff.js';
import { renderToolErrorMessage } from './messages.js';
import type { AssistantCommitEnv } from './run-gates.js';
import { isApprovalGated } from './tool-wiring.js';

/**
 * The run-scoped context the walk operates on. Extends the handoff
 * execution env (the walk hands it through verbatim); the extra fields
 * mirror the run-loop locals the former inline walk captured.
 */
export interface ToolCallWalkEnv<TDeps, TOutput> extends HandoffRunEnv<TDeps, TOutput> {
  readonly config: Pick<AgentConfig<TDeps, TOutput>, 'deps' | 'checkpointStore'>;
  readonly handoffMap: ReadonlyMap<string, HandoffEntry<TDeps>>;
  readonly toolDataFlowGuard: AssistantCommitEnv['toolDataFlowGuard'];
  readonly promotedDeferred: Set<string>;
  readonly dispatchBatch: DispatchBatchFn<TDeps, TOutput>;
}

/**
 * Walk calls in finalCalls order. Handoffs are special-cased
 * inline (≤1 per step) and never routed through the executor.
 * Non-handoff calls accumulate into a batch dispatched through
 * the ToolExecutor; the batch is flushed before a handoff and
 * before each approval-gated call so execution order is kept.
 * Gated calls are COLLECTED (all of them, agent-01) and the run
 * suspends once after the walk, so every non-gated toolCallId
 * has a tool message before the suspend snapshot - a dropped
 * call would persist a dangling `tool_use` that real providers
 * reject on resume.
 */
export async function* processStepToolCalls<TDeps, TOutput>(
  env: ToolCallWalkEnv<TDeps, TOutput>,
  finalCalls: ReadonlyArray<ToolCall>,
  stepRegistry: ToolRegistry,
  stepExecutor: ToolExecutor,
  execRunContext: RunContext<TDeps>,
  stepNumber: number,
): AsyncGenerator<
  AgentEvent<TOutput>,
  { readonly suspended: boolean; readonly abortPending?: boolean },
  void
> {
  const { config, state, messages, signal, handoffMap } = env;
  const { toolDataFlowGuard, promotedDeferred, dispatchBatch } = env;
  let batch: ToolCall[] = [];
  let stepApprovalsRequested = 0;

  for (const call of finalCalls) {
    const handoff = handoffMap.get(call.toolName);
    if (handoff !== undefined) {
      if (batch.length > 0) {
        yield* dispatchBatch(batch, stepExecutor, execRunContext, stepNumber);
        batch = [];
      }
      yield* executeHandoffToolCall<TDeps, TOutput>(env, call, handoff, stepNumber);
      continue;
    }

    // Approval pre-screen (Adapter G / durable HITL). Evaluate the
    // registry-resolved `needsApproval`; a gated call flushes the
    // queued batch (prior calls' side-effects complete first) and
    // is recorded as a pending approval. The walk CONTINUES: later
    // gated calls are collected too, and later non-gated calls
    // still execute before the suspend (agent-01 - previously
    // everything after the first gated call was silently dropped,
    // never executed and never approvable, leaving dangling
    // `tool_use` ids in the persisted transcript).
    const resolvedTool = stepRegistry.get(call.toolName);
    // tools-02 (agent mirror): the approval decision must be made
    // on the input that will actually execute. For gated tools the
    // args are validated HERE: a schema failure fails the call fast
    // as `invalid_input` (a human is never asked to approve args
    // that cannot run, and the resumed dispatch can therefore never
    // hit the repair hook), and the predicate receives the parsed
    // value its typed signature promises - not raw pre-coercion
    // JSON.
    let gateInput: unknown = call.args;
    if (resolvedTool !== undefined && isApprovalGated(resolvedTool)) {
      const parsed = safeParseGatedArgs(resolvedTool, call.args);
      if (parsed !== undefined && !parsed.success) {
        const toolError: ToolError = {
          toolCallId: call.toolCallId,
          toolName: call.toolName,
          kind: 'invalid_input',
          message: `Invalid arguments for approval-gated tool '${call.toolName}': ${parsed.message}`,
        };
        const stepEntry = state.steps[state.steps.length - 1];
        if (stepEntry !== undefined) {
          (stepEntry.toolCalls as CompletedToolCall[]).push({
            call,
            outcome: toolError,
            stepNumber,
          });
        }
        yield { type: 'tool.execute.start', toolCallId: call.toolCallId };
        yield {
          type: 'tool.execute.error',
          toolCallId: call.toolCallId,
          error: toolError,
        };
        const text = renderToolErrorMessage(toolError);
        messages.push({ role: 'tool', toolCallId: call.toolCallId, content: text });
        state.messages.push({ role: 'tool', toolCallId: call.toolCallId, content: text });
        continue;
      }
      if (parsed !== undefined) gateInput = parsed.data;
    }
    const needsApproval = await invokeNeedsApproval(
      resolvedTool,
      gateInput,
      execRunContext,
      signal,
    );
    if (needsApproval) {
      if (batch.length > 0) {
        yield* dispatchBatch(batch, stepExecutor, execRunContext, stepNumber);
        batch = [];
      }
      yield { type: 'tool.execute.start', toolCallId: call.toolCallId };
      const approval: ToolApproval = {
        toolCallId: call.toolCallId,
        toolName: call.toolName,
        args: call.args,
        requestedAt: new Date().toISOString(),
      };
      state.pendingApprovals.push(approval);
      stepApprovalsRequested += 1;
      yield {
        type: 'tool.approval.requested',
        toolCallId: call.toolCallId,
      };
      continue;
    }

    batch.push(call);
  }

  if (batch.length > 0) {
    yield* dispatchBatch(batch, stepExecutor, execRunContext, stepNumber);
  }

  // Durable-HITL suspend: once per step, carrying EVERY gated call
  // the model batched. Runs after the final batch flush so the
  // suspend snapshot already contains tool messages for the whole
  // non-gated remainder of the step.
  if (stepApprovalsRequested > 0) {
    state.status = 'awaiting_approval';
    // AG-19: persist the coarse taint summary + promoted-tool set into
    // the suspended state so a resume rehydrates the sink gate and the
    // discovered-tool catalogue instead of starting empty.
    const taintSnap = toolDataFlowGuard?.snapshotLedger(state.id);
    if (taintSnap !== undefined) state.taintSummary = taintSnap;
    if (promotedDeferred.size > 0) state.promotedTools = [...promotedDeferred];
    // W-038: an abort that arrived while this step was collecting gated
    // calls must reach the `onPendingApprovals` policy INSTEAD of the
    // unconditional suspend - and no 'suspended awaiting_approval'
    // checkpoint may be written first, or the durable trail would
    // contradict the aborted outcome and resurrect denied approvals on
    // resume. The factory applies the policy and persists the final,
    // policy-consistent state through the same put seam.
    if (signal.aborted) {
      return { suspended: true, abortPending: true };
    }
    if (config.checkpointStore !== undefined) {
      await config.checkpointStore.put(
        state.id,
        'agent',
        {
          id: state.id,
          threadId: state.id,
          namespace: 'agent',
          // AG-23: persist a detached, secret-redacted snapshot -
          // never the live MutableRunState reference.
          state: serializeRunState(state, { stripTracingApiKey: true }),
          channelVersions: {},
          stepNumber,
          createdAt: new Date().toISOString(),
        },
        { source: 'sync', status: 'suspended', nodeName: 'agent.run', sessionId: state.sessionId },
      );
    }
    return { suspended: true };
  }
  return { suspended: false };
}
