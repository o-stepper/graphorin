/**
 * @graphorin/observability — observability primitives for the
 * Graphorin framework. Ships:
 *
 * - the typed `AISpan<T>` tracer over OpenTelemetry,
 * - the **mandatory** `withValidation()` wrapper for every exporter,
 * - the sensitivity-aware `RedactionValidator` with 14 built-in PII /
 *   secret detection patterns,
 * - OpenTelemetry GenAI semantic-conventions conformance helpers,
 * - OpenInference span-kind emission,
 * - the structured `Logger` with span correlation,
 * - the append-only `JSONLExporter` for replay,
 * - sanitized-by-default `Replay` primitives,
 * - the hierarchical `CostTracker`,
 * - and a minimal inline eval runner.
 *
 * The full documentation lives in the package `README.md`.
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.3.0';

export * from './cost/index.js';
export * from './eval/index.js';
export * from './exporters/index.js';
export * from './gen-ai/index.js';
export * from './logger/index.js';
export * from './openinference/index.js';
export * from './redaction/index.js';
export * from './replay/index.js';
export * from './telemetry/index.js';
export * from './tracer/index.js';
