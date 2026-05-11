/**
 * Factory that materialises a `@modelcontextprotocol/sdk` `Transport`
 * instance from a {@link MCPTransportConfig}.
 *
 * The factory is small on purpose: every MCP-spec evolution (new
 * transport, transport-specific option, transport-level header
 * convention) lands here so the higher-level {@link createMCPClient}
 * stays untouched.
 *
 * @packageDocumentation
 */

import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

import type { MCPTransportConfig } from '../transport/types.js';

/**
 * Outcome of the transport build, including the SDK transport
 * instance and the helper hooks the client needs to forward to the
 * SDK.
 */
export interface BuiltTransport {
  readonly transport: Transport;
  readonly resolveAuthHeader?: () => Promise<string | null>;
  readonly disposeBeforeStart?: () => Promise<void>;
}

/**
 * Build a SDK `Transport` from a {@link MCPTransportConfig}.
 *
 * @stable
 */
export function buildTransport(config: MCPTransportConfig): BuiltTransport {
  switch (config.kind) {
    case 'stdio': {
      const stdio: Transport = new StdioClientTransport({
        command: config.command,
        ...(config.args === undefined ? {} : { args: [...config.args] }),
        ...(config.env === undefined ? {} : { env: { ...config.env } }),
        ...(config.cwd === undefined ? {} : { cwd: config.cwd }),
        ...(config.stderr === undefined ? {} : { stderr: config.stderr }),
      });
      return Object.freeze({ transport: stdio });
    }
    case 'streamable-http': {
      const url = typeof config.url === 'string' ? new URL(config.url) : config.url;
      const headers = { ...(config.headers ?? {}) };
      // The SDK class's `sessionId: string | undefined` getter is
      // structurally narrower than `Transport.sessionId?: string` in
      // strict mode; route through `unknown` to keep the public
      // surface clean.
      const sdkTransport = new StreamableHTTPClientTransport(url, {
        ...(config.fetch === undefined ? {} : { fetch: config.fetch }),
        requestInit: { headers },
        ...(config.sessionId === undefined ? {} : { sessionId: config.sessionId }),
      });
      const transport = sdkTransport as unknown as Transport;
      return Object.freeze({ transport });
    }
    case 'sse': {
      const url = typeof config.url === 'string' ? new URL(config.url) : config.url;
      const headers = { ...(config.headers ?? {}) };
      const transport: Transport = new SSEClientTransport(url, {
        ...(config.fetch === undefined ? {} : { fetch: config.fetch }),
        requestInit: { headers },
      });
      return Object.freeze({ transport });
    }
  }
}
