---
'@graphorin/agent': patch
'@graphorin/cli': patch
'@graphorin/core': patch
'@graphorin/embedder-ollama': patch
'@graphorin/embedder-transformersjs': patch
'@graphorin/eslint-plugin': patch
'@graphorin/mcp': patch
'@graphorin/memory': patch
'@graphorin/observability': patch
'@graphorin/pricing': patch
'@graphorin/provider': patch
'@graphorin/provider-llamacpp-node': patch
'@graphorin/security': patch
'@graphorin/server': patch
'@graphorin/sessions': patch
'@graphorin/skills': patch
'@graphorin/store-sqlite': patch
'@graphorin/tools': patch
'@graphorin/triggers': patch
'@graphorin/workflow': patch
---

Every published package now declares its tree-shaking contract via `sideEffects` (W-137): 18 packages audited to a pure module scope get `false`, the CLI declares its bin entry (`["./dist/bin/*"]`), and `@graphorin/security` gets an explicit `true` - its secrets subsystem registers built-in resolvers and the SecretValue caller-context provider at import time, so marking it pure would let bundlers drop those registrations. `mvp-readiness` now fails any publishable manifest without a declared `sideEffects`, closing the drift for future packages.
