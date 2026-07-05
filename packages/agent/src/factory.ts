/**
 * `createAgent({...})` - the agent factory entry point.
 *
 * Wires the typed `model -> tool calls -> model` loop, the streamed
 * event surface, the steering / followUp queues, durable HITL via
 * `RunState`, the multi-agent handoff layer, the agent-level model
 * fallback chain, and the per-tool preferred-model resolution.
 *
 * Custom adapters override behaviour by supplying alternative
 * `Provider` / `Memory` / `CheckpointStore` instances; the loop
 * never reaches into adapter internals.
 *
 * @packageDocumentation
 */

import type {
  AgentEvent,
  AgentResult,
  AISpan,
  Message,
  ProviderRequest,
  RunContext,
  RunState,
  RunStep,
  Sensitivity,
  Tool,
  ToolApproval,
  ToolCall,
  ToolDefinition,
} from '@graphorin/core';
import { isStepCount, NOOP_TRACER } from '@graphorin/core';
import type { Memory } from '@graphorin/memory';

import {
  AgentRuntimeError,
  ConcurrentRunError,
  InvalidAgentConfigError,
  InvalidPreferredModelError,
  MultipleHandoffsInStepError,
} from './errors/index.js';
import type { AgentFallbackPolicy } from './fallback/index.js';
import type { DescribedFilter } from './filters/index.js';
import { newId } from './internal/ids.js';
import { InMemoryUsageAccumulator } from './internal/usage-accumulator.js';
import { CausalityMonitor } from './lateral-leak/causality-monitor.js';
import { createProgressIO, type ProgressIO } from './progress/index.js';
import { addModelUsage } from './run-state/index.js';
import {
  createCompactMethod,
  createFanOutMethod,
  createProgressSurface,
  createRunMethods,
} from './runtime/agent-surface.js';
import { createToTool } from './runtime/agent-to-tool.js';
import {
  dispatchResumedApprovals,
  processResumeDirective,
  type ResumedDispatchEnv,
  type ResumeRunEnv,
} from './runtime/approvals.js';
import { type DispatchRunEnv, dispatchToolBatch } from './runtime/dispatch.js';
import { wireToolExecution } from './runtime/executor-wiring.js';
import { type FallbackChainEnv, runProviderFallbackChain } from './runtime/fallback-chain.js';
import { HANDOFF_TOOL_PREFIX, isDescribedFilter } from './runtime/handoff.js';
import {
  accumulateUsage,
  applyReasoningRetention,
  countLeadingSystemMessages,
} from './runtime/messages.js';
import {
  type CompactionRunEnv,
  maybeAutoCompact,
  noopCompactionResult,
  type PendingManualCompact,
  tryEmergencyCompact,
} from './runtime/run-compaction.js';
import { createRunFinisher } from './runtime/run-finish.js';
import {
  type AssistantCommitEnv,
  buildStructuredInstruction,
  type CancellationEnv,
  commitAssistantMessage,
  emitCancellation,
  finalizeRunOutput,
  type GuardrailScreenEnv,
  type RunOutputEnv,
  runVerifierGate,
  screenInputGuardrails,
  type VerifierGateEnv,
} from './runtime/run-gates.js';
import { initializeRunState, seedInitialMessages } from './runtime/run-init.js';
import {
  asMessages,
  type InternalRunSnapshot,
  isModelHintLike,
  isModelSpecLike,
  type MutableRunState,
  validatePreferredModel,
} from './runtime/run-input.js';
import {
  buildBaseRequest,
  resolveStepToolContext,
  type StepCatalogueEnv,
  type StepRequestEnv,
  toolToDefinition,
} from './runtime/step-catalogue.js';
import { processStepToolCalls, type ToolCallWalkEnv } from './runtime/tool-call-walk.js';
import type { ExecutorEventBridge } from './tooling/adapters.js';
import type {
  AbortOptions,
  Agent,
  AgentCallOptions,
  AgentConfig,
  AgentInput,
  AgentProgressIO,
} from './types.js';

/**
 * Build a fresh {@link Agent} from the supplied configuration.
 *
 * @stable
 */
export function createAgent<TDeps = unknown, TOutput = string>(
  config: AgentConfig<TDeps, TOutput>,
): Agent<TDeps, TOutput> {
  if (typeof config.name !== 'string' || config.name.length === 0) {
    throw new InvalidAgentConfigError("missing 'name'");
  }
  if (config.provider === undefined || config.provider === null) {
    throw new InvalidAgentConfigError("missing 'provider'");
  }
  // AG-3: a schema on a text-kind output spec is a config mistake (the
  // schema would never run) - reject instead of silently ignoring.
  if (config.outputType?.kind === 'text' && config.outputType.schema !== undefined) {
    throw new InvalidAgentConfigError(
      "outputType.kind 'text' with a schema - did you mean kind: 'structured'?",
    );
  }
  validatePreferredModel(config.preferredModel);
  if (config.modelTierMap !== undefined) {
    for (const [tier, spec] of Object.entries(config.modelTierMap)) {
      if (!isModelHintLike(tier)) throw new InvalidPreferredModelError({ tier });
      if (spec === undefined) continue;
      if (!isModelSpecLike(spec)) throw new InvalidPreferredModelError(spec);
    }
  }
  if (config.fallbackModels !== undefined) {
    for (const spec of config.fallbackModels) {
      if (!isModelSpecLike(spec)) throw new InvalidPreferredModelError(spec);
    }
  }

  const agentId = newId('agent');
  const tracer = config.tracer ?? NOOP_TRACER;
  const stopWhen = config.stopWhen ?? isStepCount(50);
  const fallbackPolicy: AgentFallbackPolicy = config.fallbackPolicy ?? {};
  const handoffMap = new Map<
    string,
    { readonly agent: Agent<TDeps, unknown>; readonly filter: DescribedFilter | undefined }
  >();
  for (const entry of config.handoffs ?? []) {
    const isWrappedHandoff = typeof entry === 'object' && entry !== null && 'target' in entry;
    const subAgent: Agent<TDeps, unknown> = isWrappedHandoff
      ? (entry as { readonly target: Agent<TDeps, unknown> }).target
      : (entry as Agent<TDeps, unknown>);
    const userFilter = isWrappedHandoff
      ? (
          entry as {
            readonly inputFilter?:
              | DescribedFilter
              | ((history: readonly Message[]) => readonly Message[]);
          }
        ).inputFilter
      : undefined;
    const filter = isDescribedFilter(userFilter) ? userFilter : undefined;
    const toolName = `${HANDOFF_TOOL_PREFIX}${subAgent.config.name}`;
    handoffMap.set(toolName, { agent: subAgent, filter });
  }

  let pendingSteer: Message[] = [];
  const pendingFollowUp: Message[] = [];
  let abortController: AbortController | undefined;
  let pendingAbort: AbortOptions | undefined;
  // Per-run scratch refs surfaced through the public surface for
  // event emission from `steer(...)` / `followUp(...)`.
  let activeRunState: RunState | undefined;
  // D2: capability of the ACTIVE run - read by the code-mode bridge so
  // in-script tool calls inherit the run's single-writer restriction.
  let activeRunCapability: 'read-only' | undefined;
  /** AG-11: guards the one-in-flight-run-per-instance invariant. */
  let runInFlight = false;
  const externalEventQueue: AgentEvent<TOutput>[] = [];

  const pendingManualCompacts: PendingManualCompact[] = [];

  const memory: Memory | undefined = config.memory;
  const progressIO: ProgressIO = createProgressIO({
    ...(config.sensitivity !== undefined ? { defaultSensitivity: config.sensitivity } : {}),
  });

  // Warm-up tool stack (Principle #12 / WI-03 / WI-05 / WI-10 / WI-11 /
  // WI-13 / D6): registry assembly, built-in registration (tool_search,
  // plan, read_result), guard hooks, the shared ToolExecutor factory and
  // the code-mode surface - wired in `runtime/executor-wiring.ts`. The
  // registry is exposed read-only as `agent.registry`.
  const executorBridgeSlot: { current: ExecutorEventBridge | undefined } = { current: undefined };
  const {
    toolRegistry,
    spillWriter,
    resultReader,
    makeToolExecutor,
    toolExecutor,
    toolDataFlowGuard,
    ruleOfTwoCapabilityFloor,
    isCodeMode,
    codeModeAdvertised,
  } = wireToolExecution<TDeps, TOutput>({
    config,
    memory,
    agentId,
    handoffToolNames: handoffMap.keys(),
    getActiveRunState: () => activeRunState,
    getActiveRunCapability: () => activeRunCapability,
    executorBridgeSlot,
  });

  const causalityMonitor = config.causalityMonitor
    ? new CausalityMonitor(config.causalityMonitor)
    : undefined;

  /**
   * AG-11: one in-flight run per Agent instance. `steer` / `followUp` /
   * `abort` / `compact` address "the run" with no run handle, so
   * overlapping runs on one instance cannot be expressed safely - they
   * would share the abort controller, steer queue, active-run ref and
   * executor bridge. A second concurrent `run()` / `stream()` rejects
   * with {@link ConcurrentRunError}; run-scoped state is reset on entry
   * (a steer/abort queued after the previous run ended belongs to NO
   * run) and cleared in a `finally` that also covers abandoned streams
   * (consumer `break`) and thrown runs.
   */
  async function* runLoop(
    input: AgentInput | RunState,
    options: AgentCallOptions<TDeps>,
  ): AsyncGenerator<AgentEvent<TOutput>, AgentResult<TOutput>, void> {
    if (runInFlight) {
      throw new ConcurrentRunError();
    }
    runInFlight = true;
    pendingSteer = [];
    pendingAbort = undefined;
    // D2 + D4: per-run capability - the call-level override wins, then
    // the agent default, then the Rule-of-Two floor (a profile denying
    // external side effects forces read-only even without an explicit
    // capability). Absent ⇒ all capabilities (legacy behaviour).
    activeRunCapability = options.capability ?? config.capability ?? ruleOfTwoCapabilityFloor;
    // AG-10: the causality chain is a per-run artifact - a denial
    // recorded in one run must not poison detection in the next.
    causalityMonitor?.reset();
    try {
      return yield* runLoopInner(input, options);
    } finally {
      runInFlight = false;
      activeRunState = undefined;
      activeRunCapability = undefined;
      // Backstop for exits that bypass `finishRun` (abandoned stream,
      // generator teardown): settle queued manual compactions so no
      // `agent.compact()` promise is left hanging (CE-3/AG-13).
      while (pendingManualCompacts.length > 0) {
        pendingManualCompacts.shift()?.resolve(noopCompactionResult('no-active-run'));
      }
    }
  }

  async function* runLoopInner(
    input: AgentInput | RunState,
    options: AgentCallOptions<TDeps>,
  ): AsyncGenerator<AgentEvent<TOutput>, AgentResult<TOutput>, void> {
    const { seed: rawSeed, resumed } = asMessages(input);
    // AG-12: queued follow-ups are next-turn metadata - they ride into
    // the next FRESH run as leading user turns. The old path mutated a
    // finished run back to 'running' and appended the message to a loop
    // that never processed it, leaving a non-terminal persisted RunState
    // with a dangling user turn. Resumed runs keep the queue intact.
    const seed =
      resumed === undefined && pendingFollowUp.length > 0
        ? [...pendingFollowUp.splice(0, pendingFollowUp.length), ...rawSeed]
        : rawSeed;
    const sessionId = options.sessionId ?? config.sessionId ?? `session_${newId()}`;
    const userId = options.userId ?? config.userId;
    const localCtl = new AbortController();
    abortController = localCtl;
    // AG-5: the loop + every provider request must observe the LOCAL
    // controller, so `agent.abort()` (which aborts `localCtl`) is honoured even
    // when the caller supplied their own `options.signal`. The caller's signal
    // is propagated INTO `localCtl` by the listener below; the listener is torn
    // down in the run's `finally` so it does not accumulate across runs that
    // share one long-lived parent signal.
    const signal = localCtl.signal;
    const parentSignal = options.signal;
    const onParentAbort = (): void => localCtl.abort();
    if (parentSignal !== undefined) {
      if (parentSignal.aborted) localCtl.abort();
      else parentSignal.addEventListener('abort', onParentAbort);
    }

    const usageAcc = new InMemoryUsageAccumulator();
    // Bootstrap the run state, the AG-19 security rehydration and the
    // `tool_search` promotion set (see `runtime/run-init.ts`).
    const { state, promotedDeferred, runStartPromotions } = initializeRunState<TDeps, TOutput>(
      { config, agentId, sessionId, userId, toolDataFlowGuard },
      resumed,
    );
    activeRunState = state;

    // agent-08 (F4): capture the run-scoped security state on EVERY exit
    // through finishRun - not just the approval suspend. An 'aborted' run
    // is resumable (the AG-14 guard blocks only awaiting_approval/failed)
    // and a 'completed' run re-enters as a follow-up; both must rehydrate
    // the enforce-mode sink gate and the discovered-tool catalogue.
    // Shadows the factory-scope finishRunBase for every call in this run.
    async function* finishRun(
      s: MutableRunState & RunState,
      snapshot: InternalRunSnapshot<TOutput>,
    ): AsyncGenerator<AgentEvent<TOutput>, AgentResult<TOutput>, void> {
      const taintSnap = toolDataFlowGuard?.snapshotLedger(s.id);
      if (taintSnap !== undefined) {
        (s as { taintSummary?: typeof taintSnap }).taintSummary = taintSnap;
      }
      if (promotedDeferred.size > 0) {
        (s as { promotedTools?: readonly string[] }).promotedTools = [...promotedDeferred];
      }
      return yield* finishRunBase(s, snapshot);
    }

    const messages: Message[] = resumed ? [...state.messages] : [];
    if (!resumed) {
      // Fresh run: resolve `instructions` (AG-8), optionally assemble
      // the memory-aware system prompt (CE-1), and seed the buffer +
      // RunState mirror (see `runtime/run-init.ts`).
      await seedInitialMessages<TDeps, TOutput>(
        { config, options, memory, agentId, sessionId, userId, tracer, signal, usageAcc, state },
        messages,
        seed,
      );
    }

    const finalSnapshot: InternalRunSnapshot<TOutput> = {
      output: '' as unknown as TOutput,
    };

    // C7: one agent.run span per run; step/tool/provider spans parent
    // under it so the whole run is a single trace tree. Attributes follow
    // the OTel GenAI semantic conventions (gen_ai.*).
    const runSpan = tracer.startSpan({
      type: 'agent.run',
      attrs: {
        'gen_ai.operation.name': 'invoke_agent',
        'gen_ai.agent.id': agentId,
        'gen_ai.agent.name': config.name,
        'graphorin.run.id': state.id,
        'graphorin.session.id': sessionId,
        'graphorin.run.resumed': resumed !== undefined,
      },
    });
    let currentStepSpan: AISpan<'agent.step'> | undefined;

    yield { type: 'agent.start', runId: state.id, agentId };

    // AG-2 / SDF-4: input guardrails screen each fresh-run seed user
    // message (string content) BEFORE the first provider call, using the
    // canonical `@graphorin/security` composer. 'block' fails the run
    // without reaching the model; 'rewrite' replaces the content in both
    // the working buffer and the persisted RunState; 'warn' logs and
    // continues. Resumed runs skip the pass - their seed was screened
    // when first submitted.
    const inputGuards = config.guardrails?.input;
    if (!resumed && inputGuards !== undefined && inputGuards.length > 0) {
      const blocked = yield* screenInputGuardrails<TOutput>(
        { state, messages, sessionId, agentId },
        inputGuards,
      );
      if (blocked) {
        return yield* finishRun(state, finalSnapshot);
      }
    }

    // AG-3: one per-run JSON instruction for structured output, appended
    // to each provider request (never the shared buffer / RunState).
    const structuredInstruction =
      config.outputType?.kind === 'structured'
        ? buildStructuredInstruction(config.outputType)
        : undefined;

    // AG-1: approved gated calls collected from a resume directive, executed
    // for real once every approval is resolved (see the dispatch below).
    const resumedApprovedCalls: ToolCall[] = [];
    // agent-02: the ToolApproval records behind `resumedApprovedCalls`,
    // kept so the write-ahead intent checkpoint can re-attach them to
    // `pendingApprovals` (a crash-retry against the intent re-dispatches).
    const grantedApprovals: ToolApproval[] = [];
    // Process resume directive - apply approval decisions to any
    // pending approvals captured in the previous suspend.
    if (
      resumed &&
      options.directive?.approvals !== undefined &&
      state.pendingApprovals.length > 0
    ) {
      yield* processResumeDirective<TOutput>(
        { state, messages },
        options.directive.approvals,
        resumedApprovedCalls,
        grantedApprovals,
      );
    }
    // AG-14: the resumed status is left untouched here. A 'failed' run is NOT
    // silently rewritten to 'completed' (the terminal/suspended guard below
    // returns it as-is); a 'completed' run keeps its status and re-enters the
    // loop for a follow-up; an unresolved 'awaiting_approval' run is caught by
    // that same guard.

    // WI-09: pin the trusted system-prompt prefix length now, on the
    // fully-assembled initial buffer, so auto-compaction never rewrites
    // it and prior summaries stay re-compactable (see
    // `countLeadingSystemMessages`).
    const systemPrefixLength = countLeadingSystemMessages(messages);

    const runContextBase: RunContext<TDeps> = {
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

    const handoffNames = Array.from(handoffMap.keys());

    /**
     * One run-scoped env threaded into every extracted runtime module
     * (issue #23): the intersection structurally satisfies each
     * module's env interface, so a single object carries the live loop
     * references the former closures captured (field names mirror the
     * original locals). `getPendingAbort` / `getActiveTodos` are live
     * reads of the factory's mutable scratch; `tryEmergencyCompact` and
     * `dispatchBatch` are pre-bound to this same env.
     */
    type RunLoopEnv = DispatchRunEnv &
      CompactionRunEnv &
      CancellationEnv &
      GuardrailScreenEnv &
      AssistantCommitEnv &
      FallbackChainEnv<TOutput> &
      StepCatalogueEnv<TDeps, TOutput> &
      StepRequestEnv<TDeps, TOutput> &
      ToolCallWalkEnv<TDeps, TOutput> &
      ResumeRunEnv &
      ResumedDispatchEnv<TDeps, TOutput> &
      VerifierGateEnv<TDeps, TOutput> &
      RunOutputEnv<TDeps, TOutput>;
    const runEnv: RunLoopEnv = {
      config,
      options,
      memory,
      state,
      messages,
      sessionId,
      agentId,
      userId,
      signal,
      stopWhen,
      fallbackPolicy,
      structuredInstruction,
      systemPrefixLength,
      runContextBase,
      handoffMap,
      handoffNames,
      isCodeMode,
      toolRegistry,
      toolExecutor,
      makeToolExecutor,
      resultReader,
      codeModeAdvertised,
      causalityMonitor,
      toolDataFlowGuard,
      promotedDeferred,
      runStartPromotions,
      activeRunCapability,
      executorBridgeSlot,
      pendingManualCompacts,
      getPendingAbort: () => pendingAbort,
      getActiveTodos: () => activeRunState?.todos,
      tryEmergencyCompact: () => tryEmergencyCompact<TOutput>(runEnv),
      dispatchBatch: (calls, executor, runContext, stepNum, dispatchOpts) =>
        dispatchToolBatch<TDeps, TOutput>(
          runEnv,
          calls,
          executor,
          runContext,
          stepNum,
          dispatchOpts,
        ),
    };

    // AG-14 (failed half): a terminal-failed run must never re-enter the
    // provider loop or dispatch anything - that would silently complete a
    // failed run. Return it as-is.
    if (resumed && state.status === 'failed') {
      return yield* finishRun(state, finalSnapshot);
    }

    // AG-1 / agent-02 / agent-07: execute the approved gated calls for
    // REAL before the provider loop, bracketed by the write-ahead intent
    // + post-dispatch checkpoints (see `runtime/approvals.ts`).
    if (resumed && resumedApprovedCalls.length > 0) {
      yield* dispatchResumedApprovals<TDeps, TOutput>(
        runEnv,
        resumedApprovedCalls,
        grantedApprovals,
      );
    }

    // AG-14 (suspended half): a resumed run still awaiting approvals the
    // directive did not resolve must not re-enter the provider loop - that
    // would re-issue a dangling tool_use real providers reject. The granted
    // subset (above) HAS executed and is journaled; return the re-suspended
    // state carrying its results.
    if (resumed && state.status === 'awaiting_approval') {
      return yield* finishRun(state, finalSnapshot);
    }

    let stepNumber = 0;
    // C3: verifier-triggered continuation rounds consumed this run.
    let verifierRoundsUsed = 0;
    // AG-15: tools the model actually called on the PREVIOUS step - the
    // per-tool preferred-model ladder consults these, never the full
    // advertised catalogue.
    let lastStepCalledToolNames: ReadonlyArray<string> = [];

    try {
      while (!stopWhen.check(state)) {
        // Drain any externally-queued lifecycle events
        // (`agent.steered`, `agent.followup.queued`).
        while (externalEventQueue.length > 0) {
          const ev = externalEventQueue.shift();
          if (ev !== undefined) yield ev;
        }
        if (signal.aborted) {
          if (yield* emitCancellation<TOutput>(runEnv)) {
            return yield* finishRun(state, finalSnapshot);
          }
          break;
        }
        stepNumber += 1;
        const stepStart = new Date().toISOString();

        // Drain steering queue.
        if (pendingSteer.length > 0) {
          for (const m of pendingSteer) {
            messages.push(m);
            state.messages.push(m);
          }
          pendingSteer = [];
        }

        yield { type: 'step.start', stepNumber };
        // C7: defensive end for a span left open by a mid-step exit path.
        currentStepSpan?.end();
        currentStepSpan = tracer.startSpan({
          type: 'agent.step',
          parent: runSpan,
          attrs: {
            'gen_ai.operation.name': 'invoke_agent',
            'gen_ai.agent.id': agentId,
            'gen_ai.agent.name': config.name,
            'graphorin.run.id': state.id,
            'graphorin.step.number': stepNumber,
          },
        });

        // WI-09 (P1-1): bound context growth before the provider call.
        // Fires `context.compacted` and rewrites the buffer in place only
        // when the memory ContextEngine's trigger crosses threshold; a
        // no-memory / below-threshold / secret-tier step is a no-op, so
        // the happy-path event stream is unchanged (R10).
        yield* maybeAutoCompact<TOutput>(runEnv);

        const stepCtx: RunContext<TDeps> = {
          ...runContextBase,
          stepNumber,
          messages,
          ...(currentStepSpan !== undefined ? { span: currentStepSpan } : {}),
        };
        const overrides = config.prepareStep ? await config.prepareStep(stepCtx) : {};

        // Resolve the step's registry / executor / catalogue / preferred
        // model / fallback chain (see `runtime/step-catalogue.ts`).
        const { stepRegistry, stepExecutor, stepTools, primary, fallbackChain } =
          resolveStepToolContext<TDeps, TOutput>(runEnv, overrides, lastStepCalledToolNames);

        // Resolve the effective reasoning-retention policy for this step
        // (RB-42), dropping buffered reasoning when the contract
        // downgrades to `'strip'` (see `runtime/messages.ts`).
        const reasoningPolicy = applyReasoningRetention(
          config.reasoningRetention,
          primary.resolvedProvider,
          messages,
          state.messages,
        );

        const toolDefs: ReadonlyArray<ToolDefinition> = stepTools.map((t) =>
          toolToDefinition(t as Tool<unknown, unknown, unknown>),
        );

        // Assemble the step's base provider request (AG-3 / D6 / RB-42;
        // see `runtime/step-catalogue.ts`).
        const baseRequest: ProviderRequest = buildBaseRequest<TDeps, TOutput>(
          runEnv,
          overrides,
          toolDefs,
          reasoningPolicy,
          stepNumber,
          currentStepSpan,
        );

        // Stream the step's provider call across the fallback chain
        // (see `runtime/fallback-chain.ts`); a terminal provider
        // failure is already recorded on `state` when `failed` is set.
        const chain = yield* runProviderFallbackChain<TOutput>(
          runEnv,
          fallbackChain,
          baseRequest,
          primary,
          stepNumber,
        );
        if (chain.failed) {
          return yield* finishRun(state, finalSnapshot);
        }
        const { modelSucceeded, textBuffer, finalCalls, stepReasoningParts } = chain;
        const { stepUsage, lastModelId } = chain;

        // AG-6: a mid-stream abort that interrupted the stream (no completed
        // model) ends the run as a cancellation ('aborted', or 'failed' under
        // the `onPendingApprovals: 'fail'` policy) rather than falling through
        // to a 'no-provider-completed' failure. When the model DID complete
        // (e.g. `drain: true` let the step finish), fall through so the step's
        // tool calls run and the graceful stop happens at the loop top.
        if (signal.aborted && !modelSucceeded) {
          yield* emitCancellation<TOutput>(runEnv);
          return yield* finishRun(state, finalSnapshot);
        }

        if (!modelSucceeded) {
          yield {
            type: 'agent.error',
            error: {
              message: 'all configured providers failed without finishing',
              code: 'no-provider-completed',
            },
          };
          state.status = 'failed';
          state.error = { message: 'no provider completed', code: 'no-provider-completed' };
          return yield* finishRun(state, finalSnapshot);
        }

        usageAcc.add(lastModelId, stepUsage);
        addModelUsage(state, lastModelId, stepUsage);
        accumulateUsage(state.usage, stepUsage);

        // Lateral-leak commit gate (RB-55 / AG-10 / C6): scan, commit
        // the assistant message, record the taint span, and emit the
        // detection event (see `runtime/run-gates.ts`).
        const leakBlocked = yield* commitAssistantMessage<TOutput>(
          runEnv,
          textBuffer,
          stepReasoningParts,
          finalCalls,
          reasoningPolicy,
        );

        const handoffCalls = finalCalls.filter((c) => handoffMap.has(c.toolName));
        if (handoffCalls.length > 1) {
          throw new MultipleHandoffsInStepError(handoffCalls.map((c) => c.toolName));
        }

        const stepRecord: RunStep = {
          stepNumber,
          startedAt: stepStart,
          endedAt: new Date().toISOString(),
          usage: stepUsage,
          toolCalls: [],
          agentId: state.currentAgentId,
          // C3: journal the RAW model response (pre-leak-block text) so
          // createReplayProvider(state) can re-drive the run offline.
          ...(config.recordProviderResponses === true
            ? {
                providerResponse: {
                  modelId: lastModelId,
                  ...(textBuffer.length > 0 ? { text: textBuffer } : {}),
                  ...(finalCalls.length > 0 ? { toolCalls: [...finalCalls] } : {}),
                },
              }
            : {}),
        };
        state.steps.push(stepRecord);
        lastStepCalledToolNames = finalCalls.map((c) => c.toolName);

        if (textBuffer.length > 0 && !leakBlocked) {
          finalSnapshot.output = textBuffer as unknown as TOutput;
          yield { type: 'text.complete', text: textBuffer };
        }

        if (finalCalls.length > 0) {
          // `stepRegistry` / `stepExecutor` were resolved with the
          // catalogue above (so the advertised tools and the executor's
          // resolvable tools agree, including any `prepareStep` override).
          const execRunContext: RunContext<TDeps> = {
            ...runContextBase,
            stepNumber,
            messages,
            ...(currentStepSpan !== undefined ? { span: currentStepSpan } : {}),
          };

          // Walk the calls (batch dispatch, inline handoff, approval
          // pre-screen, once-per-step durable-HITL suspend; see
          // `runtime/tool-call-walk.ts`).
          const walked = yield* processStepToolCalls<TDeps, TOutput>(
            runEnv,
            finalCalls,
            stepRegistry,
            stepExecutor,
            execRunContext,
            stepNumber,
          );
          if (walked.suspended) {
            return yield* finishRun(state, finalSnapshot);
          }
        }

        currentStepSpan?.setAttributes({
          'gen_ai.usage.input_tokens': stepUsage.promptTokens,
          'gen_ai.usage.output_tokens': stepUsage.completionTokens,
        });
        currentStepSpan?.end();
        currentStepSpan = undefined;
        yield { type: 'step.end', stepNumber, usage: stepUsage };

        if (finalCalls.length === 0) {
          // C3: verifier gate on the terminal response (see
          // `runtime/run-gates.ts`); a failed round feeds back and the
          // loop takes another step while rounds remain.
          if (config.verifiers !== undefined && config.verifiers.length > 0) {
            const gate = yield* runVerifierGate<TDeps, TOutput>(
              runEnv,
              finalSnapshot,
              stepNumber,
              verifierRoundsUsed,
            );
            verifierRoundsUsed = gate.verifierRoundsUsed;
            if (gate.continueRun) continue;
          }
          state.status = 'completed';
          break;
        }
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      const code = cause instanceof AgentRuntimeError ? (cause.code as string) : 'unknown';
      yield { type: 'agent.error', error: { message, code } };
      state.status = 'failed';
      state.error = { message, code };
      return yield* finishRun(state, finalSnapshot);
    } finally {
      // C7: close the trace tree on every exit path.
      currentStepSpan?.end();
      currentStepSpan = undefined;
      runSpan.setAttributes({
        'gen_ai.usage.input_tokens': state.usage.promptTokens,
        'gen_ai.usage.output_tokens': state.usage.completionTokens,
        'graphorin.run.status': state.status,
      });
      runSpan.setStatus(state.status === 'failed' ? 'error' : 'ok');
      runSpan.end();
      // AG-5: drop the parent-signal listener so it does not accumulate across
      // runs that share one long-lived `options.signal`. Runs after this point
      // (the follow-up loop) keep working via `agent.abort()` on `localCtl`.
      if (parentSignal !== undefined) {
        parentSignal.removeEventListener('abort', onParentAbort);
      }
    }

    // Terminal output phases in their frozen order: stop-condition cut
    // (AG-24), structured-output parse (AG-3), output guardrails
    // (AG-2 / SDF-4) - see `runtime/run-gates.ts`.
    yield* finalizeRunOutput<TDeps, TOutput>(runEnv, finalSnapshot);
    activeRunState = undefined;
    return yield* finishRun(state, finalSnapshot);
  }

  // Terminal path: settle the manual-compact queue, finalize the
  // result, clear terminal-run spill artifacts and emit `agent.end`
  // (see `runtime/run-finish.ts`).
  const finishRunBase = createRunFinisher<TOutput>({
    pendingManualCompacts,
    spillWriter,
    checkpointStore: config.checkpointStore,
    checkpointPolicy: config.checkpointPolicy,
  });

  // The public call surface over the run loop (AG-9; see
  // `runtime/agent-surface.ts`).
  const { stream, run } = createRunMethods<TDeps, TOutput>(runLoop);

  const steer = (message: AgentInput): void => {
    const { seed } = asMessages(message);
    pendingSteer.push(...seed);
    if (activeRunState !== undefined) {
      externalEventQueue.push({
        type: 'agent.steered',
        runId: activeRunState.id,
      } as AgentEvent<TOutput>);
    }
  };

  const followUp = (message: AgentInput): void => {
    const { seed } = asMessages(message);
    pendingFollowUp.push(...seed);
    if (activeRunState !== undefined) {
      externalEventQueue.push({
        type: 'agent.followup.queued',
        runId: activeRunState.id,
      } as AgentEvent<TOutput>);
    }
  };

  const abort = (options?: AbortOptions): void => {
    pendingAbort = options ?? {};
    abortController?.abort();
  };

  // `agent.toTool()` - the sub-agent tool surface, incl. contextFold
  // and child-taint propagation (see `runtime/agent-to-tool.ts`).
  const toTool = createToTool<TDeps, TOutput>({ config, run, stream });

  // `compact` / `fanOut` / the progress IO surface (AG-13 / AG-7 /
  // AG-20; see `runtime/agent-surface.ts`). The deps object reads the
  // factory's mutable `activeRunState` scratch through a live getter.
  const surfaceDeps = {
    config,
    memory,
    agentId,
    getActiveRunState: () => activeRunState,
    externalEventQueue,
    pendingManualCompacts,
    progressIO,
  };
  const compact = createCompactMethod<TDeps, TOutput>(surfaceDeps);
  const fanOut = createFanOutMethod<TDeps, TOutput>(surfaceDeps);
  const progress: AgentProgressIO = createProgressSurface<TDeps, TOutput>(surfaceDeps);

  void config.sensitivity as Sensitivity | undefined;

  const agent: Agent<TDeps, TOutput> = {
    id: agentId,
    config,
    stream,
    run,
    steer,
    followUp,
    abort,
    toTool,
    compact,
    fanOut,
    progress,
    registry: toolRegistry,
  };

  return agent;
}
