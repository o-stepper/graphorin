/**
 * Eleven memory tools registered with `@graphorin/tools` by the
 * `createMemory()` facade - plus an opt-in twelfth, `deep_recall` (P2-4),
 * appended only when iterative retrieval is configured. Each factory
 * takes a {@link MemoryToolDeps} bundle so consumers can scope the tool
 * surface (per-tier ACL, scope resolver, etc.) without rebuilding the
 * underlying memory facade.
 *
 * Wave-D D3 adds tool PROFILES: `'full'` (the canonical stable-order
 * set), `'interactive'` (read-only - the front-line conversational
 * agent cannot write memory by construction; curation belongs to the
 * reviser), and `'reviser'` (the full read+write surface, semantically
 * reserved for the sleep-time curation agent). The single-writer split
 * mirrors the channels-wave discipline: interactive agents observe,
 * the reviser mutates.
 *
 * @packageDocumentation
 */

import type { Tool } from '@graphorin/core';
import {
  createBlockAppendTool,
  createBlockReplaceTool,
  createBlockRethinkTool,
} from './block-tools.js';
import {
  createFactForgetTool,
  createFactHistoryTool,
  createFactRememberTool,
  createFactSearchTool,
  createFactSupersedeTool,
  createFactValidateTool,
} from './fact-tools.js';
import {
  createConversationSearchTool,
  createDeepRecallTool,
  createRecallEpisodesTool,
} from './recall-tools.js';
import { createRunbookSearchTool } from './runbook-tools.js';
import type { MemoryToolDeps } from './types.js';

export {
  createBlockAppendTool,
  createBlockReplaceTool,
  createBlockRethinkTool,
} from './block-tools.js';
export {
  createFactForgetTool,
  createFactHistoryTool,
  createFactRememberTool,
  createFactSearchTool,
  createFactSupersedeTool,
  createFactValidateTool,
} from './fact-tools.js';
export {
  createConversationSearchTool,
  createDeepRecallTool,
  createRecallEpisodesTool,
} from './recall-tools.js';
export { createRunbookSearchTool } from './runbook-tools.js';
export type { MemoryToolDeps, ScopeResolver } from './types.js';

/**
 * Memory tool profile (wave-D D3): which slice of the canonical set an
 * agent receives. `'interactive'` is read-only by construction.
 *
 * @stable
 */
export type MemoryToolProfile = 'interactive' | 'reviser' | 'full';

/** The valid profile values (runtime validation source). */
export const MEMORY_TOOL_PROFILES: ReadonlyArray<MemoryToolProfile> = Object.freeze([
  'interactive',
  'reviser',
  'full',
]);

/**
 * Options for {@link buildMemoryTools}.
 *
 * @stable
 */
export interface BuildMemoryToolsOptions {
  /**
   * Tool profile (wave-D D3). `'full'` (default) keeps the canonical
   * stable-order set; `'interactive'` builds ONLY the read tools
   * (`fact_search`, `recall_episodes`, `conversation_search`,
   * `fact_history`, plus the gated read appendices) - write tools do
   * not exist in the returned array, so a front-line agent cannot
   * mutate memory by construction; `'reviser'` is the full read+write
   * surface for the sleep-time curation agent.
   */
  readonly profile?: MemoryToolProfile;
  /**
   * Append the gated `deep_recall` tool (P2-4) as a twelfth tool. The
   * facade sets this only when `iterativeRetrieval` is configured, so the
   * default tool surface stays at the canonical eleven. Default `false`.
   */
  readonly includeDeepRecall?: boolean;
  /**
   * Append the gated `runbook_search` tool (D3). The facade sets this
   * only when `createMemory({ runbookSearch: true })` opts in, so the
   * default tool surface is unchanged. Default `false`.
   */
  readonly includeRunbookSearch?: boolean;
}

/**
 * Build the canonical memory-tool array for a profile. Order is stable
 * for `'full'` / `'reviser'` - consumers can rely on the indices for
 * snapshot tests. `fact_history` (P0-2) and `fact_validate` (P1-4) are
 * appended last so the original nine indices are unchanged. With
 * `{ includeDeepRecall: true }` the gated `deep_recall` tool (P2-4) is
 * appended after the stable eleven; `runbook_search` after it. Both
 * gated appendices are reads, so they appear in every profile.
 *
 * `'interactive'` returns ONLY the read tools, preserving their
 * relative order from the canonical set.
 *
 * @stable
 */
export function buildMemoryTools(
  deps: MemoryToolDeps,
  options: BuildMemoryToolsOptions = {},
): ReadonlyArray<Tool> {
  const profile = options.profile ?? 'full';
  if (!MEMORY_TOOL_PROFILES.includes(profile)) {
    throw new TypeError(
      `[graphorin/memory] unknown memory tool profile '${String(profile)}' ` +
        `(expected ${MEMORY_TOOL_PROFILES.join(' | ')}).`,
    );
  }
  // The write factories exist only outside 'interactive' - the
  // read-only guarantee is by construction, not by filtering names.
  const tools: Tool[] =
    profile === 'interactive'
      ? [
          createFactSearchTool(deps) as Tool,
          createRecallEpisodesTool(deps) as Tool,
          createConversationSearchTool(deps) as Tool,
          createFactHistoryTool(deps) as Tool,
        ]
      : [
          createBlockAppendTool(deps) as Tool,
          createBlockReplaceTool(deps) as Tool,
          createBlockRethinkTool(deps) as Tool,
          createFactRememberTool(deps) as Tool,
          createFactSearchTool(deps) as Tool,
          createFactSupersedeTool(deps) as Tool,
          createFactForgetTool(deps) as Tool,
          createRecallEpisodesTool(deps) as Tool,
          createConversationSearchTool(deps) as Tool,
          createFactHistoryTool(deps) as Tool,
          createFactValidateTool(deps) as Tool,
        ];
  if (options.includeDeepRecall === true) {
    tools.push(createDeepRecallTool(deps) as Tool);
  }
  if (options.includeRunbookSearch === true) {
    tools.push(createRunbookSearchTool(deps) as Tool);
  }
  return Object.freeze(tools);
}
