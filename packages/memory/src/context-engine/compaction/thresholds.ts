/**
 * Per-provider trigger threshold defaults for the auto-compaction
 * subsystem (RB-46 / suggested DEC-162). Computed from the active
 * provider's `contextWindow` at agent warm-up; surfaced as a pure
 * function so the same logic applies to library-mode + server-mode
 * callers.
 *
 * @packageDocumentation
 */

import type { LocalProviderTrust } from '@graphorin/core';
import type { CompactionTriggerConfig } from './types.js';

/**
 * Reserved tokens for the next provider response. Mirrors the
 * existing `reservedForResponse: 4096` ContextEngine default.
 *
 * @stable
 */
export const DEFAULT_RESERVED_FOR_RESPONSE = 4096;

/**
 * Reserved tokens for the compaction summarizer call so the
 * summarizer fits without re-triggering. Mirrors the suggested
 * DEC-162 default.
 *
 * @stable
 */
export const DEFAULT_RESERVED_FOR_COMPACTION = 8192;

/**
 * Default ratio multiplied against the provider's context window
 * when neither `thresholdTokens` nor `thresholdRatio` is supplied.
 *
 * @stable
 */
export const DEFAULT_THRESHOLD_RATIO = 0.85;

/**
 * Resolve the effective threshold (in tokens) at which the
 * auto-trigger fires. The implementation matches the suggested
 * DEC-162 row 2 spec:
 *
 * ```
 * effectiveThreshold = min(
 *   contextWindow * thresholdRatio,
 *   contextWindow - reservedForResponse - reservedForCompaction,
 * );
 * ```
 *
 * Operators override per `CompactionConfig.trigger.{thresholdTokens,
 * thresholdRatio}`.
 *
 * @stable
 */
export function resolveTriggerThreshold(input: {
  readonly contextWindow: number;
  readonly trigger?: 'never' | CompactionTriggerConfig;
  readonly reservedForResponse?: number;
  readonly reservedForCompaction?: number;
}): number {
  if (input.trigger === 'never') return Number.POSITIVE_INFINITY;
  // Explicit `thresholdTokens` wins as-is (operator's choice).
  if (input.trigger?.thresholdTokens !== undefined && input.trigger.thresholdTokens >= 0) {
    return input.trigger.thresholdTokens;
  }
  const reservedResponse = input.reservedForResponse ?? DEFAULT_RESERVED_FOR_RESPONSE;
  const reservedCompaction = input.reservedForCompaction ?? DEFAULT_RESERVED_FOR_COMPACTION;
  const ratio = input.trigger?.thresholdRatio ?? DEFAULT_THRESHOLD_RATIO;
  const headroom = Math.max(0, input.contextWindow - reservedResponse - reservedCompaction);
  const ratioFloor = Math.max(0, Math.floor(input.contextWindow * ratio));
  return Math.min(ratioFloor, headroom);
}

/**
 * Resolve the default `compaction` mode (ON / OFF) per the active
 * provider's trust class. Default ON for cloud-tier providers
 * (`'public-tls' | 'public-mtls'`); default OFF for loopback
 * (operator owns the failure mode honestly via the manual
 * `agent.compact()` API).
 *
 * Returns `'auto'` when the operator did not pass an explicit
 * config; returns `'enabled'` / `'disabled'` for explicit booleans
 * the resolver folds into the auto-default.
 *
 * @stable
 */
export type AutoCompactionDefault = 'enabled' | 'disabled';

export function resolveAutoCompactionDefault(
  trustClass: LocalProviderTrust | undefined,
): AutoCompactionDefault {
  switch (trustClass ?? 'public-tls') {
    case 'loopback':
      return 'disabled';
    case 'private':
      // Private LANs are the ambiguous tier - treat as enabled
      // because operators rarely run dense sessions on them; the
      // override is one config line away.
      return 'enabled';
    case 'public-tls':
    case 'public-cleartext':
      return 'enabled';
    default:
      return 'enabled';
  }
}
