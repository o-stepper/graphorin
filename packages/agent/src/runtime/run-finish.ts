/**
 * The terminal path of every agent run: settle leftover manual-compact
 * requests (CE-3 / AG-13), assemble the final {@link AgentResult}
 * (AG-9), clear terminal-run spill artifacts (TL-10), and end the
 * stream with `agent.end` (AG-20). Extracted verbatim from
 * `factory.ts` (issue #23); the former factory closures now hang off
 * {@link createRunFinisher}'s deps.
 *
 * @packageDocumentation
 */

import type { AgentEvent, AgentResult, RunState } from '@graphorin/core';
import type { createDefaultSpillWriter } from '@graphorin/tools/result';
import { noopCompactionResult, type PendingManualCompact } from './run-compaction.js';
import type { InternalRunSnapshot, MutableRunState } from './run-input.js';

/** What the terminal path needs from the agent factory scope. */
export interface RunFinisherDeps {
  readonly pendingManualCompacts: PendingManualCompact[];
  readonly spillWriter: ReturnType<typeof createDefaultSpillWriter>;
}

/**
 * Build the factory's `finishRunBase` over the shared manual-compact
 * queue and spill writer.
 */
export function createRunFinisher<TOutput>(
  deps: RunFinisherDeps,
): (
  state: MutableRunState,
  snapshot: InternalRunSnapshot<TOutput>,
) => AsyncGenerator<AgentEvent<TOutput>, AgentResult<TOutput>, void> {
  const { pendingManualCompacts, spillWriter } = deps;

  /**
   * Terminal wrapper around {@link finalize}: every exit path of the run
   * loop - completed, failed, aborted, suspended - ends the stream with
   * an `agent.end` event carrying the final {@link AgentResult} (AG-20).
   */
  async function* finishRunBase(
    state: MutableRunState,
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
    }
    yield { type: 'agent.end', runId: result.state.id, result };
    return result;
  }

  function finalize(
    state: MutableRunState,
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
      state: state as unknown as RunState,
    };
  }

  return finishRunBase;
}
