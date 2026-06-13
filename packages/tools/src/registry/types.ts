/**
 * Public types for the strategy-aware {@link ToolRegistry} surface.
 *
 * @packageDocumentation
 */

import type { ResolvedTool, ToolSource } from '@graphorin/core';

/**
 * Strategy for resolving cross-source tool-name collisions.
 *
 * - `'auto-prefix'` (default) — rename losers with a stable
 *   namespace-derived prefix (e.g. `linear.search_issues` for an MCP
 *   server identifying as `linear`).
 * - `'priority'`              — keep the highest-priority registration
 *   per the precedence ladder; drop the rest.
 * - `'manual'`                — refuse to register the loser; throw
 *   {@link ToolCollisionError} with a structured payload so the
 *   operator can configure either renaming or filtering.
 *
 * @stable
 */
export type CollisionStrategy = 'auto-prefix' | 'priority' | 'manual';

/**
 * Context passed alongside the strategy. Mirrors the shape used by
 * the per-source dispatchers (the MCP client in Phase 09 and the
 * skill loader in Phase 08).
 *
 * @stable
 */
export interface CollisionContext {
  readonly source: ToolSource;
  readonly priority?: number;
}

/**
 * Audit row produced for every collision the registry resolves. The
 * dispatcher writes one record per `(toolName, action)` pair; the
 * downstream audit emitter and counter increments read from these
 * records so the data path stays single-source.
 *
 * @stable
 */
export type CollisionResolution =
  | {
      readonly toolName: string;
      readonly winner: ToolSource;
      readonly losers: ReadonlyArray<ToolSource>;
      readonly action: 'priority-resolved';
      readonly tieBreakReason:
        | 'first-party-precedence'
        | 'explicit-priority'
        | 'registration-order';
    }
  | {
      readonly toolName: string;
      readonly winner: ToolSource;
      readonly losers: ReadonlyArray<ToolSource>;
      readonly action: 'auto-prefix-applied';
      readonly renamed: {
        readonly from: string;
        readonly to: string;
        readonly namespaceSource: string;
      };
    }
  | {
      readonly toolName: string;
      readonly conflictingSources: ReadonlyArray<ToolSource>;
      readonly action: 'manual-rejected';
    }
  | {
      readonly toolName: string;
      readonly winner: ToolSource;
      readonly losers: ReadonlyArray<ToolSource>;
      readonly action: 'first-party-precedence';
    };

/**
 * Match returned by {@link ToolRegistry.searchDeferred}. Carries the
 * stage that produced the match so consumers can detect rank-chain
 * fallback and surface it on the trace span.
 *
 * @stable
 */
export interface ToolSearchMatch {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Readonly<Record<string, unknown>>;
  /** A5: the matched tool's output schema, when declared (renders a return type). */
  readonly outputSchema?: Readonly<Record<string, unknown>>;
  readonly score: number;
  readonly source: 'semantic' | 'bm25' | 'regex-name';
}

/**
 * Pluggable embedder hook used by the semantic stage of
 * {@link ToolRegistry.searchDeferred}. The agent runtime supplies an
 * implementation backed by the configured embedder (default per the
 * memory subsystem); the registry falls through to the BM25 stage if
 * the hook is undefined OR returns `null` for a given query.
 *
 * @stable
 */
export interface ToolSearchEmbedder {
  /** Stable identifier surfaced through the cache key. */
  id(): string;
  /** Output dimensionality. */
  dim(): number;
  /** Embed a batch of strings. */
  embed(texts: ReadonlyArray<string>, signal?: AbortSignal): Promise<ReadonlyArray<Float32Array>>;
}

/**
 * Public entry inserted into the registry. Mirrors the canonical
 * `ResolvedTool` shape — every consumer reads from this single record
 * shape regardless of registration source.
 *
 * @stable
 */
export type RegistryEntry<TInput = unknown, TOutput = unknown, TDeps = unknown> = ResolvedTool<
  TInput,
  TOutput,
  TDeps
>;
