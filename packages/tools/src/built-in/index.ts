/**
 * Built-in tools shipped with `@graphorin/tools`.
 *
 * - `tool_search` — deferred-tool catalogue lookup. Always registered
 *   when at least one tool in the registry is deferred.
 * - `httpRequest` — typed HTTP wrapper with redaction-aware spans.
 * - `readFileLines` — sandbox-aware bounded file reader.
 * - `searchFile` — sandbox-aware bounded text search across a file.
 *
 * @packageDocumentation
 */

export { createToolSearchTool, type ToolSearchToolOptions } from './tool-search.js';
