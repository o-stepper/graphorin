---
'@graphorin/core': patch
---

Core API stability is now enforced, not just claimed (W-127): the public surface is committed as an api-extractor report (`packages/core/etc/core.api.md`) and the new `check-api-report` CI gate fails any PR that changes the surface without updating it. Point fixes ride along: `ProviderResponse.toolCalls` reuses the canonical `ToolCall` type (the inline shape was structurally identical - not a breaking change), `Tool.defer_loading` documents its deliberate snake_case (one-to-one with the Anthropic wire flag), `SessionMemoryStore.search` documents that the positional `query` is authoritative over `opts.query` (pinned by a store-sqlite test), and the README's stale "loose @experimental corners" line now states the truth: the whole core surface ships `@stable`; `@experimental` lives in mcp/tools/security/skills.
