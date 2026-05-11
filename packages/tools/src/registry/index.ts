/**
 * Strategy-aware tool registry surface for `@graphorin/tools`.
 *
 * @packageDocumentation
 */

export type { ToolAuditEvent } from '../audit/index.js';
export type { Bm25Document, Bm25Match, Bm25Options } from './bm25.js';
export { defineBm25Index, tokenise } from './bm25.js';
export {
  DEFAULT_MAX_RESULT_TOKENS,
  type NormaliseOutcome,
  type NormaliseWarning,
  normaliseTool,
} from './normalize.js';
export {
  createToolRegistry,
  type ToolRegistry,
  type ToolRegistryOptions,
} from './registry.js';
export type {
  CollisionContext,
  CollisionResolution,
  CollisionStrategy,
  RegistryEntry,
  ToolSearchEmbedder,
  ToolSearchMatch,
} from './types.js';
