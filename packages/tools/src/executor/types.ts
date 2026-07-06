/**
 * Executor contract types - the public option / guard surfaces accepted
 * by `createToolExecutor(...)`, plus the internal {@link ExecutorRuntime}
 * dependency bundle threaded through the `phase-*` modules. Every public
 * name here is re-exported from `./executor.js`, so the original import
 * paths keep working.
 *
 * @packageDocumentation
 */

import type {
  CompletedToolCall,
  ResolvedTool,
  RunContext,
  Sandbox,
  Sensitivity,
  SideEffectClass,
  ToolApproval,
  ToolCall,
  ToolErrorKind,
  ToolExecuteEndEvent,
  ToolExecuteErrorEvent,
  ToolExecuteStartEvent,
  ToolSource,
  ToolTrustClass,
} from '@graphorin/core';
import type { ImperativePattern } from '@graphorin/observability/redaction';
import type { MemoryModificationGuard, MemoryRegionReader } from '@graphorin/security/guard';
import type { ResolvedSandboxPolicy, SandboxTrustLevel } from '@graphorin/security/sandbox';

import type { ToolAuditEvent } from '../audit/index.js';
import type { ToolRegistry } from '../registry/registry.js';
import type { ResultSummarizer, SpillWriter, TokenCounter } from '../result/truncate.js';
import type { StreamingEvent } from '../streaming/channel.js';
import type { SecretResolverHook } from './tool-context.js';

/** Union of `tool.execute.*` events the executor forwards through `streamingSink`. */
export type ExecutorEvent =
  | ToolExecuteStartEvent
  | ToolExecuteEndEvent
  | ToolExecuteErrorEvent
  | StreamingEvent;

/** Optional repair hook for invalid LLM-generated tool args. */
export interface ToolRepairHook {
  repair(opts: {
    readonly toolName: string;
    readonly invalidArgs: unknown;
    readonly schemaError: unknown;
    readonly signal: AbortSignal;
  }): Promise<unknown | null>;
}

/** Options accepted by `createToolExecutor(...)`. */
export interface ExecutorOptions {
  readonly registry: ToolRegistry;
  /** Cap on parallel tool calls per batch. Defaults to `8`. */
  readonly maxParallelTools?: number;
  /** Audit emitter override. Defaults to the global registry. */
  readonly emitAudit?: (event: ToolAuditEvent) => void;
  /** Approval gate - invoked when a tool's `needsApproval` resolves to `true`. */
  readonly approvalGate?: ApprovalGate;
  /**
   * Declarative tool-argument policy guard (D4 / Progent). Consulted
   * AFTER schema validation + approval, BEFORE the data-flow sink gate,
   * on every tool call. A `forbid` verdict blocks the call with a
   * `capability_blocked` outcome. The pure decision engine lives in
   * `@graphorin/security/policy` (`evaluateToolArgumentPolicy`); the
   * agent runtime injects this adapter. Absent ⇒ no policy (legacy).
   */
  readonly argumentPolicy?: ToolArgumentPolicyGuard;
  /** Tool repair hook (single-round). */
  readonly repair?: ToolRepairHook;
  /** Per-provider token counter used by the truncation pipeline. */
  readonly tokenCounter?: TokenCounter;
  /** Optional summarizer for the `'summarize'` truncation strategy. */
  readonly summarizer?: ResultSummarizer;
  /** Optional spill writer for the `'spill-to-file'` truncation strategy. */
  readonly spill?: SpillWriter;
  /** Secrets resolver injected from the agent runtime. */
  readonly secretResolver?: SecretResolverHook;
  /**
   * Hard-kill grace window (ms) for tools that ignore `ctx.signal`.
   * Default `50`.
   */
  readonly cancellationGraceMs?: number;
  /**
   * W-114: cap on the in-memory handle-producer-taint map (TL-6). The
   * map previously grew for the executor's whole lifetime; at the cap
   * the OLDEST entry is evicted FIFO - safe, because the on-disk taint
   * sidecar restores producer taint for evicted handles (the tools-03
   * fallback). Default 1024.
   */
  readonly handleProducerTaintCap?: number;
  /** Pluggable imperative patterns override. */
  readonly imperativePatterns?: ReadonlyArray<ImperativePattern>;
  /**
   * Override for the imperative-pattern scan budget (ms). The
   * scanner returns `null` (= timed out, strip-pass skipped) when
   * it exceeds this budget; the production default of `5` ms is
   * sufficient on hot paths but can flake on cold-start CI runners
   * where V8 JIT warm-up + shared-CPU jitter routinely pushes the
   * first scan above 5 ms. Tests that need deterministic strip
   * behaviour on noisy runners can raise this to e.g. `250` ms.
   * Defaults to `5` ms (production-safe).
   */
  readonly imperativeBudgetMs?: number;
  /**
   * Sink for tool execution events; the agent runtime forwards these
   * into `agent.stream(...)`. Receives every `tool.execute.*` variant
   * emitted by the executor (start, progress, partial, end, error).
   */
  readonly streamingSink?: (event: ExecutorEvent) => void;
  /** Default streaming queue depth. Default `256`. */
  readonly streamingEventQueueDepth?: number;
  /**
   * Optional sandbox-dispatch resolver. Returns the {@link Sandbox}
   * implementation to use for a given resolved policy, OR `null` to
   * run the tool inline (the default for `kind: 'none'` policies).
   * Skill loaders / agent runtimes inject this when sandbox-bundled
   * code (skills, MCP-derived tools) needs out-of-process execution.
   */
  readonly sandboxResolver?: (policy: ResolvedSandboxPolicy) => Sandbox | null;
  /**
   * Optional memory-modification guard factory. Returns a
   * {@link MemoryModificationGuard} per the tool's
   * `memoryGuardTier`. The agent runtime supplies the implementation
   * (`createGuard(...)` from `@graphorin/security/guard`); when
   * absent, the guard step is skipped (audit-only baseline).
   */
  readonly memoryGuardFactory?: (
    tier: NonNullable<ResolvedTool['memoryGuardTier']>,
  ) => MemoryModificationGuard | null;
  /**
   * Optional memory-region reader the guard uses to hash the
   * pre/post snapshots. The agent runtime supplies one automatically
   * when `memory` is wired (a scope-aware reader over the working
   * tier, SDF-1); without a reader the snapshot/verify cycle is
   * skipped.
   */
  readonly memoryRegionReader?: MemoryRegionReader;
  /**
   * Optional provenance / data-flow guard (P1-3). When present, the
   * executor consults it as a *sink gate* before running any
   * `side-effecting` / `external-stateful` tool (so untrusted content
   * cannot reach an exfiltration/mutation sink ungated) and *records* the
   * provenance of every successful output for downstream sink checks. The
   * agent runtime supplies the implementation (`@graphorin/security`'s
   * taint engine threaded through a per-run ledger); when absent, both
   * steps are skipped (zero overhead, feature off). Because every
   * in-script code-mode tool call also flows through `executeOne`, the
   * same guard composes with code-mode automatically (P1-2).
   */
  readonly dataFlowGuard?: DataFlowGuard;
  /**
   * Wall-clock limit applied to INLINE tool execution (TL-4). When set,
   * this executor-level value takes precedence; otherwise the resolved
   * per-tool sandbox-tier `timeoutMs` applies when > 0, else
   * {@link DEFAULT_INLINE_TOOL_TIMEOUT_MS} (60s). Expiry fails the call
   * with `ToolError({ kind: 'timeout' })`; the run continues.
   */
  readonly inlineToolTimeoutMs?: number;
  /**
   * C3: transparent bounded retry for transient tool failures. A failed
   * attempt whose error kind is in `kinds` is silently re-executed with
   * exponential backoff (a ToolRateLimitError's `retryAfterMs` wins over
   * the computed backoff) up to `maxAttempts` TOTAL attempts - but only
   * for `pure` / `read-only` tools or tools declaring an
   * `idempotencyKey`, so a retry can never double a side effect.
   *
   * Defaults: `maxAttempts: 3`, `backoffMs: 250`, `kinds: ['rate_limited']`
   * ('timeout' is deliberately not retried by default - stacked wall-clock
   * timeouts multiply run latency; opt in via `kinds` when you want it).
   */
  readonly retry?: {
    readonly maxAttempts?: number;
    readonly backoffMs?: number;
    readonly kinds?: ReadonlyArray<ToolErrorKind>;
  };
}

/**
 * Provenance / data-flow guard the executor consults at the tool
 * boundary. Decisions and per-run taint state live in the
 * implementation; the executor only enforces the {@link DataFlowVerdict}
 * and audits it. See `@graphorin/security/dataflow`.
 */
export interface DataFlowGuard {
  /**
   * Sink gate: decide whether a `side-effecting` / `external-stateful`
   * tool may run given what untrusted/sensitive content has entered the
   * run. Called only for sinks. Pure w.r.t. the executor (no I/O); the
   * executor emits the audit row and enforces a `'block'`.
   */
  inspect(input: DataFlowInspectInput): DataFlowVerdict;
  /**
   * Record one successful output's provenance so later sink gates can
   * detect untrusted-to-sink flows. Called for every successful result.
   */
  record(input: DataFlowRecordInput): void;
}

/** Input to {@link DataFlowGuard.inspect}. */
export interface DataFlowInspectInput {
  readonly toolName: string;
  readonly sideEffectClass: SideEffectClass;
  readonly trustClass: ToolTrustClass;
  readonly sensitivity?: Sensitivity;
  readonly source?: ToolSource;
  /**
   * Raw-shaped POST-REPAIR arguments (stringified by the guard for
   * probing): what the approval gate saw and what the validate phase
   * derives the executed input from (W-118). Bytes-equal to the
   * model's `call.args` when no repair hook ran. Residual limitation:
   * probed before schema coercion, so spans introduced purely by Zod
   * `transform`/`default` are not visible to the verbatim probe.
   */
  readonly args: unknown;
  readonly runContext: RunContext;
}

/** Input to {@link DataFlowGuard.record}. */
export interface DataFlowRecordInput {
  readonly toolName: string;
  readonly trustClass: ToolTrustClass;
  /**
   * C6: per-result taint override from the tool's ToolReturn envelope.
   * Flags only ever WIDEN the derived label (guards must never let an
   * override downgrade an untrusted tool's output).
   */
  readonly taintOverride?: {
    readonly untrusted?: boolean;
    readonly sensitive?: boolean;
    readonly sourceKind?: string;
  };
  readonly sensitivity?: Sensitivity;
  readonly source?: ToolSource;
  /** The (sanitized) output text the model will see. */
  readonly outputText: string;
  readonly runContext: RunContext;
}

/**
 * Verdict returned by {@link DataFlowGuard.inspect}. Mirrors
 * `@graphorin/security`'s `DataFlowDecision`; the agent maps one to the
 * other so the executor takes no security dependency.
 *
 * - `'allow'`      - proceed silently.
 * - `'flag'`       - shadow-mode detection: audit, then proceed.
 * - `'declassify'` - operator-authorized tainted flow: audit, then proceed.
 * - `'block'`      - enforce-mode block: surface `dataflow_policy_blocked`.
 */
export type DataFlowVerdict =
  | { readonly action: 'allow' }
  | {
      readonly action: 'flag' | 'declassify' | 'block';
      readonly flow: string;
      readonly reason: string;
      readonly sourceKinds: ReadonlyArray<string>;
    };

/** Approval gate the executor consults before executing a gated tool. */
export interface ApprovalGate {
  /**
   * Request approval for the tool call. Returns `{ granted: true }` to
   * proceed, `{ granted: false, reason? }` to deny.
   */
  request(call: ToolCall, approval: ToolApproval): Promise<ApprovalDecision>;
}

/** Approval gate decision. */
export type ApprovalDecision =
  | { readonly granted: true }
  | { readonly granted: false; readonly reason?: string };

/** Per-batch options accepted by `executor.executeBatch(...)`. */
export interface ExecuteBatchOptions {
  readonly calls: ReadonlyArray<ToolCall>;
  readonly runContext: RunContext;
  readonly stepNumber: number;
  /** Trust level for the per-tool sandbox resolution. Default `'user-defined'`. */
  readonly trustLevel?: SandboxTrustLevel;
  /**
   * Disable the single-round repair hook for this batch (tools-02).
   * Used for PRE-APPROVED calls replayed on a durable-HITL resume: a
   * human granted exactly these args, so a repair rewrite must fail as
   * `invalid_input` rather than execute a payload nobody saw.
   */
  readonly disableRepair?: boolean;
  /**
   * Run-level capability restriction (D2 - single-writer constraint).
   * `'read-only'` deterministically blocks every `side-effecting` /
   * `external-stateful` tool with a `capability_blocked` outcome, no
   * matter what the model asked for - the enforcement half of the
   * agent-side advertise filter. Absent ⇒ all capabilities (legacy).
   */
  readonly capability?: 'read-only';
}

/**
 * Structural adapter for the D4 tool-argument policy (Progent). The
 * agent runtime wires `evaluateToolArgumentPolicy` from
 * `@graphorin/security/policy`; `@graphorin/tools` stays dependency-free
 * on security.
 *
 * @stable
 */
export interface ToolArgumentPolicyGuard {
  evaluate(input: {
    readonly toolName: string;
    readonly sideEffectClass: SideEffectClass;
    readonly sensitive: boolean;
    /**
     * Trust class of the tool under evaluation (W-101) - lets guards
     * enforce trust-taxonomy rules (Rule-of-Two `untrustedInput`).
     */
    readonly trustClass: ToolTrustClass;
    readonly args: unknown;
  }): { readonly effect: 'allow' } | { readonly effect: 'forbid'; readonly reason: string };
}

/** Public executor surface. */
export interface ToolExecutor {
  /** Run a batch of tool calls. */
  executeBatch(opts: ExecuteBatchOptions): Promise<ReadonlyArray<CompletedToolCall>>;
  /** Run a single tool call. */
  executeOne(opts: {
    readonly call: ToolCall;
    readonly runContext: RunContext;
    readonly stepNumber: number;
    readonly trustLevel?: SandboxTrustLevel;
    /** See {@link ExecuteBatchOptions.disableRepair}. */
    readonly disableRepair?: boolean;
    /** See {@link ExecuteBatchOptions.capability}. */
    readonly capability?: 'read-only';
  }): Promise<CompletedToolCall>;
}

/**
 * Default wall-clock limit for INLINE tool execution (TL-4). Sandbox
 * tiers carry their own per-tier defaults; inline closures previously
 * had none - a hanging tool that ignored `ctx.signal` blocked the run
 * indefinitely.
 *
 * @stable
 */
export const DEFAULT_INLINE_TOOL_TIMEOUT_MS = 60_000;

/**
 * TL-6: trust class of the tool that PRODUCED a spill artifact, keyed
 * by handle URI in {@link ExecutorRuntime.handleProducerTaint}. Handle
 * reads (read_result) re-apply inbound sanitization + dataflow
 * provenance by the PRODUCER's class so an untrusted body cannot
 * launder to trusted through the built-in reader.
 */
export interface HandleProducerTaint {
  readonly trustClass: ToolTrustClass;
  readonly source: ToolSource;
  readonly sensitivity?: Sensitivity;
}

/**
 * Internal dependency bundle built once per `createToolExecutor(...)`
 * call and threaded (by reference) through every `phase-*` function.
 * Carries the caller's raw {@link ExecutorOptions} plus the resolved
 * defaults and the executor-scoped mutable state.
 */
export interface ExecutorRuntime {
  /** The caller-supplied options, unmodified. */
  readonly options: ExecutorOptions;
  /** Resolved audit emitter (defaults to the global registry). */
  readonly emit: (event: ToolAuditEvent) => void;
  /** Resolved parallel-call cap. Default `8`. */
  readonly maxParallelTools: number;
  /** Resolved hard-kill grace window (ms). Default `50`. */
  readonly cancellationGraceMs: number;
  /** Resolved streaming queue depth. Default `256`. */
  readonly streamingEventQueueDepth: number;
  /** Resolved sandbox-dispatch resolver (defaults to inline-only). */
  readonly sandboxResolver: (policy: ResolvedSandboxPolicy) => Sandbox | null;
  /** Resolved memory-guard factory (defaults to no guard). */
  readonly memoryGuardFactory: (
    tier: NonNullable<ResolvedTool['memoryGuardTier']>,
  ) => MemoryModificationGuard | null;
  /** Optional memory-region reader for the guard snapshot/verify cycle. */
  readonly memoryRegionReader: MemoryRegionReader | undefined;
  /** Resolved spill writer for the `'spill-to-file'` truncation strategy. */
  readonly spillWriter: SpillWriter;
  /**
   * TL-6: trust class of the tool that PRODUCED each spill artifact,
   * keyed by handle URI. In-memory per executor - handles from another
   * executor or a resumed prior process fall back to the reader-reported
   * class, which the default file reader recovers from the artifact's
   * taint sidecar (tools-03), so the taint survives both boundaries.
   */
  readonly handleProducerTaint: Map<string, HandleProducerTaint>;
}
