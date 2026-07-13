/**
 * Tool-batch dispatch bridging for the agent runtime: routes a batch of
 * (non-handoff) tool calls through the shared `@graphorin/tools`
 * executor and surfaces the outcomes as the long-standing
 * `tool.execute.*` agent events + tool messages (R10), including the
 * WI-10 result-handle rendering and the WI-05 `tool_search` promotion
 * fold. Extracted verbatim from `factory.ts` (issue #23); the former
 * run-loop closure now takes an explicit {@link DispatchRunEnv}.
 *
 * @packageDocumentation
 */

import type {
  AgentEvent,
  CompletedToolCall,
  Message,
  RunContext,
  RunState,
  ToolCall,
} from '@graphorin/core';
import type { ToolExecutor } from '@graphorin/tools/executor';
import type { CausalityMonitor } from '../lateral-leak/causality-monitor.js';
import { createExecutorEventBridge, type ExecutorEventBridge } from '../tooling/adapters.js';
import { renderToolErrorMessage } from './messages.js';
import type { MutableRunState } from './run-input.js';
import { recordToolSearchPromotions, TOOL_SEARCH_NAME } from './tool-wiring.js';

/**
 * Shape of the run-bound `dispatchBatch` wrapper the factory threads
 * into the resume-dispatch and tool-call-walk modules, so their call
 * sites read exactly as the former in-loop closure calls did.
 */
export type DispatchBatchFn<TDeps, TOutput> = (
  calls: ReadonlyArray<ToolCall>,
  executor: ToolExecutor,
  runContext: RunContext<TDeps>,
  stepNum: number,
  dispatchOpts?: { readonly disableRepair?: boolean; readonly preApproved?: boolean },
) => AsyncGenerator<AgentEvent<TOutput>, void, void>;

/**
 * The run-scoped context a batch dispatch operates on. Field names
 * mirror the run-loop locals the former closure captured; the
 * executor-bridge slot is the shared mutable cell the warm-up
 * streaming sink reads while a batch is in flight.
 */
export interface DispatchRunEnv {
  readonly state: MutableRunState & RunState;
  readonly messages: Message[];
  readonly causalityMonitor: CausalityMonitor | undefined;
  readonly promotedDeferred: Set<string>;
  readonly activeRunCapability: 'read-only' | undefined;
  readonly executorBridgeSlot: { current: ExecutorEventBridge | undefined };
}

/**
 * Dispatch a batch of (non-handoff) tool calls through the
 * {@link ToolExecutor} and surface the results as `AgentEvent`s.
 *
 * The agent owns the `tool.execute.start` / `.end` / `.error`
 * lifecycle (derived deterministically from the returned
 * {@link CompletedToolCall} outcomes) so every outcome kind -
 * success, unknown-tool, invalid-input, sanitization-blocked,
 * execution error - yields a consistent event and tool message,
 * preserving the pre-WI-03 stream shape (R10). The executor's
 * genuinely-live streaming events (`tool.execute.progress` /
 * `.partial`, emitted only by streaming-hint tools) are bridged
 * through Adapter E while the batch runs and are purely additive.
 *
 * Parallelism (WI-04): the executor runs independent calls in this
 * batch concurrently, bounded by `maxParallelTools`. `tool.execute.start`
 * is emitted up-front in call order and `.end` / `.error` after the
 * batch settles, also in call order - so result mapping and tool-message
 * history are deterministic regardless of which call finishes first,
 * while `.progress` / `.partial` events for concurrent calls interleave
 * (keyed by `toolCallId`). Tools declaring `executionMode: 'sequential'`
 * are serialised by the executor and never overlap.
 */
export async function* dispatchToolBatch<TDeps, TOutput>(
  env: DispatchRunEnv,
  calls: ReadonlyArray<ToolCall>,
  executor: ToolExecutor,
  runContext: RunContext<TDeps>,
  stepNum: number,
  dispatchOpts: { readonly disableRepair?: boolean; readonly preApproved?: boolean } = {},
): AsyncGenerator<AgentEvent<TOutput>, void, void> {
  const { state, messages, causalityMonitor, promotedDeferred, activeRunCapability } = env;
  const { executorBridgeSlot } = env;
  if (calls.length === 0) return;
  for (const call of calls) {
    // W-049: toolName duplicated for subscriber convenience.
    yield { type: 'tool.execute.start', toolCallId: call.toolCallId, toolName: call.toolName };
  }

  const bridge = createExecutorEventBridge();
  executorBridgeSlot.current = bridge;
  const resultsPromise = executor.executeBatch({
    calls,
    runContext,
    stepNumber: stepNum,
    ...(dispatchOpts.disableRepair !== undefined
      ? { disableRepair: dispatchOpts.disableRepair }
      : {}),
    // E1: resumed pre-approved batches satisfy ask/defer verdicts.
    ...(dispatchOpts.preApproved !== undefined ? { preApproved: dispatchOpts.preApproved } : {}),
    // D2: the run's capability restriction rides every batch.
    ...(activeRunCapability !== undefined ? { capability: activeRunCapability } : {}),
  });
  // Close the bridge once the batch settles so `drain()` ends; the
  // executor catches per-call errors, so the batch never rejects.
  const closeOnSettle = resultsPromise.then(
    () => bridge.close(),
    () => bridge.close(),
  );
  for await (const event of bridge.drain()) {
    if (event.type === 'tool.execute.progress' || event.type === 'tool.execute.partial') {
      yield event as AgentEvent<TOutput>;
    }
  }
  await closeOnSettle;
  executorBridgeSlot.current = undefined;

  const completed = await resultsPromise;
  const byCallId = new Map(completed.map((c) => [c.outcome.toolCallId, c]));
  const stepEntry = state.steps[state.steps.length - 1];
  for (const call of calls) {
    const result = byCallId.get(call.toolCallId);
    if (result === undefined) continue;
    if (stepEntry !== undefined) {
      (stepEntry.toolCalls as CompletedToolCall[]).push(result);
    }
    const outcome = result.outcome;
    if ('kind' in outcome) {
      yield {
        type: 'tool.execute.error',
        toolCallId: call.toolCallId,
        toolName: call.toolName,
        error: outcome,
      };
      const text = renderToolErrorMessage(outcome);
      messages.push({ role: 'tool', toolCallId: call.toolCallId, content: text });
      state.messages.push({ role: 'tool', toolCallId: call.toolCallId, content: text });
      causalityMonitor?.recordCall(`tool.error:${call.toolName}`);
    } else {
      const output = outcome.output;
      yield {
        type: 'tool.execute.end',
        toolCallId: call.toolCallId,
        toolName: call.toolName,
        result: output,
        durationMs: outcome.durationMs,
      };
      // WI-10 (P1-4): when the result spilled to a handle, inline only
      // the bounded preview plus a retrieval hint so the full blob never
      // enters the context window - the model fetches the rest on demand
      // via `read_result`. Inlined results serialise exactly as before
      // (preserves the happy-path message contract, R10).
      const handle = outcome.resultHandle;
      const rendered =
        handle !== undefined
          ? `${handle.preview}\n\n[Full result${
              handle.bytes !== undefined ? ` (${handle.bytes} bytes)` : ''
            } stored behind a handle. Call read_result with handle ${JSON.stringify(
              handle.uri,
            )} to retrieve it - optionally narrow with offset/length (bytes) or startLine/endLine.]`
          : typeof output === 'string'
            ? output
            : JSON.stringify(output);
      // C3 (ACI): an empty body reads as a glitch to models; say
      // explicitly that the tool ran and simply had nothing to print.
      const text =
        rendered === undefined || rendered.trim().length === 0
          ? '(tool ran successfully with no output)'
          : rendered;
      messages.push({ role: 'tool', toolCallId: call.toolCallId, content: text });
      state.messages.push({ role: 'tool', toolCallId: call.toolCallId, content: text });
      causalityMonitor?.recordCall(`tool:${call.toolName}`);
      // WI-05: a successful `tool_search` promotes its matches so the
      // catalogue advertises them on the next step.
      if (call.toolName === TOOL_SEARCH_NAME) {
        recordToolSearchPromotions(output, promotedDeferred);
      }
    }
  }
}
