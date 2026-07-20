---
'@graphorin/agent': patch
'@graphorin/cli': patch
'@graphorin/core': patch
'@graphorin/eslint-plugin': patch
'@graphorin/evals': patch
'@graphorin/mcp': patch
'@graphorin/memory': patch
'@graphorin/observability': patch
'@graphorin/protocol': patch
'@graphorin/provider': patch
'@graphorin/provider-llamacpp-node': patch
'@graphorin/reranker-llm': patch
'@graphorin/reranker-transformersjs': patch
'@graphorin/security': patch
'@graphorin/server': patch
'@graphorin/store-sqlite': patch
'@graphorin/tools': patch
---

Every type referenced by a public API is now exported from a documented barrel - about 130 previously unreachable types (memory tool input/output shapes, executor and truncation hooks, audit listener signatures, protocol frame schemas, sandbox peer-module views, new core agent-event variants, and more) became importable, clearing all 115 TypeDoc referenced-but-not-included warnings. Three previously file-local names were renamed while being made public: the tools audit listener is `ToolAuditListener`, the memory-guard listener is `MemoryGuardAuditListener`, the secret-value listener is `SecretValueAuditListener`, and the built-in tool-search match row is `ToolSearchToolMatch` (the registry-level `ToolSearchMatch` is unchanged). None of these were importable before, so no consumer code breaks.
