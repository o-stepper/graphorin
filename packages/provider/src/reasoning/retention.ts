/**
 * Reasoning-retention resolver - picks the effective
 * {@link ReasoningRetention} value for a request given:
 *
 * 1. an explicit per-request `reasoningRetention` field (highest
 *    precedence - user override always wins),
 * 2. an instance-level override supplied to `createProvider({...})`,
 *    and
 * 3. the auto-detected default derived from the adapter's declared
 *    `capabilities.reasoningContract` (lowest precedence).
 *
 * @packageDocumentation
 */

import type { ReasoningContract, ReasoningRetention } from '@graphorin/core';

/**
 * Map from `ReasoningContract` to the conservative default
 * `ReasoningRetention` value used when no override is supplied.
 *
 * @stable
 */
export const REASONING_RETENTION_DEFAULTS: Readonly<Record<ReasoningContract, ReasoningRetention>> =
  Object.freeze({
    hidden: 'strip',
    'round-trip-required': 'pass-through-claude',
    optional: 'strip',
  });

/**
 * Inputs to {@link resolveReasoningRetention}.
 *
 * @stable
 */
export interface ResolveReasoningRetentionInput {
  /** Explicit per-request override (highest precedence). */
  readonly requested?: ReasoningRetention;
  /** Instance-level override supplied to `createProvider({...})`. */
  readonly overridden?: ReasoningRetention;
  /** Adapter-declared capability (lowest precedence). */
  readonly contract?: ReasoningContract;
}

/**
 * Resolve the effective {@link ReasoningRetention} value for a single
 * request. The resolution is precedence-driven:
 *
 * 1. `requested` wins if defined.
 * 2. `overridden` wins next.
 * 3. The default for `contract` is used if the contract is known.
 * 4. `'strip'` is the conservative fallback when no input is supplied.
 *
 * @stable
 */
export function resolveReasoningRetention(
  input: ResolveReasoningRetentionInput,
): ReasoningRetention {
  if (input.requested !== undefined) return input.requested;
  if (input.overridden !== undefined) return input.overridden;
  if (input.contract !== undefined) {
    return REASONING_RETENTION_DEFAULTS[input.contract];
  }
  return 'strip';
}
