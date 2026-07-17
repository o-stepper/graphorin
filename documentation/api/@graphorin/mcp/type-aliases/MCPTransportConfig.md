[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPTransportConfig

# Type Alias: MCPTransportConfig

```ts
type MCPTransportConfig = 
  | StdioTransportConfig
  | StreamableHttpTransportConfig
  | SseTransportConfig;
```

Defined in: [packages/mcp/src/transport/types.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L24)

Transport descriptors accepted by [createMCPClient](/api/@graphorin/mcp/functions/createMCPClient.md).

The discriminated union mirrors the three transports the
`@modelcontextprotocol/sdk@^1.29.0` package exports:

- `'stdio'`           - the primary transport for local MCP servers
  started as a child process. The transport spawns the configured
  command, pipes JSON-RPC over stdio, and tears the child down on
  `client.close()`.
- `'streamable-http'` - the current default transport for remote MCP
  servers (the spec-recommended replacement for the legacy SSE
  transport). Supports server-assigned `Mcp-Session-Id` + the
  `Last-Event-ID` resume handshake when the server advertises it on
  `initialize`.
- `'sse'`             - the deprecated legacy transport. Kept for
  back-compat with MCP servers that have not yet migrated to the
  streamable HTTP transport. The runtime emits one WARN-per-process
  on transport selection; the transport is not eligible for the
  resumable-session features.

## Stable
