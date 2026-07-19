/**
 * Fresh-run message-buffer initialization: resolve the agent's
 * `instructions` (string or per-run function form), optionally
 * assemble the memory-aware 6-layer system prompt via the context
 * engine (opt-in), and seed the buffer + RunState mirror.
 * Extracted verbatim from `factory.ts` (issue #23).
 *
 * @packageDocumentation
 */

import type { Message, RunContext, RunState } from '@graphorin/core';
import type { Memory } from '@graphorin/memory';
import { newId } from '../internal/ids.js';
import { createInitialRunState } from '../run-state/index.js';
import type { buildDataFlowGuard } from '../tooling/dataflow.js';
import type { AgentCallOptions, AgentConfig, InboundTaintSeed } from '../types.js';
import { lastUserText } from './messages.js';
import type { MutableRunState } from './run-input.js';

/** What the fresh-run seeding pass needs from the run loop's scope. */
export interface RunInitEnv<TDeps, TOutput> {
  readonly config: AgentConfig<TDeps, TOutput>;
  readonly options: AgentCallOptions<TDeps>;
  readonly memory: Memory | undefined;
  readonly agentId: string;
  readonly sessionId: string;
  readonly userId: string | undefined;
  readonly tracer: RunContext<TDeps>['tracer'];
  readonly signal: AbortSignal;
  readonly usageAcc: RunContext<TDeps>['usage'];
  readonly state: MutableRunState & RunState;
}

/**
 * Inject the agent's system prompt at the top of the buffer
 * exactly once per run, before any seed messages - then mirror the
 * assembled messages into RunState so the JSONL session export and
 * any downstream consumers see what the agent saw.
 */
export async function seedInitialMessages<TDeps, TOutput>(
  env: RunInitEnv<TDeps, TOutput>,
  messages: Message[],
  seed: Message[],
): Promise<void> {
  const { config, options, memory, agentId, sessionId, userId } = env;
  const { tracer, signal, usageAcc, state } = env;
  const instructionsRaw = config.instructions;
  // AG-8: resolve the function form of `instructions` (sync or async). It is
  // resolved ONCE per run (the per-run contract documented on `AgentConfig`),
  // against a RunContext snapshot at step 0; the result is pinned as the
  // run's system-prompt prefix. A function that previously returned nothing
  // observable now actually seeds the system message.
  let instructionsText: string;
  if (typeof instructionsRaw === 'string') {
    instructionsText = instructionsRaw;
  } else {
    const instructionsCtx: RunContext<TDeps> = {
      runId: state.id,
      sessionId,
      ...(userId !== undefined ? { userId } : {}),
      agentId,
      deps: (options.deps ?? config.deps) as TDeps,
      tracer,
      signal,
      usage: usageAcc,
      stepNumber: 0,
      messages,
      state,
    };
    instructionsText = await instructionsRaw(instructionsCtx);
  }
  let systemPrompt = instructionsText;
  if (config.autoAssembleContext === true && memory !== undefined) {
    // CE-1 (opt-in): build the memory-aware 6-layer system prompt via the
    // context engine. The instructions become Layer 2; the engine prepends
    // the memory base and appends working blocks, procedural rules, skill
    // cards, the metadata counts, and (when `factsAutoRecall` is configured)
    // auto-recalled facts. Default-off keeps the explicit memory-tools
    // pattern, so the system prompt is `instructions` alone.
    const lastUser = lastUserText(seed);
    const assembled = await memory.contextEngine.assemble(memory, {
      scope: { userId: userId ?? agentId, sessionId, agentId },
      agentId,
      sessionId,
      runId: state.id,
      ...(instructionsText.length > 0 ? { agentInstructions: instructionsText } : {}),
      ...(lastUser !== undefined ? { lastUserMessage: lastUser } : {}),
    });
    systemPrompt = assembled.systemMessage.content;
  }
  if (systemPrompt.length > 0) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push(...seed);
  // Mirror the assembled messages into RunState so the JSONL
  // session export and any downstream consumers see what the
  // agent saw.
  for (const m of messages) state.messages.push(m);
}

/** What the run-state bootstrap needs from the run loop's scope. */
export interface RunStateInitEnv<TDeps, TOutput> {
  readonly config: Pick<AgentConfig<TDeps, TOutput>, 'toolPromotion'>;
  readonly agentId: string;
  readonly sessionId: string;
  readonly userId: string | undefined;
  readonly toolDataFlowGuard: ReturnType<typeof buildDataFlowGuard> | undefined;
  /** Message-borne taint seed from `AgentCallOptions.inboundTaint`. */
  readonly inboundTaint?: InboundTaintSeed;
}

/** The run-scoped state the bootstrap hands back to the run loop. */
export interface InitializedRunState {
  readonly state: MutableRunState & RunState;
  readonly promotedDeferred: Set<string>;
  readonly runStartPromotions: Set<string> | undefined;
}

/**
 * Bootstrap the run's state: create (or adopt) the {@link RunState},
 * rehydrate the run-scoped security state (the persisted coarse
 * taint summary re-seeds the enforce-mode sink gate), and restore the
 * `tool_search` promotion set (with the `'run-boundary'` snapshot).
 */
export function initializeRunState<TDeps, TOutput>(
  env: RunStateInitEnv<TDeps, TOutput>,
  resumed: RunState | undefined,
): InitializedRunState {
  const { config, agentId, sessionId, userId, toolDataFlowGuard } = env;
  const baseState: RunState = resumed
    ? resumed
    : createInitialRunState({
        id: newId('run'),
        agentId,
        sessionId,
        ...(userId !== undefined ? { userId } : {}),
      });
  // Mutable view (the public RunState is `readonly` but the runtime
  // owns the lifecycle; cast to a writable shape here).
  const state = baseState as RunState as unknown as MutableRunState & RunState;

  // AG-19: rehydrate the run-scoped security state BEFORE any tool runs this
  // resume. Seeding the data-flow ledger with the persisted coarse taint
  // summary keeps an enforce-mode sink gated across the suspend/resume
  // boundary (the promoted-tool set is restored below, once it exists).
  if (resumed && state.taintSummary !== undefined) {
    toolDataFlowGuard?.seedLedger(state.id, state.taintSummary);
  }

  // B1.5: stamp message-borne channel input into the ledger BEFORE the
  // first step. Runs after the resume seed on purpose - widen-only, so
  // a resumed run keeps its persisted taint AND gains the new message's.
  if (env.inboundTaint !== undefined) {
    toolDataFlowGuard?.recordInboundMessage(state.id, env.inboundTaint);
  }

  // WI-05: deferred tools promoted by a `tool_search` call this run.
  // Membership grows as the model discovers tools and gates which
  // deferred entries the per-step catalogue advertises. TL-7/AG-19:
  // persisted onto `RunState.promotedTools` at every exit and
  // rehydrated here, so a resumed run keeps its discoveries.
  const promotedDeferred = new Set<string>();
  // AG-19: restore deferred tools promoted by `tool_search` before the suspend
  // so they remain in the per-step catalogue after a resume.
  if (resumed && state.promotedTools !== undefined) {
    for (const name of state.promotedTools) promotedDeferred.add(name);
  }
  // C1: under `toolPromotion: 'run-boundary'` the advertised catalogue is
  // frozen to the promotions known at run start (incl. those restored
  // above), keeping the provider prompt cache byte-stable for the whole
  // run. New promotions still land in `promotedDeferred` (and persist),
  // taking effect on the next run / resume.
  const runStartPromotions =
    config.toolPromotion === 'run-boundary' ? new Set(promotedDeferred) : undefined;

  return { state, promotedDeferred, runStartPromotions };
}
