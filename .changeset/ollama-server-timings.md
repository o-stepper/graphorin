---
"@graphorin/core": minor
"@graphorin/provider": minor
---

Ollama server timings surfaced in events and traces (external audit 2026-07-16, item 8). The core `ProviderEvent` `finish` variant gains an optional `providerMetadata` field mirroring `ProviderResponse.providerMetadata` for the streaming path. The Ollama adapter normalizes the server's nanosecond timing fields into the new `OllamaTimings` shape (`totalMs` / `loadMs` / `promptEvalMs` / `evalMs`) and reports it under `providerMetadata.ollama` on both the streamed `finish` event and the `generate()` response, so model load, prompt processing and generation are finally distinguishable - a cold call dominated by `loadMs` no longer looks like slow generation. `withTracing` stamps numeric vendor diagnostics from `providerMetadata` onto the provider span as `graphorin.provider.<vendor>.<key>` attributes (bounded, numbers only). `DEFAULT_OLLAMA_BASE_URL` is now exported from the package barrel.
