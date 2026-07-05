---
'@graphorin/agent': patch
'@graphorin/cli': patch
'@graphorin/client': patch
'@graphorin/core': patch
'@graphorin/embedder-ollama': patch
'@graphorin/embedder-transformersjs': patch
'@graphorin/eslint-plugin': patch
'@graphorin/evals': patch
'@graphorin/mcp': patch
'@graphorin/memory': patch
'@graphorin/observability': patch
'@graphorin/pricing': patch
'@graphorin/protocol': patch
'@graphorin/provider': patch
'@graphorin/provider-llamacpp-node': patch
'@graphorin/reranker-llm': patch
'@graphorin/reranker-transformersjs': patch
'@graphorin/secret-1password': patch
'@graphorin/security': patch
'@graphorin/server': patch
'@graphorin/sessions': patch
'@graphorin/skills': patch
'@graphorin/store-sqlite': patch
'@graphorin/store-sqlite-encrypted': patch
'@graphorin/tools': patch
'@graphorin/triggers': patch
'@graphorin/workflow': patch
---

Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.
