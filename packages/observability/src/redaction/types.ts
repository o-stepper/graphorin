/**
 * Public types for the {@link RedactionValidator} surface.
 *
 * @packageDocumentation
 */

import type { RedactionInput, RedactionOutput, RedactionValidator } from '@graphorin/core';

import type { RedactionPattern } from './patterns.js';

export type { RedactionInput, RedactionOutput, RedactionValidator } from '@graphorin/core';

/**
 * Optional sink invoked every time the validator drops a value or
 * masks a pattern. Useful for emitting custom metrics, audit entries,
 * or alert hooks. The callback receives only sanitized data — secret
 * values are never forwarded.
 *
 * @stable
 */
export type RedactionViolationCallback = (violation: RedactionViolation) => void;

/**
 * Sanitized record describing a single redaction event. Never carries
 * the secret value itself; only metadata that is safe to log.
 *
 * @stable
 */
export interface RedactionViolation {
  readonly reason:
    | 'sensitivity-tier-exceeded'
    | 'pii-pattern-match'
    | 'secret-pattern-match'
    | 'unredacted-secret-value'
    | 'invalid-input';
  readonly attribute?: string;
  readonly spanType?: string;
  readonly origin?: string;
  /** Pattern names that fired (if applicable). */
  readonly patterns?: ReadonlyArray<string>;
  /** Tier declared by the upstream caller. */
  readonly declaredTier?: RedactionInput['tier'];
}

/**
 * Counter exposed via {@link createRedactionValidator}. Implementations
 * keep counters in-memory; downstream code can scrape them and convert
 * to Prometheus metrics.
 *
 * @stable
 */
export interface RedactionCounters {
  /** Total values dropped by the validator. */
  droppedTotal: number;
  /** Drops by reason; the four built-in reasons + any custom ones. */
  droppedByReason: Readonly<Record<string, number>>;
  /** Pattern-matching counters keyed by pattern name. */
  matchesByPattern: Readonly<Record<string, number>>;
}

/**
 * Configuration shape for {@link createRedactionValidator}.
 *
 * @stable
 */
export interface RedactionValidatorOptions {
  /** Identifier reported via `validator.id`. Defaults to `'default'`. */
  readonly id?: string;
  /** Lowest tier that may pass through the validator. Default: `'public'`. */
  readonly minTier?: RedactionInput['tier'];
  /**
   * When `true`, throw a {@link RedactionValidationError} on any drop.
   * Useful in tests; production should keep this off so the validator
   * silently drops + counts.
   */
  readonly failOnUnredactedSensitive?: boolean;
  /**
   * Pattern catalogue. Defaults to the 14 built-in default-on
   * patterns. Custom patterns can extend or replace this list.
   */
  readonly patterns?: ReadonlyArray<RedactionPattern>;
  /**
   * Per-name allow-list. When provided, only patterns whose `name`
   * appears here are evaluated. Empty array disables all pattern
   * matching (tier filtering still applies).
   */
  readonly enabledPatterns?: ReadonlyArray<string>;
  /**
   * Per-name deny-list. Patterns listed here are skipped entirely.
   * Applied **after** `enabledPatterns`.
   */
  readonly disabledPatterns?: ReadonlyArray<string>;
  /**
   * Optional sink invoked on every violation. Receives only sanitized
   * data; never receives secret values.
   */
  readonly onViolation?: RedactionViolationCallback;
  /**
   * Optional pluggable additional check, fired after the pattern
   * scan succeeds. The callback returns `null` to drop the value or a
   * sanitized {@link RedactionOutput} to forward.
   */
  readonly customValidator?: (input: RedactionInput) => RedactionOutput | null;
}

/**
 * Concrete validator returned by {@link createRedactionValidator}.
 *
 * @stable
 */
export interface RedactionValidatorInstance extends RedactionValidator {
  /** Snapshot of internal counters. Returned object is a fresh copy. */
  readonly counters: () => RedactionCounters;
  /** Reset all counters back to zero. */
  readonly resetCounters: () => void;
}
