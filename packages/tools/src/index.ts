/**
 * @graphorin/tools — typed tool surface for the Graphorin framework.
 *
 * The package owns:
 *
 * - The {@link tool}({...}) builder for declaring a Zod-typed tool.
 * - The strategy-aware {@link ToolRegistry} with deferred-loading
 *   support and the three-tier {@link ToolRegistry.searchDeferred}
 *   ranking chain.
 * - The {@link ToolExecutor} with parallel / sequential dispatch,
 *   approval flow, sandbox enforcement (via `@graphorin/security`),
 *   per-tool secrets ACL scoping, the memory-modification guard
 *   wiring, hard-kill cancellation with a 50 ms grace, single-round
 *   tool repair, the inbound prompt-injection sanitization layer, the
 *   four-strategy result truncation pipeline, and the streaming-tool
 *   execution surface (progress + partial chunks with bounded
 *   backpressure).
 * - The built-in tools (`tool_search`, `httpRequest`, `readFileLines`,
 *   `searchFile`).
 *
 * Every public surface lives in a stable sub-export
 * (`@graphorin/tools/builder`, `@graphorin/tools/registry`,
 * `@graphorin/tools/executor`, `@graphorin/tools/streaming`,
 * `@graphorin/tools/inbound`, `@graphorin/tools/result`,
 * `@graphorin/tools/built-in`, `@graphorin/tools/audit`,
 * `@graphorin/tools/errors`).
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.4.0';

export * from './audit/index.js';
export * from './builder/index.js';
export * from './built-in/index.js';
export * from './errors/index.js';
export * from './executor/index.js';
export * from './inbound/index.js';
export * from './registry/index.js';
export * from './result/index.js';
export * from './streaming/index.js';
