/**
 * Dispatch phase: run the tool - either delegated to a resolved
 * `Sandbox` or inline under the secrets scope with an enforced
 * wall-clock limit (TL-4) - racing the linked `AbortSignal` with the
 * hard-kill grace window, then map any failure onto the model-visible
 * `ToolError` (tools-06 structured kinds preserved).
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
  ToolErrorKind,
} from '@graphorin/core';

import { incrementCounter } from '../audit/index.js';
import { toResultEnvelope } from '../result/envelope.js';
import type { StreamingAggregator } from '../streaming/channel.js';
import { describe, emitErrorAudit, frozenCompleted, toErrorEvent } from './outcome.js';
import type { PreparedCallContext } from './phase-context.js';
import { withSecretsScope } from './tool-context.js';
import { ToolRateLimitError } from './tool-errors.js';
import { DEFAULT_INLINE_TOOL_TIMEOUT_MS, type ExecutorRuntime } from './types.js';

/** TL-4: sentinel for the inline wall-clock expiry (maps to kind 'timeout'). */
class InlineToolTimeoutError extends Error {
  constructor(readonly limitMs: number) {
    super(`Tool execution exceeded the ${limitMs}ms wall-clock timeout.`);
    this.name = 'InlineToolTimeoutError';
  }
}

/**
 * tools-06: structured carrier for a non-ok `SandboxResult` so the error
 * kind the sandbox reported survives to the model-visible `ToolError`
 * instead of flattening to `execution_failed`.
 */
class SandboxOutcomeError extends Error {
  constructor(
    readonly sandboxErrorKind:
      | 'timeout'
      | 'memory-exceeded'
      | 'sandbox-violation'
      | 'aborted'
      | 'execution-failed',
    sandboxId: string,
    message: string,
    cause?: unknown,
  ) {
    super(
      `[sandbox:${sandboxId}] ${sandboxErrorKind}: ${message}`,
      ...(cause !== undefined ? [{ cause }] : []),
    );
    this.name = 'SandboxOutcomeError';
  }
}

/** Narrow a loosely-typed sandbox error kind onto the contract union. */
function normalizeSandboxErrorKind(
  kind: string,
): 'timeout' | 'memory-exceeded' | 'sandbox-violation' | 'aborted' | 'execution-failed' {
  switch (kind) {
    case 'timeout':
    case 'memory-exceeded':
    case 'sandbox-violation':
    case 'aborted':
      return kind;
    default:
      return 'execution-failed';
  }
}

/** Map a sandbox-reported error kind onto the model-visible ToolErrorKind. */
function toolErrorKindForSandbox(err: SandboxOutcomeError): ToolErrorKind {
  switch (err.sandboxErrorKind) {
    case 'timeout':
      return 'timeout';
    case 'sandbox-violation':
    case 'memory-exceeded':
      return 'sandbox_violation';
    case 'aborted':
      return 'aborted';
    default:
      return 'execution_failed';
  }
}

/** Structural shape of `Sandbox.run(...)`'s return value. */
interface SandboxResultLike {
  readonly ok: boolean;
  readonly output?: unknown;
  readonly error?: { readonly kind: string; readonly message: string };
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

/** Outcome of {@link dispatchToolCall}. */
export interface DispatchOutcome {
  readonly rawResult: unknown;
  readonly executeError: unknown;
  /** `performance.now()` timestamp taken right before dispatch. */
  readonly execStart: number;
}

// Run the tool. If a sandbox dispatcher is configured AND the
// resolved policy is non-`'none'` AND the dispatcher returns a
// non-null `Sandbox`, we delegate to its `run(...)` API. Tools
// declared inline via `tool({...})` cannot be serialised to a
// worker, so the dispatcher returns `null` for them and the
// executor falls back to inline execution; the sandbox policy is
// still surfaced on the span and audit row for operator visibility.
export async function dispatchToolCall(
  rt: ExecutorRuntime,
  input: {
    readonly tool: ResolvedTool;
    readonly runContext: RunContext;
    readonly validatedInput: unknown;
    readonly prepared: PreparedCallContext;
    readonly span: AISpan<'tool.execute'>;
  },
): Promise<DispatchOutcome> {
  const { tool, runContext, validatedInput, prepared, span } = input;
  const { channel, linkedAbort } = prepared;
  const execStart = performance.now();
  const sandbox = prepared.sandbox.kind !== 'none' ? rt.sandboxResolver(prepared.sandbox) : null;
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
              ...(prepared.sandbox.timeoutMs > 0 ? { timeoutMs: prepared.sandbox.timeoutMs } : {}),
              ...(prepared.sandbox.maxMemoryMb > 0
                ? { maxMemoryMb: prepared.sandbox.maxMemoryMb }
                : {}),
              allowNetwork: !prepared.sandbox.noNetwork,
              allowFs: !prepared.sandbox.noFilesystem,
            },
          ),
        linkedAbort.signal,
        rt.cancellationGraceMs,
      )) as SandboxResultLike;
      if (sandboxOutcome.ok) {
        rawResult = sandboxOutcome.output;
      } else {
        const errInfo = sandboxOutcome.error ?? {
          kind: 'execution-failed',
          message: 'sandbox returned a non-ok result without error metadata',
        };
        // tools-06: preserve the sandbox's structured kind so a
        // violation/timeout reaches the model as its own ToolErrorKind.
        executeError = new SandboxOutcomeError(
          normalizeSandboxErrorKind(errInfo.kind),
          sandbox.id,
          errInfo.message,
          (errInfo as { cause?: unknown }).cause,
        );
      }
    } else {
      // TL-4: inline closures get an enforced wall-clock limit - the
      // tier-resolved per-tool timeout when set, else the executor
      // default. A tool that hangs and ignores `ctx.signal` fails with
      // kind 'timeout' instead of blocking the run forever.
      const inlineLimitMs =
        rt.options.inlineToolTimeoutMs !== undefined
          ? rt.options.inlineToolTimeoutMs
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
                () => tool.execute(validatedInput as never, prepared.ctx),
                linkedAbort.signal,
                rt.cancellationGraceMs,
              ),
          }),
          new Promise<never>((_, reject) => {
            inlineTimer = setTimeout(() => {
              // W-031: actually STOP the tool, not just the await. A
              // well-behaved tool listening on ctx.signal winds down
              // instead of running to completion in the background
              // (double side effects behind an already-reported
              // timeout). No unhandled rejection: Promise.race keeps
              // handlers on the losing promise.
              linkedAbort.abort();
              reject(new InlineToolTimeoutError(inlineLimitMs));
            }, inlineLimitMs);
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
    // TL-11: detach the per-call linked signal - without this every
    // settled call left one listener on the run signal for the rest
    // of the run (MaxListeners warnings on long gated runs).
    linkedAbort.release();
  }
  return { rawResult, executeError, execStart };
}

// tools-06: honour the structured carriers before flattening -
// sandbox results keep their reported kind, and an author-thrown
// ToolRateLimitError reaches the model as 'rate_limited'.
export function completeExecutionFailure(
  rt: ExecutorRuntime,
  input: {
    readonly call: ToolCall;
    readonly tool: ResolvedTool;
    readonly runContext: RunContext;
    readonly stepNumber: number;
    readonly span: AISpan<'tool.execute'>;
    readonly executeError: unknown;
    /** The per-call linked signal - aborted means the run was cancelled. */
    readonly abortSignal: AbortSignal;
    readonly aggregator: StreamingAggregator;
    readonly durationMs: number;
  },
): CompletedToolCall {
  const { call, tool, runContext, stepNumber, span, executeError, aggregator, durationMs } = input;
  // W-031 ordering: the inline timer now aborts the LINKED signal, so
  // "linked signal aborted" no longer implies cancellation - a timeout
  // must classify as 'timeout'. A REAL cancellation is visible on the
  // parent run signal and still wins (a cancel racing the timer reads
  // as aborted, which is what the caller asked for).
  const parentAborted = runContext.signal.aborted;
  const timedOut = executeError instanceof InlineToolTimeoutError && !parentAborted;
  const cancelled = !timedOut && (parentAborted || input.abortSignal.aborted);
  const kind: ToolErrorKind = cancelled
    ? 'aborted'
    : executeError instanceof InlineToolTimeoutError
      ? 'timeout'
      : executeError instanceof SandboxOutcomeError
        ? toolErrorKindForSandbox(executeError)
        : executeError instanceof ToolRateLimitError
          ? 'rate_limited'
          : 'execution_failed';
  const partialOutput =
    aggregator.chunks.length > 0
      ? toResultEnvelope({ raw: undefined, chunks: aggregator.chunks }).output
      : undefined;
  const retryAfterHint =
    executeError instanceof ToolRateLimitError && executeError.retryAfterMs !== undefined
      ? `retry after ${executeError.retryAfterMs}ms`
      : undefined;
  // W-031: 'timeout' defaults to recoverable + retry_later
  // (recoveryForKind) - the right call for read-only/pure and for
  // idempotency-keyed tools, but an open invitation to double-execute a
  // NON-idempotent side-effecting tool whose first (timed-out) call may
  // still have completed at the remote end (a slow payment API charges
  // twice). Deterministic policy over the model-facing hint: explicit
  // fields below win over recoveryForKind in frozenCompleted.
  const nonIdempotentSideEffectTimeout =
    kind === 'timeout' &&
    (tool.__sideEffectClass === 'side-effecting' ||
      tool.__sideEffectClass === 'external-stateful') &&
    tool.__hasIdempotencyKey !== true;
  const timeoutWarning = 'the first invocation may still have completed; do not retry blindly';
  const baseHint =
    retryAfterHint ??
    (partialOutput !== undefined ? 'partial output captured in stream buffer' : undefined);
  const hint = nonIdempotentSideEffectTimeout
    ? baseHint !== undefined
      ? `${baseHint}; ${timeoutWarning}`
      : timeoutWarning
    : baseHint;
  const error: ToolError = {
    toolCallId: call.toolCallId,
    toolName: tool.name,
    kind,
    message: cancelled ? 'Tool execution cancelled' : describe(executeError),
    cause: executeError,
    ...(hint !== undefined ? { hint } : {}),
    ...(nonIdempotentSideEffectTimeout
      ? { recoverable: false, recoveryHint: 'report_to_user' as const }
      : {}),
  };
  if (cancelled) {
    incrementCounter('tool.streaming.events.dropped.total', {
      toolName: tool.name,
      reason: 'cancelled',
    });
  }
  emitErrorAudit(rt, error, runContext, stepNumber, cancelled ? 'cancelled' : undefined);
  rt.options.streamingSink?.(toErrorEvent(call, error));
  span.setStatus(cancelled ? 'cancelled' : 'error', error.message);
  span.recordException(executeError);
  return frozenCompleted(call, error, stepNumber, durationMs);
}
