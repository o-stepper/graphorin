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
  readonly disposeBeforeStart?: () => Promise<void>;
}

/**
 * Live source of the outbound `Authorization` header for the HTTP
 * transports. The bridge's `OAuthAuthorizationProvider` satisfies this
 * structurally (its `resolveHeader()` already returns the full
 * `Bearer <token>` value); a static `bearerToken` is wrapped into a
 * constant resolver by {@link createMCPClient}.
 *
 * @internal
 */
export interface TransportAuthSource {
  /** Resolve the full `Authorization` header value (e.g. `Bearer abc`). */
  resolveHeader(): Promise<string> | string;
}

/**
 * Wrap a `fetch` implementation so the live `Authorization` header is
 * re-resolved and injected on **every** outgoing request. The wrapper
 * always overwrites a caller-supplied `Authorization` header so the
 * provider stays the single source of truth (refresh-ahead from
 * {@link createOAuthAuthorizationProvider} fires per request).
 */
function authWrappedFetch(baseFetch: typeof fetch, auth: TransportAuthSource): typeof fetch {
  return (async (input: Parameters<typeof fetch>[0], init?: RequestInit): Promise<Response> => {
    const header = await auth.resolveHeader();
    const headers = new Headers(init?.headers);
    headers.set('Authorization', header);
    return baseFetch(input, { ...init, headers });
  }) as typeof fetch;
}

/**
 * Build a SDK `Transport` from a {@link MCPTransportConfig}.
 *
 * When an `auth` source is supplied (HTTP transports only) the factory
 * installs a per-request fetch-wrapper that re-resolves the
 * `Authorization` header on every outgoing call — this is the seam that
 * makes a long-lived agent session survive OAuth token expiry without
 * re-creating the client.
 *
 * @stable
 */
export function buildTransport(
  config: MCPTransportConfig,
  options?: { readonly auth?: TransportAuthSource },
): BuiltTransport {
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
      const baseFetch = config.fetch ?? fetch;
      const fetchImpl =
        options?.auth === undefined ? config.fetch : authWrappedFetch(baseFetch, options.auth);
      // The SDK class's `sessionId: string | undefined` getter is
      // structurally narrower than `Transport.sessionId?: string` in
      // strict mode; route through `unknown` to keep the public
      // surface clean.
      const sdkTransport = new StreamableHTTPClientTransport(url, {
        ...(fetchImpl === undefined ? {} : { fetch: fetchImpl }),
        requestInit: { headers },
        ...(config.sessionId === undefined ? {} : { sessionId: config.sessionId }),
      });
      const transport = sdkTransport as unknown as Transport;
      return Object.freeze({ transport });
    }
    case 'sse': {
      const url = typeof config.url === 'string' ? new URL(config.url) : config.url;
      const headers = { ...(config.headers ?? {}) };
      const baseFetch = config.fetch ?? fetch;
      const fetchImpl =
        options?.auth === undefined ? config.fetch : authWrappedFetch(baseFetch, options.auth);
      const transport: Transport = new SSEClientTransport(url, {
        ...(fetchImpl === undefined ? {} : { fetch: fetchImpl }),
        requestInit: { headers },
      });
      return Object.freeze({ transport });
    }
  }
}
