/**
 * Assemble a single `@graphorin/tools` {@link ToolRegistry} from every
 * tool source the agent knows about (first-party `config.tools` + skill
 * tools), then resolve cross-source name collisions deterministically.
 *
 * This realises Principle #12 (one registry, one collision policy) and
 * gives `createToolRegistry(...)` its first production call-site
 * (`createAgent(...)` warm-up - see `factory.ts`). The run loop consumes
 * the resulting registry in a later work item (WI-03); `tool_search`
 * uses it in WI-05. This module only *builds* it.
 *
 * Two deliberate fidelity notes (verified against source, not the plan):
 *  - **MCP tools are not auto-stamped.** `adaptMCPTools(...)` returns
 *    plain `Tool`s; `__source`/`__trustClass` are only ever assigned by
 *    the registry's `normaliseTool(...)` at registration time, derived
 *    from the `source` passed to `register(...)`. So {@link inferToolSource}
 *    honours an explicit `__source` stamp if one is present (forward-
 *    compatible with a dedicated `mcp` config hook / re-registered
 *    `ResolvedTool`s) and otherwise treats the tool as first-party. The
 *    MCP tool's baked-in `sandboxPolicy` / `inboundSanitization` are
 *    preserved regardless (operator override > trust-class default).
 *  - **Skill tool-stamping lives here, not in `@graphorin/skills`.** The
 *    skills loader defers it (it does not depend on a tools registry);
 *    the agent - which depends on both - stamps each inline skill tool
 *    via `stampSkillTool(...)`.
 *
 * @packageDocumentation
 */

import type { Tool, ToolSource } from '@graphorin/core';
import type { SkillMetadata } from '@graphorin/skills';
import { stampSkillTool } from '@graphorin/skills';
import {
  type CollisionContext,
  type CollisionResolution,
  type CollisionStrategy,
  createToolRegistry,
  type ToolAuditEvent,
  type ToolRegistry,
  type ToolSearchEmbedder,
} from '@graphorin/tools/registry';

import type { SkillsRegistryLike } from '../types.js';

/** The source attributed to an unstamped first-party `config.tools` entry. */
const FIRST_PARTY_SOURCE: ToolSource = Object.freeze({ kind: 'first-party' });

/** The five `ToolSource.kind` discriminants (used to validate a stamp). */
const TOOL_SOURCE_KINDS: ReadonlySet<string> = new Set([
  'first-party',
  'built-in',
  'skill',
  'mcp',
  'web-search',
]);

/** Options for {@link buildToolRegistry}. */
export interface BuildToolRegistryOptions {
  /** First-party (and any pre-stamped) tools, i.e. `config.tools`. */
  readonly tools?: ReadonlyArray<Tool<unknown, unknown, unknown>>;
  /**
   * The agent's skill registry (`config.skills`). Only entries that
   * structurally match the {@link SkillLike} surface contribute tools;
   * non-inline skill sources expose `tools(): []` and are a no-op here.
   */
  readonly skills?: SkillsRegistryLike;
  /** Collision-resolution strategy. Default `'auto-prefix'`. */
  readonly collisionStrategy?: CollisionStrategy;
  /**
   * Context tag carried on the collision audit rows + used for the
   * `'priority'` tie-break boost. Default `{ source: first-party }`.
   */
  readonly collisionContext?: CollisionContext;
  /** Audit sink forwarded to the registry (collision + classification rows). */
  readonly emitAudit?: (event: ToolAuditEvent) => void;
  /** Semantic-search embedder. Passed through; consumed by `tool_search` (WI-05). */
  readonly embedder?: ToolSearchEmbedder;
  /** Cosine threshold for the semantic search stage (WI-05). */
  readonly semanticScoreThreshold?: number;
  /**
   * C6: defer-load every tool that does not declare `defer_loading`
   * itself (the minimal-scaffold posture). Passed through to
   * `createToolRegistry(...)`. Default `false`.
   */
  readonly deferLoadingByDefault?: boolean;
}

/** Outcome of {@link buildToolRegistry}. */
export interface BuildToolRegistryResult {
  /** The assembled registry, post collision-resolution. */
  readonly registry: ToolRegistry;
  /** The collision resolutions (also emitted on the audit sink). */
  readonly resolutions: ReadonlyArray<CollisionResolution>;
  /** Count of tools registered across every source. */
  readonly registered: number;
  /** Count of `skills.list()` entries skipped for not matching the `Skill` surface. */
  readonly skippedSkillEntries: number;
}

/**
 * Build and collision-resolve a {@link ToolRegistry} from the supplied
 * tool sources.
 *
 * Registration order (which seeds the `'registration-order'` tie-break)
 * is: every `tools` entry, then every inline tool of every skill.
 * Throws whatever `register(...)` throws for a malformed tool
 * (`InvalidExampleError`, `InvalidPreferredModelError`,
 * `InvalidSideEffectClassError`) - the registry is the validation
 * authority, so a bad tool fails fast at build time.
 *
 * @stable
 */
export function buildToolRegistry(options: BuildToolRegistryOptions = {}): BuildToolRegistryResult {
  const registry = createToolRegistry({
    ...(options.emitAudit !== undefined ? { emitAudit: options.emitAudit } : {}),
    ...(options.embedder !== undefined ? { embedder: options.embedder } : {}),
    ...(options.semanticScoreThreshold !== undefined
      ? { semanticScoreThreshold: options.semanticScoreThreshold }
      : {}),
    ...(options.deferLoadingByDefault === true ? { deferLoadingByDefault: true } : {}),
  });

  let registered = 0;

  // 1. First-party / pre-stamped tools (`config.tools`).
  for (const tool of options.tools ?? []) {
    registry.register(tool, inferToolSource(tool));
    registered += 1;
  }

  // 2. Skill tools. The agent accepts a loose `SkillsRegistryLike`, so
  //    each `list()` entry is narrowed structurally before stamping.
  let skippedSkillEntries = 0;
  for (const entry of options.skills?.list?.() ?? []) {
    if (!isSkillLike(entry)) {
      skippedSkillEntries += 1;
      continue;
    }
    for (const tool of entry.tools()) {
      const stamped = stampSkillTool(tool, entry);
      registry.register(stamped.tool, stamped.source);
      registered += 1;
    }
  }

  // 3. Resolve collisions deterministically (first-party wins; losers
  //    are namespaced). `assertNoDuplicates(strategy, ctx)` emits a
  //    `tool:collision:*` audit row per resolution.
  const resolutions = registry.assertNoDuplicates(
    options.collisionStrategy ?? 'auto-prefix',
    options.collisionContext ?? { source: FIRST_PARTY_SOURCE },
  );

  return Object.freeze({ registry, resolutions, registered, skippedSkillEntries });
}

/**
 * Derive the {@link ToolSource} for a `config.tools` entry. Honours an
 * explicit, well-formed `__source` stamp when present (so re-registered
 * `ResolvedTool`s and a future `mcp` config hook keep their provenance);
 * otherwise the tool is first-party. See the module doc on why MCP tools
 * are *not* auto-detected here.
 */
function inferToolSource(tool: Tool<unknown, unknown, unknown>): ToolSource {
  const stamped = (tool as { readonly __source?: unknown }).__source;
  return isToolSource(stamped) ? stamped : FIRST_PARTY_SOURCE;
}

/** Structural guard: a well-formed {@link ToolSource} discriminated union. */
function isToolSource(value: unknown): value is ToolSource {
  if (typeof value !== 'object' || value === null) return false;
  const kind = (value as { readonly kind?: unknown }).kind;
  return typeof kind === 'string' && TOOL_SOURCE_KINDS.has(kind);
}

/**
 * Minimal structural view of a `@graphorin/skills` `Skill` - exactly the
 * members {@link buildToolRegistry} reads. The agent's `SkillsRegistryLike`
 * is intentionally loose (`list?(): unknown[]`), so entries are validated
 * at runtime before being treated as skills.
 */
interface SkillLike {
  readonly metadata: SkillMetadata;
  tools(): ReadonlyArray<Tool<unknown, unknown, unknown>>;
}

/** Structural guard for the {@link SkillLike} surface. */
function isSkillLike(value: unknown): value is SkillLike {
  if (typeof value !== 'object' || value === null) return false;
  const metadata = (value as { readonly metadata?: unknown }).metadata;
  const metadataOk =
    typeof metadata === 'object' &&
    metadata !== null &&
    typeof (metadata as { readonly name?: unknown }).name === 'string' &&
    typeof (metadata as { readonly graphorinTrustLevel?: unknown }).graphorinTrustLevel ===
      'string';
  return metadataOk && typeof (value as { readonly tools?: unknown }).tools === 'function';
}
