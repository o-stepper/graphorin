---
'@graphorin/mcp': patch
---

`listTools`/`listResources`/`listPrompts` now follow `nextCursor` and drain the full cursor chain (mcp-skills-02). MCP list operations are paginated since protocol 2024-11-05 and the SDK does not auto-paginate, so a paginating server's catalogue was silently truncated to page 1 - tools beyond it never reached `toTools()`, defer-loading thresholds counted a partial catalogue, and pin fingerprints covered a partial catalogue. A defensive 100-page cap (with a WARN) bounds buggy or adversarial servers that never terminate the chain.
