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

Tarballs now ship `src/` so the published `dist/**/*.d.ts.map` files actually work (W-136): the maps referenced `../src/*.ts` that the `files` whitelist excluded, so go-to-definition fell back into `.d.ts` and the shipped maps were dead weight. The pack gate gains a `map-integrity` leg: every source referenced by a shipped map must resolve inside the tarball (or be embedded via `sourcesContent`), with an anti-vacuous guard - a package whose tsdown config emits declaration maps must contain a non-zero number of `.d.ts.map` files, so a cache-restored dist that silently dropped maps fails the gate instead of passing vacuously. `mvp-readiness` now requires `src` in every publishable `files` array.
