/**
 * Cassette substitution-vs-live decision engine. Given a cassette
 * (file / inline / stream) and a `ToolReplayMode`, the engine plays
 * out the per-tool decisions per the
 * `'pure'` / `'read-only'` / `'side-effecting'` / `'external-stateful'`
 * matrix.
 *
 * The orchestration with an actual agent runtime — actually invoking
 * tools live, threading the substituted result back into the agent
 * loop — lives in `@graphorin/agent`. This file owns the **decision**
 * layer: pure functions that take the cassette + the live invocation
 * and return an event the runtime acts on.
 *
 * @packageDocumentation
 */

import { createHash } from 'node:crypto';
import type { SideEffectClass } from '@graphorin/core';
import { CassetteIdempotencyMismatchError, CassetteSchemaMismatchError } from '../errors/index.js';
import type { ToolCallRecord } from './types.js';

/**
 * Operator-facing reason surfaced on every cassette decision event.
 *
 * @stable
 */
export type CassetteReplayReason =
  | 'auto-policy'
  | 'auto-policy-safety-gate'
  | 'live-mode-forced'
  | 'mixed-mode-per-tool'
  | 'idempotency-mismatch-fallback';

/**
 * Single decision the replay engine reports per cassette record.
 *
 * @stable
 */
export type CassetteReplayDecision =
  | {
      readonly type: 'tool.cassette.replay.substituted';
      readonly toolName: string;
      readonly toolCallId: string;
      readonly stepNumber: number;
      readonly sideEffectClass: SideEffectClass;
      readonly substitutedOutput: unknown;
      readonly reason: CassetteReplayReason;
    }
  | {
      readonly type: 'tool.cassette.replay.live';
      readonly toolName: string;
      readonly toolCallId: string;
      readonly stepNumber: number;
      readonly sideEffectClass: SideEffectClass;
      readonly reason: CassetteReplayReason;
      readonly warnLevel: 'INFO' | 'WARN-non-silenceable' | 'WARN';
    }
  | {
      readonly type: 'tool.cassette.replay.idempotency-mismatch';
      readonly toolName: string;
      readonly toolCallId: string;
      readonly stepNumber: number;
      readonly sideEffectClass: SideEffectClass;
      readonly recordedSha256OfArgs: string;
      readonly liveSha256OfArgs: string;
      readonly recordedIdempotencyKey?: string;
      readonly liveIdempotencyKey?: string;
      readonly decision: 'continue-with-recorded' | 'aborted' | 'fallback-live';
    }
  | {
      readonly type: 'tool.cassette.replay.artifact-missing';
      readonly toolName: string;
      readonly toolCallId: string;
      readonly stepNumber: number;
      readonly missingArtifactPath: string;
      readonly decision: 'aborted' | 'fallback-live';
    };

/**
 * Live invocation surface threaded into `decideToolReplay(...)` by
 * the agent runtime at the moment of tool dispatch.
 *
 * @stable
 */
export interface CassetteLiveInvocation {
  readonly toolName: string;
  readonly args: unknown;
  /**
   * Resolved live `idempotencyKey(input, ctx)` output, if the tool
   * declares the optional callback. `undefined` means the tool does
   * not declare one.
   */
  readonly idempotencyKey?: string;
  /**
   * Validate the cassette's recorded `output` against the live
   * tool's `outputSchema`. Returning a non-empty issues string
   * signals a schema drift; the engine surfaces a
   * {@link CassetteSchemaMismatchError} when `failOnSchemaMismatch`
   * is `true`.
   */
  validateRecordedOutput?: (output: unknown) => string | null;
}

/**
 * Configuration consumed by {@link decideToolReplay}.
 *
 * @stable
 */
export interface CassetteReplayPolicyOptions {
  readonly mode: 'auto' | 'live' | 'recorded' | 'mixed';
  readonly perToolMode?: Readonly<Record<string, 'live' | 'recorded'>>;
  readonly failOnIdempotencyMismatch?: boolean;
  readonly failOnSchemaMismatch?: boolean;
}

/**
 * Pure-function decision engine. Takes a single cassette record + the
 * live invocation and returns either a `'substituted'` /
 * `'idempotency-mismatch'` / `'live'` decision per the policy matrix.
 *
 * The engine never side-effects; the runtime acts on the returned
 * decision.
 *
 * @stable
 */
export function decideToolReplay(
  recorded: ToolCallRecord,
  live: CassetteLiveInvocation,
  policy: CassetteReplayPolicyOptions,
): CassetteReplayDecision {
  const mode = policy.mode;
  const overrideMode = policy.perToolMode?.[recorded.toolName];

  // 1) Hard-mode overrides.
  if (mode === 'live') {
    return {
      type: 'tool.cassette.replay.live',
      toolName: recorded.toolName,
      toolCallId: recorded.toolCallId,
      stepNumber: recorded.stepNumber,
      sideEffectClass: recorded.sideEffectClass,
      reason: 'live-mode-forced',
      warnLevel: 'INFO',
    };
  }
  if (mode === 'recorded') {
    return substituteDecision(recorded, 'auto-policy');
  }
  if (mode === 'mixed' && overrideMode !== undefined) {
    return overrideMode === 'recorded'
      ? substituteDecision(recorded, 'mixed-mode-per-tool')
      : {
          type: 'tool.cassette.replay.live',
          toolName: recorded.toolName,
          toolCallId: recorded.toolCallId,
          stepNumber: recorded.stepNumber,
          sideEffectClass: recorded.sideEffectClass,
          reason: 'mixed-mode-per-tool',
          warnLevel: 'INFO',
        };
  }

  // 2) Auto policy honouring the per-class matrix.
  switch (recorded.sideEffectClass) {
    case 'pure':
    case 'read-only': {
      // Idempotency check.
      const mismatch = detectIdempotencyMismatch(recorded, live);
      if (mismatch !== null) {
        const decision =
          policy.failOnIdempotencyMismatch === true ? 'aborted' : 'continue-with-recorded';
        if (decision === 'aborted') {
          throw new CassetteIdempotencyMismatchError(
            recorded.toolName,
            recorded.sha256OfArgs ?? '',
            mismatch.liveSha256,
          );
        }
        return {
          type: 'tool.cassette.replay.idempotency-mismatch',
          toolName: recorded.toolName,
          toolCallId: recorded.toolCallId,
          stepNumber: recorded.stepNumber,
          sideEffectClass: recorded.sideEffectClass,
          recordedSha256OfArgs: recorded.sha256OfArgs ?? '',
          liveSha256OfArgs: mismatch.liveSha256,
          ...(recorded.idempotencyKey !== undefined
            ? { recordedIdempotencyKey: recorded.idempotencyKey }
            : {}),
          ...(live.idempotencyKey !== undefined ? { liveIdempotencyKey: live.idempotencyKey } : {}),
          decision,
        };
      }
      // Schema check.
      const issues = live.validateRecordedOutput?.(recorded.output);
      if (issues !== null && issues !== undefined && issues !== '') {
        if (policy.failOnSchemaMismatch !== false) {
          throw new CassetteSchemaMismatchError(recorded.toolName, issues);
        }
      }
      return substituteDecision(recorded, 'auto-policy');
    }
    case 'side-effecting': {
      return {
        type: 'tool.cassette.replay.live',
        toolName: recorded.toolName,
        toolCallId: recorded.toolCallId,
        stepNumber: recorded.stepNumber,
        sideEffectClass: recorded.sideEffectClass,
        reason: 'auto-policy',
        warnLevel: 'INFO',
      };
    }
    case 'external-stateful': {
      return {
        type: 'tool.cassette.replay.live',
        toolName: recorded.toolName,
        toolCallId: recorded.toolCallId,
        stepNumber: recorded.stepNumber,
        sideEffectClass: recorded.sideEffectClass,
        reason: 'auto-policy-safety-gate',
        warnLevel: 'WARN-non-silenceable',
      };
    }
    default: {
      // Unknown SideEffectClass — be conservative.
      return {
        type: 'tool.cassette.replay.live',
        toolName: recorded.toolName,
        toolCallId: recorded.toolCallId,
        stepNumber: recorded.stepNumber,
        sideEffectClass: recorded.sideEffectClass,
        reason: 'auto-policy-safety-gate',
        warnLevel: 'WARN',
      };
    }
  }
}

/**
 * Compute the canonical SHA-256 of any value the cassette layer
 * accepts as `args`. Mirrors what the writer records under
 * `sha256OfArgs`.
 *
 * @stable
 */
export function sha256OfValue(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');
}

function detectIdempotencyMismatch(
  recorded: ToolCallRecord,
  live: CassetteLiveInvocation,
): { readonly liveSha256: string } | null {
  if (recorded.sha256OfArgs === undefined) return null;
  const liveSha256 = sha256OfValue(live.args);
  if (recorded.sha256OfArgs !== liveSha256) return { liveSha256 };
  if (
    recorded.idempotencyKey !== undefined &&
    live.idempotencyKey !== undefined &&
    recorded.idempotencyKey !== live.idempotencyKey
  ) {
    return { liveSha256 };
  }
  return null;
}

function substituteDecision(
  recorded: ToolCallRecord,
  reason: CassetteReplayReason,
): CassetteReplayDecision {
  return {
    type: 'tool.cassette.replay.substituted',
    toolName: recorded.toolName,
    toolCallId: recorded.toolCallId,
    stepNumber: recorded.stepNumber,
    sideEffectClass: recorded.sideEffectClass,
    substitutedOutput: recorded.output,
    reason,
  };
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    const keys = Object.keys(value as Record<string, unknown>).sort();
    for (const key of keys) out[key] = canonicalize((value as Record<string, unknown>)[key]);
    return out;
  }
  if (typeof value === 'bigint') return `bigint:${value.toString()}`;
  if (typeof value === 'undefined') return null;
  return value;
}
