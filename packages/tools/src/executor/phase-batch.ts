/**
 * Batch scheduling phase: partitions a batch into sequential vs
 * parallel calls, serialises the sequential ones first (deterministic
 * ordering), pumps the parallel ones under the `maxParallelTools`
 * bound, and synthesizes `execution_failed` outcomes for rejections
 * that escape the per-call pipeline (TL-12 / tools-07).
 *
 * @packageDocumentation
 */

import type { CompletedToolCall, ToolCall } from '@graphorin/core';

import { describe, frozenCompleted } from './outcome.js';
import type { ExecuteBatchOptions, ExecutorRuntime, ToolExecutor } from './types.js';

export async function runExecuteBatch(
  rt: ExecutorRuntime,
  executeOne: ToolExecutor['executeOne'],
  batch: ExecuteBatchOptions,
): Promise<ReadonlyArray<CompletedToolCall>> {
  const trustLevel = batch.trustLevel ?? 'user-defined';
  const calls = [...batch.calls];
  if (calls.length === 0) return Object.freeze<CompletedToolCall[]>([]);

  // Partition into parallel + sequential.
  const sequentialCalls: ToolCall[] = [];
  const parallelCalls: ToolCall[] = [];
  for (const call of calls) {
    const tool = rt.options.registry.get(call.toolName);
    if (tool?.executionMode === 'sequential') {
      sequentialCalls.push(call);
    } else {
      parallelCalls.push(call);
    }
  }

  const results: CompletedToolCall[] = new Array(calls.length);
  const indexByCallId = new Map(calls.map((c, i) => [c.toolCallId, i]));

  // Run sequential tools first (deterministic ordering).
  // TL-12 (tools-07): `executeOne` is designed not to throw, but a
  // user-supplied hook that does (e.g. a throwing `tracer.span`) must
  // never SHRINK the batch - a missing slot means the agent pushes no
  // `tool` message for that id, leaving a dangling `tool_use` the next
  // provider request is rejected for. Synthesize an `execution_failed`
  // outcome instead of dropping the slot.
  const synthesizeFailure = (call: ToolCall, cause: unknown): CompletedToolCall =>
    frozenCompleted(
      call,
      {
        toolCallId: call.toolCallId,
        toolName: call.toolName,
        kind: 'execution_failed',
        message: `tool execution rejected outside the executor pipeline: ${describe(cause)}`,
      },
      batch.stepNumber,
    );

  for (const call of sequentialCalls) {
    let completed: CompletedToolCall;
    try {
      completed = await executeOne({
        call,
        runContext: batch.runContext,
        stepNumber: batch.stepNumber,
        trustLevel,
        ...(batch.disableRepair !== undefined ? { disableRepair: batch.disableRepair } : {}),
        ...(batch.preApproved !== undefined ? { preApproved: batch.preApproved } : {}),
        ...(batch.capability !== undefined ? { capability: batch.capability } : {}),
      });
    } catch (cause) {
      completed = synthesizeFailure(call, cause);
    }
    const idx = indexByCallId.get(call.toolCallId);
    if (idx !== undefined) results[idx] = completed;
  }

  // Parallel tools - concurrency-bounded.
  let inFlight = 0;
  const queue = [...parallelCalls];
  await new Promise<void>((resolve) => {
    const tickle = (): void => {
      while (inFlight < rt.maxParallelTools && queue.length > 0) {
        const call = queue.shift();
        if (call === undefined) break;
        inFlight++;
        void executeOne({
          call,
          runContext: batch.runContext,
          stepNumber: batch.stepNumber,
          trustLevel,
          ...(batch.disableRepair !== undefined ? { disableRepair: batch.disableRepair } : {}),
          ...(batch.preApproved !== undefined ? { preApproved: batch.preApproved } : {}),
          ...(batch.capability !== undefined ? { capability: batch.capability } : {}),
        })
          .catch((cause: unknown) => synthesizeFailure(call, cause))
          .then((completed) => {
            const idx = indexByCallId.get(call.toolCallId);
            if (idx !== undefined) results[idx] = completed;
          })
          .finally(() => {
            inFlight = Math.max(0, inFlight - 1);
            if (queue.length === 0 && inFlight === 0) resolve();
            else tickle();
          });
      }
      if (queue.length === 0 && inFlight === 0) resolve();
    };
    tickle();
  });

  return Object.freeze(results.filter((r) => r !== undefined));
}
