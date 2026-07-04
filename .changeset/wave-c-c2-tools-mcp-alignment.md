---
'@graphorin/provider': minor
'@graphorin/tools': minor
---

Tools/MCP alignment (audit 2026-07-04 Wave C, cluster C2).

- Worked examples now fold into the model-facing tool description inside the adapters themselves (vercel, openai-shaped, ollama; idempotent with the `createProvider` fold), so raw-adapter setups get them too.
- `searchDeferred` indexes name + description + tags + worked-example comments (BM25 and semantic legs), widening `tool_search` recall to the phrasing examples document.
- tools-06: `sandbox_violation` and `rate_limited` are now actually produced - a non-ok `SandboxResult` keeps its structured kind (violation/memory-exceeded -> `sandbox_violation`, sandbox timeout -> `timeout`), and tool authors can throw the new `ToolRateLimitError` (with `retryAfterMs`) to surface `rate_limited` with a pacing hint.
- SEP-1303 conformance suite: one test per producible `ToolErrorKind` pins that every failure returns as a model-visible outcome (never a protocol throw, batch never shrinks). Docs: MCP 2026-07-28 RC deprecation callout (sampling/roots/logging frozen; Tasks targets the extension shape).
