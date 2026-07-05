---
'@graphorin/agent': minor
'@graphorin/cli': minor
'@graphorin/client': minor
'@graphorin/core': minor
'@graphorin/embedder-ollama': minor
'@graphorin/embedder-transformersjs': minor
'@graphorin/eslint-plugin': minor
'@graphorin/evals': minor
'@graphorin/mcp': minor
'@graphorin/memory': minor
'@graphorin/observability': minor
'@graphorin/pricing': minor
'@graphorin/protocol': minor
'@graphorin/provider': minor
'@graphorin/provider-llamacpp-node': minor
'@graphorin/reranker-llm': minor
'@graphorin/reranker-transformersjs': minor
'@graphorin/secret-1password': minor
'@graphorin/security': minor
'@graphorin/server': minor
'@graphorin/sessions': minor
'@graphorin/skills': minor
'@graphorin/store-sqlite': minor
'@graphorin/store-sqlite-encrypted': minor
'@graphorin/tools': minor
'@graphorin/triggers': minor
'@graphorin/workflow': minor
---

W-072: every export map's `import` condition becomes `default`, and the Node floor rises to `>=22.12.0`.

CJS consumers previously hit a bewildering `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of a clear ESM-only signal. With the `default` condition, plain `require('@graphorin/core')` works via Node's stable `require(esm)` - which shipped in 22.12, hence the engines bump across every workspace manifest (packages, examples, benchmarks, docs; enforced by the widened mvp-readiness sweep). No dual-instance hazard: there is no CJS build, `require()` returns the same ESM module instance. ESM consumers are unaffected (`default` serves both paths; `types` stays first). The pack gate now runs attw under the full `node16` profile (was `esm-only`) and adds a runtime `require(esm)` smoke against the packed tarballs. Installs on Node 22.0-22.11 with `engine-strict` will refuse - upgrade Node (see the migration guide).
