/**
 * Eleven memory tools registered with `@graphorin/tools` by the
 * `createMemory()` facade — plus an opt-in twelfth, `deep_recall` (P2-4),
 * appended only when iterative retrieval is configured. Each factory
 * takes a {@link MemoryToolDeps} bundle so consumers can scope the tool
 * surface (per-tier ACL, scope resolver, etc.) without rebuilding the
 * underlying memory facade.
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
 * Options for {@link buildMemoryTools}.
 *
 * @stable
 */
export interface BuildMemoryToolsOptions {
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
 * Build the canonical eleven-memory-tool array. Order is stable —
 * consumers can rely on the indices for snapshot tests. `fact_history`
 * (P0-2) and `fact_validate` (P1-4) are appended last so the original
 * nine indices are unchanged. With `{ includeDeepRecall: true }` the
 * gated `deep_recall` tool (P2-4) is appended as a twelfth, after the
 * stable eleven.
 *
 * @stable
 */
export function buildMemoryTools(
  deps: MemoryToolDeps,
  options: BuildMemoryToolsOptions = {},
): ReadonlyArray<Tool> {
  const tools: Tool[] = [
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
