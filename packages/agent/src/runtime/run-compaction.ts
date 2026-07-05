/**
 * Compaction lifecycle for the agent run loop (WI-09 / P1-1, CE-3 /
 * AG-13, context-engine-06): the auto-compaction trigger evaluated
 * before each provider request, the last-resort emergency compaction at
 * hard context overflow, the servicing of `agent.compact()` manual
 * requests, and the prefix-pinned splice shared by all three paths.
 * Extracted verbatim from `factory.ts` (issue #23); the former run-loop
 * closures now take an explicit {@link CompactionRunEnv}.
 *
 * @packageDocumentation
 */

import type { AgentEvent, Message, RunState, Sensitivity } from '@graphorin/core';
import type { Memory } from '@graphorin/memory';
import type { CompactionApiResult, CompactOptions } from '../types.js';
import type { MutableRunState } from './run-input.js';

/** Return envelope of `ContextEngine.compactNow` (shared splice paths, CE-3). */
export type CompactionEnvelope = Awaited<ReturnType<Memory['contextEngine']['compactNow']>>;

/**
 * Manual-compaction requests enqueued by `agent.compact()` (CE-3 /
 * AG-13). The run loop owns the live message buffer, so the splice
 * must happen inside the loop: `maybeAutoCompact` services the queue
 * at the next step boundary, and `finishRun` settles leftovers as
 * explicit no-ops.
 */
export interface PendingManualCompact {
  readonly options: CompactOptions | undefined;
  readonly resolve: (result: CompactionApiResult) => void;
  readonly reject: (cause: unknown) => void;
}

export const noopCompactionResult = (
  skippedReason: NonNullable<CompactionApiResult['skippedReason']>,
): CompactionApiResult => ({
  beforeTokens: 0,
  afterTokens: 0,
  summaryTokens: 0,
  durationMs: 0,
  hooksFiredCount: 0,
  summary: '',
  applied: false,
  skippedReason,
});

/**
 * The run-scoped context the compaction paths operate on. Field names
 * mirror the run-loop locals the former closures captured; the live
 * message buffer and the pending-manual queue are shared references.
 */
export interface CompactionRunEnv {
  readonly config: { readonly sensitivity?: Sensitivity };
  readonly memory: Memory | undefined;
  readonly state: MutableRunState & RunState;
  readonly messages: Message[];
  readonly sessionId: string;
  readonly agentId: string;
  readonly systemPrefixLength: number;
  readonly pendingManualCompacts: PendingManualCompact[];
}

/**
 * Auto-compaction trigger (WI-09 / P1-1). Before assembling each
 * provider request, ask the memory {@link ContextEngine} whether the
 * in-flight buffer has crossed its per-provider threshold
 * (`shouldCompact`); when it has, summarise the older turns
 * (`compactNow`, `source: 'auto-trigger'`), splice the result back in
 * - preserving the byte-stable system prefix and the most-recent
 * turns verbatim - and emit `context.compacted`. The compaction is
 * configured on the memory facade (`createMemory({ contextEngine })`,
 * RB-46); there is no parallel agent-level knob.
 *
 * No-op when no memory is wired, when compaction is disabled or below
 * threshold (the engine returns `false`), or for `secret`-tier runs
 * (secret history is never shipped to the summarizer - a less-trusted
 * external sink; per-result handle references land in WI-10). Best
 * effort: a misconfigured engine (e.g. no summarizer) is swallowed and
 * the run proceeds uncompacted rather than aborting mid-flight.
 *
 * Operator-requested compactions (`agent.compact()`, CE-3/AG-13) are
 * serviced here too, FIRST - the queue carries the `compact()` promise
 * resolvers, and manual requests bypass the trigger evaluation.
 */
export async function* maybeAutoCompact<TOutput>(
  env: CompactionRunEnv,
): AsyncGenerator<AgentEvent<TOutput>, void, void> {
  const { config, memory, state, messages, sessionId, agentId, systemPrefixLength } = env;
  const { pendingManualCompacts } = env;
  while (pendingManualCompacts.length > 0) {
    const pending = pendingManualCompacts.shift();
    if (pending !== undefined) yield* serviceManualCompact<TOutput>(env, pending);
  }
  const mem = memory;
  if (mem === undefined) return;
  // Sensitivity gate (WI-09 step 2): drop, never re-route, secret-tier
  // content. Auto-compaction is an LLM summarizer call, so a secret
  // run is left un-compacted here.
  if (config.sensitivity === 'secret') return;
  const engine = mem.contextEngine;
  // context-engine-04: trigger, reclaim floor, and anti-thrash guard
  // share one basis - the engine sees the full buffer for the trigger
  // total, learns where the pinned (uncompactable) prefix ends, and
  // receives the prefix messages so the guard arms against the FULL
  // post-splice context instead of the sliced body.
  const triggered = await engine
    .shouldCompact(messages, { compactableFromIndex: systemPrefixLength })
    .catch(() => false);
  if (!triggered) return;

  const startedAt = Date.now();
  const envelope = await engine
    .compactNow({
      scope: { userId: state.userId ?? agentId, sessionId, agentId },
      runId: state.id,
      sessionId,
      agentId,
      source: 'auto-trigger',
      messages: messages.slice(systemPrefixLength),
      prefixMessages: messages.slice(0, systemPrefixLength),
      memory: mem,
    })
    // No summarizer configured (or the strategy threw) - proceed with
    // the un-compacted buffer rather than failing a live run.
    .catch(() => undefined);
  if (envelope === undefined) return;
  // Nothing was old enough to trim (body ≤ preserve-recent) - skip the
  // splice + event so `context.compacted` only fires on real work.
  if (envelope.result.droppedMessageIndices.length === 0) return;

  spliceCompacted(env, envelope);
  yield {
    type: 'context.compacted',
    runId: state.id,
    sessionId,
    agentId,
    beforeTokens: envelope.result.beforeTokens,
    afterTokens: envelope.result.afterTokens,
    summaryTokens: envelope.result.summaryTokens,
    durationMs: Date.now() - startedAt,
    source: 'auto-trigger',
    hooksFiredCount: envelope.result.hooksFiredCount,
  };
}

/**
 * context-engine-06: last-resort tier at hard context overflow. When
 * a provider rejects the request as over-window, force ONE aggressive
 * compaction (`preserveRecentTurns: 2`, trigger evaluation bypassed)
 * and let the caller retry the same provider - the fallback chain's
 * members usually share the same window, so without this the run just
 * dies. Returns `true` when the buffer actually shrank (retry is
 * worthwhile); `false` when memory is not wired, the run is
 * secret-tier, compaction trimmed nothing, or the engine threw.
 */
export async function* tryEmergencyCompact<TOutput>(
  env: CompactionRunEnv,
): AsyncGenerator<AgentEvent<TOutput>, boolean, void> {
  const { config, memory, state, messages, sessionId, agentId, systemPrefixLength } = env;
  const mem = memory;
  if (mem === undefined || config.sensitivity === 'secret') return false;
  const startedAt = Date.now();
  const envelope = await mem.contextEngine
    .compactNow({
      scope: { userId: state.userId ?? agentId, sessionId, agentId },
      runId: state.id,
      sessionId,
      agentId,
      source: 'auto-trigger',
      messages: messages.slice(systemPrefixLength),
      prefixMessages: messages.slice(0, systemPrefixLength),
      memory: mem,
      preserveRecentTurns: 2,
    })
    .catch(() => undefined);
  if (envelope === undefined || envelope.result.droppedMessageIndices.length === 0) {
    return false;
  }
  spliceCompacted(env, envelope);
  yield {
    type: 'context.compacted',
    runId: state.id,
    sessionId,
    agentId,
    beforeTokens: envelope.result.beforeTokens,
    afterTokens: envelope.result.afterTokens,
    summaryTokens: envelope.result.summaryTokens,
    durationMs: Date.now() - startedAt,
    source: 'auto-trigger',
    hooksFiredCount: envelope.result.hooksFiredCount,
  };
  return true;
}

/**
 * Prefix-pinned splice shared by the auto + manual compaction paths
 * (CE-3): stable system prefix + [summary, ...recent turns], with the
 * post-compaction hooks' text Context Essentials re-anchored as a
 * trailing system message so they survive the trim (RB-46). Mutates
 * BOTH the live loop buffer and `state.messages`.
 */
function spliceCompacted(env: CompactionRunEnv, envelope: CompactionEnvelope): void {
  const { state, messages, systemPrefixLength } = env;
  const prefix = messages.slice(0, systemPrefixLength);
  const rebuilt: Message[] = [...prefix, ...envelope.result.trimmedMessages];
  const essentials = envelope.extraContent
    .map((part) =>
      typeof part === 'object' && part !== null && 'text' in part
        ? String((part as { readonly text: unknown }).text)
        : '',
    )
    .filter((text) => text.length > 0)
    .join('\n\n');
  if (essentials.length > 0) {
    rebuilt.push({ role: 'system', content: essentials });
  }
  messages.splice(0, messages.length, ...rebuilt);
  state.messages.splice(0, state.messages.length, ...rebuilt);
}

/**
 * Service one `agent.compact()` request inside the loop (CE-3/AG-13):
 * same prefix-pinned splice as the auto path, `source: 'manual'` (or
 * the caller's `'pre-step'`), `preserveRecentTurns` forwarded as a
 * per-call strategy override. An engine failure rejects the caller's
 * promise but never aborts the live run; a summarize that trims
 * nothing resolves `applied: false` without an event.
 */
async function* serviceManualCompact<TOutput>(
  env: CompactionRunEnv,
  pending: PendingManualCompact,
): AsyncGenerator<AgentEvent<TOutput>, void, void> {
  const { memory, state, messages, sessionId, agentId, systemPrefixLength } = env;
  const mem = memory;
  if (mem === undefined) {
    pending.resolve(noopCompactionResult('no-memory'));
    return;
  }
  const source = pending.options?.source ?? 'manual';
  const startedAt = Date.now();
  let envelope: CompactionEnvelope;
  try {
    envelope = await mem.contextEngine.compactNow({
      scope: { userId: state.userId ?? agentId, sessionId, agentId },
      runId: state.id,
      sessionId,
      agentId,
      source,
      messages: messages.slice(systemPrefixLength),
      // context-engine-04: same accounting basis as the auto path.
      prefixMessages: messages.slice(0, systemPrefixLength),
      memory: mem,
      ...(pending.options?.preserveRecentTurns !== undefined
        ? { preserveRecentTurns: pending.options.preserveRecentTurns }
        : {}),
    });
  } catch (cause) {
    pending.reject(cause);
    return;
  }
  const { result } = envelope;
  const applied = result.droppedMessageIndices.length > 0;
  if (applied) {
    spliceCompacted(env, envelope);
    yield {
      type: 'context.compacted',
      runId: state.id,
      sessionId,
      agentId,
      beforeTokens: result.beforeTokens,
      afterTokens: result.afterTokens,
      summaryTokens: result.summaryTokens,
      durationMs: Date.now() - startedAt,
      source,
      hooksFiredCount: result.hooksFiredCount,
    };
  }
  pending.resolve({
    beforeTokens: result.beforeTokens,
    afterTokens: result.afterTokens,
    summaryTokens: result.summaryTokens,
    durationMs: Date.now() - startedAt,
    hooksFiredCount: result.hooksFiredCount,
    summary: result.summary ?? '',
    applied,
    ...(applied ? {} : { skippedReason: 'nothing-to-trim' as const }),
  });
}
