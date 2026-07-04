---
'@graphorin/mcp': patch
'@graphorin/skills': patch
'@graphorin/tools': patch
---

MCP correctness tail (audit 2026-07-04 Wave B, cluster B8).

- mcp-skills-05: a `sampling/createMessage` carrying `tools` / `toolChoice` is rejected with an `McpError` (the 2025-11-25 MUST - the client does not declare `sampling.tools`; previously it silently answered as a plain completion). URL-mode elicitation is declined honestly instead of being surfaced as an empty form with the URL invisible.
- mcp-skills-06: MCP resource handles are scoped to their originating server (`mcp:<serverId>:<uri>`); `createMcpResourceReader` consults ONLY the matching client, closing the cross-server confused-deputy hop where server A's link (or a prompt-injected model) fetched a resource from trusted server B. Bare URIs are refused unless `allowCrossServer: true` is opted in.
- mcp-skills-07: server-supplied JSON-Schema `pattern`s are guarded before compilation - pattern/tested-string length caps plus a nested-quantifier heuristic (`(a+)+`-class) - so a malicious server can no longer stall the event loop with catastrophic backtracking; guarded-out patterns degrade to permissive like malformed ones.
- mcp-skills-10: new `onTransportClose` / `onTransportError` callbacks (plus `mcp.transport.closed|error.total` counters and a WARN log) surface a dead stdio child / dropped HTTP session; previously a disconnect was observable only as protocol errors on later calls.
- mcp-skills-11: new `MCPClient.readResourceContents(uri)` returns every content item; the single-content `readResource` convenience now WARNs + counts when it truncates a multi-content response.
- mcp-skills-04 (adjusted): a same-source tool re-registration increments `tool.registry.same-source-replaced.total`, so two server instances colliding on one identity are observable churn instead of a silent swap.
- mcp-skills-09 (F-10): the documented NESTED `metadata.graphorin` frontmatter form now actually resolves (flat dotted keys still win when both are present); skills.md fixes `sandboxTier` to `sandbox` and the `parseSlashCommand` output shape.
- mcp-skills-08 (F-9): mcp-client.md rewritten to the real observability surface (counters, no `mcp.tool.invoke` span, no per-call audit rows), the real executor error mapping, and the `.`-namespaced `sideEffectClassByTool` keys; sampling-with-tools / tasks / icons documented as known-unsupported.
