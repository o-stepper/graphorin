/**
 * The agent's public call surface, built over the factory's run loop:
 * `stream` / `run` (the AsyncIterable wrapper and the drained-run
 * variant, AG-9), `compact` (queued into the loop, CE-3 / AG-13),
 * `fanOut` (AG-7 lifecycle events onto the external queue), and the
 * structured progress-artifact IO (AG-20). Extracted verbatim from
 * `factory.ts` (issue #23); the factory's mutable `activeRunState`
 * scratch is read through a live getter so event payloads observe
 * exactly what the former closures observed.
 *
 * @packageDocumentation
 */

import type { AgentEvent, AgentResult, RunState } from '@graphorin/core';
import type { Memory } from '@graphorin/memory';
import {
  type FanOutResult,
  type FanOutOptions as RunFanOutOptions,
  runFanOut,
} from '../fanout/index.js';
import { newId } from '../internal/ids.js';
import type { ProgressIO, ProgressReadOptions, ProgressWriteOptions } from '../progress/index.js';
import type {
  AgentCallOptions,
  AgentConfig,
  AgentFanOutOptions,
  AgentInput,
  AgentProgressIO,
  CompactionApiResult,
  CompactOptions,
} from '../types.js';
import { noopCompactionResult, type PendingManualCompact } from './run-compaction.js';

/** The factory's per-instance run entry point (concurrency-guarded). */
export type RunLoopFn<TDeps, TOutput> = (
  input: AgentInput | RunState,
  options: AgentCallOptions<TDeps>,
) => AsyncGenerator<AgentEvent<TOutput>, AgentResult<TOutput>, void>;

/** Build the `stream` / `run` methods over the factory's run loop. */
export function createRunMethods<TDeps, TOutput>(
  runLoop: RunLoopFn<TDeps, TOutput>,
): {
  readonly stream: (
    input: AgentInput | RunState,
    options?: AgentCallOptions<TDeps>,
  ) => AsyncIterable<AgentEvent<TOutput>>;
  readonly run: (
    input: AgentInput | RunState,
    options?: AgentCallOptions<TDeps>,
  ) => Promise<AgentResult<TOutput>>;
} {
  const stream = (
    input: AgentInput | RunState,
    options?: AgentCallOptions<TDeps>,
  ): AsyncIterable<AgentEvent<TOutput>> => {
    const opts = options ?? {};
    return {
      [Symbol.asyncIterator]: () => {
        const gen = runLoop(input, opts);
        return {
          async next(): Promise<IteratorResult<AgentEvent<TOutput>, void>> {
            const r = await gen.next();
            if (r.done === true) {
              return { done: true, value: undefined };
            }
            return { done: false, value: r.value };
          },
          async return(): Promise<IteratorResult<AgentEvent<TOutput>, void>> {
            await gen.return(undefined as unknown as AgentResult<TOutput>);
            return { done: true, value: undefined };
          },
        };
      },
    };
  };

  const run = async (
    input: AgentInput | RunState,
    options?: AgentCallOptions<TDeps>,
  ): Promise<AgentResult<TOutput>> => {
    const opts = options ?? {};
    const gen = runLoop(input, opts);
    let next = await gen.next();
    while (next.done !== true) {
      next = await gen.next();
    }
    // Every terminal path of the run loop returns `finalize(...)`; an
    // undefined return value would mean the generator was torn down
    // externally - an invariant violation, not a run outcome (AG-9).
    const result = next.value;
    if (result === undefined) {
      throw new Error('unreachable: agent run loop ended without a result');
    }
    return result;
  };

  return { stream, run };
}

/** What the out-of-loop surface methods need from the factory scope. */
export interface AgentSurfaceDeps<TDeps, TOutput> {
  readonly config: Pick<AgentConfig<TDeps, TOutput>, 'sensitivity' | 'mergeGuard'>;
  readonly memory: Memory | undefined;
  readonly agentId: string;
  readonly getActiveRunState: () => RunState | undefined;
  readonly externalEventQueue: AgentEvent<TOutput>[];
  readonly pendingManualCompacts: PendingManualCompact[];
  readonly progressIO: ProgressIO;
}

/** Build the `compact` method (queued into the run loop, CE-3 / AG-13). */
export function createCompactMethod<TDeps, TOutput>(
  deps: AgentSurfaceDeps<TDeps, TOutput>,
): (options?: CompactOptions) => Promise<CompactionApiResult> {
  const { config, memory, getActiveRunState, pendingManualCompacts } = deps;
  return async (options?: CompactOptions): Promise<CompactionApiResult> => {
    // No memory wired - an explicit no-op (AG-13), intentionally
    // forgiving so example apps that don't wire memory don't crash
    // on `agent.compact()`.
    if (memory === undefined) return noopCompactionResult('no-memory');
    // Sensitivity gate (WI-09 step 2) applies to MANUAL compaction
    // too: secret-tier history never ships to the summarizer.
    if (config.sensitivity === 'secret') return noopCompactionResult('sensitivity-gated');
    // Idle - there is no live buffer to splice (AG-13's explicit
    // no-op marker, where the old surface silently reported zeros).
    if (getActiveRunState() === undefined) return noopCompactionResult('no-active-run');
    // CE-3/AG-13: the run loop owns the live buffer, so the splice
    // happens there - enqueue and let `maybeAutoCompact` service the
    // request at the next step boundary with the same prefix-pinned
    // splice as auto-compaction. Don't await this from inside a tool
    // handler: the loop can't reach the next step until the tool
    // returns.
    return await new Promise<CompactionApiResult>((resolve, reject) => {
      pendingManualCompacts.push({ options, resolve, reject });
    });
  };
}

/** Build the `fanOut` method (AG-7: lifecycle events reach the stream). */
export function createFanOutMethod<TDeps, TOutput>(
  deps: AgentSurfaceDeps<TDeps, TOutput>,
): <TFanOutOutput = unknown>(
  options: AgentFanOutOptions<TFanOutOutput>,
) => Promise<FanOutResult<TFanOutOutput>> {
  const { config, agentId, getActiveRunState, externalEventQueue } = deps;
  return async <TFanOutOutput = unknown>(
    options: AgentFanOutOptions<TFanOutOutput>,
  ): Promise<FanOutResult<TFanOutOutput>> => {
    const activeRunState = getActiveRunState();
    const runId = activeRunState?.id ?? `run_${newId()}`;
    const sessionId = activeRunState?.sessionId ?? `session_${newId()}`;
    const fanOutOptions: RunFanOutOptions<TFanOutOutput> = {
      children: options.children,
      ...(options.maxConcurrentChildren !== undefined
        ? { maxConcurrentChildren: options.maxConcurrentChildren }
        : {}),
      ...(options.perBudget !== undefined ? { perBudget: options.perBudget } : {}),
      ...(options.mergeStrategy !== undefined ? { mergeStrategy: options.mergeStrategy } : {}),
      ...(options.signal !== undefined ? { signal: options.signal } : {}),
      // AG-7: fanout lifecycle events reach the agent stream - queued
      // on the external-event queue and drained into the active (or
      // next consumed) run, like steer/follow-up/progress events.
      emit: (event) => {
        externalEventQueue.push(event as AgentEvent<TOutput>);
      },
      // AG-7: the configured sideways-injection merge guard finally
      // applies to the judge-merge path.
      ...(config.mergeGuard !== undefined ? { mergeGuard: config.mergeGuard } : {}),
      runId,
      sessionId,
      agentId,
    };
    return runFanOut<TFanOutOutput>(fanOutOptions);
  };
}

/** Build the structured progress-artifact IO surface (AG-20). */
export function createProgressSurface<TDeps, TOutput>(
  deps: AgentSurfaceDeps<TDeps, TOutput>,
): AgentProgressIO {
  const { agentId, getActiveRunState, externalEventQueue, progressIO } = deps;
  // Stable fallback id so out-of-run `progress.write` → `progress.read`
  // pairs resolve to the same artifact directory (a fresh id per call
  // could never find what it just wrote).
  const progressFallbackRunId = `run_${newId()}`;
  const progress: AgentProgressIO = {
    write: async (content: string, opts?: ProgressWriteOptions) => {
      const runId = getActiveRunState()?.id ?? progressFallbackRunId;
      const ref = await progressIO.write(runId, content, opts);
      // AG-20: surface the documented `agent.progress.written` event -
      // queued here and drained into the active (or next consumed) stream.
      externalEventQueue.push({
        type: 'agent.progress.written',
        runId,
        sessionId: getActiveRunState()?.sessionId ?? '',
        agentId,
        ref,
      } as AgentEvent<TOutput>);
      return ref;
    },
    read: async (opts?: ProgressReadOptions) => {
      const queriedRunId = opts?.runId ?? getActiveRunState()?.id ?? progressFallbackRunId;
      const refs = await progressIO.read(queriedRunId, opts);
      externalEventQueue.push({
        type: 'agent.progress.read',
        runId: getActiveRunState()?.id ?? queriedRunId,
        sessionId: getActiveRunState()?.sessionId ?? '',
        agentId,
        refs,
        queriedRunId,
        queriedRole: opts?.role,
      } as AgentEvent<TOutput>);
      return refs;
    },
  };
  return progress;
}
