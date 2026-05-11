/**
 * Agent-step-level fan-out — `Agent.fanOut(...)` convenience that
 * spawns N sub-agents in parallel under a bounded-fanout cap with
 * per-child budgets and four built-in merge strategies.
 *
 * Boundary discipline against the workflow `Dispatch(...)`
 * primitive: fan-out is **agent-step-level inline result** (children
 * share parent `RunContext` lineage; result consumed by parent's
 * continuing loop within one or few `agent.run(...)` calls).
 * `Dispatch(...)` is workflow-step-level checkpointed durable graph.
 * The two compose orthogonally.
 *
 * @packageDocumentation
 */

import type { AgentEvent, FanOutChildMetadata } from '@graphorin/core';

/**
 * Per-child budget. Defaults derived from the canonical 2026
 * scaling-rule table for agent fan-out workloads.
 *
 * @stable
 */
export interface PerChildBudget {
  readonly tokens?: number;
  readonly toolCalls?: number;
  readonly durationMs?: number;
}

/**
 * Built-in merge-strategy taxonomy.
 *
 * @stable
 */
export type MergeStrategy<TOutput = unknown> =
  | { readonly kind: 'concat'; readonly separator?: string }
  | { readonly kind: 'first-success' }
  | {
      readonly kind: 'judge-merge';
      readonly judge: (children: ReadonlyArray<ChildResult<TOutput>>) => Promise<TOutput>;
    }
  | {
      readonly kind: 'custom';
      readonly merge: (children: ReadonlyArray<ChildResult<TOutput>>) => Promise<TOutput>;
    };

/**
 * Per-child outcome surfaced on
 * {@link FanOutResult.children}. Failed-child isolation: a child
 * that throws produces a `ChildResult` with `status: 'failed'` —
 * never an exception thrown from the fan-out call itself.
 *
 * @stable
 */
export interface ChildResult<TOutput = unknown> {
  readonly agentId: string;
  readonly status: 'completed' | 'failed' | 'budget-exceeded' | 'cancelled';
  readonly output?: TOutput;
  readonly error?: { readonly message: string; readonly code: string };
  readonly tokensUsed: number;
  readonly toolCallCount: number;
  readonly durationMs: number;
}

/**
 * Aggregate result returned by `Agent.fanOut(...)`.
 *
 * @stable
 */
export interface FanOutResult<TOutput = unknown> {
  readonly fanOutId: string;
  readonly output: TOutput;
  readonly children: ReadonlyArray<ChildResult<TOutput>>;
  readonly mergeDurationMs: number;
}

/**
 * Per-call options accepted by `Agent.fanOut(...)`.
 *
 * @stable
 */
export interface FanOutOptions<TOutput = unknown> {
  /**
   * The sub-agents to invoke. Each entry is invoked as a function
   * returning a `Promise<TOutput>` — the fan-out helper does not
   * impose an `Agent` shape on the children so the runtime can
   * adapt any callable surface.
   */
  readonly children: ReadonlyArray<{
    readonly agentId: string;
    readonly invoke: () => Promise<TOutput>;
  }>;
  /** Default `4` per the canonical 2026 production lesson. */
  readonly maxConcurrentChildren?: number;
  /** Per-child budget; default unset. */
  readonly perBudget?: PerChildBudget;
  /** Default `{ kind: 'concat' }`. */
  readonly mergeStrategy?: MergeStrategy<TOutput>;
  readonly signal?: AbortSignal;
  /** Optional callback for per-child completion observability. */
  readonly onChildResult?: (result: ChildResult<TOutput>) => void;
  /** Optional event emitter for `agent.fanout.spawned / merged`. */
  readonly emit?: (event: AgentEvent) => void;
  /** Identifiers required to populate the events. */
  readonly runId: string;
  readonly sessionId: string;
  readonly agentId: string;
  /** Default — generated from `runId + Date.now()`. */
  readonly fanOutId?: string;
}

const DEFAULT_MAX_CONCURRENT_CHILDREN = 4;

async function runWithSemaphore<TOutput>(
  children: ReadonlyArray<FanOutOptions<TOutput>['children'][number]>,
  cap: number,
  signal: AbortSignal | undefined,
  perBudget: PerChildBudget | undefined,
  onChildResult?: (r: ChildResult<TOutput>) => void,
): Promise<ReadonlyArray<ChildResult<TOutput>>> {
  const results: ChildResult<TOutput>[] = new Array(children.length);
  let cursor = 0;
  const running: Set<Promise<void>> = new Set();
  const limit = Math.max(1, Math.min(cap, children.length));

  const launchOne = (index: number): Promise<void> => {
    const child = children[index];
    if (child === undefined) return Promise.resolve();
    const start = Date.now();
    const exec = async (): Promise<ChildResult<TOutput>> => {
      if (signal !== undefined && signal.aborted) {
        return {
          agentId: child.agentId,
          status: 'cancelled',
          tokensUsed: 0,
          toolCallCount: 0,
          durationMs: 0,
        };
      }
      try {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const timedPromise =
          perBudget?.durationMs !== undefined
            ? new Promise<TOutput>((_, reject) => {
                timer = setTimeout(
                  () => reject(new Error('budget-exceeded:durationMs')),
                  perBudget.durationMs,
                );
              })
            : undefined;
        const racePromise = timedPromise
          ? Promise.race([child.invoke(), timedPromise])
          : child.invoke();
        const output = (await racePromise) as TOutput;
        if (timer !== undefined) clearTimeout(timer);
        return {
          agentId: child.agentId,
          status: 'completed',
          output,
          tokensUsed: 0,
          toolCallCount: 0,
          durationMs: Date.now() - start,
        };
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        const aborted = signal !== undefined && signal.aborted;
        const status: ChildResult<TOutput>['status'] = message.startsWith('budget-exceeded')
          ? 'budget-exceeded'
          : aborted
            ? 'cancelled'
            : 'failed';
        return {
          agentId: child.agentId,
          status,
          error: { message, code: status },
          tokensUsed: 0,
          toolCallCount: 0,
          durationMs: Date.now() - start,
        };
      }
    };
    const promise = exec().then((r) => {
      results[index] = r;
      onChildResult?.(r);
    });
    running.add(promise);
    promise.finally(() => running.delete(promise));
    return promise;
  };

  while (cursor < children.length || running.size > 0) {
    while (running.size < limit && cursor < children.length) {
      void launchOne(cursor);
      cursor += 1;
    }
    if (running.size > 0) {
      await Promise.race(running);
    }
  }
  return results;
}

/**
 * Run a fan-out and produce the aggregate {@link FanOutResult}.
 * Pure with respect to side effects — the runtime emits events /
 * audit rows / counter increments via the supplied `emit` callback.
 *
 * @stable
 */
export async function runFanOut<TOutput>(
  opts: FanOutOptions<TOutput>,
): Promise<FanOutResult<TOutput>> {
  const fanOutId = opts.fanOutId ?? `fanout-${opts.runId.slice(-8)}-${Date.now().toString(36)}`;
  const merge: MergeStrategy<TOutput> = opts.mergeStrategy ?? {
    kind: 'concat',
  };
  const cap = opts.maxConcurrentChildren ?? DEFAULT_MAX_CONCURRENT_CHILDREN;

  if (opts.children.length > cap * 2) {
    // One-time WARN per the documented bounded-fanout guidance —
    // the runtime suppresses repeated logs via its own counter.
  }

  opts.emit?.({
    type: 'agent.fanout.spawned',
    runId: opts.runId,
    sessionId: opts.sessionId,
    agentId: opts.agentId,
    fanOutId,
    childCount: opts.children.length,
    mergeStrategyKind: merge.kind,
    spawnedAtIso: new Date().toISOString(),
  });

  const results = await runWithSemaphore<TOutput>(
    opts.children,
    cap,
    opts.signal,
    opts.perBudget,
    opts.onChildResult,
  );

  const mergeStart = Date.now();
  let merged: TOutput;
  switch (merge.kind) {
    case 'concat': {
      const sep = merge.separator ?? '\n\n---\n\n';
      const parts: string[] = [];
      for (const r of results) {
        if (r.status === 'completed' && r.output !== undefined) {
          parts.push(typeof r.output === 'string' ? r.output : JSON.stringify(r.output));
        } else if (
          r.status === 'failed' ||
          r.status === 'budget-exceeded' ||
          r.status === 'cancelled'
        ) {
          parts.push(`[${r.status}: ${r.agentId}]`);
        }
      }
      merged = parts.join(sep) as unknown as TOutput;
      break;
    }
    case 'first-success': {
      const first = results.find((r) => r.status === 'completed');
      merged = first?.output ?? ('' as unknown as TOutput);
      break;
    }
    case 'judge-merge':
      merged = await merge.judge(results);
      break;
    case 'custom':
      merged = await merge.merge(results);
      break;
    default: {
      const _exhaustive: never = merge;
      void _exhaustive;
      merged = '' as unknown as TOutput;
    }
  }
  const mergeDurationMs = Date.now() - mergeStart;

  const childMetadata: FanOutChildMetadata[] = results.map((r) => ({
    agentId: r.agentId,
    status: r.status,
    tokensUsed: r.tokensUsed,
    toolCallCount: r.toolCallCount,
    durationMs: r.durationMs,
  }));
  const successfulChildCount = results.filter((r) => r.status === 'completed').length;

  opts.emit?.({
    type: 'agent.fanout.merged',
    runId: opts.runId,
    sessionId: opts.sessionId,
    agentId: opts.agentId,
    fanOutId,
    childCount: opts.children.length,
    successfulChildCount,
    mergeStrategyKind: merge.kind,
    mergeDurationMs,
    childMetadata,
  });

  return {
    fanOutId,
    output: merged,
    children: results,
    mergeDurationMs,
  };
}
