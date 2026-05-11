/**
 * Sensitivity-aware redaction surface for `@graphorin/observability`.
 *
 * The validator is the building block for the mandatory `withValidation()`
 * wrapper applied to every exporter. It defaults to **default-deny
 * non-public** — values declared above the tier floor are dropped + counted
 * — and runs every value through the catalogue of built-in PII / secret
 * patterns.
 *
 * @packageDocumentation
 */

export { DEFAULT_VALIDATION_CONFIG, type ValidationConfig } from './config.js';
export { RedactionValidationError, UnvalidatedExporterError } from './errors.js';
export {
  BUILT_IN_IMPERATIVE_PATTERNS,
  IMPERATIVE_PREFILTER_SUBSTRINGS,
  type ImperativePattern,
  type ImperativePatternName,
  type ScanResult as ImperativeScanResult,
  scanImperativePatterns,
  stripImperativePatterns,
} from './imperative-patterns.js';
export {
  ALL_BUILT_IN_PATTERNS,
  BUILT_IN_PATTERNS,
  type BuiltInPatternName,
  OPT_IN_PATTERNS,
  type PatternCategory,
  type RedactionPattern,
} from './patterns.js';
export type {
  RedactionCounters,
  RedactionInput,
  RedactionOutput,
  RedactionValidator,
  RedactionValidatorInstance,
  RedactionValidatorOptions,
  RedactionViolation,
  RedactionViolationCallback,
} from './types.js';
export { compareSensitivityTiers, createRedactionValidator } from './validator.js';
