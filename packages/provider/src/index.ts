/**
 * @graphorin/provider — vendor-neutral LLM provider layer for the
 * Graphorin framework.
 *
 * The package owns:
 *
 * - The `createProvider(...)` factory for wrapping adapter modules in
 *   a stable `Provider` shape.
 * - Four adapters out of the box: the Vercel AI SDK adapter for the
 *   default cloud path, plus three local-LLM adapters (Ollama HTTP,
 *   llama-server HTTP, and a generic OpenAI-compatible adapter for
 *   LMStudio / LocalAI / vLLM / Together-style endpoints). All three
 *   `baseUrl`-driven adapters share the same {@link LocalProviderTrust}
 *   classifier.
 * - The canonical-order middleware composer
 *   ({@link composeProviderMiddleware}) and the seven built-in
 *   middlewares (`withTracing`, `withRetry`, `withRateLimit`,
 *   `withCostLimit`, `withCostTracking`, `withFallback`,
 *   `withRedaction`).
 * - The pluggable `TokenCounter` dispatcher (`createDefaultCounter`)
 *   plus the per-vendor strategies and a heuristic fallback.
 * - The per-provider model-tier auto-classifier
 *   ({@link classifyModelTier}) that maps a `Provider`'s `modelId` to
 *   one of `'fast' | 'balanced' | 'smart'`.
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.3.0';

export * from './adapters/index.js';
export * from './counters/index.js';
export * from './errors/index.js';
export * from './middleware/index.js';
export * from './model-tier/index.js';
export * from './provider.js';
export * from './reasoning/index.js';
export * from './trust/index.js';
