/**
 * Errors thrown by the redaction layer.
 *
 * @packageDocumentation
 */

import type { RedactionViolation } from './types.js';

/**
 * Thrown by the validator when `failOnUnredactedSensitive: true` and
 * a value would otherwise be dropped or masked. The error never
 * carries the secret value itself; only the sanitized
 * {@link RedactionViolation} metadata.
 *
 * @stable
 */
export class RedactionValidationError extends Error {
  /** @stable */
  readonly kind = 'redaction-validation-failed' as const;
  /** @stable */
  readonly violation: RedactionViolation;

  constructor(message: string, violation: RedactionViolation) {
    super(message);
    this.name = 'RedactionValidationError';
    this.violation = violation;
  }
}

/**
 * Thrown at startup when an exporter is registered without going
 * through `withValidation(...)`. Enforces ADR-035: every exporter
 * must validate before forwarding.
 *
 * @stable
 */
export class UnvalidatedExporterError extends Error {
  /** @stable */
  readonly kind = 'unvalidated-exporter' as const;
  /** Exporter identifier (typically `exporter.constructor.name`). */
  readonly exporterId: string;

  constructor(exporterId: string) {
    super(
      `Exporter "${exporterId}" was registered without withValidation(). All ` +
        'exporters must be wrapped - see RedactionValidator policy. Wrap with ' +
        "`withValidation(exporter, opts)` or set `validation: 'off'` (NOT recommended) " +
        'on the tracer to opt out explicitly (logs a startup WARN).',
    );
    this.name = 'UnvalidatedExporterError';
    this.exporterId = exporterId;
  }
}
