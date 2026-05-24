/**
 * Built-in tools shipped with `@graphorin/tools`.
 *
 * - `tool_search` — deferred-tool catalogue lookup. Always registered
 *   when at least one tool in the registry is deferred.
 * - `read_result` — fetch (a range of) a large tool result stored behind a
 *   handle. Registered when at least one tool spills to file.
 *
 * @packageDocumentation
 */

export { createReadResultTool, type ReadResultToolOptions } from './read-result.js';
export { createToolSearchTool, type ToolSearchToolOptions } from './tool-search.js';
