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
  CheckpointStore,
  HandoffFilter,
  Message,
  ModelHint,
  ModelSpec,
  ProgressArtifactRef,
  Provider,
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
import type { ToolRegistry } from '@graphorin/tools/registry';
import type { ResultReader } from '@graphorin/tools/result';
import type { AgentFallbackPolicy } from './fallback/index.js';
import type { FanOutResult, MergeStrategy, PerChildBudget } from './fanout/index.js';
import type { CausalityMonitorConfig } from './lateral-leak/causality-monitor.js';
import type { MergeGuardConfig } from './lateral-leak/merge-guard.js';
import type { ProtocolGuardConfig } from './lateral-leak/protocol-guard.js';
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
   * the run with `output-validation-failed` — never a silent cast.
   */
  readonly schema?: { parse(value: unknown): TOutput };
  /** Optional description shown to the model alongside the schema. */
  readonly description?: string;
  /**
   * Wire-format JSON Schema advertised to the model: forwarded on
   * `ProviderRequest.outputType` for adapters with native structured
   * output, and embedded in the fallback JSON instruction appended as
   * a trailing system message (the documented contract until adapters
   * consume `outputType` natively — PS-24).
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
  readonly tools?: ReadonlyArray<Tool<unknown, unknown, TDeps>>;
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
export type HandoffEntry<TDeps = unknown> =
  | Agent<TDeps, unknown>
  | {
      readonly target: Agent<TDeps, unknown>;
      readonly inputFilter?: HandoffFilter;
    };

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
  readonly tools?: ReadonlyArray<Tool<unknown, unknown, TDeps>>;
  readonly skills?: SkillsRegistryLike;
  readonly memory?: Memory;
  /**
   * Opt in to building the per-run system prompt from the memory
   * {@link ContextEngine} (CE-1). When `true` **and** `memory` is wired, the
   * runtime calls `memory.contextEngine.assemble(...)` once at run start: the
   * agent's `instructions` become Layer 2 and the engine prepends the memory
   * base and appends working blocks, procedural rules, skill cards, the
   * metadata counts, and — when `factsAutoRecall` is configured — auto-recalled
   * facts. Defaults `false`: the prompt is built from `instructions` alone and
   * the model reaches memory only through the memory tools it calls (the
   * documented explicit pattern). Has no effect without `memory`.
   */
  readonly autoAssembleContext?: boolean;
  readonly handoffs?: ReadonlyArray<HandoffEntry<TDeps>>;
  readonly outputType?: OutputSpec<TOutput>;
  /**
   * Deterministic checks run by the loop (AG-2; canonical contract is
   * `@graphorin/security`'s `GuardrailDefinition` — SDF-4).
   *
   * - `input` guardrails run over each **fresh-run seed user message**
   *   (string content) before the first provider call. `'block'` fails
   *   the run (`guardrail-blocked`) without reaching the model;
   *   `'rewrite'` replaces the message content (mirrored into the
   *   persisted `RunState`); `'warn'` logs and continues.
   * - `output` guardrails run over the **final output** on the
   *   completed path before `agent.end`. `'block'` fails the run;
   *   `'rewrite'` replaces `result.output` (text deltas were already
   *   streamed — the rewrite governs the durable result, not the
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
   * - `'direct'` (default) — the model emits one provider tool-call per
   *   tool, each result inlined into the conversation.
   * - `'code-mode'` — the agent advertises only the `code_execute` /
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
  readonly mergeGuard?: MergeGuardConfig;
  readonly protocolGuard?: ProtocolGuardConfig;
  /**
   * Provenance / taint-based data-flow policy (P1-3, opt-in). Enforces
   * data-flow rules at the tool-execution boundary using the provenance
   * Graphorin already tracks (trust class + source + sensitivity), to
   * defuse the lethal trifecta: a sink (`side-effecting` /
   * `external-stateful` tool) is blocked when untrusted content flows
   * into it verbatim, or — conservatively — when it fires while both
   * untrusted content and secret-tier data are present in the run.
   *
   * - `mode: 'shadow'`  — audit-only; tainted flows are flagged
   *   (`tool:dataflow:flagged` audit + counter) but never blocked. Ship
   *   this first to surface false positives.
   * - `mode: 'enforce'` — tainted flows are blocked (the sink does not
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
  readonly tracer?: Tracer;
  readonly checkpointStore?: CheckpointStore;
  readonly sensitivity?: Sensitivity;
  readonly sessionId?: string;
  readonly userId?: string;
  readonly deps?: TDeps;
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
   * HITL resume directive. Supplied alongside a `RunState` to
   * resolve any approvals that were pending when the previous
   * `agent.run(...)` call suspended.
   */
  readonly directive?: ResumeDirective;
}

/**
 * `agent.toTool({...})` options.
 *
 * @stable
 */
export interface AgentToToolOptions {
  readonly name?: string;
  readonly description?: string;
  readonly exposeTurns?: 'final' | 'all' | 'none';
  readonly secretsInheritance?: 'inherit-allowlist' | 'isolated' | 'forward-explicit';
  readonly inheritSecrets?: ReadonlyArray<string>;
  readonly inputFilter?: HandoffFilter;
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
   * resolved at abort time.
   *
   * - `'deny'` (default) — auto-deny pending approvals.
   * - `'hold'`            — keep the approvals on `RunState.pendingApprovals`.
   * - `'fail'`            — reject the run with `RunError(code: 'run-aborted')`.
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
}

/**
 * Per-call shape accepted by `Agent.fanOut(...)`. Mirrors the
 * pure-function {@link FanOutOptions} but omits the runtime-supplied
 * identifiers — the `Agent` instance carries those.
 *
 * @stable
 */
export interface AgentFanOutOptions<TOutput = unknown> {
  readonly children: ReadonlyArray<{
    readonly agentId: string;
    readonly invoke: () => Promise<TOutput>;
  }>;
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
  toTool(options?: AgentToToolOptions): Tool<{ readonly input: string }, TOutput, TDeps>;
  compact(options?: CompactOptions): Promise<CompactionApiResult>;
  /**
   * Convenience wrapper around the standalone `runFanOut(...)`. The
   * returned `FanOutResult` carries per-child status + the merged
   * output. Per-child failures are captured in `children[].status`
   * — this method never throws on a child failure (the merge
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
