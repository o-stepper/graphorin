import type { Sensitivity } from '../types/sensitivity.js';

/**
 * Wraps every observability exporter (OTLP, console, JSONL replay log,
 * …) and refuses to forward attributes that exceed the configured
 * sensitivity floor or that contain matched secret / PII patterns.
 *
 * Concrete patterns and the default policy live in
 * `@graphorin/observability`; the interface lives here so every package
 * (server, agent, workflow, …) can require a `RedactionValidator` in its
 * config without taking an observability dependency.
 *
 * @stable
 */
export interface RedactionValidator {
  /** Identifier of the policy in use (`'default-deny-internal'`, …). */
  readonly id: string;
  /** Lowest tier that may pass through the validator. */
  readonly minTier: Sensitivity;
  /**
   * Validate (and optionally rewrite) an attribute payload. Returns the
   * sanitized value or `null` if the entire record must be dropped.
   */
  validate(input: RedactionInput): RedactionOutput | null;
}

/**
 * Input handed to `RedactionValidator.validate(...)`.
 *
 * @stable
 */
export interface RedactionInput {
  readonly value: unknown;
  /** Tier declared by the upstream caller for this value. */
  readonly tier: Sensitivity;
  /** Optional context describing where the value originated. */
  readonly context?: {
    readonly attribute?: string;
    readonly spanType?: string;
    readonly origin?: string;
  };
}

/**
 * Result of `RedactionValidator.validate(...)` — either the sanitized
 * payload (possibly equal to the input) or `null` if the value must be
 * dropped entirely.
 *
 * @stable
 */
export interface RedactionOutput {
  readonly value: unknown;
  readonly tier: Sensitivity;
  /** List of pattern names matched while validating. */
  readonly matched?: ReadonlyArray<string>;
}
