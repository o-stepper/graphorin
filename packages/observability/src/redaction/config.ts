/**
 * Configuration shape consumed by `observability.validation.*`.
 *
 * The shape mirrors the canonical settings so consumer configuration
 * files can use a single typed structure.
 *
 * @packageDocumentation
 */

import type { Sensitivity } from '@graphorin/core';

import type { RedactionPattern } from './patterns.js';

/**
 * @stable
 */
export interface ValidationConfig {
  /** Lowest tier that may pass through the validator. */
  readonly minTier?: Sensitivity;
  /**
   * When `true`, the validator throws on dropped values instead of
   * silently dropping + counting. Use in tests; production should
   * keep the default.
   *
   * @default false
   */
  readonly failOnUnredactedSensitive?: boolean;
  /**
   * Custom pattern catalogue. Defaults to the 14 default-on built-in
   * patterns.
   */
  readonly patterns?: ReadonlyArray<RedactionPattern>;
  /** Per-name allow-list. */
  readonly enabledPatterns?: ReadonlyArray<string>;
  /** Per-name deny-list. */
  readonly disabledPatterns?: ReadonlyArray<string>;
}

/**
 * Default validation configuration. Mirrors the runtime defaults used
 * by `createTracer({ ... })` when `validation` is omitted.
 *
 * @stable
 */
export const DEFAULT_VALIDATION_CONFIG: Required<
  Pick<ValidationConfig, 'minTier' | 'failOnUnredactedSensitive'>
> = Object.freeze({
  minTier: 'public' as const,
  failOnUnredactedSensitive: false,
});
