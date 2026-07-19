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
'@graphorin/proactive': patch
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

Public TSDoc no longer carries internal audit/work-item ticket ids ("deep retest P1-3", "W-135", wave letters, finding families): roughly 1100 docblock sites across 28 packages were rewritten to describe the behaviour itself, with every technical statement preserved (decision-record references like ADR-x/DEC-x stay). Two runtime strings also dropped their ticket ids: the tools executor's approval-rewrite refusal message and the server's secret-resolution hint. A new `check-api-wording` gate scans the generated API reference and fails CI if ticket vocabulary ever leaks back in.
