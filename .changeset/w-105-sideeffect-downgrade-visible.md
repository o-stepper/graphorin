---
'@graphorin/mcp': patch
---

W-105: an operator downgrade of an MCP tool's `sideEffectClass` below the sink classes (`'read-only'` / `'pure'` via `sideEffectClassByTool`) is now visible: one WARN per tool at adaptation time (naming the server, the tool and every gate the tool leaves - dataflow sink gate, Rule-of-Two writer forbid, read-only capability gate) and a new additive frozen `AdaptedToolsResult.downgradedTools` list for operator audits. The guide documents the consequences and that the server's own `readOnlyHint` is deliberately never trusted for classification. Default behaviour without overrides is byte-identical.
