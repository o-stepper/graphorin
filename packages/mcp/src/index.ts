/**
 * `@graphorin/mcp` - Model Context Protocol client for the Graphorin
 * framework.
 *
 * The package owns:
 *
 * - The {@link createMCPClient} factory that opens a typed MCP
 *   connection over stdio, Streamable HTTP, or the deprecated SSE
 *   transport.
 * - The {@link MCPClient} surface (`listTools` / `listResources` /
 *   `listPrompts` / `callTool` / `readResource` / `getPrompt` /
 *   `close`) plus the strategy-aware {@link MCPClient.toTools}
 *   adapter that bridges MCP tool descriptors into Graphorin
 *   `Tool` records.
 * - The OAuth bridge that resolves bearer headers from the
 *   {@link OAuthAuthorizationProvider} backed by
 *   `@graphorin/security/oauth`.
 * - Library helpers (`mcpAuthLogin`, `mcpAuthListSessions`,
 *   `mcpAuthRefresh`, `mcpAuthRevoke`, `mcpAuthStatus`) consumed by
 *   the upcoming `graphorin auth` CLI surface.
 * - Typed errors ({@link MCPConnectionError},
 *   {@link MCPProtocolError}, {@link MCPAuthError},
 *   {@link MCPToolNotFoundError}, {@link MCPCallTimeoutError},
 *   {@link MCPCancelledError}, {@link MCPInvalidConfigError},
 *   {@link MCPTransportNotSupportedError}, {@link GraphorinMCPError}).
 *
 * Stable sub-paths:
 *
 * ```ts
 * import { createMCPClient } from '@graphorin/mcp/client';
 * import { createOAuthAuthorizationProvider } from '@graphorin/mcp/oauth';
 * import { formatMCPServerName, validateMCPServerConfig } from '@graphorin/mcp/helpers';
 * import { MCPConnectionError } from '@graphorin/mcp/errors';
 * import type { MCPTransportConfig, ServerIdentity } from '@graphorin/mcp/transport';
 * ```
 *
 * @packageDocumentation
 */

/** Canonical version constant, derived from `package.json` at build time. */
import pkg from '../package.json' with { type: 'json' };

export const VERSION: string = pkg.version;

export * from './client/index.js';
export * from './errors/index.js';
export * from './helpers/index.js';
export * from './oauth/index.js';
export * from './transport/index.js';
