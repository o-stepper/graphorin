/**
 * Public surface for the MCP client.
 *
 * @packageDocumentation
 */

export { _resetSseWarnDedupForTesting, createMCPClient } from './client.js';
export {
  _resetMcpAdapterDedupForTesting,
  adaptCallResult,
  adaptMCPTools,
  DEFAULT_DEFER_LOADING_THRESHOLD,
} from './to-tools.js';
export type {
  CreateMCPClientOptions,
  MCPCallToolResult,
  MCPClient,
  MCPContentPart,
  MCPPromptDefinition,
  MCPPromptMessage,
  MCPResourceContent,
  MCPResourceDefinition,
  MCPToolDefinition,
  MCPToToolsOptions,
} from './types.js';
