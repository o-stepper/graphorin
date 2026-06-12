---
'@graphorin/mcp': minor
---

fix(mcp): adapted tools carry the mcp provenance stamp; dead per-call options removed (MC-7, MC-12)

- **MC-7**: `toTools()` returned unstamped `Tool`s, so MCP tools passed via
  `config.tools` (the only real path) were classified `first-party-user-defined`
  by the agent registry — their output was never marked untrusted for the
  WI-12 dataflow / lethal-trifecta policy (inbound sanitization survived;
  provenance did not). Every adapted tool is now pre-stamped with
  `__source: { kind: 'mcp', serverIdentity }`, which `inferToolSource`
  already honours — registration yields `__trustClass: 'mcp-derived'` and an
  untrusted taint label with zero operator boilerplate.
- **MC-12**: `MCPToToolsOptions.collisionStrategy` / `.priority` were
  declared but never consumed by the adapter (collision resolution happens
  at registry registration, which `toTools()` does not perform) — both
  removed. The client-level `createMCPClient({ collisionStrategy, priority })`
  surface (exposed as `MCPClient` metadata) is unchanged.
