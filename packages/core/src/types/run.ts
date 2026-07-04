import type { Tracer } from '../contracts/tracer.js';
import type { HandoffRecord } from './handoff.js';
import type { Message } from './message.js';
import type { CompletedToolCall, ToolApproval } from './tool.js';
import type { ToolCall } from './tool-call.js';
import type { ModelUsage, Usage, UsageAccumulator } from './usage.js';

/**
 * Status of an in-flight or completed agent run. Append-only persistence
 * stores expose this verbatim on the `runs` table.
 *
 * @stable
 */
export type RunStatus = 'running' | 'completed' | 'failed' | 'aborted' | 'awaiting_approval';

/**
 * Single step inside an agent run. The agent runtime appends one
 * `RunStep` per provider call.
 *
 * @stable
 */
export interface RunStep {
  readonly stepNumber: number;
  readonly startedAt: string;
  readonly endedAt?: string;
  readonly usage?: Usage;
  readonly toolCalls: readonly CompletedToolCall[];
  /**
   * Stable agent id active for this step (changes after a handoff).
   */
  readonly agentId: string;
  /**
   * The model response this step produced, recorded when the agent runs
   * with `recordProviderResponses: true` (C3). Enables deterministic
   * replay: `createReplayProvider(state)` serves these back in order so
   * a run re-executes without live model calls.
   */
  readonly providerResponse?: RunStepProviderResponse;
}

/**
 * Journaled model response for one step (C3, opt-in via the agent's
 * `recordProviderResponses`). Captures the RAW model output — the text
 * before any lateral-leak block replaced it in the transcript — so a
 * replay reproduces the original run faithfully.
 *
 * @stable
 */
export interface RunStepProviderResponse {
  readonly modelId: string;
  readonly text?: string;
  readonly toolCalls?: ReadonlyArray<ToolCall>;
}

/**
 * Per-model usage breakdown carried alongside the aggregate
 * {@link Usage} on {@link RunState}. Populated by the per-step retry
 * loop when `Agent.fallbackModels` fires; for runs that never fall
 * back, the map carries a single entry for the primary model with
 * `attemptCount: 1`.
 *
 * The aggregate `RunState.usage` is always the sum of every entry's
 * `Usage` portion (the field is asserted in tests).
 *
 * @stable
 */
export interface RunStateUsageByModel {
  readonly [modelId: string]: Usage & { readonly attemptCount: number };
}

/**
 * The full, serializable state of a run. The agent runtime persists this
 * to the checkpoint store on every `awaiting_approval` boundary, so a
 * separate process can resume the run.
 *
 * The shape is intentionally JSON-stable: every nested type is plain
 * `JSON`-encodable (no `Map`, no `Set`, no `Date`).
 *
 * @stable
 */
export interface RunState {
  readonly id: string;
  readonly agentId: string;
  readonly currentAgentId: string;
  readonly sessionId: string;
  readonly userId?: string;
  status: RunStatus;
  readonly steps: RunStep[];
  readonly messages: Message[];
  readonly pendingApprovals: ToolApproval[];
  readonly handoffs: HandoffRecord[];
  readonly usage: Usage;
  /**
   * Per-model usage breakdown. Populated by the per-step retry loop
   * when `Agent.fallbackModels` fires (RB-48 / suggested DEC-164 /
   * suggested ADR-052). Backward-compat: rehydrating a serialized
   * state that omits the field synthesizes a single-entry map for
   * the primary model.
   */
  usageByModel?: RunStateUsageByModel;
  /**
   * AG-19: coarse data-flow taint summary, carried across suspend/resume so a
   * resumed run does not start with an empty ledger that silently un-gates
   * sinks exposed before the suspend. Structurally matches
   * `@graphorin/security`'s `TaintLedgerSnapshot` (core takes no security
   * dependency); only the load-bearing flags are persisted — never the tracked
   * untrusted text spans.
   */
  taintSummary?: RunTaintSummary;
  /**
   * AG-19: names of deferred tools promoted by `tool_search` this run, carried
   * across suspend/resume so discovered tools remain in the per-step catalogue.
   */
  promotedTools?: ReadonlyArray<string>;
  readonly startedAt: string;
  finishedAt?: string;
  error?: RunError;
}

/**
 * Coarse, serializable data-flow taint summary persisted in {@link RunState}
 * across suspend/resume (AG-19). Structurally identical to
 * `@graphorin/security`'s `TaintLedgerSnapshot`; carries no untrusted text.
 *
 * @stable
 */
export interface RunTaintSummary {
  readonly untrustedSeen: boolean;
  readonly sensitiveSeen: boolean;
  readonly untrustedSourceKinds: ReadonlyArray<string>;
  /**
   * C6: one-way FNV-1a hashes of normalized untrusted-span tiles. Re-arms
   * the verbatim-carry probe after a resume at tile granularity. Hashes
   * only — no untrusted text is ever persisted (the invariant above
   * holds).
   */
  readonly spanTileHashes?: ReadonlyArray<string>;
}

/**
 * Snapshot helper used by `@graphorin/observability` aggregators to
 * convert the on-disk `usageByModel` shape into the canonical
 * {@link ModelUsage} array. Pure utility — kept in core so consumers
 * do not have to take an observability dependency just to flatten a
 * run-state breakdown.
 *
 * @stable
 */
export function flattenUsageByModel(
  byModel: RunStateUsageByModel | undefined,
): ReadonlyArray<ModelUsage> {
  if (byModel === undefined) return [];
  const out: ModelUsage[] = [];
  for (const [modelId, entry] of Object.entries(byModel)) {
    const m: ModelUsage = {
      modelId,
      promptTokens: entry.promptTokens,
      completionTokens: entry.completionTokens,
      totalTokens: entry.totalTokens,
      callCount: entry.attemptCount,
      ...(entry.reasoningTokens !== undefined ? { reasoningTokens: entry.reasoningTokens } : {}),
      ...(entry.cost !== undefined ? { cost: entry.cost } : {}),
    };
    out.push(m);
  }
  return out;
}

/**
 * Failure carried by `RunState.error`. The shape mirrors the wire format
 * used by `agent.error` events.
 *
 * @stable
 */
export interface RunError {
  readonly message: string;
  readonly code: string;
  readonly details?: unknown;
}

/**
 * Per-run dependency / context bag handed to every tool, hook and
 * provider middleware in scope. Generic over the user-defined deps shape.
 *
 * `tracer`, `signal`, `usage` and `state` are always present; everything
 * else is optional.
 *
 * @stable
 */
export interface RunContext<TDeps = unknown> {
  readonly runId: string;
  readonly sessionId: string;
  readonly userId?: string;
  readonly agentId: string;
  readonly deps: TDeps;
  readonly tracer: Tracer;
  readonly signal: AbortSignal;
  readonly usage: UsageAccumulator;
  readonly stepNumber: number;
  readonly messages: ReadonlyArray<Message>;
  readonly state: RunState;
  /**
   * C7: the current `agent.step` span (when the runtime traces). Spans
   * created inside tool execution parent under it so a run's traces
   * form one tree.
   */
  readonly span?: import('../contracts/tracer.js').AISpan;
}
