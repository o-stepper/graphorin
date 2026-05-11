---
'@graphorin/core': minor
'@graphorin/provider': minor
'@graphorin/provider-llamacpp-node': minor
---

Phase 06 — provider layer. Two new packages join the Graphorin
framework on top of the foundations from Phase 02
(`@graphorin/core`), Phase 03 (`@graphorin/security`), Phase 04
(`@graphorin/observability` + `@graphorin/pricing`), and Phase 05
(`@graphorin/store-sqlite` + `@graphorin/embedder-transformersjs` +
`@graphorin/embedder-ollama` + `@graphorin/triggers`). After this
phase, every later module has a vendor-neutral LLM call path.

`@graphorin/core` ships:

- **New cost-tier vocabulary** — `ModelHint = 'fast' | 'balanced' |
  'smart'` plus the `MODEL_HINTS` literal triple and a unified
  `ModelSpec = ProviderLike | { provider: ProviderLike; model: string }`
  shape. The vocabulary is provider-agnostic at the tool author level;
  the operator-side `Agent.modelTierMap?` mapping (Phase 12) resolves
  the hint to a concrete provider per agent.
- **New `LocalProviderTrust` literal union** — `'loopback' | 'private'
  | 'public-tls' | 'public-cleartext'` — the canonical trust class
  assigned to a local-LLM provider based on its `baseUrl`. Hoisted to
  `@graphorin/core/contracts` so security policy and observability
  consumers can type against it without a `@graphorin/provider`
  dependency. Legacy `OllamaTrust` alias preserved with `@deprecated`
  JSDoc; removed in v0.2.
- **New `ReasoningRetention` policy enum** — `'strip' |
  'pass-through-claude' | 'pass-through-all'` — controls intra-loop
  reasoning-content transmission between consecutive
  `provider.stream(...)` calls. Companion `ReasoningContract` literal
  declared on `ProviderCapabilities` lets adapters publish their
  per-family default (`'hidden' | 'round-trip-required' | 'optional'`).
- **`ProviderRequest.reasoningRetention?`** — per-request override that
  always wins over the adapter / agent default.
- **`ReasoningContent.meta?`** — optional opaque metadata round-tripped
  byte-equal when retention is `'pass-through-*'`. The field is
  provider-supplied protocol payload; redaction scanning skips it
  entirely.

`@graphorin/provider` ships:

- **`createProvider(adapter, options?)`** — wraps an adapter return
  value in the canonical `Provider` shape; centralises sensitivity
  declarations, capability narrowing, and reasoning-retention
  defaults.
- **Four adapters out of the box** —
  - `vercelAdapter(model, opts?)` — wraps any `LanguageModel`-shaped
    AI SDK value in a Graphorin `Provider`. The AI SDK is an
    optional peer; the adapter dynamically imports `'ai'` on first
    use, and tests inject `runtimeOverrides` to short-circuit the
    import. Translates the streaming chunks (`text-delta`,
    `reasoning(-delta)`, `tool-call(-streaming)`, `finish`,
    `error`) onto the canonical `ProviderEvent` discriminated union.
  - `ollamaAdapter(opts)` — direct client for the native Ollama HTTP
    API (`POST /api/chat`, newline-delimited JSON streaming). Refuses
    to start on `public-cleartext` URLs unless
    `allowInsecureTransport: true` is supplied.
  - `llamaCppServerAdapter(opts)` — direct client for the upstream
    `llama-server` binary from the llama.cpp project. Speaks the
    OpenAI-compatible REST contract end-to-end (`POST /v1/chat/completions`
    with `text/event-stream` chunks terminated by `data: [DONE]`).
  - `openAICompatibleAdapter(opts)` — generic OpenAI-compatible
    adapter — works against LMStudio (port 1234), LocalAI (port 8080),
    vLLM (`python -m vllm.entrypoints.openai.api_server`,
    port 8000), Together-style self-host endpoints, and any other
    server in the OpenAI-compatible ecosystem.
- **Shared `LocalProviderTrust` classifier** at
  `@graphorin/provider/trust/classify-local-provider.ts` — one
  classifier, one policy table, one error type. Consumed by every
  `baseUrl`-driven adapter. Per-tier sensitivity defaults exposed via
  `SENSITIVITY_DEFAULTS_PER_TRUST`. In-process adapters declare a
  permanent `loopback` classification via
  `PERMANENT_LOOPBACK_CLASSIFICATION`. Public-cleartext URLs raise
  `LocalProviderInsecureTransportError` (legacy alias
  `OllamaInsecureTransportError` preserved for one minor; both point
  at the same constructor).
- **Canonical-order middleware composer** — `composeProviderMiddleware([...])`
  enforces the documented ordering at startup and throws
  `MiddlewareOrderingError` with the offending pair on violation.
  The seven built-in middlewares (`withTracing`, `withRetry`,
  `withRateLimit`, `withCostLimit`, `withCostTracking`,
  `withFallback`, `withRedaction`) brand themselves with a
  cross-realm-safe `MIDDLEWARE_KIND` symbol so the composer can
  walk and validate the chain. Custom middleware registers via
  `defineProviderMiddleware({ kind, factory })` and is allowed at
  any position relative to the canonical entries.
- **`withRedaction` outbound prompt-redaction middleware** — the
  innermost layer in the canonical order. Walks every text-bearing
  field of `ProviderRequest` (system / user / assistant / tool
  messages, tool-call args, vendor-prefixed `cache_control` spans),
  detects `SecretValue`-shaped instances cross-realm via the shared
  `Symbol.for('graphorin.SecretValue')` brand, runs the configured
  pattern catalogue (defaults to the 14 built-in patterns shared with
  `@graphorin/observability/redaction/patterns`), applies the
  configured action (`'redact'` in-place by default; `'throw'` for
  `failClosed: true`), and emits one sanitised violation per
  detection (consumer-supplied `onViolation` hook). Trust-class-aware
  defaults: `loopback` providers scope to `'secret-value-only'`;
  `private` and `public-tls` use `'all'`. Streaming response side
  scan is observability-only — emits violations on `text-delta`
  chunks but does NOT mutate stream content.
- **Production startup hook** — `assertProductionMiddleware(provider, opts?)`
  throws `MissingProductionMiddlewareError` when a security-critical
  middleware is missing under `NODE_ENV=production`. Defaults to
  enforcing `withRedaction`; consumers extend the `requiredKinds`
  list to lock additional middlewares.
- **Pluggable `TokenCounter` dispatcher** — `createDefaultCounter({ model, provider?, anthropicApiKey? })`
  returns the recommended counter per `(provider, model)`:
  - Anthropic Claude → `AnthropicAPICounter` (native `count_tokens`
    when an API key is configured; `cl100k_base` proxy otherwise).
  - OpenAI / OpenAI-compatible → `JsTiktokenCounter('cl100k_base')`.
  - Google Gemini → `GoogleAPICounter` (cl100k_base proxy in v0.1).
  - Bedrock → `BedrockAPICounter` (cl100k_base proxy in v0.1).
  - Ollama / unknown → `HeuristicCounter` (default `chars/4`) with
    one WARN per `(id, modelId)` tuple per process.
- **`detectProviderFamily({ model, provider? })`** — exported helper
  that classifies a `(model, provider)` pair into one of seven
  families. Reused by `createDefaultCounter` and by the model-tier
  classifier to keep provider-family detection in one place.
- **Process-global counter slot** — `setGlobalTokenCounter(counter)` /
  `getGlobalTokenCounter()`. Components in later phases (the
  ContextEngine in Phase 10) read the global slot when no per-provider
  counter is wired explicitly.
- **Per-provider model-tier auto-classifier** —
  `classifyModelTier(provider)` returns `'fast' | 'balanced' | 'smart'
  | undefined` for any provider's `modelId`. The classifier is a pure
  function backed by a static rule table (`CLASSIFIER_RULES`). The
  table covers the canonical 2026 model families (Anthropic Haiku /
  Sonnet / Opus, OpenAI gpt-* / o*, Google Gemini Flash / Pro / Ultra,
  AWS Bedrock variants); Ollama / OpenAI-compatible / unknown returns
  `undefined`. Consumed by the agent runtime (Phase 12) to validate
  operator-supplied tier mappings and to surface tier-not-mapped
  recommendations.
- **Reasoning-retention resolver** — `resolveReasoningRetention({...})`
  picks the effective `ReasoningRetention` for a request given the
  precedence ladder explicit-request > instance-override >
  contract-default > `'strip'`. The resolver is consumed by
  `createProvider(...)` and by every adapter that needs to populate
  the per-request default.

`@graphorin/provider-llamacpp-node` ships:

- **`llamaCppNodeAdapter(opts)`** — in-process GGUF adapter wrapping
  `node-llama-cpp@^3.5`. Loads a `.gguf` model file directly into
  the same Node process — no daemon, no port to manage, no GPU
  contention with other processes. Declares `trust: 'loopback'`
  permanently because the model lives in the same trust boundary as
  the host process; the symmetry mirrors
  `@graphorin/embedder-transformersjs` (in-process embedder; same
  trust boundary).
- **`LlamaCppNativeCounter`** — token counter that wraps
  `model.tokenize(text)` from the loaded GGUF instance, strictly
  tighter than the cl100k_base proxy used by the HTTP-shaped local
  adapters. Cache invalidation is keyed on the model file path
  fingerprint when supplied so swapping models invalidates the
  per-message caches upstream.
- **`runtimeOverrides`** seam — every adapter call lazily loads the
  `node-llama-cpp` peer on first use; tests inject a fixture-driven
  override so the suite runs offline without taking the heavy native
  peer.
- **Documentation-only GGUF model provenance discipline** — README
  documents the recommended publishers
  (`huggingface.co/ggml-org`, `huggingface.co/TheBloke`,
  `huggingface.co/bartowski`, `huggingface.co/unsloth`,
  `huggingface.co/Qwen` for official Qwen) and the SHA-256
  verification procedure. Full enforcement (allowlist + signature
  verification) is a future Graphorin work item.
- **HITL durable-resume tradeoff documentation** — README documents
  that the in-process adapter does NOT survive a process restart
  mid-stream; for HITL durable mid-stream resume one of the
  HTTP-shaped adapters (`ollamaAdapter`, `llamaCppServerAdapter`,
  `openAICompatibleAdapter`) is the better choice.

Repository hygiene:

- `scripts/check-no-network.mjs` already allow-listed
  `packages/provider/` ahead of this phase per the conventional
  network-allow-list discipline; `@graphorin/provider-llamacpp-node`
  has no fetch-shaped network calls (the in-process adapter loads
  files from disk and runs inference locally, the test seam injects
  fixtures).
- New packages pass `pnpm exec biome check` cleanly.
- 317 new tests cover the full surface (293 in `@graphorin/provider`
  + 24 in `@graphorin/provider-llamacpp-node`); both packages clear
  the 80% line / 80% function / 75% branch coverage thresholds
  declared in their `vitest.config.ts`.
- New `@graphorin/provider/reasoning` sub-path export bundles the
  reasoning-content lifecycle helpers (`resolveReasoningRetention`,
  `inferReasoningContract`, `applyReasoningPolicy`) for downstream
  consumption (e.g. by `@graphorin/provider-llamacpp-node` to apply
  the same in-process preflight discipline as the HTTP-shaped
  adapters).

Deep-audit fixes (post-initial-implementation, same release):

- **`withRedaction.stripCacheControlOnHit`** is now wired end-to-end:
  when the scrubber records a hit anywhere in the request and the
  caller's `providerOptions.anthropic.cache_control` is set, the
  marker is stripped before send and an
  `'anthropic-cache-control-stripped'` violation is emitted via the
  `onViolation` hook. The default remains `true`.
- **`withRetry`** now honours `Retry-After`: the loop reads
  `retryAfterMs` (numeric milliseconds) or `retryAfterSeconds`
  (numeric seconds) from the thrown error AND `headers['retry-after']`
  (numeric seconds OR HTTP-date) from HTTP-shaped errors. The
  resolved hint replaces the computed exponential / linear / constant
  backoff for that one attempt and is still capped at `maxDelayMs`.
  The default `retryableErrors` predicate also recognises
  `RateLimitExceededError` (`kind: 'rate-limit-exceeded'`), HTTP 429,
  and `kind: 'capacity'` in addition to the existing `'transient'` /
  `'rate-limit'` / 5xx kinds.
- **Per-family `reasoningContract` auto-detection** lands on the
  cloud-LLM `vercelAdapter`. The new
  `@graphorin/provider/reasoning/inferReasoningContract({modelId,provider?})`
  pure function maps Anthropic Claude families (and Bedrock-Claude
  variants) to `'round-trip-required'`, OpenAI o1 / o3 + Gemini
  reasoning variants to `'hidden'`, and everything else to
  `'optional'`. The adapter calls it at construction; explicit
  `capabilities.reasoningContract` overrides still win.
- **`applyReasoningPolicy(messages, retention)`** runs at every
  adapter's request preflight (`vercelAdapter`, `ollamaAdapter`,
  `llamaCppServerAdapter`, `openAICompatibleAdapter`,
  `llamaCppNodeAdapter`). When the resolved retention is `'strip'`,
  every `reasoning` content part on assistant messages is dropped;
  `'pass-through-claude'` keeps Anthropic-shaped reasoning (parts
  whose `meta.provider === 'anthropic'` OR carrying a `meta.signature`
  field) and drops the rest; `'pass-through-all'` returns the input
  unchanged. The transformation is shallow and zero-cost when the
  resolved retention is `'pass-through-all'` or no reasoning parts
  exist.
