/**
 * Agent-step-level fan-out - `Agent.fanOut(...)` convenience that
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

import { createHash } from 'node:crypto';
import type { AgentEvent, FanOutChildMetadata } from '@graphorin/core';
import { MergeBlockedError } from '../errors/index.js';
import {
  type ContentOriginKind,
  computeSourceTrust,
  evaluateMerge,
  type MergeGuardConfig,
  type TrustClass,
} from '../lateral-leak/merge-guard.js';

/**
 * Per-child budget. Defaults derived from the canonical 2026
 * scaling-rule table for agent fan-out workloads.
 *
 * @stable
 */
export interface PerChildBudget {
  /**
   * Max `usage.totalTokens` per child. Enforced **post-hoc** and only
   * for usage-reporting children (an `invoke` that resolves to a full
   * `AgentResult` - e.g. `() => child.run(input)`); a child returning a
   * plain value reports `tokensUsed: 0` and this cap cannot fire.
   */
  readonly tokens?: number;
  /**
   * Max tool calls per child. Same usage-reporting contract as
   * {@link PerChildBudget.tokens} (counted from `state.steps`).
   */
  readonly toolCalls?: number;
  /** Wall-clock cap, enforced for every child via a race timer. */
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
 * that throws produces a `ChildResult` with `status: 'failed'` -
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
   * returning a `Promise<TOutput>` - the fan-out helper does not
   * impose an `Agent` shape on the children so the runtime can
   * adapt any callable surface.
   */
  readonly children: ReadonlyArray<{
    readonly agentId: string;
    /**
     * Child callable. Resolve to a plain `TOutput`, or to a full
     * `AgentResult` (e.g. `() => childAgent.run(input)`) - the fan-out
     * detects the result envelope structurally (`output` + numeric
     * `usage.totalTokens` + `state`), unwraps `output`, and harvests
     * `tokensUsed` / `toolCallCount` so per-child budgets can enforce.
     */
    readonly invoke: () => Promise<TOutput>;
    /** Trust-class for the merge guard (default `'loopback'`). */
    readonly trustClass?: TrustClass;
    /** Content-origin for the merge guard (default `'built-in'`). */
    readonly origin?: ContentOriginKind;
    /** Rolling trust adjustment in `[0,1]` (default `1`). */
    readonly historyAdjustment?: number;
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
  /**
   * Sideways-injection merge guard (AG-7): on `'judge-merge'` the
   * fan-out scores each child's source trust and contribution weight
   * against the judge's merged output; a biased merge emits
   * `agent.lateral-leak.detected` (vector `sideways-injection`) and -
   * under `strictness: 'detect-and-block'` - throws
   * {@link MergeBlockedError}.
   */
  readonly mergeGuard?: MergeGuardConfig;
  /** Identifiers required to populate the events. */
  readonly runId: string;
  readonly sessionId: string;
  readonly agentId: string;
  /** Default - generated from `runId + Date.now()`. */
  readonly fanOutId?: string;
}

const DEFAULT_MAX_CONCURRENT_CHILDREN = 4;

/**
 * Structurally detect a full `AgentResult` returned by a child
 * `invoke` (AG-16): an object carrying `output`, a numeric
 * `usage.totalTokens`, and a `state` with string `id`/`status`. The
 * three-field match makes accidental collision with a user `TOutput`
 * negligible; children whose genuine output looks like this should
 * resolve a plain value instead.
 */
function harvestAgentResult(
  value: unknown,
):
  | { readonly output: unknown; readonly tokensUsed: number; readonly toolCallCount: number }
  | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const v = value as {
    readonly output?: unknown;
    readonly usage?: { readonly totalTokens?: unknown };
    readonly state?: { readonly id?: unknown; readonly status?: unknown; readonly steps?: unknown };
  };
  if (!('output' in v)) return undefined;
  if (typeof v.usage?.totalTokens !== 'number') return undefined;
  if (typeof v.state?.id !== 'string' || typeof v.state.status !== 'string') return undefined;
  let toolCallCount = 0;
  if (Array.isArray(v.state.steps)) {
    for (const step of v.state.steps) {
      const calls = (step as { readonly toolCalls?: unknown }).toolCalls;
      if (Array.isArray(calls)) toolCallCount += calls.length;
    }
  }
  return { output: v.output, tokensUsed: v.usage.totalTokens, toolCallCount };
}

/**
 * Whitespace-token overlap of a child's output against the merged
 * output, in `[0,1]` - the contribution-weight estimate the merge
 * guard's docstring contracts (each child scored independently; a
 * judge parroting one child verbatim yields ~1.0 for that child).
 */
function contributionWeight(childText: string, mergedText: string): number {
  if (childText.length === 0 || mergedText.length === 0) return 0;
  const mergedTokens = mergedText.split(/\s+/).filter((t) => t.length > 0);
  if (mergedTokens.length === 0) return 0;
  const childTokens = new Set(childText.split(/\s+/).filter((t) => t.length > 0));
  let hits = 0;
  for (const token of mergedTokens) {
    if (childTokens.has(token)) hits += 1;
  }
  return hits / mergedTokens.length;
}

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
      if (signal?.aborted) {
        return {
          agentId: child.agentId,
          status: 'cancelled',
          tokensUsed: 0,
          toolCallCount: 0,
          durationMs: 0,
        };
      }
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
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
        const raw = await racePromise;
        // AG-16: a child resolving to a full AgentResult reports its
        // real usage - unwrap the output and harvest the counters.
        const report = harvestAgentResult(raw);
        const output = (report === undefined ? raw : report.output) as TOutput;
        const tokensUsed = report?.tokensUsed ?? 0;
        const toolCallCount = report?.toolCallCount ?? 0;
        // Post-hoc budget enforcement (only fires for usage-reporting
        // children): the over-budget output is withheld from the merge.
        const exceeded =
          (perBudget?.tokens !== undefined && tokensUsed > perBudget.tokens
            ? `tokens ${tokensUsed} > ${perBudget.tokens}`
            : undefined) ??
          (perBudget?.toolCalls !== undefined && toolCallCount > perBudget.toolCalls
            ? `toolCalls ${toolCallCount} > ${perBudget.toolCalls}`
            : undefined);
        if (exceeded !== undefined) {
          return {
            agentId: child.agentId,
            status: 'budget-exceeded',
            error: { message: `budget-exceeded: ${exceeded}`, code: 'budget-exceeded' },
            tokensUsed,
            toolCallCount,
            durationMs: Date.now() - start,
          };
        }
        return {
          agentId: child.agentId,
          status: 'completed',
          output,
          tokensUsed,
          toolCallCount,
          durationMs: Date.now() - start,
        };
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        const aborted = signal?.aborted;
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
      } finally {
        // AG-16: the duration timer must die on EVERY path - leaving it
        // armed on rejection held the event loop open.
        if (timer !== undefined) clearTimeout(timer);
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
 * Pure with respect to side effects - the runtime emits events /
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
    case 'judge-merge': {
      merged = await merge.judge(results);
      // AG-7: the sideways-injection merge guard scores each child's
      // source trust × contribution weight against the judge's merged
      // output. A biased merge emits `agent.lateral-leak.detected`;
      // 'detect-and-block' refuses the merge entirely.
      if (opts.mergeGuard !== undefined && opts.mergeGuard.strictness !== 'off') {
        const mergedText = typeof merged === 'string' ? merged : JSON.stringify(merged);
        const overrides = opts.mergeGuard.sourceTrustOverrides ?? {};
        const perChild = results.map((r, i) => {
          const c = opts.children[i];
          const childText =
            r.output === undefined
              ? ''
              : typeof r.output === 'string'
                ? r.output
                : JSON.stringify(r.output);
          return {
            agentId: r.agentId,
            sourceTrust: computeSourceTrust(
              {
                agentId: r.agentId,
                trustClass: c?.trustClass ?? 'loopback',
                origin: c?.origin ?? 'built-in',
                ...(c?.historyAdjustment !== undefined
                  ? { historyAdjustment: c.historyAdjustment }
                  : {}),
              },
              overrides,
            ),
            contributionWeight: contributionWeight(childText, mergedText),
          };
        });
        const verdict = evaluateMerge(perChild, opts.mergeGuard);
        if (verdict.biased) {
          opts.emit?.({
            type: 'agent.lateral-leak.detected',
            runId: opts.runId,
            sessionId: opts.sessionId,
            agentId: opts.agentId,
            vector: 'sideways-injection',
            severity: verdict.decision === 'block' ? 'block' : 'warn',
            causalityChain: verdict.offendingChild === undefined ? [] : [verdict.offendingChild],
            messageContentSha256: createHash('sha256').update(mergedText, 'utf8').digest('hex'),
            decision:
              verdict.decision === 'block'
                ? 'block'
                : verdict.decision === 'flag'
                  ? 'flag'
                  : 'detect',
            detectedAtIso: new Date().toISOString(),
          });
          if (verdict.decision === 'block') {
            throw new MergeBlockedError(
              fanOutId,
              `low-trust child '${verdict.offendingChild}' (sourceTrust ${verdict.sourceTrust?.toFixed(2)}) contributes ${(
                (verdict.contributionWeight ?? 0) * 100
              ).toFixed(0)}% of the merged output`,
            );
          }
        }
      }
      break;
    }
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
