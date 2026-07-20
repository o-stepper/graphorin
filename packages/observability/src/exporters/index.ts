/**
 * Exporter surface for `@graphorin/observability`.
 *
 * Every exporter MUST be wrapped via {@link withValidation} before it
 * is registered with the tracer. Un-wrapped exporters cause
 * `createTracer(...)` to throw at startup unless the operator opts
 * out explicitly with `validation: 'off'` (in which case a startup
 * WARN is logged).
 *
 * @packageDocumentation
 */

export {
  type ConsoleExporterOptions,
  createConsoleExporter,
} from './console.js';
export {
  createJSONLExporter,
  type DateProvider,
  type JSONLExporter,
  type JSONLExporterOptions,
} from './jsonl.js';
export {
  createOTLPHttpExporter,
  type OTLPHttpExporterOptions,
  toOtlpEnvelope,
} from './otlp-http.js';
export type {
  SpanRecord,
  SpanRecordEvent,
  TraceExporter,
} from './types.js';
export { VALIDATED_EXPORTER_BRAND } from './types.js';
export {
  isValidatedExporter,
  tryGetValidatorCounters,
  type WithValidationOptions,
  withValidation,
} from './with-validation.js';
