/**
 * `createToolExecutor(...)` - runs `Tool[]` invocations.
 *
 * Responsibilities, per the working-plan deliverables:
 *
 *  - Parallel-by-default dispatch via `Promise.allSettled`; tools tagged
 *    `executionMode: 'sequential'` are serialised inside the batch.
 *  - Approval flow: `needsApproval(input, ctx)` → suspend the run and
 *    emit `tool.approval.requested`; the caller resumes with a
 *    grant / deny decision.
 *  - Per-tool secrets ACL via `withSecretsScope`.
 *  - Sandbox enforcement via `@graphorin/security`'s
 *    `resolveSandbox(...)` policy resolver.
 *  - Cancellation: linked `AbortSignal`; 50 ms grace window before
 *    surfacing `ToolError({ kind: 'aborted' })`.
 *  - Single-round tool repair on input-schema failure.
 *  - Streaming-tool surface via the per-call `StreamingChannel`.
 *  - Truncation pipeline + inbound sanitization on the assembled body.
 *  - Per-execution `tool.execute` AISpan with rich attributes.
 *
 * This module is the ORCHESTRATOR: it owns the executor-scoped state
 * (the {@link ExecutorRuntime} bundle) and composes the sequential
 * per-call phases, each of which lives in its own sibling module:
 *
 *  - `phase-batch.ts`        - batch partitioning + bounded scheduling
 *  - `phase-retry.ts`        - C3 transparent bounded retry
 *  - `phase-validate.ts`     - schema validation + single-round repair
 *  - `phase-approval.ts`     - `needsApproval` predicate + approval gate
 *  - `phase-policy.ts`       - D4 / Progent tool-argument policy
 *  - `phase-dataflow.ts`     - WI-12 data-flow provenance sink gate
 *  - `phase-context.ts`      - sandbox resolve + linked abort + channel + ctx
 *  - `phase-memory-guard.ts` - memory-guard snapshot / verify
 *  - `phase-dispatch.ts`     - sandbox / inline execution + failure mapping
 *  - `phase-envelope.ts`     - streaming-buffer reconcile + output schema
 *  - `phase-truncate.ts`     - TL-6 producer taint + truncation / spill
 *  - `phase-sanitize.ts`     - inbound sanitization on the bounded body
 *  - `phase-result.ts`       - result assembly + provenance + end events
 *
 * Shared contract types live in `types.ts`; the completion / error
 * funnel in `outcome.ts`. Both are re-exported here so every original
 * import path keeps working.
 *
 * @packageDocumentation
 */

import type {
  AISpan,
  CompletedToolCall,
  ResolvedTool,
  RunContext,
  ToolCall,
  ToolError,
} from '@graphorin/core';
import type { SandboxTrustLevel } from '@graphorin/security/sandbox';

import { emitToolAudit, incrementCounter, observeHistogram } from '../audit/index.js';
import { createDefaultSpillWriter } from '../result/spill.js';
import { DEFAULT_MAX_BUFFER_BYTES } from '../streaming/channel.js';
import { emitErrorAudit, frozenCompleted, toStartEvent } from './outcome.js';
import { runApprovalPhase } from './phase-approval.js';
import { runExecuteBatch } from './phase-batch.js';
import { prepareCallContext } from './phase-context.js';
import { runDataFlowSinkGate } from './phase-dataflow.js';
import { completeExecutionFailure, dispatchToolCall } from './phase-dispatch.js';
import { buildEnvelopePhase } from './phase-envelope.js';
import { snapshotMemoryGuard, verifyMemoryGuard } from './phase-memory-guard.js';
import { runArgumentPolicyPhase } from './phase-policy.js';
import { assembleResultPhase } from './phase-result.js';
import { runWithRetry } from './phase-retry.js';
import { runSanitizePhase } from './phase-sanitize.js';
import { runTruncationPhase } from './phase-truncate.js';
import { runValidateArgsPhase } from './phase-validate.js';
import type {
  ExecuteBatchOptions,
  ExecutorOptions,
  ExecutorRuntime,
  ToolExecutor,
} from './types.js';

export {
  type ApprovalDecision,
  type ApprovalGate,
  type DataFlowGuard,
  type DataFlowInspectInput,
  type DataFlowRecordInput,
  type DataFlowVerdict,
  DEFAULT_INLINE_TOOL_TIMEOUT_MS,
  type ExecuteBatchOptions,
  type ExecutorEvent,
  type ExecutorOptions,
  type ToolArgumentPolicyGuard,
  type ToolExecutor,
  type ToolRepairHook,
} from './types.js';

/**
 * Build a {@link ToolExecutor} bound to a registry.
 *
 * @stable
 */
export function createToolExecutor(opts: ExecutorOptions): ToolExecutor {
  const rt: ExecutorRuntime = {
    options: opts,
    emit: opts.emitAudit ?? emitToolAudit,
    maxParallelTools: opts.maxParallelTools ?? 8,
    cancellationGraceMs: opts.cancellationGraceMs ?? 50,
    streamingEventQueueDepth: opts.streamingEventQueueDepth ?? 256,
    streamingMaxBufferBytes: opts.streamingMaxBufferBytes ?? DEFAULT_MAX_BUFFER_BYTES,
    sandboxResolver: opts.sandboxResolver ?? (() => null),
    memoryGuardFactory: opts.memoryGuardFactory ?? (() => null),
    memoryRegionReader: opts.memoryRegionReader,
    // Default spill writer - writes to `<os.tmpdir()>/graphorin-spill/<runId>/<toolCallId>.<ext>`
    // with `0600` permissions and tier-aware sensitivity inheritance.
    spillWriter: opts.spill ?? createDefaultSpillWriter(),
    // TL-6: trust class of the tool that PRODUCED each spill artifact,
    // keyed by handle URI. Handle reads (read_result) re-apply inbound
    // sanitization + dataflow provenance by the PRODUCER's class so an
    // untrusted body cannot launder to trusted through the built-in
    // reader. In-memory per executor - handles from another executor or
    // a resumed prior process fall back to the reader-reported class,
    // which the default file reader recovers from the artifact's taint
    // sidecar (tools-03), so the taint survives both boundaries.
    handleProducerTaint: new Map(),
  };

  async function executeBatch(
    batch: ExecuteBatchOptions,
  ): Promise<ReadonlyArray<CompletedToolCall>> {
    return runExecuteBatch(rt, executeOne, batch);
  }

  async function executeOne(opts2: {
    readonly call: ToolCall;
    readonly runContext: RunContext;
    readonly stepNumber: number;
    readonly trustLevel?: SandboxTrustLevel;
    readonly disableRepair?: boolean;
    readonly capability?: 'read-only';
  }): Promise<CompletedToolCall> {
    const { call, runContext, stepNumber } = opts2;
    const trustLevel = opts2.trustLevel ?? 'user-defined';
    const disableRepair = opts2.disableRepair === true;
    const tool = rt.options.registry.get(call.toolName);

    if (tool === undefined) {
      const error: ToolError = {
        toolCallId: call.toolCallId,
        toolName: call.toolName,
        kind: 'unknown_tool',
        message: `Unknown tool: ${call.toolName}`,
      };
      emitErrorAudit(rt, error, runContext, stepNumber);
      return frozenCompleted(call, error, stepNumber);
    }

    // D2 single-writer constraint: a read-only run deterministically
    // blocks writer tools BEFORE validation/approval - the enforcement
    // half behind the agent's advertise filter, so a model (or injected
    // instruction) calling an unadvertised writer still cannot execute.
    if (
      opts2.capability === 'read-only' &&
      (tool.__sideEffectClass === 'side-effecting' ||
        tool.__sideEffectClass === 'external-stateful')
    ) {
      const error: ToolError = {
        toolCallId: call.toolCallId,
        toolName: call.toolName,
        kind: 'capability_blocked',
        message: `Tool '${call.toolName}' is ${tool.__sideEffectClass}, but this run holds read-only capability (single-writer constraint).`,
      };
      incrementCounter('tool.executor.capability-blocked.total', { toolName: call.toolName });
      emitErrorAudit(rt, error, runContext, stepNumber);
      return frozenCompleted(call, error, stepNumber);
    }

    const attempt = (): Promise<CompletedToolCall> =>
      // Wrap the entire execution in a `tool.execute` AISpan so the
      // observability layer captures `args`, `result`, `durationMs`, the
      // resolved sandbox kind, the memory-guard tier, the sensitivity
      // tier, the side-effect class, and the streaming hint per the
      // GenAI Semantic Conventions extension.
      runContext.tracer.span<'tool.execute', CompletedToolCall>(
        {
          type: 'tool.execute',
          // C7: parent under the current agent.step span when present, so
          // tool spans join the run's trace tree instead of starting one.
          ...(runContext.span !== undefined ? { parent: runContext.span } : {}),
          attrs: {
            'graphorin.tool.name': tool.name,
            'graphorin.tool.call_id': call.toolCallId,
            'gen_ai.operation.name': 'execute_tool',
            'gen_ai.tool.name': tool.name,
            'gen_ai.tool.call.id': call.toolCallId,
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
        (span) =>
          executeOneInSpan(call, tool, runContext, stepNumber, trustLevel, span, disableRepair),
      );

    return runWithRetry(rt, tool, runContext, attempt);
  }

  async function executeOneInSpan(
    call: ToolCall,
    tool: ResolvedTool,
    runContext: RunContext,
    stepNumber: number,
    trustLevel: SandboxTrustLevel,
    span: AISpan<'tool.execute'>,
    disableRepair = false,
  ): Promise<CompletedToolCall> {
    incrementCounter('tool.executor.invocations.total', { toolName: tool.name });
    if (tool.__streamingHint) {
      incrementCounter('tool.streaming.tools.invoked.total', { toolName: tool.name });
    }

    // Validate args FIRST (with optional single-round repair) - tools-02;
    // see `phase-validate.ts` for the TOCTOU rationale.
    const validated = await runValidateArgsPhase(rt, {
      call,
      tool,
      runContext,
      stepNumber,
      disableRepair,
    });
    if (!validated.ok) return validated.completed;
    const { validatedInput, effectiveArgs } = validated;

    // Approval flow - evaluated on the validated input.
    const approval = await runApprovalPhase(rt, {
      call,
      tool,
      runContext,
      stepNumber,
      trustLevel,
      validatedInput,
      effectiveArgs,
    });
    if (!approval.ok) return approval.completed;

    // D4 Progent tool-argument policy: deterministic pre-execution block.
    const policyBlock = runArgumentPolicyPhase(rt, {
      call,
      tool,
      runContext,
      stepNumber,
      validatedInput,
    });
    if (policyBlock !== null) return policyBlock;

    // Data-flow provenance gate (WI-12 / P1-3) - sinks only. Probes
    // `effectiveArgs` (raw-shaped, post-repair), consistent with the
    // approval gate and the argument policy above (W-118).
    const dataFlowBlock = runDataFlowSinkGate(rt, {
      call,
      tool,
      runContext,
      stepNumber,
      effectiveArgs,
    });
    if (dataFlowBlock !== null) return dataFlowBlock;

    // Build the per-call context.
    const prepared = await prepareCallContext(
      rt,
      call,
      tool,
      runContext,
      stepNumber,
      trustLevel,
      validatedInput,
    );
    const { channel, linkedAbort } = prepared;

    // Wire the resolved sandbox policy onto the span.
    span.setAttributes({
      'graphorin.tool.sandbox.kind': prepared.sandbox.kind,
      'graphorin.tool.sandbox.forced': prepared.sandbox.forced,
      'graphorin.tool.sandbox.no_network': prepared.sandbox.noNetwork,
      'graphorin.tool.sandbox.no_filesystem': prepared.sandbox.noFilesystem,
    });

    // Memory-modification guard - snapshot before; verify after.
    const guardState = await snapshotMemoryGuard(rt, tool);

    // Surface the start event via the runContext / sink hooks.
    rt.emit({
      action: 'tool:execute:start',
      actor: { kind: 'tool', id: tool.name },
      target: tool.name,
      decision: 'success',
      ts: Date.now(),
      context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
      metadata: {
        sandboxKind: prepared.sandbox.kind,
        sideEffectClass: tool.__sideEffectClass,
        memoryGuardTier: guardState.guardTier,
      },
    });
    rt.options.streamingSink?.(toStartEvent(call));
    span.addEvent('tool.execute.start');

    // Optional idempotency-key resolution.
    let idempotencyKey: string | undefined;
    if (tool.idempotencyKey !== undefined) {
      try {
        idempotencyKey = await Promise.resolve(tool.idempotencyKey(validatedInput, prepared.ctx));
        incrementCounter('tool.classification.idempotency-key-evaluated.total', {
          toolName: tool.name,
          sideEffectClass: tool.__sideEffectClass,
        });
      } catch {
        idempotencyKey = undefined;
      }
    }

    // Run the tool - sandbox-delegated or inline (see phase-dispatch.ts).
    const dispatched = await dispatchToolCall(rt, {
      tool,
      runContext,
      validatedInput,
      prepared,
      span,
    });

    const aggregator = channel.snapshot();
    const durationMs = performance.now() - dispatched.execStart;
    observeHistogram('tool.executor.duration_ms', durationMs, { toolName: tool.name });
    span.setAttributes({ 'graphorin.tool.duration_ms': Math.round(durationMs) });

    // Post-execute memory-modification guard verification.
    await verifyMemoryGuard(rt, {
      call,
      tool,
      runContext,
      stepNumber,
      span,
      state: guardState,
      executeError: dispatched.executeError,
    });

    let executeError = dispatched.executeError;
    if (linkedAbort.signal.aborted && executeError === undefined) {
      executeError = new Error('aborted');
    }

    if (executeError !== undefined) {
      return completeExecutionFailure(rt, {
        call,
        tool,
        runContext,
        stepNumber,
        span,
        executeError,
        abortSignal: linkedAbort.signal,
        aggregator,
        durationMs,
      });
    }

    // Reconcile streaming buffer with the explicit return + output schema.
    const enveloped = buildEnvelopePhase(rt, {
      call,
      tool,
      runContext,
      stepNumber,
      durationMs,
      rawResult: dispatched.rawResult,
      aggregator,
    });
    if (!enveloped.ok) return enveloped.completed;
    const { envelope } = enveloped;

    // Truncation pipeline (TL-6 producer-taint resolution + TL-2 routing).
    const truncated = await runTruncationPhase(rt, {
      call,
      tool,
      runContext,
      stepNumber,
      span,
      envelope,
    });

    // Inbound sanitization on the bounded body.
    const sanitized = runSanitizePhase(rt, {
      call,
      tool,
      runContext,
      stepNumber,
      durationMs,
      span,
      envelope,
      truncatedBody: truncated.truncation.body,
      producerTaint: truncated.producerTaint,
      effectiveTrustClass: truncated.effectiveTrustClass,
    });
    if (!sanitized.ok) return sanitized.completed;

    // Assemble the final result + provenance record + end events.
    return assembleResultPhase(rt, {
      call,
      tool,
      runContext,
      stepNumber,
      durationMs,
      envelope,
      split: truncated.split,
      truncation: truncated.truncation,
      sanitization: sanitized.sanitization,
      effectiveOutput: sanitized.effectiveOutput,
      effectiveTrustClass: truncated.effectiveTrustClass,
      effectiveSource: truncated.effectiveSource,
      effectiveSensitivity: truncated.effectiveSensitivity,
      aggregator,
      idempotencyKey,
    });
  }

  return { executeBatch, executeOne };
}
