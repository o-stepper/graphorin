/**
 * Nine memory tools registered with `@graphorin/tools` by the
 * `createMemory()` facade. Each factory takes a {@link MemoryToolDeps}
 * bundle so consumers can scope the tool surface (per-tier ACL, scope
 * resolver, etc.) without rebuilding the underlying memory facade.
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
  createFactRememberTool,
  createFactSearchTool,
  createFactSupersedeTool,
} from './fact-tools.js';
import { createConversationSearchTool, createRecallEpisodesTool } from './recall-tools.js';
import type { MemoryToolDeps } from './types.js';

export {
  createBlockAppendTool,
  createBlockReplaceTool,
  createBlockRethinkTool,
} from './block-tools.js';
export {
  createFactForgetTool,
  createFactRememberTool,
  createFactSearchTool,
  createFactSupersedeTool,
} from './fact-tools.js';
export {
  createConversationSearchTool,
  createRecallEpisodesTool,
} from './recall-tools.js';
export type { MemoryToolDeps, ScopeResolver } from './types.js';

/**
 * Build the canonical nine-memory-tool array. Order is stable —
 * consumers can rely on the indices for snapshot tests.
 *
 * @stable
 */
export function buildMemoryTools(deps: MemoryToolDeps): ReadonlyArray<Tool> {
  const tools: ReadonlyArray<Tool> = [
    createBlockAppendTool(deps) as Tool,
    createBlockReplaceTool(deps) as Tool,
    createBlockRethinkTool(deps) as Tool,
    createFactRememberTool(deps) as Tool,
    createFactSearchTool(deps) as Tool,
    createFactSupersedeTool(deps) as Tool,
    createFactForgetTool(deps) as Tool,
    createRecallEpisodesTool(deps) as Tool,
    createConversationSearchTool(deps) as Tool,
  ];
  return Object.freeze(tools);
}
