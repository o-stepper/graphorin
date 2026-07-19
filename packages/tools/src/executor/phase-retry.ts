/**
 * Retry phase: transparent bounded retry for transient tool
 * failures around a single-attempt runner. See
 * `ExecutorOptions.retry` for the semantics and defaults.
 *
 * @packageDocumentation
 */

import type { CompletedToolCall, ResolvedTool, RunContext, ToolErrorKind } from '@graphorin/core';

import { incrementCounter } from '../audit/index.js';
import { ToolRateLimitError } from './tool-errors.js';
import type { ExecutorRuntime } from './types.js';

// C3: transparent bounded retry for transient failures. Only kinds in
// the retry set are eligible, and - critical for correctness - only
// when re-running cannot double a side effect: pure/read-only tools,
// or tools declaring an idempotencyKey. Each attempt gets its own
// tool.execute span; the model never sees the swallowed attempts.
export async function runWithRetry(
  rt: ExecutorRuntime,
  tool: ResolvedTool,
  runContext: RunContext,
  attempt: () => Promise<CompletedToolCall>,
): Promise<CompletedToolCall> {
  const retryCfg = rt.options.retry;
  const maxAttempts = Math.max(1, retryCfg?.maxAttempts ?? 3);
  const retryKinds: ReadonlySet<ToolErrorKind> = new Set(retryCfg?.kinds ?? ['rate_limited']);
  const baseBackoffMs = retryCfg?.backoffMs ?? 250;
  const retrySafe =
    tool.__sideEffectClass === 'pure' ||
    tool.__sideEffectClass === 'read-only' ||
    tool.__hasIdempotencyKey;

  let completed = await attempt();
  let attemptsUsed = 1;
  while (
    attemptsUsed < maxAttempts &&
    retrySafe &&
    'kind' in completed.outcome &&
    retryKinds.has(completed.outcome.kind) &&
    !runContext.signal.aborted
  ) {
    const failedKind = completed.outcome.kind;
    const retryAfterMs =
      completed.outcome.cause instanceof ToolRateLimitError
        ? completed.outcome.cause.retryAfterMs
        : undefined;
    const delayMs = retryAfterMs ?? baseBackoffMs * 2 ** (attemptsUsed - 1);
    incrementCounter('tool.executor.retry.total', { toolName: tool.name, kind: failedKind });
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, delayMs);
      runContext.signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
    });
    if (runContext.signal.aborted) break;
    completed = await attempt();
    attemptsUsed += 1;
  }
  return completed;
}
