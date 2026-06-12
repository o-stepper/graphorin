/**
 * `createToolExecutor(...)` — runs `Tool[]` invocations.
 *
 * Responsibilities, per the working-plan deliverables:
 *
 *  - Parallel-by-default dispatch via `Promise.allSettled`; tools tagged
 *    `executionMode: 'sequential'` are serialised inside the batch.
 *  - Approval flow: `needsApproval(input, ctx)` → suspend the run and
 *    emit `tool.approval.requested`; the caller resumes with a
 *    grant / deny decision.
 *  - Per-tool secrets ACL via {@link withSecretsScope}.
 *  - Sandbox enforcement via `@graphorin/security`'s
 *    `resolveSandbox(...)` policy resolver.
 *  - Cancellation: linked `AbortSignal`; 50 ms grace window before
 *    surfacing `ToolError({ kind: 'aborted' })`.
 *  - Single-round tool repair on input-schema failure.
 *  - Streaming-tool surface via the per-call {@link StreamingChannel}.
 *  - Truncation pipeline + inbound sanitization on the assembled body.
 *  - Per-execution `tool.execute` AISpan with rich attributes.
 *
 * @packageDocumentation
 */

import type {
  AISpan,
  CompletedToolCall,
  ResolvedTool,
  RunContext,
  Sandbox,
  Sensitivity,
  SideEffectClass,
  ToolApproval,
  ToolCall,
  ToolError,
  ToolErrorKind,
  ToolExecuteEndEvent,
  ToolExecuteErrorEvent,
  ToolExecuteStartEvent,
  ToolOutcome,
  ToolResult,
  ToolSource,
  ToolTrustClass,
  ZodLikeSchema,
} from '@graphorin/core';
import type { ImperativePattern } from '@graphorin/observability/redaction';
import type { MemoryModificationGuard, MemoryRegionReader } from '@graphorin/security/guard';
import type { ResolvedSandboxPolicy } from '@graphorin/security/sandbox';
import { resolveSandbox, type SandboxTrustLevel } from '@graphorin/security/sandbox';

import {
  emitToolAudit,
  incrementCounter,
  observeHistogram,
  type ToolAuditEvent,
} from '../audit/index.js';
import { defaultInboundSanitization } from '../builder/trust-class.js';
import { applyInboundSanitization } from '../inbound/sanitize.js';
import type { ToolRegistry } from '../registry/registry.js';
import { splitTextAndContentParts, toResultEnvelope } from '../result/envelope.js';
import { createDefaultSpillWriter } from '../result/spill.js';
import {
  type ResultSummarizer,
  type SpillWriter,
  type TokenCounter,
  truncateBody,
} from '../result/truncate.js';
import { createStreamingChannel, type StreamingEvent } from '../streaming/channel.js';
import {
  buildToolExecutionContext,
  type SecretResolverHook,
  withSecretsScope,
} from './tool-context.js';

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

/** Options accepted by {@link createToolExecutor}. */
export interface ExecutorOptions {
  readonly registry: ToolRegistry;
  /** Cap on parallel tool calls per batch. Defaults to `8`. */
  readonly maxParallelTools?: number;
  /** Audit emitter override. Defaults to the global registry. */
  readonly emitAudit?: (event: ToolAuditEvent) => void;
  /** Approval gate — invoked when a tool's `needsApproval` resolves to `true`. */
  readonly approvalGate?: ApprovalGate;
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
   * Wall-clock limit applied to INLINE tool execution (TL-4) — the
   * per-tool sandbox-tier `timeoutMs` wins when resolved > 0. Expiry
   * fails the call with `ToolError({ kind: 'timeout' })`; the run
   * continues. Default {@link DEFAULT_INLINE_TOOL_TIMEOUT_MS} (60s).
   */
  readonly inlineToolTimeoutMs?: number;
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
  /** The raw tool-call arguments (stringified by the guard for probing). */
  readonly args: unknown;
  readonly runContext: RunContext;
}

/** Input to {@link DataFlowGuard.record}. */
export interface DataFlowRecordInput {
  readonly toolName: string;
  readonly trustClass: ToolTrustClass;
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
 * - `'allow'`      — proceed silently.
 * - `'flag'`       — shadow-mode detection: audit, then proceed.
 * - `'declassify'` — operator-authorized tainted flow: audit, then proceed.
 * - `'block'`      — enforce-mode block: surface `dataflow_policy_blocked`.
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
  }): Promise<CompletedToolCall>;
}

/**
 * Build a {@link ToolExecutor} bound to a registry.
 *
 * @stable
 */
/**
 * Default wall-clock limit for INLINE tool execution (TL-4). Sandbox
 * tiers carry their own per-tier defaults; inline closures previously
 * had none — a hanging tool that ignored `ctx.signal` blocked the run
 * indefinitely.
 *
 * @stable
 */
export const DEFAULT_INLINE_TOOL_TIMEOUT_MS = 60_000;

/** TL-4: sentinel for the inline wall-clock expiry (maps to kind 'timeout'). */
class InlineToolTimeoutError extends Error {
  constructor(readonly limitMs: number) {
    super(`Tool execution exceeded the ${limitMs}ms wall-clock timeout.`);
    this.name = 'InlineToolTimeoutError';
  }
}

/** TL-6: trust classes whose content must not launder through handle reads. */
function isUntrustedProducerClass(trustClass: ToolTrustClass): boolean {
  return defaultInboundSanitization(trustClass) === 'detect-and-strip-and-wrap';
}

export function createToolExecutor(opts: ExecutorOptions): ToolExecutor {
  const maxParallelTools = opts.maxParallelTools ?? 8;
  const emit = opts.emitAudit ?? emitToolAudit;
  const cancellationGraceMs = opts.cancellationGraceMs ?? 50;
  const streamingEventQueueDepth = opts.streamingEventQueueDepth ?? 256;
  const sandboxResolver = opts.sandboxResolver ?? (() => null);
  const memoryGuardFactory = opts.memoryGuardFactory ?? (() => null);
  const memoryRegionReader = opts.memoryRegionReader;
  // Default spill writer — writes to `<os.tmpdir()>/graphorin-spill/<runId>/<toolCallId>.<ext>`
  // with `0600` permissions and tier-aware sensitivity inheritance.
  const spillWriter = opts.spill ?? createDefaultSpillWriter();
  // TL-6: trust class of the tool that PRODUCED each spill artifact,
  // keyed by handle URI. Handle reads (read_result) re-apply inbound
  // sanitization + dataflow provenance by the PRODUCER's class so an
  // untrusted body cannot launder to trusted through the built-in
  // reader. In-memory per executor — handles from a resumed prior
  // process fall back to the reader-reported class (or none).
  const handleProducerTaint = new Map<
    string,
    {
      readonly trustClass: ToolTrustClass;
      readonly source: ToolSource;
      readonly sensitivity?: Sensitivity;
    }
  >();

  async function executeBatch(
    batch: ExecuteBatchOptions,
  ): Promise<ReadonlyArray<CompletedToolCall>> {
    const trustLevel = batch.trustLevel ?? 'user-defined';
    const calls = [...batch.calls];
    if (calls.length === 0) return Object.freeze<CompletedToolCall[]>([]);

    // Partition into parallel + sequential.
    const sequentialCalls: ToolCall[] = [];
    const parallelCalls: ToolCall[] = [];
    for (const call of calls) {
      const tool = opts.registry.get(call.toolName);
      if (tool?.executionMode === 'sequential') {
        sequentialCalls.push(call);
      } else {
        parallelCalls.push(call);
      }
    }

    const results: CompletedToolCall[] = new Array(calls.length);
    const indexByCallId = new Map(calls.map((c, i) => [c.toolCallId, i]));

    // Run sequential tools first (deterministic ordering).
    for (const call of sequentialCalls) {
      const completed = await executeOne({
        call,
        runContext: batch.runContext,
        stepNumber: batch.stepNumber,
        trustLevel,
      });
      const idx = indexByCallId.get(call.toolCallId);
      if (idx !== undefined) results[idx] = completed;
    }

    // Parallel tools — concurrency-bounded.
    let inFlight = 0;
    const queue = [...parallelCalls];
    await new Promise<void>((resolve) => {
      const tickle = (): void => {
        while (inFlight < maxParallelTools && queue.length > 0) {
          const call = queue.shift();
          if (call === undefined) break;
          inFlight++;
          void executeOne({
            call,
            runContext: batch.runContext,
            stepNumber: batch.stepNumber,
            trustLevel,
          })
            .then((completed) => {
              const idx = indexByCallId.get(call.toolCallId);
              if (idx !== undefined) results[idx] = completed;
            })
            .catch(() => {
              /* completed handler already records error outcomes */
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

  async function executeOne(opts2: {
    readonly call: ToolCall;
    readonly runContext: RunContext;
    readonly stepNumber: number;
    readonly trustLevel?: SandboxTrustLevel;
  }): Promise<CompletedToolCall> {
    const { call, runContext, stepNumber } = opts2;
    const trustLevel = opts2.trustLevel ?? 'user-defined';
    const tool = opts.registry.get(call.toolName);

    if (tool === undefined) {
      const error: ToolError = {
        toolCallId: call.toolCallId,
        toolName: call.toolName,
        kind: 'unknown_tool',
        message: `Unknown tool: ${call.toolName}`,
      };
      emitErrorAudit(error, runContext, stepNumber);
      return frozenCompleted(call, error, stepNumber);
    }

    // Wrap the entire execution in a `tool.execute` AISpan so the
    // observability layer captures `args`, `result`, `durationMs`, the
    // resolved sandbox kind, the memory-guard tier, the sensitivity
    // tier, the side-effect class, and the streaming hint per the
    // GenAI Semantic Conventions extension.
    return runContext.tracer.span<'tool.execute', CompletedToolCall>(
      {
        type: 'tool.execute',
        attrs: {
          'graphorin.tool.name': tool.name,
          'graphorin.tool.call_id': call.toolCallId,
          'graphorin.tool.side_effect_class': tool.__sideEffectClass,
          'graphorin.tool.streaming_hint': tool.__streamingHint,
          'graphorin.tool.trust_class': tool.__trustClass,
          ...(tool.sensitivity !== undefined
            ? { 'graphorin.tool.sensitivity': tool.sensitivity }
            : {}),
          ...(tool.memoryGuardTier !== undefined
            ? { 'graphorin.tool.memory_guard.tier': tool.memoryGuardTier }
            : {}),
        },
      },
      (span) => executeOneInSpan(call, tool, runContext, stepNumber, trustLevel, span),
    );
  }

  async function executeOneInSpan(
    call: ToolCall,
    tool: ResolvedTool,
    runContext: RunContext,
    stepNumber: number,
    trustLevel: SandboxTrustLevel,
    span: AISpan<'tool.execute'>,
  ): Promise<CompletedToolCall> {
    incrementCounter('tool.executor.invocations.total', { toolName: tool.name });
    if (tool.__streamingHint) {
      incrementCounter('tool.streaming.tools.invoked.total', { toolName: tool.name });
    }

    // Approval flow.
    if (tool.needsApproval !== undefined) {
      // TL-11: a static `needsApproval: true` needs no context at all;
      // the function form gets one that is DISPOSED right after the
      // predicate — previously both forms eagerly built a full per-call
      // context (sandbox resolve + streaming channel + abort listener)
      // that was thrown away while its run-signal listener lived on.
      let needsApproval: boolean;
      if (typeof tool.needsApproval === 'function') {
        const predicateCtx = await prepareContext(call, tool, runContext, stepNumber, trustLevel);
        try {
          needsApproval = await tool.needsApproval(predicateCtx.input, predicateCtx.ctx);
        } finally {
          predicateCtx.channel.abort('finished');
          predicateCtx.linkedAbort.release();
        }
      } else {
        needsApproval = tool.needsApproval;
      }
      if (needsApproval) {
        const approval: ToolApproval = {
          toolCallId: call.toolCallId,
          toolName: tool.name,
          args: call.args,
          requestedAt: new Date().toISOString(),
        };
        emit({
          action: 'tool:approval:requested',
          actor: { kind: 'tool', id: tool.name },
          target: tool.name,
          decision: 'success',
          ts: Date.now(),
          context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
        });
        const decision = (await opts.approvalGate?.request(call, approval)) ?? {
          granted: false,
          reason: 'no-approval-gate-configured',
        };
        if (!decision.granted) {
          emit({
            action: 'tool:approval:denied',
            actor: { kind: 'tool', id: tool.name },
            target: tool.name,
            decision: 'denied',
            ts: Date.now(),
            context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
            ...(decision.reason !== undefined ? { metadata: { reason: decision.reason } } : {}),
          });
          const error: ToolError = {
            toolCallId: call.toolCallId,
            toolName: tool.name,
            kind: 'approval_denied',
            message: `Tool execution denied${decision.reason ? `: ${decision.reason}` : ''}.`,
            ...(decision.reason !== undefined ? { hint: decision.reason } : {}),
          };
          return frozenCompleted(call, error, stepNumber);
        }
        emit({
          action: 'tool:approval:granted',
          actor: { kind: 'tool', id: tool.name },
          target: tool.name,
          decision: 'success',
          ts: Date.now(),
          context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
        });
      }
    }

    // Validate args (with optional single-round repair).
    let validatedInput: unknown;
    {
      const parsed = tool.inputSchema.safeParse(call.args);
      if (parsed.success) {
        validatedInput = parsed.data;
      } else if (opts.repair !== undefined) {
        try {
          const repaired = await opts.repair.repair({
            toolName: tool.name,
            invalidArgs: call.args,
            schemaError: parsed.error,
            signal: runContext.signal,
          });
          if (repaired === null) {
            return failWith(
              call,
              tool,
              'invalid_input',
              parsed.error.message,
              runContext,
              stepNumber,
            );
          }
          const reparsed = tool.inputSchema.safeParse(repaired);
          if (!reparsed.success) {
            return failWith(
              call,
              tool,
              'invalid_input',
              reparsed.error.message,
              runContext,
              stepNumber,
            );
          }
          validatedInput = reparsed.data;
        } catch (cause) {
          return failWith(call, tool, 'invalid_input', describe(cause), runContext, stepNumber);
        }
      } else {
        return failWith(call, tool, 'invalid_input', parsed.error.message, runContext, stepNumber);
      }
    }

    // Data-flow provenance gate (WI-12 / P1-3). Sinks only: untrusted
    // content must not reach an exfiltration / mutation sink without an
    // operator declassification. The guard decides + tracks taint; the
    // executor audits the verdict and blocks the call when told to. Read
    // tools are never gated (they cannot exfiltrate), so the common path
    // pays nothing.
    if (
      opts.dataFlowGuard !== undefined &&
      (tool.__sideEffectClass === 'side-effecting' ||
        tool.__sideEffectClass === 'external-stateful')
    ) {
      const verdict = opts.dataFlowGuard.inspect({
        toolName: tool.name,
        sideEffectClass: tool.__sideEffectClass,
        trustClass: tool.__trustClass,
        ...(tool.sensitivity !== undefined ? { sensitivity: tool.sensitivity } : {}),
        source: tool.__source,
        args: call.args,
        runContext,
      });
      if (verdict.action !== 'allow') {
        const auditAction =
          verdict.action === 'block'
            ? 'tool:dataflow:blocked'
            : verdict.action === 'declassify'
              ? 'tool:dataflow:declassified'
              : 'tool:dataflow:flagged';
        emit({
          action: auditAction,
          actor: { kind: 'tool', id: tool.name },
          target: tool.name,
          decision: verdict.action === 'block' ? 'denied' : 'success',
          ts: Date.now(),
          context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
          metadata: {
            flow: verdict.flow,
            reason: verdict.reason,
            sourceKinds: [...verdict.sourceKinds],
            sideEffectClass: tool.__sideEffectClass,
            decision: verdict.action,
          },
        });
        incrementCounter('tool.dataflow.decision.total', {
          toolName: tool.name,
          decision: verdict.action,
          flow: verdict.flow,
        });
        if (verdict.action === 'block') {
          return failWith(
            call,
            tool,
            'dataflow_policy_blocked',
            verdict.reason,
            runContext,
            stepNumber,
          );
        }
      }
    }

    // Build the per-call context.
    const prepared = await prepareContext(
      call,
      tool,
      runContext,
      stepNumber,
      trustLevel,
      validatedInput,
    );
    const { ctx, channel, linkedAbort } = prepared;

    // Wire the resolved sandbox policy onto the span.
    span.setAttributes({
      'graphorin.tool.sandbox.kind': prepared.sandbox.kind,
      'graphorin.tool.sandbox.forced': prepared.sandbox.forced,
      'graphorin.tool.sandbox.no_network': prepared.sandbox.noNetwork,
      'graphorin.tool.sandbox.no_filesystem': prepared.sandbox.noFilesystem,
    });

    // Memory-modification guard — snapshot before; verify after. The
    // guard factory returns null when the configured tier is `'pure'`
    // / `'side-effecting-no-memory'` / when no factory is configured;
    // we then skip the snapshot/verify dance.
    const guardTier = tool.memoryGuardTier ?? 'unknown';
    const guard = memoryGuardFactory(guardTier);
    let preSnapshot: Awaited<ReturnType<MemoryModificationGuard['snapshot']>> | null = null;
    if (guard !== null && memoryRegionReader !== undefined) {
      try {
        preSnapshot = await guard.snapshot(memoryRegionReader);
      } catch {
        preSnapshot = null;
      }
    }

    // Surface the start event via the runContext / sink hooks.
    emit({
      action: 'tool:execute:start',
      actor: { kind: 'tool', id: tool.name },
      target: tool.name,
      decision: 'success',
      ts: Date.now(),
      context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
      metadata: {
        sandboxKind: prepared.sandbox.kind,
        sideEffectClass: tool.__sideEffectClass,
        memoryGuardTier: guardTier,
      },
    });
    opts.streamingSink?.(toStartEvent(call));
    span.addEvent('tool.execute.start');

    // Optional idempotency-key resolution.
    let idempotencyKey: string | undefined;
    if (tool.idempotencyKey !== undefined) {
      try {
        idempotencyKey = await Promise.resolve(tool.idempotencyKey(validatedInput, ctx));
        incrementCounter('tool.classification.idempotency-key-evaluated.total', {
          toolName: tool.name,
          sideEffectClass: tool.__sideEffectClass,
        });
      } catch {
        idempotencyKey = undefined;
      }
    }

    // Run the tool. If a sandbox dispatcher is configured AND the
    // resolved policy is non-`'none'` AND the dispatcher returns a
    // non-null `Sandbox`, we delegate to its `run(...)` API. Tools
    // declared inline via `tool({...})` cannot be serialised to a
    // worker, so the dispatcher returns `null` for them and the
    // executor falls back to inline execution; the sandbox policy is
    // still surfaced on the span and audit row for operator visibility.
    const execStart = performance.now();
    const sandbox = prepared.sandbox.kind !== 'none' ? sandboxResolver(prepared.sandbox) : null;
    // TL-3: operators alert on declared-but-not-enforced isolation. For
    // kind 'none', in-process IS the policy (enforced by definition);
    // for any other kind, enforcement means a real sandbox dispatcher.
    span.setAttributes({
      'graphorin.tool.sandbox.enforced': prepared.sandbox.kind === 'none' || sandbox !== null,
    });
    let rawResult: unknown;
    let executeError: unknown;
    try {
      if (sandbox !== null) {
        const sandboxOutcome = (await raceWithCancellation(
          () =>
            sandbox.run(
              {
                kind: 'handler',
                module: tool.name,
                export: 'execute',
              },
              {
                input: validatedInput,
                signal: linkedAbort.signal,
                ...(prepared.sandbox.timeoutMs > 0
                  ? { timeoutMs: prepared.sandbox.timeoutMs }
                  : {}),
                ...(prepared.sandbox.maxMemoryMb > 0
                  ? { maxMemoryMb: prepared.sandbox.maxMemoryMb }
                  : {}),
                allowNetwork: !prepared.sandbox.noNetwork,
                allowFs: !prepared.sandbox.noFilesystem,
              },
            ),
          linkedAbort.signal,
          cancellationGraceMs,
        )) as SandboxResultLike;
        if (sandboxOutcome.ok) {
          rawResult = sandboxOutcome.output;
        } else {
          const errInfo = sandboxOutcome.error ?? {
            kind: 'execution-failed',
            message: 'sandbox returned a non-ok result without error metadata',
          };
          executeError = new Error(`[sandbox:${sandbox.id}] ${errInfo.kind}: ${errInfo.message}`);
        }
      } else {
        // TL-4: inline closures get an enforced wall-clock limit — the
        // tier-resolved per-tool timeout when set, else the executor
        // default. A tool that hangs and ignores `ctx.signal` fails with
        // kind 'timeout' instead of blocking the run forever.
        const inlineLimitMs =
          opts.inlineToolTimeoutMs !== undefined
            ? opts.inlineToolTimeoutMs
            : prepared.sandbox.timeoutMs > 0
              ? prepared.sandbox.timeoutMs
              : DEFAULT_INLINE_TOOL_TIMEOUT_MS;
        span.setAttributes({ 'graphorin.tool.inline_timeout_ms': inlineLimitMs });
        let inlineTimer: NodeJS.Timeout | undefined;
        try {
          rawResult = await Promise.race([
            withSecretsScope({
              tool,
              runContext,
              fn: () =>
                raceWithCancellation(
                  () => tool.execute(validatedInput as never, ctx),
                  linkedAbort.signal,
                  cancellationGraceMs,
                ),
            }),
            new Promise<never>((_, reject) => {
              inlineTimer = setTimeout(
                () => reject(new InlineToolTimeoutError(inlineLimitMs)),
                inlineLimitMs,
              );
            }),
          ]);
        } finally {
          if (inlineTimer !== undefined) clearTimeout(inlineTimer);
        }
      }
    } catch (caught) {
      executeError = caught;
    } finally {
      channel.abort('finished');
      // TL-11: detach the per-call linked signal — without this every
      // settled call left one listener on the run signal for the rest
      // of the run (MaxListeners warnings on long gated runs).
      linkedAbort.release();
    }

    const aggregator = channel.snapshot();
    const durationMs = performance.now() - execStart;
    observeHistogram('tool.executor.duration_ms', durationMs, { toolName: tool.name });
    span.setAttributes({ 'graphorin.tool.duration_ms': Math.round(durationMs) });

    // Post-execute memory-modification guard verification.
    if (
      guard !== null &&
      preSnapshot !== null &&
      memoryRegionReader !== undefined &&
      executeError === undefined
    ) {
      try {
        const verify = await guard.verify(preSnapshot, memoryRegionReader);
        span.setAttributes({
          'graphorin.tool.memory_guard.verify.ok': verify.ok,
          'graphorin.tool.memory_guard.verify.duration_us': verify.verifyDurationUs,
        });
        if (!verify.ok) {
          emit({
            action: 'tool:execute:error',
            actor: { kind: 'tool', id: tool.name },
            target: tool.name,
            decision: 'error',
            ts: Date.now(),
            context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
            metadata: {
              kind: 'memory-guard-mismatch',
              regions: [...verify.mismatched],
              tier: guardTier,
            },
          });
          incrementCounter('tool.executor.memory_guard.mismatch.total', {
            toolName: tool.name,
            tier: guardTier,
          });
        }
      } catch {
        // Guard failures never tear down the tool execution path.
      }
    }

    if (linkedAbort.signal.aborted && executeError === undefined) {
      executeError = new Error('aborted');
    }

    if (executeError !== undefined) {
      const cancelled = linkedAbort.signal.aborted;
      const kind: ToolErrorKind = cancelled
        ? 'aborted'
        : executeError instanceof InlineToolTimeoutError
          ? 'timeout'
          : 'execution_failed';
      const partialOutput =
        aggregator.chunks.length > 0
          ? toResultEnvelope({ raw: undefined, chunks: aggregator.chunks }).output
          : undefined;
      const error: ToolError = {
        toolCallId: call.toolCallId,
        toolName: tool.name,
        kind,
        message: cancelled ? 'Tool execution cancelled' : describe(executeError),
        cause: executeError,
        ...(partialOutput !== undefined
          ? { hint: 'partial output captured in stream buffer' }
          : {}),
      };
      if (cancelled) {
        incrementCounter('tool.streaming.events.dropped.total', {
          toolName: tool.name,
          reason: 'cancelled',
        });
      }
      emitErrorAudit(error, runContext, stepNumber, cancelled ? 'cancelled' : undefined);
      opts.streamingSink?.(toErrorEvent(call, error));
      span.setStatus(cancelled ? 'cancelled' : 'error', error.message);
      span.recordException(executeError);
      return frozenCompleted(call, error, stepNumber, durationMs);
    }

    // Reconcile streaming buffer with explicit return. `undefined` is
    // the canonical "no explicit return" signal (per the
    // buffer-becomes-output discipline for streaming-hint tools);
    // `null` is a legitimate return value and is forwarded as-is.
    const explicitReturnPresent = rawResult !== undefined;
    const envelope = explicitReturnPresent
      ? toResultEnvelope({ raw: rawResult as unknown })
      : toResultEnvelope({ raw: undefined, chunks: aggregator.chunks });
    if (explicitReturnPresent && aggregator.chunks.length > 0) {
      incrementCounter('tool.streaming.return-and-stream-conflict.total', { toolName: tool.name });
    }

    // Optional output schema validation.
    if (tool.outputSchema !== undefined && envelope.output !== undefined) {
      const out = (tool.outputSchema as ZodLikeSchema<unknown>).safeParse(envelope.output);
      if (!out.success) {
        return failWith(
          call,
          tool,
          'invalid_output',
          out.error.message,
          runContext,
          stepNumber,
          durationMs,
        );
      }
    }

    // Truncation pipeline.
    const split = splitTextAndContentParts(envelope);
    // Surface every non-text content-part kind as a span attribute so
    // operators see image / audio / file pass-through behaviour.
    if (split.nonText.length > 0) {
      const kinds = [...new Set(split.nonText.map((p) => p.type))];
      for (const kind of kinds) {
        span.setAttributes({
          [`graphorin.tool.result.contentpart.kind.${kind}`]: true,
        });
      }
    }
    // TL-2: a structured (object/array) output that overflows the cap must
    // not be inlined whole. `normalize` always resolves a concrete strategy
    // (default `'middle'`), so when a structured output lands on that default
    // we route it through spill-to-file instead — the model sees a bounded
    // preview + a `read_result` handle while the full blob is preserved out of
    // context. An explicitly pinned `'tail'` / `'summarize'` / `'spill-to-file'`
    // is honoured. Under the cap `truncateBody` is a no-op regardless, so small
    // objects and all string outputs pass through unchanged.
    const baseStrategy = tool.truncationStrategy ?? 'middle';
    const isStructuredOutput = envelope.output !== undefined && typeof envelope.output !== 'string';
    const effectiveStrategy =
      isStructuredOutput && baseStrategy === 'middle' ? 'spill-to-file' : baseStrategy;
    span.setAttributes({
      'graphorin.tool.result.truncation.strategy': effectiveStrategy,
      'graphorin.tool.result.truncation.source': 'tool',
      'graphorin.tool.result.max_tokens': tool.maxResultTokens ?? 16384,
    });
    const truncation = await truncateBody({
      body: split.text,
      maxTokens: tool.maxResultTokens ?? 16384,
      strategy: effectiveStrategy,
      options: {
        ...(opts.tokenCounter !== undefined ? { counter: opts.tokenCounter } : {}),
        ...(opts.summarizer !== undefined ? { summarizer: opts.summarizer } : {}),
        spill: spillWriter,
        runId: runContext.runId,
        toolCallId: call.toolCallId,
        ...(tool.sensitivity !== undefined ? { toolSensitivityTier: tool.sensitivity } : {}),
        signal: runContext.signal,
      },
    });
    span.setAttributes({
      'graphorin.tool.result.truncation.applied': truncation.truncated,
    });
    if (truncation.truncated) {
      observeHistogram('tool.result.size.tokens', truncation.originalTokens, {
        toolName: tool.name,
      });
      incrementCounter('tool.result.truncation.applied.total', {
        toolName: tool.name,
        strategy: truncation.strategyApplied,
      });
      incrementCounter(
        'tool.result.truncation.bytes-dropped.total',
        { toolName: tool.name, strategy: truncation.strategyApplied },
        Math.max(0, split.text.length - truncation.body.length),
      );
      emit({
        action: 'tool:result:truncated',
        actor: { kind: 'tool', id: tool.name },
        target: tool.name,
        decision: 'success',
        ts: Date.now(),
        context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
        metadata: {
          strategy: truncation.strategyApplied,
          originalTokens: truncation.originalTokens,
          keptTokens: truncation.keptTokens,
          droppedTokens: truncation.droppedTokens,
          ...(truncation.artifactPath !== undefined
            ? { artifactPath: truncation.artifactPath }
            : {}),
          ...(truncation.summarizerModel !== undefined
            ? { summarizerModel: truncation.summarizerModel }
            : {}),
        },
      });
      if (truncation.artifactPath !== undefined) {
        emit({
          action: 'tool:result:spill:written',
          actor: { kind: 'tool', id: tool.name },
          target: tool.name,
          decision: 'success',
          ts: Date.now(),
          context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
          metadata: {
            artifactPath: truncation.artifactPath,
            byteCount: truncation.artifactBytes ?? 0,
          },
        });
        incrementCounter('tool.result.spill.written.total', { toolName: tool.name });
        if (truncation.artifactBytes !== undefined) {
          incrementCounter(
            'tool.result.spill.bytes.total',
            { toolName: tool.name },
            truncation.artifactBytes,
          );
        }
      }
    } else {
      observeHistogram('tool.result.size.tokens', truncation.originalTokens, {
        toolName: tool.name,
      });
    }

    // TL-6: a handle read returns content PRODUCED by an earlier tool —
    // sanitize and record provenance by the PRODUCER's trust class, not
    // the reader's own (read_result is a trusted built-in; without this
    // an untrusted spill laundered to trusted on the way back in).
    const readHandle =
      typeof (call.args as { readonly handle?: unknown } | null | undefined)?.handle === 'string'
        ? (call.args as { readonly handle: string }).handle
        : undefined;
    const mappedTaint = readHandle !== undefined ? handleProducerTaint.get(readHandle) : undefined;
    const readerReportedClass =
      typeof (envelope.output as { readonly producerTrustClass?: unknown } | null | undefined)
        ?.producerTrustClass === 'string'
        ? ((envelope.output as { readonly producerTrustClass: string })
            .producerTrustClass as ToolTrustClass)
        : undefined;
    const producerTaint =
      mappedTaint !== undefined && isUntrustedProducerClass(mappedTaint.trustClass)
        ? mappedTaint
        : readerReportedClass !== undefined && isUntrustedProducerClass(readerReportedClass)
          ? { trustClass: readerReportedClass, source: tool.__source }
          : undefined;
    const effectiveTrustClass = producerTaint?.trustClass ?? tool.__trustClass;
    const effectiveSource = producerTaint?.source ?? tool.__source;
    const effectiveSensitivity = producerTaint?.sensitivity ?? tool.sensitivity;

    // TL-6: object outputs bypass `wrapOutput` untouched (WI-10), so for
    // a tainted handle read the `content` string field is defanged
    // in place — that is the channel the model actually reads.
    let effectiveOutput = envelope.output;
    if (
      producerTaint !== undefined &&
      typeof effectiveOutput === 'object' &&
      effectiveOutput !== null &&
      typeof (effectiveOutput as { readonly content?: unknown }).content === 'string'
    ) {
      const contentSanitization = applyInboundSanitization({
        body: (effectiveOutput as { readonly content: string }).content,
        policy: defaultInboundSanitization(effectiveTrustClass),
        trustClass: effectiveTrustClass,
        toolName: tool.name,
        ...(opts.imperativePatterns !== undefined ? { patterns: opts.imperativePatterns } : {}),
        ...(opts.imperativeBudgetMs !== undefined ? { budgetMs: opts.imperativeBudgetMs } : {}),
      });
      effectiveOutput = { ...(effectiveOutput as object), content: contentSanitization.body };
    }

    // Inbound sanitization.
    const sanitization = applyInboundSanitization({
      body: truncation.body,
      // When producer taint fired, the producer-class default (always
      // 'detect-and-strip-and-wrap' — taint only fires for untrusted
      // classes) overrides the reader's own baked policy: the reader was
      // classified for ITS provenance, not for the content it relays.
      policy:
        producerTaint !== undefined
          ? defaultInboundSanitization(effectiveTrustClass)
          : (tool.inboundSanitization ?? 'pass-through'),
      trustClass: effectiveTrustClass,
      toolName: tool.name,
      ...(tool.failClosed === true ? { failClosed: true } : {}),
      ...(opts.imperativePatterns !== undefined ? { patterns: opts.imperativePatterns } : {}),
      ...(opts.imperativeBudgetMs !== undefined ? { budgetMs: opts.imperativeBudgetMs } : {}),
    });
    if (sanitization.patternsHit.length > 0) {
      for (const pattern of sanitization.patternsHit) {
        incrementCounter('tool.inbound.sanitization.hit.total', {
          pattern,
          trustClass: tool.__trustClass,
          toolName: tool.name,
        });
      }
      emit({
        action: 'tool:result:sanitization:hit',
        actor: { kind: 'tool', id: tool.name },
        target: tool.name,
        decision: 'success',
        ts: Date.now(),
        context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
        metadata: {
          patterns: [...sanitization.patternsHit],
          trustClass: tool.__trustClass,
          policyAction: sanitization.wrapped
            ? 'wrapped'
            : sanitization.stripped
              ? 'stripped'
              : 'flagged',
        },
      });
    }
    if (sanitization.blocked) {
      incrementCounter('tool.inbound.sanitization.blocked.total', {
        trustClass: tool.__trustClass,
      });
      emit({
        action: 'tool:result:sanitization:blocked',
        actor: { kind: 'tool', id: tool.name },
        target: tool.name,
        decision: 'denied',
        ts: Date.now(),
        context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
        metadata: {
          trustClass: tool.__trustClass,
          patterns: [...sanitization.patternsHit],
        },
      });
      const error: ToolError = {
        toolCallId: call.toolCallId,
        toolName: tool.name,
        kind: 'inbound_sanitization_blocked',
        message: `Tool result blocked by inbound sanitization (patterns: ${sanitization.patternsHit.join(', ')}).`,
      };
      return frozenCompleted(call, error, stepNumber, durationMs);
    }
    incrementCounter(
      'tool.inbound.sanitization.scan.duration_us.total',
      {
        trustClass: tool.__trustClass,
      },
      sanitization.scanDurationUs,
    );
    span.setAttributes({
      'graphorin.tool.inbound.sanitization.scan_duration_us': sanitization.scanDurationUs,
      'graphorin.tool.inbound.sanitization.policy': tool.inboundSanitization ?? 'pass-through',
      'graphorin.tool.inbound.sanitization.patterns_hit_count': sanitization.patternsHit.length,
    });

    const sanitizedOutput = wrapOutput(effectiveOutput, sanitization.body, split.text);
    const result: ToolResult = {
      toolCallId: call.toolCallId,
      toolName: tool.name,
      output: sanitizedOutput,
      contentParts: [
        ...split.nonText,
        ...split.textParts.map((p) => ({ ...p, text: sanitization.body }) as typeof p),
      ],
      durationMs,
      // WI-10 (P1-4): when the body spilled to a file, surface a structured,
      // opaque handle + the bounded preview so the agent inlines the preview
      // (not the full blob) and the model can fetch the rest via `read_result`.
      ...(truncation.resultHandle !== undefined
        ? {
            resultHandle: {
              uri: truncation.resultHandle,
              kind: 'spill-file' as const,
              preview: sanitization.body,
              producerTrustClass: effectiveTrustClass,
              ...(truncation.artifactBytes !== undefined
                ? { bytes: truncation.artifactBytes }
                : {}),
            },
          }
        : {}),
    };
    if (truncation.resultHandle !== undefined) {
      // TL-6: remember who produced this artifact so a later read
      // re-applies the producer's taint (effective values chain taint
      // across re-spills of handle reads too).
      handleProducerTaint.set(truncation.resultHandle, {
        trustClass: effectiveTrustClass,
        source: effectiveSource,
        ...(effectiveSensitivity !== undefined ? { sensitivity: effectiveSensitivity } : {}),
      });
    }
    // Record this output's provenance so later sink gates can detect
    // untrusted-to-sink flows (WI-12 / P1-3). Uses the sanitized text the
    // model will actually see — that is the only content it can forward.
    if (opts.dataFlowGuard !== undefined) {
      opts.dataFlowGuard.record({
        toolName: tool.name,
        trustClass: effectiveTrustClass,
        ...(effectiveSensitivity !== undefined ? { sensitivity: effectiveSensitivity } : {}),
        source: effectiveSource,
        outputText: sanitization.body,
        runContext,
      });
    }
    emit({
      action: 'tool:execute:end',
      actor: { kind: 'tool', id: tool.name },
      target: tool.name,
      decision: 'success',
      ts: Date.now(),
      context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
      metadata: {
        durationMs,
        ...(idempotencyKey !== undefined ? { idempotencyKey } : {}),
        ...(tool.__streamingHint ? { streamingHint: true, chunkCount: aggregator.chunkCount } : {}),
      },
    });
    if (tool.__streamingHint) {
      emit({
        action: 'tool:execute:streamed',
        actor: { kind: 'tool', id: tool.name },
        target: tool.name,
        decision: 'success',
        ts: Date.now(),
        context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
        metadata: {
          chunkCount: aggregator.chunkCount,
          progressEventCount: aggregator.progressEventCount,
          totalBytes: aggregator.totalBytes,
          durationMs,
          streamingHint: true,
          // Resume support is a Phase 09 (MCP) cross-cut; we expose
          // `resumed: false` here so the audit row is forward-compatible
          // with the resumable session metadata the MCP adapter will
          // wire later.
          resumed: false,
        },
      });
    }
    opts.streamingSink?.(toEndEvent(call, result.output, durationMs));

    return frozenCompleted(call, result, stepNumber, durationMs);
  }

  async function prepareContext(
    call: ToolCall,
    tool: ResolvedTool,
    runContext: RunContext,
    stepNumber: number,
    trustLevel: SandboxTrustLevel,
    inputMaybe?: unknown,
  ) {
    const sandbox = resolveSandbox({
      trustLevel,
      toolName: tool.name,
      ...(tool.sandboxPolicy !== undefined
        ? { override: { kind: mapSandboxPolicy(tool.sandboxPolicy) } }
        : {}),
    });
    const linkedAbort = linkSignal(runContext.signal);
    const sink = opts.streamingSink;
    const channel = createStreamingChannel({
      toolName: tool.name,
      toolCallId: call.toolCallId,
      stepNumber,
      eventQueueDepth: streamingEventQueueDepth,
      streamingHint: tool.__streamingHint,
      ...(sink !== undefined ? { sink: (event) => sink(event) } : {}),
    });
    const ctx = buildToolExecutionContext({
      tool,
      toolCallId: call.toolCallId,
      runContext,
      signal: linkedAbort.signal,
      streamingChannel: channel,
      ...(opts.secretResolver !== undefined ? { secretResolver: opts.secretResolver } : {}),
    });
    return { ctx, channel, linkedAbort, sandbox, input: inputMaybe ?? call.args };
  }

  function failWith(
    call: ToolCall,
    tool: ResolvedTool,
    kind: ToolErrorKind,
    message: string,
    runContext: RunContext,
    stepNumber: number,
    durationMs?: number,
  ): CompletedToolCall {
    const error: ToolError = {
      toolCallId: call.toolCallId,
      toolName: tool.name,
      kind,
      message,
    };
    emitErrorAudit(error, runContext, stepNumber);
    opts.streamingSink?.(toErrorEvent(call, error));
    return frozenCompleted(call, error, stepNumber, durationMs);
  }

  function emitErrorAudit(
    error: ToolError,
    runContext: RunContext,
    stepNumber: number,
    reason?: string,
  ): void {
    emit({
      action: 'tool:execute:error',
      actor: { kind: 'tool', id: error.toolName },
      target: error.toolName,
      decision: 'error',
      ts: Date.now(),
      context: { runId: runContext.runId, stepNumber, toolCallId: error.toolCallId },
      metadata: {
        kind: error.kind,
        ...(reason !== undefined ? { reason } : {}),
      },
    });
    incrementCounter('tool.executor.errors.total', { toolName: error.toolName, kind: error.kind });
  }

  return { executeBatch, executeOne };
}

/** Structural shape of `Sandbox.run(...)`'s return value. */
interface SandboxResultLike {
  readonly ok: boolean;
  readonly output?: unknown;
  readonly error?: { readonly kind: string; readonly message: string };
}

function frozenCompleted(
  call: ToolCall,
  outcome: ToolOutcome,
  stepNumber: number,
  durationMs?: number,
): CompletedToolCall {
  void durationMs;
  return Object.freeze({
    call: Object.freeze({ ...call }),
    outcome: Object.freeze({ ...outcome }) as ToolOutcome,
    stepNumber,
  });
}

function describe(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

function mapSandboxPolicy(
  policy: NonNullable<ResolvedTool['sandboxPolicy']>,
): ResolvedSandboxPolicy['kind'] {
  switch (policy) {
    case 'none':
      return 'none';
    case 'sandboxed':
      return 'worker-threads';
    case 'isolated':
      return 'isolated-vm';
    case 'docker':
      return 'docker';
  }
}

function linkSignal(parent: AbortSignal): {
  readonly signal: AbortSignal;
  readonly abort: () => void;
  /** TL-11: detach from the parent — settled calls must not accumulate listeners. */
  readonly release: () => void;
} {
  const ac = new AbortController();
  let release: () => void = () => {};
  if (parent.aborted) {
    ac.abort();
  } else {
    const onAbort = (): void => ac.abort();
    parent.addEventListener('abort', onAbort, { once: true });
    release = () => parent.removeEventListener('abort', onAbort);
  }
  return { signal: ac.signal, abort: () => ac.abort(), release };
}

async function raceWithCancellation<T>(
  fn: () => Promise<T>,
  signal: AbortSignal,
  graceMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    let graceTimer: NodeJS.Timeout | undefined;
    const resolveOnce = (value: T): void => {
      if (settled) return;
      settled = true;
      if (graceTimer !== undefined) clearTimeout(graceTimer);
      resolve(value);
    };
    const rejectOnce = (err: unknown): void => {
      if (settled) return;
      settled = true;
      if (graceTimer !== undefined) clearTimeout(graceTimer);
      reject(err);
    };
    const onAbort = (): void => {
      // Give the tool a grace window to honour the signal before we
      // surface the synthetic 'aborted' error.
      graceTimer = setTimeout(() => {
        rejectOnce(new Error('aborted'));
      }, graceMs);
    };
    if (signal.aborted) onAbort();
    else signal.addEventListener('abort', onAbort, { once: true });
    fn().then(resolveOnce).catch(rejectOnce);
  });
}

function wrapOutput(rawOutput: unknown, sanitizedText: string, originalText: string): unknown {
  // When the rendered text is byte-identical to the original (nothing was
  // truncated or sanitized), pass the typed output through unchanged — small
  // objects keep their structure for downstream consumers (code-mode, etc).
  if (sanitizedText === originalText) return rawOutput;
  // Otherwise the body was bounded (truncated) and/or had imperative content
  // stripped. The model must see exactly that bounded text — never the full
  // structured object (TL-2). Previously a non-string output was returned
  // whole here, so the cap + inbound sanitization were computed and thrown
  // away and the agent inlined the entire blob (and any injection past the
  // cap) verbatim. Returning the bounded text closes that bypass; the full
  // value is preserved out of context behind the spill `resultHandle`.
  return sanitizedText;
}

function toStartEvent(call: ToolCall): ToolExecuteStartEvent {
  return { type: 'tool.execute.start', toolCallId: call.toolCallId };
}

function toEndEvent(call: ToolCall, result: unknown, durationMs: number): ToolExecuteEndEvent {
  return { type: 'tool.execute.end', toolCallId: call.toolCallId, result, durationMs };
}

function toErrorEvent(call: ToolCall, error: ToolError): ToolExecuteErrorEvent {
  return { type: 'tool.execute.error', toolCallId: call.toolCallId, error };
}
