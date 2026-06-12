---
'@graphorin/provider': patch
---

feat(provider): default request timeouts + structured-output plumbing on the HTTP adapters (PS-24)

Two table-stakes gaps:

- **Request timeouts** — no adapter or middleware implemented a timeout; a hung
  `llama-server` stalled `generate()` forever. `callJsonHttp` now applies a
  default **120 s time-to-response** budget (scoped to headers — a long
  streaming body is never killed), surfacing as a retryable `ProviderHttpError`
  ("request timed out after …") distinct from plain network errors. The
  caller's `signal` composes via `AbortSignal.any`; `timeoutMs` overrides per
  adapter (`0` disables). Documented in the providers guide.
- **Structured output** — `ProviderRequest.outputType` (set by the agent's
  AG-3 plumbing and the memory pipelines: query-transform, iterative, reconcile,
  deep, induce) was silently dropped by every adapter that declared
  `structuredOutput: true`. The OpenAI-shaped path (Ollama `/v1`,
  OpenAI-compatible, llama.cpp server) now maps it to `response_format`
  (`json_schema` with the supplied schema, else `json_object`); the native
  Ollama path maps it to `format` (schema object, else `'json'`). Gated on
  `capabilities.structuredOutput` so an override keeps requests clean for
  servers that reject the field. `llamaCppServerAdapter` gains the
  `capabilities` override it silently lacked.
