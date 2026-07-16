---
'@graphorin/mcp': patch
---

Correct the MCP client downgrade-audit documentation (e2e 2026-07-16, MCP-SKIL-01, doc-drift). The guide referenced `AdaptedToolsResult.downgradedTools` as the audit surface for per-tool trust downgrades, but no such type is exported and `toTools()` returns a plain `Tool[]`. The guide now states the auditable record is the one WARN logged per downgrade at adaptation time.
