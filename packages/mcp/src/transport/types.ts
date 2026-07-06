/**
 * Transport descriptors accepted by {@link createMCPClient}.
 *
 * The discriminated union mirrors the three transports the
 * `@modelcontextprotocol/sdk@^1.29.0` package exports:
 *
 * - `'stdio'`           - the primary transport for local MCP servers
 *   started as a child process. The transport spawns the configured
 *   command, pipes JSON-RPC over stdio, and tears the child down on
 *   `client.close()`.
 * - `'streamable-http'` - the current default transport for remote MCP
 *   servers (the spec-recommended replacement for the legacy SSE
 *   transport). Supports server-assigned `Mcp-Session-Id` + the
 *   `Last-Event-ID` resume handshake when the server advertises it on
 *   `initialize`.
 * - `'sse'`             - the deprecated legacy transport. Kept for
 *   back-compat with MCP servers that have not yet migrated to the
 *   streamable HTTP transport. The runtime emits one WARN-per-process
 *   on transport selection; the transport is not eligible for the
 *   resumable-session features.
 *
 * @stable
 */
export type MCPTransportConfig =
  | StdioTransportConfig
  | StreamableHttpTransportConfig
  | SseTransportConfig;

/** Options for the `'stdio'` transport. */
export interface StdioTransportConfig {
  readonly kind: 'stdio';
  readonly command: string;
  readonly args?: ReadonlyArray<string>;
  readonly env?: Readonly<Record<string, string>>;
  readonly cwd?: string;
  /**
   * How to handle the spawned child's stderr stream. Defaults to
   * `'inherit'` so operator-supplied servers print diagnostics to the
   * host process's stderr; `'pipe'` collects stderr into the
   * transport for in-process logging; `'ignore'` discards it.
   */
  readonly stderr?: 'inherit' | 'pipe' | 'ignore';
}

/** Options for the `'streamable-http'` transport. */
export interface StreamableHttpTransportConfig {
  readonly kind: 'streamable-http';
  readonly url: string | URL;
  readonly headers?: Readonly<Record<string, string>>;
  /**
   * Optional pre-existing session id. Most operators leave this
   * unset - the server assigns one on `initialize` and the client
   * persists it for the lifetime of the connection.
   */
  readonly sessionId?: string;
  /** Custom `fetch` implementation; defaults to the global `fetch`. */
  readonly fetch?: typeof fetch;
}

/** Options for the deprecated `'sse'` transport. */
export interface SseTransportConfig {
  readonly kind: 'sse';
  readonly url: string | URL;
  readonly headers?: Readonly<Record<string, string>>;
  readonly fetch?: typeof fetch;
}

/**
 * Server identity descriptor attached to every MCP-derived `Tool`.
 * Mirrors the shape consumed by the tool-registry collision
 * resolver; the `argsHash` / `urlHostname` fields are the
 * disambiguation keys the registry uses when surfacing collision
 * resolutions, while the canonical `id` field is the operator-
 * facing label.
 *
 * @stable
 */
export type ServerIdentity =
  | {
      readonly kind: 'mcp-stdio';
      /** Transport-derived id (W-016) - see the union TSDoc. */
      readonly id: string;
      readonly command: string;
      readonly argsHash: string;
      readonly serverInfoName?: string;
      /** Self-reported `serverInfo.name` - display/logs ONLY, never identity. */
      readonly reportedServerName?: string;
    }
  | {
      readonly kind: 'mcp-streamable-http';
      /** Transport-derived id including a non-default port (W-016). */
      readonly id: string;
      readonly urlHostname: string;
      readonly urlPath: string;
      readonly serverInfoName?: string;
      /** Self-reported `serverInfo.name` - display/logs ONLY, never identity. */
      readonly reportedServerName?: string;
    }
  | {
      readonly kind: 'mcp-sse';
      /** Transport-derived id including a non-default port (W-016). */
      readonly id: string;
      readonly urlHostname: string;
      readonly urlPath: string;
      readonly serverInfoName?: string;
      /** Self-reported `serverInfo.name` - display/logs ONLY, never identity. */
      readonly reportedServerName?: string;
    };
