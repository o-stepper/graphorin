/**
 * The terminal path of every agent run: settle leftover manual-compact
 * requests, assemble the final {@link AgentResult}, clear
 * terminal-run spill artifacts, and end the stream with
 * `agent.end`. Extracted verbatim from
 * `factory.ts` (issue #23); the former factory closures now hang off
 * {@link createRunFinisher}'s deps.
 *
 * @packageDocumentation
 */

import type { AgentEvent, AgentResult, CheckpointStore, RunState } from '@graphorin/core';
import type { createDefaultSpillWriter } from '@graphorin/tools/result';
import { noopCompactionResult, type PendingManualCompact } from './run-compaction.js';
import type { InternalRunSnapshot, MutableRunState } from './run-input.js';

/** What the terminal path needs from the agent factory scope. */
export interface RunFinisherDeps {
  readonly pendingManualCompacts: PendingManualCompact[];
  readonly spillWriter: ReturnType<typeof createDefaultSpillWriter>;
  /** Thread erasure on terminal runs (`'delete-on-terminal'`). */
  readonly checkpointStore?: CheckpointStore | undefined;
  readonly checkpointPolicy?: 'keep' | 'delete-on-terminal' | undefined;
}

/**
 * Build the factory's `finishRunBase` over the shared manual-compact
 * queue and spill writer.
 */
export function createRunFinisher<TOutput>(
  deps: RunFinisherDeps,
): (
  state: MutableRunState & RunState,
  snapshot: InternalRunSnapshot<TOutput>,
) => AsyncGenerator<AgentEvent<TOutput>, AgentResult<TOutput>, void> {
  const { pendingManualCompacts, spillWriter, checkpointStore, checkpointPolicy } = deps;

  /**
   * Terminal wrapper around {@link finalize}: every exit path of the run
   * loop - completed, failed, aborted, suspended - ends the stream with
   * an `agent.end` event carrying the final {@link AgentResult}.
   *
   * The parameter is `MutableRunState & RunState`: the single caller
   * (factory `finishRun`) is typed exactly so, and the intersection lets
   * {@link finalize} assemble `AgentResult.state` without a cast.
   */
  async function* finishRunBase(
    state: MutableRunState & RunState,
    snapshot: InternalRunSnapshot<TOutput>,
  ): AsyncGenerator<AgentEvent<TOutput>, AgentResult<TOutput>, void> {
    // CE-3/AG-13: settle manual-compact requests the loop never serviced -
    // the run is over, there is no live buffer left to splice.
    while (pendingManualCompacts.length > 0) {
      pendingManualCompacts.shift()?.resolve(noopCompactionResult('no-active-run'));
    }
    const result = finalize(state, snapshot);
    // TL-10: spill artifacts are run-scoped scratch - drop them once the
    // run is terminal. `awaiting_approval` and `aborted` runs keep
    // theirs (handles must survive resume); orphans fall to the writer's
    // startup TTL sweep.
    if (result.status === 'completed' || result.status === 'failed') {
      await spillWriter.clear?.(result.state.id).catch(() => {});
      // W-005: opt-in checkpoint hygiene mirrors the spill lifecycle -
      // same statuses, best-effort, and NEVER for awaiting_approval /
      // aborted runs (their thread is the resume state). Default 'keep'
      // preserves post-hoc debugging and process-restart resume.
      if (checkpointPolicy === 'delete-on-terminal' && checkpointStore !== undefined) {
        await checkpointStore.deleteThread(result.state.id).catch(() => {});
      }
    }
    yield { type: 'agent.end', runId: result.state.id, result };
    return result;
  }

  function finalize(
    state: MutableRunState & RunState,
    snapshot: InternalRunSnapshot<TOutput>,
  ): AgentResult<TOutput> {
    state.finishedAt = state.finishedAt ?? new Date().toISOString();
    // AG-9: the result carries the terminal status, the failure (when
    // any), and the final RunState - a suspended run is resumable from
    // the result alone, no checkpointStore required.
    return {
      output: snapshot.output,
      usage: state.usage,
      status: state.status,
      ...(state.error !== undefined ? { error: state.error } : {}),
      ...(state.verdicts !== undefined ? { verdicts: state.verdicts } : {}),
      state,
    };
  }

  return finishRunBase;
}
