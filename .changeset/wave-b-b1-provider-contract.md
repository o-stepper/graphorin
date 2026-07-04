---
'@graphorin/provider': patch
'@graphorin/provider-llamacpp-node': patch
'@graphorin/core': patch
---

Provider adapters now match their real SDK / wire contracts (audit 2026-07-04 Wave B, cluster B1).

- vercel adapter: Graphorin tools convert to the AI SDK's name-keyed record with `jsonSchema()`-shaped input schemas; assistant `toolCalls` become `tool-call` content parts, `ToolMessage`s become `tool-result` messages, system-role messages hoist into the `system` option, and `toolChoice` maps onto the SDK spelling. Tool loops now run against the real `ai` peer (previously every tool conversation failed SDK validation). A real-SDK contract test suite (dev-only `ai` dependency) pins the shapes.
- Anthropic token counter posts Anthropic wire-shaped bodies (system hoist, `tool_use` / `tool_result` blocks, turn merging) instead of raw Graphorin messages that 400'd on any agent transcript; degradation to the tiktoken fallback now WARNs once.
- HTTP errors carry a canonical `errorKind` (shared `classifyHttpStatus` mapper: 429 rate-limit, 401/403 unauthorized, 5xx transient/capacity, context-length body sniff) plus captured `retry-after` / `x-ratelimit-*` headers; `withFallback` / `withRetry` consult them, so a 429 on the primary finally fails over and honours server-provided delays.
- llamacpp-node: the system prompt is no longer injected twice, per-request contexts/sequences are disposed after every stream (KV-cache leak), and aborted streams report `finishReason: 'aborted'`.
- OpenAI-compatible streaming sends `stream_options: { include_usage: true }` so vLLM / Together / OpenAI report real usage; `openAICompatibleAdapter` gained the `capabilities` / `timeoutMs` options its siblings had.
- `withCostTracking` bills separately-reported reasoning tokens at the output rate; classifiers recognise Bedrock cross-region ids (`us.anthropic.claude-...`) and the AI SDK's dotted provider ids.
