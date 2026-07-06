---
'@graphorin/core': minor
'@graphorin/tools': minor
'@graphorin/mcp': minor
'@graphorin/agent': minor
'@graphorin/memory': minor
---

The ToolReturn envelope gets a symbol brand (W-115). New core exports: `TOOL_RETURN_BRAND` (`Symbol.for`, duplicate-copy safe), the `toolReturn()` factory, and the ONE shared guard `isToolReturnEnvelope` consumed by both the executor's unwrap and the registry's example-normalizer (the duplicated sniff is gone). The structural fallback for unbranded objects is deliberately narrow - own keys within `{output, contentParts, taint}` - so a tool legitimately returning `{output, exitCode, stderr}` now reaches the model whole instead of being silently stripped to `.output`; canonical unbranded literals keep unwrapping and increment `tool.result.envelope.unbranded-toolreturn.total` toward the sniff's future deprecation. First-party producers (MCP adaptCallResult, memory recall tools, toTool taint envelopes) now brand via `toolReturn()`. Downstream consumers relying on extra fields being dropped will now see them; plain data of exactly `{output: X}` remains ambiguous by contract - brand it or rename the field.
