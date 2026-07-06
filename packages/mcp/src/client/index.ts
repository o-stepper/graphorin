/**
 * Public surface for the MCP client.
 *
 * @packageDocumentation
 */

export { _resetSseWarnDedupForTesting, createMCPClient } from './client.js';
export {
  type CreateManagedMCPClientOptions,
  createManagedMCPClient,
  type ManagedReconnectOptions,
} from './managed.js';
export {
  createMcpResourceReader,
  type McpResourceReaderOptions,
} from './mcp-resource-reader.js';
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
  MCPElicitationHandler,
  MCPElicitationRequest,
  MCPElicitationResult,
  MCPPromptDefinition,
  MCPPromptMessage,
  MCPResourceContent,
  MCPResourceDefinition,
  MCPSamplingContent,
  MCPSamplingHandler,
  MCPSamplingMessage,
  MCPSamplingRequest,
  MCPSamplingResult,
  MCPToolDefinition,
  MCPToToolsOptions,
} from './types.js';
