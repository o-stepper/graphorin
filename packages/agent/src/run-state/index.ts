/**
 * `RunState` JSON serialization and rehydration.
 *
 * The on-disk shape carries an explicit `version` field so future
 * schema bumps can detect older payloads. v0.1 ships
 * `'graphorin-run-state/1.0'` — additive fields that older readers
 * do not understand are ignored under the lenient-forward-parse
 * discipline.
 *
 * @packageDocumentation
 */

import type {
  CompletedToolCall,
  HandoffRecord,
  Message,
  RunState,
  RunStateUsageByModel,
  RunStatus,
  RunStep,
  RunTaintSummary,
  ToolApproval,
  Usage,
} from '@graphorin/core';
import { zeroUsage } from '@graphorin/core';
import { RunStateMalformedError, RunStateVersionUnsupportedError } from '../errors/index.js';

/**
 * Canonical schema id for serialized {@link RunState} payloads.
 *
 * @stable
 */
export const RUN_STATE_SCHEMA_VERSION = 'graphorin-run-state/1.1' as const;

/**
 * Reader-supported schema id range. Major version 1 only for v0.1.
 *
 * @stable
 */
export const RUN_STATE_SCHEMA_MAJOR_SUPPORTED = 1;

/**
 * On-disk payload returned by {@link serializeRunState} and accepted
 * by {@link deserializeRunState}. The shape is JSON-stable.
 *
 * @stable
 */
export interface SerializedRunState {
  readonly version: typeof RUN_STATE_SCHEMA_VERSION;
  readonly id: string;
  readonly agentId: string;
  readonly currentAgentId: string;
  readonly sessionId: string;
  readonly userId?: string;
  readonly status: RunStatus;
  readonly steps: ReadonlyArray<RunStep>;
  readonly messages: ReadonlyArray<Message>;
  readonly pendingApprovals: ReadonlyArray<ToolApproval>;
  readonly handoffs: ReadonlyArray<HandoffRecord>;
  readonly usage: Usage;
  readonly usageByModel?: RunStateUsageByModel;
  /** AG-19: coarse data-flow taint summary (no untrusted text). */
  readonly taintSummary?: RunTaintSummary;
  /** AG-19: deferred tools promoted by `tool_search` this run. */
  readonly promotedTools?: ReadonlyArray<string>;
  readonly startedAt: string;
  readonly finishedAt?: string;
  readonly error?: { readonly message: string; readonly code: string; readonly details?: unknown };
}

/**
 * Options accepted by {@link serializeRunState}.
 *
 * @stable
 */
export interface SerializeRunStateOptions {
  /**
   * Deep-redact secret-named keys (`apiKey`, `authorization`,
   * `bearerToken` / `accessToken` / `refreshToken`, `password`,
   * `secret`, …) anywhere in the snapshot — tool results and messages
   * included — replacing their values with `'[redacted]'`. Defaults to
   * `false` for the round-trip canonical helper; the agent runtime
   * passes `true` when persisting through the checkpoint store
   * (AG-23). Redaction is best-effort by key name: secrets stored
   * under unrelated keys are not detected.
   */
  readonly stripTracingApiKey?: boolean;
}

/**
 * Render a JSON-stable snapshot of the supplied {@link RunState}.
 * The returned value is plain JSON (no `Map`, `Set`, `Date`, ...).
 *
 * @stable
 */
export function serializeRunState(
  state: RunState,
  options: SerializeRunStateOptions = {},
): SerializedRunState {
  const out: SerializedRunState = {
    version: RUN_STATE_SCHEMA_VERSION,
    id: state.id,
    agentId: state.agentId,
    currentAgentId: state.currentAgentId,
    sessionId: state.sessionId,
    ...(state.userId !== undefined ? { userId: state.userId } : {}),
    status: state.status,
    steps: state.steps,
    messages: state.messages,
    pendingApprovals: state.pendingApprovals,
    handoffs: state.handoffs,
    usage: state.usage,
    ...(state.usageByModel !== undefined ? { usageByModel: state.usageByModel } : {}),
    ...(state.taintSummary !== undefined ? { taintSummary: state.taintSummary } : {}),
    ...(state.promotedTools !== undefined ? { promotedTools: state.promotedTools } : {}),
    startedAt: state.startedAt,
    ...(state.finishedAt !== undefined ? { finishedAt: state.finishedAt } : {}),
    ...(state.error !== undefined ? { error: state.error } : {}),
  };
  // AG-23: the snapshot must be DETACHED from the live MutableRunState —
  // a post-suspend mutation must never reach an already-persisted
  // checkpoint. The JSON round-trip doubles as the plain-JSON guarantee
  // this function documents (no Map/Set/Date survive it).
  const detached = JSON.parse(JSON.stringify(out)) as SerializedRunState;
  if (options.stripTracingApiKey === true) {
    redactSecretKeysInPlace(detached);
  }
  return detached;
}

/**
 * Key names whose values are redacted by
 * `serializeRunState(state, { stripTracingApiKey: true })`.
 */
const SECRET_KEY_PATTERN =
  /^(api[-_]?key|tracing[-_]?api[-_]?key|x-api-key|authorization|bearer[-_]?token|access[-_]?token|refresh[-_]?token|secret|password|passphrase)$/i;

const REDACTED = '[redacted]';

function redactSecretKeysInPlace(value: unknown): void {
  if (typeof value !== 'object' || value === null) return;
  if (Array.isArray(value)) {
    for (const item of value) redactSecretKeysInPlace(item);
    return;
  }
  const record = value as Record<string, unknown>;
  // Tool messages embed the tool output as a JSON STRING in `content` —
  // parse, redact, and re-stringify so a secret inside the string form
  // is caught too.
  if (record.role === 'tool' && typeof record.content === 'string') {
    record.content = redactJsonString(record.content);
  }
  for (const [key, inner] of Object.entries(record)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      record[key] = REDACTED;
      continue;
    }
    redactSecretKeysInPlace(inner);
  }
}

function redactJsonString(content: string): string {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return content;
    redactSecretKeysInPlace(parsed);
    return JSON.stringify(parsed);
  } catch {
    return content;
  }
}

/**
 * Render the canonical JSON string representation of the supplied
 * {@link RunState}. `JSON.stringify(serializeRunState(state))` —
 * provided as a convenience.
 *
 * @stable
 */
export function runStateToJSON(state: RunState, options?: SerializeRunStateOptions): string {
  return JSON.stringify(serializeRunState(state, options));
}

interface DeserializeOptions {
  /**
   * Synthesize `usageByModel` from a v0.1-alpha state that omits
   * the field. Defaults to `true` so callers can rehydrate older
   * states without explicit migration.
   */
  readonly synthesizeUsageByModel?: boolean;
  /**
   * Logger callback for one-time INFO messages emitted on
   * backwards-compat synthesis. Defaults to a no-op.
   */
  readonly logger?: (message: string) => void;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Rehydrate a {@link RunState} from the on-disk payload. Throws
 * {@link RunStateVersionUnsupportedError} when the payload version
 * is from a future major; throws
 * {@link RunStateMalformedError} when the payload is structurally
 * invalid.
 *
 * Backwards-compat: a payload that omits `usageByModel` is accepted
 * and the field is synthesized from the aggregate `usage` with
 * `attemptCount: 1` for the primary model.
 *
 * @stable
 */
export function deserializeRunState(payload: unknown, options: DeserializeOptions = {}): RunState {
  if (!isRecord(payload)) {
    throw new RunStateMalformedError('payload must be an object');
  }
  const versionRaw = payload.version;
  if (typeof versionRaw !== 'string') {
    throw new RunStateMalformedError("missing 'version' field");
  }
  const versionMatch = /^graphorin-run-state\/(\d+)\.(\d+)$/.exec(versionRaw);
  if (versionMatch === null) {
    throw new RunStateMalformedError(`unrecognized version '${versionRaw}'`);
  }
  const major = Number(versionMatch[1]);
  if (major > RUN_STATE_SCHEMA_MAJOR_SUPPORTED) {
    throw new RunStateVersionUnsupportedError(versionRaw, RUN_STATE_SCHEMA_VERSION);
  }
  const requiredString = (key: string): string => {
    const v = payload[key];
    if (typeof v !== 'string') {
      throw new RunStateMalformedError(`missing string '${key}' field`);
    }
    return v;
  };
  const requiredArray = <T>(key: string): T[] => {
    const v = payload[key];
    if (!Array.isArray(v)) {
      throw new RunStateMalformedError(`missing array '${key}' field`);
    }
    return v as T[];
  };
  const id = requiredString('id');
  const agentId = requiredString('agentId');
  const currentAgentId =
    typeof payload.currentAgentId === 'string' ? payload.currentAgentId : agentId;
  const sessionId = requiredString('sessionId');
  const status = requiredString('status') as RunStatus;
  const steps = requiredArray<RunStep>('steps');
  const messages = requiredArray<Message>('messages');
  const pendingApprovals = requiredArray<ToolApproval>('pendingApprovals');
  const handoffs = requiredArray<HandoffRecord>('handoffs');
  const usageRaw = payload.usage;
  if (!isRecord(usageRaw)) {
    throw new RunStateMalformedError("missing object 'usage' field");
  }
  const usage: Usage = {
    promptTokens: Number(usageRaw.promptTokens ?? 0),
    completionTokens: Number(usageRaw.completionTokens ?? 0),
    totalTokens: Number(usageRaw.totalTokens ?? 0),
    ...(usageRaw.reasoningTokens !== undefined
      ? { reasoningTokens: Number(usageRaw.reasoningTokens) }
      : {}),
    ...(isRecord(usageRaw.cost)
      ? {
          cost: {
            amount: Number(usageRaw.cost.amount ?? 0),
            currency: String(usageRaw.cost.currency ?? 'USD'),
          },
        }
      : {}),
  };
  const startedAt = requiredString('startedAt');
  const userIdRaw = payload.userId;
  const finishedAtRaw = payload.finishedAt;
  const errorRaw = payload.error;
  let error: RunState['error'];
  if (isRecord(errorRaw)) {
    error = {
      message: typeof errorRaw.message === 'string' ? errorRaw.message : 'unknown',
      code: typeof errorRaw.code === 'string' ? errorRaw.code : 'unknown',
      ...(errorRaw.details !== undefined ? { details: errorRaw.details } : {}),
    };
  }

  // Backwards-compat synthesis for usageByModel.
  let usageByModel: RunStateUsageByModel | undefined;
  if (isRecord(payload.usageByModel)) {
    const m: Record<string, Usage & { attemptCount: number }> = {};
    for (const [modelId, entryRaw] of Object.entries(payload.usageByModel)) {
      if (!isRecord(entryRaw)) continue;
      m[modelId] = {
        promptTokens: Number(entryRaw.promptTokens ?? 0),
        completionTokens: Number(entryRaw.completionTokens ?? 0),
        totalTokens: Number(entryRaw.totalTokens ?? 0),
        attemptCount: Number(entryRaw.attemptCount ?? 1),
        ...(entryRaw.reasoningTokens !== undefined
          ? { reasoningTokens: Number(entryRaw.reasoningTokens) }
          : {}),
        ...(isRecord(entryRaw.cost)
          ? {
              cost: {
                amount: Number(entryRaw.cost.amount ?? 0),
                currency: String(entryRaw.cost.currency ?? 'USD'),
              },
            }
          : {}),
      };
    }
    usageByModel = m;
  } else if (options.synthesizeUsageByModel !== false && Number.isFinite(usage.totalTokens)) {
    usageByModel = {
      [agentId]: { ...usage, attemptCount: 1 },
    };
    options.logger?.(
      `[graphorin/agent] RunState v0.1-alpha synthesis: per-model breakdown derived from aggregate usage for agent '${agentId}'.`,
    );
  }

  // AG-19: rehydrate the coarse taint summary + promoted-tool set (additive;
  // absent on older v1.0 payloads).
  let taintSummary: RunTaintSummary | undefined;
  if (isRecord(payload.taintSummary)) {
    const ts = payload.taintSummary;
    taintSummary = {
      untrustedSeen: ts.untrustedSeen === true,
      sensitiveSeen: ts.sensitiveSeen === true,
      untrustedSourceKinds: Array.isArray(ts.untrustedSourceKinds)
        ? ts.untrustedSourceKinds.filter((k): k is string => typeof k === 'string')
        : [],
    };
  }
  const promotedTools = Array.isArray(payload.promotedTools)
    ? payload.promotedTools.filter((t): t is string => typeof t === 'string')
    : undefined;

  const out: RunState = {
    id,
    agentId,
    currentAgentId,
    sessionId,
    ...(typeof userIdRaw === 'string' ? { userId: userIdRaw } : {}),
    status,
    steps,
    messages,
    pendingApprovals,
    handoffs,
    usage,
    ...(usageByModel !== undefined ? { usageByModel } : {}),
    ...(taintSummary !== undefined ? { taintSummary } : {}),
    ...(promotedTools !== undefined ? { promotedTools } : {}),
    startedAt,
    ...(typeof finishedAtRaw === 'string' ? { finishedAt: finishedAtRaw } : {}),
    ...(error !== undefined ? { error } : {}),
  };
  void zeroUsage; // kept available; some callers prefer zeroUsage as a default.
  return out;
}

/** Convenience JSON-string parser pairing with {@link runStateToJSON}. */
export function runStateFromJSON(serialized: string, options?: DeserializeOptions): RunState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new RunStateMalformedError(`invalid JSON: ${message}`);
  }
  return deserializeRunState(parsed, options);
}

/**
 * Build a fresh, minimal {@link RunState} for a new run. Helper used
 * by `createAgent({...})` so consumers can construct deterministic
 * run state in tests.
 *
 * @stable
 */
export function createInitialRunState(args: {
  readonly id: string;
  readonly agentId: string;
  readonly sessionId: string;
  readonly userId?: string;
  readonly startedAt?: string;
}): RunState {
  return {
    id: args.id,
    agentId: args.agentId,
    currentAgentId: args.agentId,
    sessionId: args.sessionId,
    ...(args.userId !== undefined ? { userId: args.userId } : {}),
    status: 'running',
    steps: [],
    messages: [],
    pendingApprovals: [],
    handoffs: [],
    usage: zeroUsage(),
    startedAt: args.startedAt ?? new Date().toISOString(),
  };
}

/**
 * Append a per-model usage entry to {@link RunState.usageByModel}.
 * Mutates the supplied state in place — used by the agent runtime's
 * per-step retry loop. Pure callers that need an immutable update
 * should clone the state first.
 *
 * @stable
 */
export function addModelUsage(state: RunState, modelId: string, delta: Usage): void {
  const current = (state.usageByModel ?? {}) as Record<string, Usage & { attemptCount: number }>;
  const prev = current[modelId];
  const merged: Usage & { attemptCount: number } = prev
    ? {
        promptTokens: prev.promptTokens + delta.promptTokens,
        completionTokens: prev.completionTokens + delta.completionTokens,
        totalTokens: prev.totalTokens + delta.totalTokens,
        ...(delta.reasoningTokens !== undefined || prev.reasoningTokens !== undefined
          ? {
              reasoningTokens: (prev.reasoningTokens ?? 0) + (delta.reasoningTokens ?? 0),
            }
          : {}),
        attemptCount: prev.attemptCount + 1,
        ...(prev.cost !== undefined ? { cost: prev.cost } : {}),
      }
    : { ...delta, attemptCount: 1 };
  current[modelId] = merged;
  // Mutate via the writable typing — `usageByModel` is declared
  // optional; the runtime owns the field's lifecycle.
  (state as { usageByModel?: RunStateUsageByModel }).usageByModel = current;
}

/**
 * Recompute the aggregate usage from `usageByModel`. Returns the
 * sum that callers can compare against `state.usage` to verify the
 * per-step retry loop maintained the documented invariant.
 *
 * @stable
 */
export function aggregateUsageFromByModel(byModel: RunStateUsageByModel | undefined): Usage {
  if (byModel === undefined) return zeroUsage();
  let pt = 0;
  let ct = 0;
  let tt = 0;
  let rt = 0;
  let hasReasoning = false;
  for (const entry of Object.values(byModel)) {
    pt += entry.promptTokens;
    ct += entry.completionTokens;
    tt += entry.totalTokens;
    if (entry.reasoningTokens !== undefined) {
      rt += entry.reasoningTokens;
      hasReasoning = true;
    }
  }
  return {
    promptTokens: pt,
    completionTokens: ct,
    totalTokens: tt,
    ...(hasReasoning ? { reasoningTokens: rt } : {}),
  };
}

/**
 * The "tools used" surface of a completed run. Cheap to compute
 * from `RunState.steps`; surfaced as a stand-alone helper for
 * Phase 17 example apps and operator-facing dashboards.
 *
 * @stable
 */
export function completedToolCallsFromState(state: RunState): ReadonlyArray<CompletedToolCall> {
  const out: CompletedToolCall[] = [];
  for (const step of state.steps) {
    for (const tc of step.toolCalls) out.push(tc);
  }
  return out;
}
