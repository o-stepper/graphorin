# @graphorin/mcp

## 0.1.0

### Minor Changes

- Initial release. The `@graphorin/mcp` package ships the typed
  Model Context Protocol client used by Graphorin agents, the
  standalone server, and the CLI. The release surface includes the
  three transports (`stdio`, `streamable-http`, `sse`), the typed
  `MCPClient` (`listTools` / `listResources` / `listPrompts` /
  `callTool` / `readResource` / `getPrompt` / `close`), the
  strategy-aware `toTools()` adapter (per-server inbound
  prompt-injection sanitization, deferred-loading auto-default at
  the 10-tool threshold, structured-content + outputSchema
  round-trip with backward-compatible `TextContent` mirror,
  per-server result envelope overrides, collision-strategy +
  per-server priority, per-server preferredModel + side-effect
  class overrides), the pluggable `EventStore` contract for
  resumable Streamable HTTP sessions (`Mcp-Session-Id` +
  `Last-Event-ID` handshake), the OAuth bridge backed by
  `@graphorin/security/oauth`, the typed error hierarchy, and the
  helper functions consumed by `graphorin auth` (CLI). See the
  package `README.md` for the full surface inventory and the
  workspace `CHANGELOG.md` for the rollup release notes.
