---
'@graphorin/mcp': patch
---

Security hardening (W-017): the text of an MCP `isError` result is now sanitized at the MCP boundary before it rides into `MCPToolExecutionError` and, through the executor, into the model-visible `ToolError.message`. Previously the error path bypassed inbound sanitization entirely (it only ran on the success path), so a malicious server could deliver a prompt-injection payload verbatim via `isError: true`. The error text now goes through the same per-server inbound policy the adapted tool declares (default `detect-and-strip-and-wrap`: imperatives stripped, body wrapped in the `<<<untrusted_content trust="mcp-derived">>>` envelope with embedded delimiters neutralized); an operator's explicit `pass-through` override is honored for parity with the success path. New counter `mcp.tool-error.injection-flagged.total` increments when a pattern fires.
