---
'@graphorin/agent': patch
'@graphorin/channels': patch
'@graphorin/cli': patch
'@graphorin/embedder-ollama': patch
'@graphorin/embedder-transformersjs': patch
'@graphorin/evals': patch
'@graphorin/observability': patch
'@graphorin/pricing': patch
'@graphorin/proactive': patch
'@graphorin/provider-llamacpp-node': patch
'@graphorin/provider': patch
'@graphorin/reranker-llm': patch
'@graphorin/reranker-transformersjs': patch
'@graphorin/secret-1password': patch
'@graphorin/security': patch
'@graphorin/sessions': patch
'@graphorin/skills': patch
'@graphorin/store-sqlite': patch
'@graphorin/triggers': patch
'@graphorin/workflow': patch
---

Fourteenth deep retest P3: every package sitting between an application and a zod-peer package (`core`/`tools`/`memory`/`mcp`) now re-declares the `zod` peer as **optional** (`peerDependenciesMeta`), so strict Yarn PnP installs stop emitting `YN0086` "does not provide zod" warnings - the application root's zod instance flows through the intermediaries. npm/pnpm behaviour is unchanged (optional peers are not auto-installed; the underlying required peers still resolve exactly as before).
