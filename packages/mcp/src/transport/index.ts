/**
 * Transport descriptors + identity helpers for `@graphorin/mcp`.
 *
 * @packageDocumentation
 */

export { deriveServerIdentity, formatMCPServerName } from '../helpers/identity.js';
export { validateMCPServerConfig } from '../helpers/validate-config.js';
export type {
  MCPTransportConfig,
  ServerIdentity,
  SseTransportConfig,
  StdioTransportConfig,
  StreamableHttpTransportConfig,
} from './types.js';
