/**
 * Public types for the agent runtime. The interfaces sit in a
 * dedicated module so consumers can import them without pulling in
 * the loop implementation.
 *
 * @packageDocumentation
 */

import type {
  AgentEvent,
  AgentResult,
  AISpan,
  AnyTool,
  CheckpointStore,
  HandoffFilter,
  Message,
  ModelHint,
  ModelSpec,
  ProgressArtifactRef,
  Provider,
  ProviderCachePolicy,
  ReasoningRetention,
  RunContext,
  RunState,
  Sensitivity,
  StopCondition,
  Tool,
  ToolChoice,
  Tracer,
} from '@graphorin/core';
import type { Memory, PostCompactionHook as MemoryPostCompactionHook } from '@graphorin/memory';
import type { DataFlowPolicyConfig } from '@graphorin/security/dataflow';
import type { InputGuardrail, OutputGuardrail } from '@graphorin/security/guardrails';
import type { RuleOfTwoProfile, ToolArgumentPolicy } from '@graphorin/security/policy';
import type { PermissionHook } from '@graphorin/tools/executor';
import type { ToolRegistry } from '@graphorin/tools/registry';
import type { ResultReader } from '@graphorin/tools/result';

// E1: the hook contract lives with the executor; re-exported here for
// config ergonomics (mirrors the guardrail re-exports in index.ts).
export type {
  PermissionHook,
  PermissionHookInput,
  PermissionHookResult,
} from '@graphorin/tools/executor';

import type { AgentFallbackPolicy } from './fallback/index.js';
import type { FanOutOptions, FanOutResult, MergeStrategy, PerChildBudget } from './fanout/index.js';
import type { CausalityMonitorConfig } from './lateral-leak/causality-monitor.js';
import type { MergeGuardConfig } from './lateral-leak/merge-guard.js';
import type { ProgressReadOptions, ProgressWriteOptions } from './progress/index.js';

/**
 * Forward-compatible type alias for the input accepted by
 * `Agent.stream / run / steer / followUp`. v0.1 ships with the
 * canonical text + multimodal Message shape; future versions may
 * add structured inputs.
 *
 * @stable
 */
export type AgentInput = string | Message | ReadonlyArray<Message>;

/**
 * Output type specification.
 *
 * @stable
 */
export interface OutputSpec<TOutput> {
  readonly kind: 'text' | 'structured';
  /**
   * Local validator (Zod-compatible `{ parse }`) applied to the final
   * model output on the completed path (AG-3). A parse failure fails
   * the run with `output-validation-failed` - never a silent cast.
   */
  readonly schema?: { parse(value: unknown): TOutput };
  /** Optional description shown to the model alongside the schema. */
  readonly description?: string;
  /**
   * Wire-format JSON Schema advertised to the model: forwarded on
   * `ProviderRequest.outputType` for adapters with native structured
   * output, and embedded in the fallback JSON instruction appended as
   * a trailing system message (the documented contract until adapters
   * consume `outputType` natively - PS-24).
   */
  readonly jsonSchema?: Readonly<Record<string, unknown>>;
}

/**
 * Per-step override hook. Receives the current `RunContext` and may
 * return overrides applied to the next provider call only.
 *
 * @stable
 */
export type PrepareStepHook<TDeps = unknown> = (
  ctx: RunContext<TDeps>,
) => Promise<PrepareStepOverrides<TDeps>> | PrepareStepOverrides<TDeps>;

/** @stable */
export interface PrepareStepOverrides<TDeps = unknown> {
  readonly provider?: Provider;
  readonly tools?: ReadonlyArray<AnyTool<TDeps>>;
  readonly toolChoice?: ToolChoice;
  readonly temperature?: number;
  readonly maxTokens?: number;
}

/**
 * Compaction post-hook factory accepted by `createAgent({...})`.
 * Re-exported from `@graphorin/memory` here for ergonomic typing.
 *
 * @stable
 */
export type PostCompactionHook = MemoryPostCompactionHook;

/**
 * Skill-registry shape consumed by the agent loop. Implementations
 * live in `@graphorin/skills`. We accept any structurally-compatible
 * value to avoid the heavyweight peer dependency on the typing
 * surface.
 *
 * @stable
 */
export interface SkillsRegistryLike {
  list?(): ReadonlyArray<unknown>;
}

/**
 * Handoff target entry accepted by `createAgent({ handoffs })`.
 * Either a bare {@link Agent} reference (default filter applied) or
 * an explicit `{ target, inputFilter? }` envelope.
 *
 * @stable
 */
// `TOutput` is existential here: handoff targets legitimately vary in
// output type, and `Agent` is invariant in `TOutput` (the result is
// covariant, `guardrails.output` is contravariant) - `unknown` would
// reject every concretely-typed agent.
export type HandoffEntry<TDeps = unknown> =
  // biome-ignore lint/suspicious/noExplicitAny: existential TOutput (see above)
  | Agent<TDeps, any>
  | {
      // biome-ignore lint/suspicious/noExplicitAny: existential TOutput (see above)
      readonly target: Agent<TDeps, any>;
      readonly inputFilter?: HandoffFilter;
      /** W-036: which child events forward into the parent stream. */
      readonly forwardEvents?: SubagentForwardPolicy;
    };

/**
 * W-036: sub-agent event-forwarding policy. `'lifecycle'` (default)
 * forwards tool execution/approval, guardrail, lateral-leak,
 * compaction and error events - never the high-frequency text deltas;
 * `'all'` forwards everything; `'none'` keeps the child a black box.
 *
 * @stable
 */
export type SubagentForwardPolicy = 'none' | 'lifecycle' | 'all';

/**
 * The full options object accepted by {@link createAgent}.
 *
 * @stable
 */
export interface AgentConfig<TDeps = unknown, TOutput = string> {
  readonly name: string;
  /**
   * The agent's system prompt. A string is used verbatim; a function is
   * resolved **once per run** (sync or async, awaited) against a
   * {@link RunContext} snapshot at step 0, and its result is pinned as the
   * run's system-prompt prefix for the whole run (it is not re-evaluated
   * per step). An empty string injects no system message.
   */
  readonly instructions: string | ((ctx: RunContext<TDeps>) => string | Promise<string>);
  readonly provider: Provider;
  readonly tools?: ReadonlyArray<AnyTool<TDeps>>;
  readonly skills?: SkillsRegistryLike;
  readonly memory?: Memory;
  /**
   * Opt-in auto-induction (wave-D D4): after a run COMPLETES at or
   * above every complexity threshold, the runtime calls
   * `memory.procedural.induceFromRun(...)` to distil the trajectory
   * into a procedure candidate. The induced rule always lands
   * QUARANTINED - it reaches the prompt only after validation (or the
   * D4 promotion policy). Requires `memory` (and a workflow inducer
   * configured on it - `procedureInduction` on `createMemory`);
   * induction failures WARN once and never fail the run. The call is
   * awaited before `agent.end`, so wire a cheap inducer model. Failed
   * / aborted / suspended runs never induce.
   */
  readonly procedureInduction?: {
    /** Master switch. Default `false`. */
    readonly auto?: boolean;
    /** Minimum completed steps. Default `3`. */
    readonly minSteps?: number;
    /** Minimum total tool calls across steps. Default `3`. */
    readonly minToolCalls?: number;
    /** Minimum observed run cost in USD (0 = ignore cost). Default `0`. */
    readonly minCostUsd?: number;
  };
  /**
   * Opt in to building the per-run system prompt from the memory
   * `ContextEngine` (CE-1). When `true` **and** `memory` is wired, the
   * runtime calls `memory.contextEngine.assemble(...)` once at run start: the
   * agent's `instructions` become Layer 2 and the engine prepends the memory
   * base and appends working blocks, procedural rules, skill cards, the
   * metadata counts, and - when `factsAutoRecall` is configured - auto-recalled
   * facts. Defaults `false`: the prompt is built from `instructions` alone and
   * the model reaches memory only through the memory tools it calls (the
   * documented explicit pattern). Has no effect without `memory`.
   */
  readonly autoAssembleContext?: boolean;
  /**
   * Context-scaffolding preset (C6, decision D-10). `'full'` (default)
   * is exactly the pre-C6 behaviour. `'minimal'` is the cheap-run
   * posture for proactive fires and heartbeats:
   *
   * - instructions-only system prompt - `autoAssembleContext` must stay
   *   off (an explicit `autoAssembleContext: true` alongside
   *   `'minimal'` is a config error, fail-fast);
   * - deferred tool loading **by default** - every registered tool
   *   without an explicit `defer_loading` declaration is withheld from
   *   the per-step catalogue and reachable through `tool_search`
   *   promotion (an explicit `defer_loading: false` stays eager);
   * - no plan tool, no attention recitation - `plan: true` alongside
   *   `'minimal'` is a config error.
   *
   * Security layers (permission mode, sandbox, taint, Rule-of-Two) are
   * deliberately NOT touched by the preset. Known limitation: the
   * code-mode API projection covers eager tools only, so a
   * defer-heavy minimal agent projects a near-empty `code_search`
   * surface (documented in the tools guide).
   */
  readonly scaffold?: 'minimal' | 'full';
  readonly handoffs?: ReadonlyArray<HandoffEntry<TDeps>>;
  readonly outputType?: OutputSpec<TOutput>;
  /**
   * Deterministic checks run by the loop (AG-2; canonical contract is
   * `@graphorin/security`'s `GuardrailDefinition` - SDF-4).
   *
   * - `input` guardrails run over each **fresh-run seed user message**
   *   (string content) before the first provider call. `'block'` fails
   *   the run (`guardrail-blocked`) without reaching the model;
   *   `'rewrite'` replaces the message content (mirrored into the
   *   persisted `RunState`); `'warn'` logs and continues.
   * - `output` guardrails run over the **final output** on the
   *   completed path before `agent.end`. `'block'` fails the run;
   *   `'rewrite'` replaces `result.output` (text deltas were already
   *   streamed - the rewrite governs the durable result, not the
   *   live token stream).
   *
   * Every trip emits a `guardrail.tripped` event.
   */
  readonly guardrails?: {
    readonly input?: ReadonlyArray<InputGuardrail<string>>;
    readonly output?: ReadonlyArray<OutputGuardrail<TOutput>>;
  };
  readonly stopWhen?: StopCondition;
  readonly toolChoice?: ToolChoice;
  readonly prepareStep?: PrepareStepHook<TDeps>;
  readonly maxParallelTools?: number;
  /**
   * How the model invokes tools (P1-2).
   *
   * - `'direct'` (default) - the model emits one provider tool-call per
   *   tool, each result inlined into the conversation.
   * - `'code-mode'` - the agent advertises only the `code_execute` /
   *   `code_search` meta-tools; the model writes a script that calls
   *   tools in a sandbox via `tools.<name>(args)`, and **only the
   *   script's final result re-enters context** (intermediate results
   *   stay inside the sandbox). Each in-script call still runs through
   *   the executor, so per-tool ACL / sanitization / truncation apply.
   *   Approval-gated tools are not reachable from code-mode (there is no
   *   durable-HITL path mid-script); call those in `'direct'` mode.
   *
   * @default 'direct'
   */
  readonly toolInvocation?: 'direct' | 'code-mode';
  readonly fallbackModels?: ReadonlyArray<ModelSpec>;
  readonly fallbackPolicy?: AgentFallbackPolicy;
  readonly preferredModel?: ModelHint | ModelSpec;
  readonly modelTierMap?: Partial<Record<ModelHint, ModelSpec>>;
  /**
   * Per-agent override of the per-provider auto-detected
   * {@link ReasoningRetention} default. Wins over the provider-
   * level default when both are present. The agent runtime feeds
   * the effective value into every `provider.stream(...)` call so
   * the wire-correct contract is honoured per RB-42 / suggested
   * DEC-158 / suggested ADR-046.
   */
  readonly reasoningRetention?: ReasoningRetention;
  readonly causalityMonitor?: CausalityMonitorConfig;
  /**
   * Sideways-injection merge guard for `agent.fanOut` `'judge-merge'`
   * (AG-7): scores per-child source trust × contribution weight against
   * the judge's merged output; a biased merge emits
   * `agent.lateral-leak.detected` and `'detect-and-block'` throws
   * `MergeBlockedError`.
   */
  readonly mergeGuard?: MergeGuardConfig;
  /**
   * Provenance / taint-based data-flow policy (P1-3, opt-in). Enforces
   * data-flow rules at the tool-execution boundary using the provenance
   * Graphorin already tracks (trust class + source + sensitivity), to
   * defuse the lethal trifecta: a sink (`side-effecting` /
   * `external-stateful` tool) is blocked when untrusted content flows
   * into it verbatim, or - conservatively - when it fires while both
   * untrusted content and secret-tier data are present in the run.
   *
   * - `mode: 'shadow'`  - audit-only; tainted flows are flagged
   *   (`tool:dataflow:flagged` audit + counter) but never blocked. Ship
   *   this first to surface false positives.
   * - `mode: 'enforce'` - tainted flows are blocked (the sink does not
   *   run; the call yields a `dataflow_policy_blocked` error) unless the
   *   sink is listed in `declassifySinks` (an audited operator override).
   *
   * Composes with `'code-mode'`: each in-script tool call flows through
   * the same executor gate. Absent (the default) leaves the loop
   * unchanged.
   */
  readonly dataFlowPolicy?: DataFlowPolicyConfig;
  /**
   * Additional result-handle readers (P1-4 / WI-13), tried after the
   * built-in spill-file reader. Wire an MCP resource reader
   * (`createMcpResourceReader` from `@graphorin/mcp/client`) here so the
   * model can resolve an MCP `resource_link` on demand via the built-in
   * `read_result` tool, instead of inlining the resource body. Supplying
   * any reader force-registers `read_result` even when no tool spills.
   */
  readonly resultReaders?: ReadonlyArray<ResultReader>;
  /**
   * Opt-in prompt-cache breakpoint policy (core-provider-02), forwarded
   * verbatim on every `ProviderRequest` the loop issues. With
   * `{ breakpoints: 'auto' }` the Anthropic path (vercel adapter) anchors
   * `cache_control` markers on the first and last conversation messages,
   * so the stable prefix (tools + system + early turns) is written to the
   * provider cache once and read at the discounted rate on every later
   * step. Providers with automatic caching ignore it. Pair with the
   * append-only transcript the loop already maintains - cache hit rate is
   * the #1 production cost lever for multi-step agents.
   */
  readonly cachePolicy?: ProviderCachePolicy;
  /**
   * When deferred-tool promotions (via `tool_search`) take effect (C1):
   *
   * - `'immediate'` (default) - a promoted tool joins the catalogue on the
   *   NEXT step. Costs one provider-cache invalidation per promotion
   *   (the tools block changes), which is the standard trade for tool
   *   discovery.
   * - `'run-boundary'` - the catalogue advertised to the model is frozen
   *   for the whole run; promotions are still recorded (and persisted on
   *   `RunState.promotedTools`) but only join the catalogue on the next
   *   run / resume. Keeps the provider prompt cache byte-stable across
   *   every step of a run.
   */
  readonly toolPromotion?: 'immediate' | 'run-boundary';
  /**
   * C3: rules-based verifiers that run when the model emits a terminal
   * (no-tool-call) response. A failing verifier's feedback is appended
   * to the transcript as a user message and the loop continues, up to
   * `maxVerifierRounds` extra rounds. Verifiers are DETERMINISTIC checks
   * (lint/test runners, format validators, exit codes) - deliberately
   * not an evidence-free "reflect on your answer" step, which the
   * self-correction literature shows degrades performance.
   */
  readonly verifiers?: ReadonlyArray<ResponseVerifier>;
  /**
   * Cap on verifier-triggered continuation rounds per run (C3).
   * @default 1
   */
  readonly maxVerifierRounds?: number;
  /**
   * C3: transparent bounded retry for transient tool failures, forwarded
   * to the executor. Defaults (when set): `maxAttempts: 3`,
   * `backoffMs: 250`, `kinds: ['rate_limited']`; retries only ever run
   * for `pure` / `read-only` tools or tools with an `idempotencyKey`.
   */
  readonly toolRetry?: {
    readonly maxAttempts?: number;
    readonly backoffMs?: number;
    readonly kinds?: ReadonlyArray<import('@graphorin/core').ToolErrorKind>;
  };
  /**
   * C3: journal each step's raw model response (text + tool calls +
   * model id) onto `RunState.steps[].providerResponse`, enabling
   * deterministic replay via `createReplayProvider(state)` - reproduce
   * an entire run without live model calls.
   * @default false
   */
  readonly recordProviderResponses?: boolean;
  readonly tracer?: Tracer;
  readonly checkpointStore?: CheckpointStore;
  /**
   * What happens to the run's checkpoint thread when the run reaches a
   * terminal status (W-005). `'keep'` (default) preserves the current
   * behaviour: checkpoints survive for post-hoc debugging and
   * process-restart resume. `'delete-on-terminal'` best-effort deletes
   * the thread after `completed` / `failed` runs; `awaiting_approval`
   * and `aborted` runs always keep theirs (the thread IS the resume
   * state). Requires {@link AgentConfig.checkpointStore}.
   * @default 'keep'
   */
  readonly checkpointPolicy?: 'keep' | 'delete-on-terminal';
  readonly sensitivity?: Sensitivity;
  /**
   * Agent-default capability restriction (D2). `'read-only'` builds a
   * side-effect-free agent: writer tools and handoffs are never
   * advertised and the executor blocks writer calls deterministically
   * (`capability_blocked`). Per-call override:
   * {@link AgentCallOptions.capability}. See {@link AgentCapability}.
   */
  readonly capability?: AgentCapability;
  /**
   * Declarative tool-argument policy (D4 / Progent). Forbid-before-allow
   * rules over tool name + validated args, evaluated by the executor on
   * every call; default-deny sensitive tools with `defaultDenySensitive`.
   * A forbid verdict blocks the call (`capability_blocked`). Composes on
   * top of {@link ruleOfTwo}. See `@graphorin/security/policy`.
   */
  readonly toolPolicy?: ToolArgumentPolicy;
  /**
   * Rule-of-Two capability profile (D4). Declares which of {untrusted
   * input, sensitive data, external side effects} this agent may hold;
   * denying external side effects forces a read-only capability floor
   * and blocks writer tools, denying sensitive data default-denies
   * sensitive tools. Holding all three is the dangerous configuration
   * the preset is designed to prevent. See `@graphorin/security/policy`.
   */
  readonly ruleOfTwo?: RuleOfTwoProfile;
  /**
   * E1 pre-tool permission hook: one caller-supplied decision point
   * (`allow | deny | ask | defer`, optional `updatedInput` rewrite)
   * over every executor-bound tool call. The run loop pre-screens it on
   * validated args so `ask`/`defer` durably suspend the run exactly
   * like `needsApproval` (the `ToolApproval` carries `mode`), `deny`
   * fails the call deterministically, and an allowed rewrite is what
   * the approval record / policy / data-flow gates see (W-118). The
   * executor evaluates the hook again at dispatch as its own phase
   * (before approval), so the hook must be pure/idempotent; on resume
   * replays it must not rewrite granted args (tools-02). Handoff and
   * `toTool` sub-agent calls are outside the hook's scope (govern the
   * child through its own config); deny-by-name still covers their
   * names. See `PermissionHook` in `@graphorin/tools/executor`.
   */
  readonly permissionHook?: PermissionHook;
  /**
   * Register the D6 structured plan tool (`update_plan`, TodoWrite-style)
   * and recite the plan back into each step's prompt (attention
   * recitation). The plan is journaled in `RunState.todos` and survives
   * resume. Default `false` - off keeps the tool surface unchanged.
   */
  readonly plan?: boolean;
  readonly sessionId?: string;
  readonly userId?: string;
  readonly deps?: TDeps;
}

/**
 * Outcome of one {@link ResponseVerifier} check (C3).
 *
 * @stable
 */
export type VerifierResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly feedback: string };

/**
 * A deterministic check over the model's terminal response (C3). Runs
 * when the loop is about to complete; `ok: false` feeds `feedback` back
 * to the model (as a user message prefixed `[verifier:<id>]`) and the
 * loop continues for up to `AgentConfig.maxVerifierRounds` extra rounds.
 *
 * A verifier that THROWS is treated as passed (the `verifier.result`
 * event still fires with `ok: true`): a buggy verifier must never
 * take down a run.
 *
 * @stable
 */
export interface ResponseVerifier {
  readonly id: string;
  verify(ctx: {
    /** The model's terminal text output (raw, pre-structured-parse). */
    readonly output: string;
    readonly state: RunState;
    readonly stepNumber: number;
  }): VerifierResult | Promise<VerifierResult>;
}

/**
 * Single approval decision attached to a {@link ResumeDirective}.
 * Mirrors the directive surface the HITL caller supplies on resume
 * (per `Command(approval: { granted, reason? })` in the agent-loop
 * reference, renamed to `Directive` per Graphorin's own naming).
 *
 * @stable
 */
export interface ApprovalDecision {
  readonly toolCallId: string;
  readonly granted: boolean;
  readonly reason?: string;
  /**
   * W-001: echo of `ToolApproval.subRunToolCallId` for approvals that
   * belong to a parked sub-agent run. Operators read the pair
   * (`toolCallId`, `subRunToolCallId`) from `RunState.pendingApprovals`
   * and return BOTH fields; decisions match on the composite key, so
   * child-local toolCallId collisions across two parked children never
   * cross-apply. A decision without this field applies only to the
   * parent's own (unparked) approvals.
   */
  readonly subRunToolCallId?: string;
}

/**
 * Resume directive accepted by `agent.run(input | RunState, { directive })`.
 *
 * The library-mode pickup pattern is: the operator stores the
 * suspended `RunState` from the previous `agent.run(...)` call,
 * waits for the user / cron / webhook to resolve the pending
 * approval, and re-invokes `agent.run(savedState, { directive: {
 * approvals: [...] } })` to resume.
 *
 * @stable
 */
export interface ResumeDirective {
  readonly approvals?: ReadonlyArray<ApprovalDecision>;
}

/**
 * B1.5: message-borne untrusted input entering a run from a channel
 * gateway. Stamped into the run's taint ledger at init, BEFORE the
 * first step, so the data-flow policy's untrusted leg is armed even
 * though the input arrives as a user MESSAGE rather than a tool
 * output (the Rule-of-Two deliberately excludes ordinary user
 * messages; channel peers are authenticated but their CONTENT is
 * attacker-influenceable). Widen-only: it can add taint, never clear
 * it.
 *
 * @stable
 */
export interface InboundTaintSeed {
  /**
   * The untrusted inbound text. Recorded as verbatim spans so a later
   * sink call whose args copy the channel text trips the probe.
   */
  readonly text: string;
  /**
   * Descriptive source kind for audit trails, e.g.
   * `'channel:telegram'`. Default `'channel-inbound'`.
   */
  readonly sourceKind?: string;
  /** Also arm the sensitive leg (rare; widen-only). */
  readonly sensitive?: boolean;
}

/**
 * Run-level budget (C5 / W-084 residual, decision D-8). Enforced as a
 * between-step precheck against the run's accumulated usage - the step
 * that crosses a ceiling completes (in-flight overshoot is inherent to
 * between-step enforcement, exactly like the consolidator's
 * `BudgetTracker`), and the run stops before the next provider call.
 * Sub-agent usage is included: handoff / `toTool` children fold their
 * usage into the parent run's accounting (W-033).
 *
 * The cost leg reads `Usage.cost`, which only exists when the provider
 * chain reports it (wire `withCostTracking` from `@graphorin/provider`
 * with a `@graphorin/pricing` snapshot). A cost ceiling without USD
 * cost data is UNENFORCED and WARNs once per run - use `maxTokens` for
 * a provider-independent ceiling.
 *
 * @stable
 */
export interface RunBudget {
  /** Maximum cumulative run cost in USD (sub-agents included). */
  readonly maxCostUsd?: number;
  /**
   * Maximum cumulative run tokens (`Usage.totalTokens`, sub-agents
   * included). Provider-independent - enforced even without pricing
   * middleware.
   */
  readonly maxTokens?: number;
  /**
   * What to do when a ceiling is crossed. `'stop'` (default) ends the
   * run through the normal terminal path: the result resolves with
   * `status: 'failed'` and `error.code: 'budget-exceeded'` (the
   * stop-condition-cut precedent), so the resumable partial state stays
   * on the result. `'throw'` rejects the run with
   * {@link AgentBudgetExceededError} after emitting `agent.error` -
   * graceful finalization (final checkpoint, `agent.end`) is skipped.
   */
  readonly onExceed?: 'stop' | 'throw';
}

/**
 * Per-call options accepted by `agent.stream(...)` / `agent.run(...)`.
 *
 * @stable
 */
export interface AgentCallOptions<TDeps> {
  readonly deps?: TDeps;
  readonly signal?: AbortSignal;
  readonly sessionId?: string;
  readonly userId?: string;
  /**
   * Run-level budget (C5): between-step enforcement against the run's
   * accumulated usage, sub-agents included. See {@link RunBudget}.
   * Not persisted in `RunState`: re-supply it when resuming a
   * suspended run.
   */
  readonly budget?: RunBudget;
  /**
   * C1/C2: fail-closed per-run model pin. When set, every step of this
   * run resolves to exactly this provider: it wins over `prepareStep`
   * provider overrides and the whole preference ladder
   * (`preferredModel` / tool hints / tier map), and the agent-level
   * fallback chain is never consulted. Built for proactive fires -
   * a heartbeat beat or cron fire must not silently escalate to a more
   * expensive model through fallback. Not persisted in `RunState`:
   * re-supply it when resuming a suspended run.
   */
  readonly pinnedProvider?: Provider;
  /**
   * B1.5: stamp message-borne untrusted input into the run's taint
   * ledger at init (see {@link InboundTaintSeed}). No-op when the
   * agent has no `dataFlowPolicy` configured.
   */
  readonly inboundTaint?: InboundTaintSeed;
  /**
   * HITL resume directive. Supplied alongside a `RunState` to
   * resolve any approvals that were pending when the previous
   * `agent.run(...)` call suspended.
   */
  readonly directive?: ResumeDirective;
  /**
   * Per-run capability restriction (D2) - overrides
   * {@link AgentConfig.capability} for this invocation. See that field
   * for semantics. Not persisted in `RunState`: re-supply it when
   * resuming a suspended run.
   */
  readonly capability?: AgentCapability;
  /**
   * W-036: parent span for this run's `agent.run` root span - a
   * multi-agent invocation forms ONE trace tree (the child's run span
   * parents under the caller's step/tool span). The runtime supplies it
   * automatically for handoffs and `toTool` sub-agents. Like
   * `capability`, it is NOT persisted in `RunState`: re-supply on
   * resume when stitching matters.
   */
  readonly parentSpan?: AISpan;
}

/**
 * Run-level capability restriction (D2 - the single-writer constraint
 * from multi-agent practice). `'read-only'` makes the run
 * side-effect-free by construction: writer tools (`side-effecting` /
 * `external-stateful`) and handoffs are never advertised to the model,
 * and the tool executor deterministically blocks any writer call the
 * model fabricates anyway (`capability_blocked`). Use it to run
 * parallel research / explorer sub-agents while exactly one agent in
 * the topology keeps write capability.
 *
 * @stable
 */
export type AgentCapability = 'read-only';

/**
 * `agent.toTool({...})` options.
 *
 * @stable
 */
export interface AgentToToolOptions {
  readonly name?: string;
  readonly description?: string;
  readonly exposeTurns?: 'final' | 'all' | 'none';
  /**
   * Shapes the sub-agent seed from the parent history (AG-17): when
   * supplied, the sub-agent is seeded with
   * `[...inputFilter(parentMessages), { role: 'user', content: input }]`.
   * Without a filter the sub-agent sees ONLY the input string - no
   * parent conversation crosses the boundary (least authority by
   * construction; there is no secret-inheritance mechanism at this
   * boundary at all).
   */
  readonly inputFilter?: HandoffFilter;
  /** W-036: which child events forward into the parent stream. */
  readonly forwardEvents?: SubagentForwardPolicy;
  /**
   * Run the sub-agent under a restricted capability (D2): a
   * `'read-only'` worker cannot execute or advertise writer tools. The
   * orchestrator-worker recipe is `parent (full capability) + workers
   * via toTool({ capability: 'read-only', contextFold: true })`.
   */
  readonly capability?: AgentCapability;
  /**
   * Context folding at the sub-agent boundary (D2): instead of the raw
   * final output, the parent receives a compact distilled outcome -
   * status, step/tool-call counts, tools used, and the final text
   * clamped to `maxChars` (default 2000). Keeps tool-heavy child runs
   * from flooding the parent window. Default off (raw output).
   */
  readonly contextFold?: boolean | { readonly maxChars?: number };
  /**
   * Propagate the child run's coarse taint flags across the fold (D2,
   * default `true`): when the child saw untrusted / sensitive content,
   * the tool result carries a widen-only `taint` override
   * (`sourceKind: 'sub-agent'`) that re-arms the PARENT's data-flow
   * ledger. A no-op when the parent has no `dataFlowPolicy`. Set
   * `false` only for children whose inputs are fully trusted.
   */
  readonly propagateTaint?: boolean;
}

/**
 * Cancellation options accepted by `agent.abort({...})`.
 *
 * @stable
 */
export interface AbortOptions {
  /**
   * When `true`, let the in-flight provider stream finish (the current step
   * reaches its boundary) instead of interrupting it mid-event, then stop at the
   * next step. Default `false` hard-kills the in-flight stream immediately. (The
   * step's tool calls still observe the cancellation once the signal is set.)
   */
  readonly drain?: boolean;
  /**
   * What to do with approvals that were already requested but not
   * resolved at abort time (W-038).
   *
   * - `'deny'` (default) - auto-deny pending approvals; each drained
   *   toolCallId gets a matching tool message so the transcript keeps
   *   no dangling `tool_use`, and the run ends `'aborted'`.
   * - `'hold'` - keep the approvals on `RunState.pendingApprovals` of
   *   the `'aborted'` state; such a state re-enters the loop only via
   *   an explicit resume directive.
   * - `'fail'` - reject the run with `RunError(code: 'run-aborted')`
   *   ONLY when approvals are actually pending; an abort with an empty
   *   queue ends `'aborted'`, never `'failed'`.
   */
  readonly onPendingApprovals?: 'deny' | 'hold' | 'fail';
}

/**
 * `agent.compact({...})` options.
 *
 * @stable
 */
export interface CompactOptions {
  readonly source?: 'manual' | 'pre-step';
  readonly preserveRecentTurns?: number;
}

/**
 * Result of `agent.compact({...})`.
 *
 * @stable
 */
export interface CompactionApiResult {
  readonly beforeTokens: number;
  readonly afterTokens: number;
  readonly summaryTokens: number;
  readonly durationMs: number;
  readonly hooksFiredCount: number;
  readonly summary: string;
  /**
   * `true` when the compaction trimmed + spliced the live run buffer
   * (CE-3/AG-13). `false` results carry an explicit
   * {@link skippedReason} instead of silently reporting zeros.
   */
  readonly applied: boolean;
  /** Why nothing was spliced, when {@link applied} is `false`. */
  readonly skippedReason?: 'no-memory' | 'no-active-run' | 'nothing-to-trim' | 'sensitivity-gated';
}

/**
 * Per-call shape accepted by `Agent.fanOut(...)`. Mirrors the
 * pure-function {@link FanOutOptions} but omits the runtime-supplied
 * identifiers - the `Agent` instance carries those.
 *
 * @stable
 */
export interface AgentFanOutOptions<TOutput = unknown> {
  readonly children: FanOutOptions<TOutput>['children'];
  readonly maxConcurrentChildren?: number;
  readonly perBudget?: PerChildBudget;
  readonly mergeStrategy?: MergeStrategy<TOutput>;
  readonly signal?: AbortSignal;
}

/**
 * Progress IO surface exposed on the `Agent` instance. The methods
 * default the `runId` cursor to the in-flight run when present, so
 * callers can use them inside an `agent.run(...)` boundary without
 * repeating the cursor.
 *
 * @stable
 */
export interface AgentProgressIO {
  write(content: string, options?: ProgressWriteOptions): Promise<ProgressArtifactRef>;
  read(options?: ProgressReadOptions): Promise<ReadonlyArray<ProgressArtifactRef>>;
}

/**
 * Public agent surface returned by {@link createAgent}.
 *
 * @stable
 */
export interface Agent<TDeps = unknown, TOutput = string> {
  readonly id: string;
  readonly config: AgentConfig<TDeps, TOutput>;
  stream(
    input: AgentInput | RunState,
    options?: AgentCallOptions<TDeps>,
  ): AsyncIterable<AgentEvent<TOutput>>;
  run(
    input: AgentInput | RunState,
    options?: AgentCallOptions<TDeps>,
  ): Promise<AgentResult<TOutput>>;
  steer(message: AgentInput): void;
  followUp(message: AgentInput): void;
  abort(options?: AbortOptions): void;
  /**
   * C1: `true` while this instance has a run in flight (the same
   * invariant that makes a second `run()` throw `ConcurrentRunError`).
   * The public busy signal for proactive coordination - a heartbeat
   * defers its beat instead of colliding with an interactive run.
   */
  isBusy(): boolean;
  toTool(options?: AgentToToolOptions): Tool<{ readonly input: string }, TOutput, TDeps>;
  compact(options?: CompactOptions): Promise<CompactionApiResult>;
  /**
   * Convenience wrapper around the standalone `runFanOut(...)`. The
   * returned `FanOutResult` carries per-child status + the merged
   * output. Per-child failures are captured in `children[].status`
   * - this method never throws on a child failure (the merge
   * strategy decides whether to propagate).
   */
  fanOut<TFanOutOutput = unknown>(
    options: AgentFanOutOptions<TFanOutOutput>,
  ): Promise<FanOutResult<TFanOutOutput>>;
  /**
   * Structured handoff-artifact APIs. Persists / reads UTF-8 text
   * artifacts under the configured artifact root; cross-run reads
   * require an explicit `runId` cursor on the read options.
   */
  readonly progress: AgentProgressIO;
  /**
   * The unified tool registry assembled at `createAgent(...)` warm-up
   * (Principle #12): every first-party + skill tool, with cross-source
   * name collisions resolved deterministically. Read-only and exposed
   * for inspection; the run loop and `tool_search` consume it. Always
   * present on agents built by `createAgent(...)`.
   */
  readonly registry?: ToolRegistry;
}

export type {
  ChildResult,
  FanOutOptions,
  FanOutResult,
  MergeStrategy,
  PerChildBudget,
} from './fanout/index.js';
export type { ProgressIO, ProgressReadOptions, ProgressWriteOptions } from './progress/index.js';
