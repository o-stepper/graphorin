---
'@graphorin/mcp': minor
---

fix(mcp): isError is a tool failure; ctx.signal and timeoutMs reach the wire (MC-4, MC-5, MC-3)

- **MC-4**: an MCP `CallToolResult.isError: true` was adapted into a
  successful `ToolReturn` — no ToolError, no failure audit, retry/error
  policies never engaged, and success-gated consumers (procedure induction)
  got corrupted signals. `adaptCallResult` now throws the new
  `MCPToolExecutionError` (`kind: 'tool-execution'`) carrying the server's
  content text, so the executor records a real failure while the model
  keeps the self-correction text.
- **MC-5**: an adapted tool's `execute()` ignored `ToolExecutionContext` —
  aborting the agent run never cancelled the in-flight MCP call, orphaning
  the JSON-RPC request server-side. The adapter now forwards `ctx.signal`
  to `client.callTool`, so cancellation sends `notifications/cancelled`.
- **MC-3**: `callTool(..., { timeoutMs })` was silently ignored (the SDK
  default applied) and the documented `MCPCallTimeoutError` was never
  instantiated. `timeoutMs` now maps onto the SDK request timeout (and
  total ceiling), SDK timeouts surface as `MCPCallTimeoutError`, and
  `toTools({ callTimeoutMs })` applies a per-server call timeout to every
  adapted tool.
