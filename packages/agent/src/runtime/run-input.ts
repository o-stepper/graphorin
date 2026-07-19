/**
 * Run-input normalization and configuration validation guards for the
 * agent runtime: the `AgentInput | RunState` -> seed-message mapping,
 * the preferred-model / model-spec structural checks, and the runtime's
 * internal mutable views of `RunState`. Extracted verbatim from
 * `factory.ts` (issue #23).
 *
 * @packageDocumentation
 */

import type {
  HandoffRecord,
  Message,
  RunState,
  RunStep,
  ToolApproval,
  Usage,
} from '@graphorin/core';
import { InvalidAgentConfigError, InvalidPreferredModelError } from '../errors/index.js';
import type { AgentInput } from '../types.js';

/**
 * Internal mutable view of {@link RunState}. The public type marks
 * most fields `readonly` to guard against accidental mutation by
 * consumers; the runtime owns the lifecycle and writes through
 * this view.
 */
export interface MutableRunState {
  status: RunState['status'];
  currentAgentId: string;
  readonly steps: RunStep[];
  readonly messages: Message[];
  readonly pendingApprovals: ToolApproval[];
  readonly handoffs: HandoffRecord[];
  usage: Usage;
  error?: RunState['error'];
  finishedAt?: string;
  usageByModel?: RunState['usageByModel'];
  /** Parked sub-agent runs (see {@link RunState.pendingSubRuns}). */
  pendingSubRuns?: RunState['pendingSubRuns'];
}

export interface InternalRunSnapshot<TOutput> {
  output: TOutput;
}

export function isModelHintLike(value: unknown): boolean {
  return value === 'fast' || value === 'balanced' || value === 'smart';
}

export function isModelSpecLike(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.modelId === 'string' && typeof v.name === 'string') return true;
  if (typeof v.provider === 'object' && v.provider !== null && typeof v.model === 'string') {
    return true;
  }
  return false;
}

export function validatePreferredModel(value: unknown): void {
  if (value === undefined) return;
  if (isModelHintLike(value)) return;
  if (isModelSpecLike(value)) return;
  throw new InvalidPreferredModelError(value);
}

export function isMessageObject(value: unknown): value is Message {
  if (typeof value !== 'object' || value === null) return false;
  const role = (value as { role?: unknown }).role;
  return role === 'system' || role === 'user' || role === 'assistant' || role === 'tool';
}

export function isRunStateObject(value: unknown): value is RunState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.agentId === 'string' &&
    Array.isArray(v.messages) &&
    Array.isArray(v.steps)
  );
}

export function asMessages(input: AgentInput | RunState): {
  readonly seed: Message[];
  readonly resumed?: RunState;
} {
  if (typeof input === 'string') {
    return { seed: [{ role: 'user', content: input }] };
  }
  if (Array.isArray(input)) {
    return { seed: [...input] as Message[] };
  }
  if (isMessageObject(input)) {
    return { seed: [input] };
  }
  if (isRunStateObject(input)) {
    return { seed: [], resumed: input };
  }
  throw new InvalidAgentConfigError(`unrecognized AgentInput shape`);
}
