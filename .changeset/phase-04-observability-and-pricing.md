---
'@graphorin/observability': minor
'@graphorin/pricing': minor
---

Phase 04 — observability + pricing primitives. Two new packages join
the Graphorin framework on top of the foundations from Phase 02
(`@graphorin/core`) and Phase 03 (`@graphorin/security`). The
implementation is opinionated: every exporter must be wrapped through
the mandatory `withValidation(...)` redaction layer, the validator
defaults to default-deny non-public, the framework makes zero
outbound network calls without an explicit user action (`check-no-network`
script lifted from a Phase 01 stub to a real static guard), and the
bundled pricing snapshot ships with a deterministic SHA-256 over its
entries.

`@graphorin/observability` ships:

- **`createTracer(...)` + `AISpan<T>`** typed tracer. Spans are
  decoupled from `@opentelemetry/api` at the API surface so consumers
  can use the package without taking the heavy OTel SDK dependency.
  The tracer auto-wraps un-wrapped exporters with the configured
  `RedactionValidator`; raw exporters paired with `validation: 'off'`
  are rejected at startup via `UnvalidatedExporterError`.
- **`createRedactionValidator(...)`** with the canonical 14
  default-on built-in patterns (Graphorin token, OpenAI / Anthropic /
  AWS / GitHub key, JWT, bearer / basic auth headers, PEM private key,
  email, credit card, US SSN, E.164 phone, IBAN) plus three opt-in
  patterns (IPv4, IPv6, GCP service-account email). Counters rollup
  per-reason / per-pattern; `failOnUnredactedSensitive: true` raises
  `RedactionValidationError` for tests.
- **`withValidation(...)`** — mandatory wrapper applied to every
  exporter. Drops records that exceed the configured tier floor;
  preserves event records when the rest of the span is safe.
- **`createConsoleExporter` / `createJSONLExporter` / `createOTLPHttpExporter`** —
  three exporters covering dev (console), replay (append-only JSONL
  with `0700` directories + `0600` files), and remote OTLP collectors
  (`fetch`-based reference implementation, swappable `fetchImpl`).
- **OpenTelemetry GenAI semantic-conventions conformance** —
  `emitGenAIAttributes(span, {...})` attaches the canonical
  `gen_ai.system` / `gen_ai.request.model` / `gen_ai.usage.*` /
  `gen_ai.response.*` / `gen_ai.tool.*` / `gen_ai.agent.*` /
  `gen_ai.operation.name` family alongside the existing
  Graphorin-prefixed attributes (every metadata attribute is tagged
  `'public'` so the default-deny exporter preserves them);
  `emitGenAIMessageEvents(span, [...])` emits per-message span events
  (`gen_ai.{user,assistant,system,tool}.message`); `deriveGenAISystem(...)`
  auto-derives the canonical vendor enum value from the provider class
  name and emits one structured WARN per process when a custom class
  name is not in the auto-derivation table.
- **OpenInference span-kind layer** — `emitOpenInferenceKind(span)`
  attaches the `openinference.span.kind` attribute via the canonical
  `agent.*` → `AGENT` / `provider.*` → `LLM` / `tool.execute` → `TOOL` /
  `memory.*` → `RETRIEVER` / `memory.embed` → `EMBEDDING` /
  `memory.consolidate.*` → `CHAIN` mapping table; the helper is a no-op
  on intentionally excluded span types (`skill.*`, `mcp.connect`,
  `mcp.list-tools`, `replay.*`).
- **`createCostTracker(...)`** — token + cost accumulator with
  parent-child rollup, per-run / per-session / per-agent / per-user
  budgets, and an `onExceed` callback.
- **`createReplay(...)`** — sanitized-by-default replay primitives.
  `mode: 'raw'` requires the supplied `canReadRaw` callback (wired to
  the `traces:read:raw` token scope by `@graphorin/server` in Phase 14)
  AND emits a `ReplayAuditBridge` entry on every invocation.
- **`getTraceLog(...)` / `pruneTraces(...)`** — file-backed JSONL log
  reader + retention pruner.
- **`runEval(...)`** — minimal inline eval runner (~150 LOC) plus the
  `Case` / `Dataset` / `Scorer` / `EvalReport` types. The full
  orchestrator + scorer libraries live in the post-MVP
  `@graphorin/evals` package.
- **`createLogger(...)` + `withCurrentSpan(...)`** — structured logger
  with automatic span correlation through `AsyncLocalStorage`. Every
  field flows through the supplied validator.
- **Telemetry stub** — `getTelemetryStatus()` and
  `announceTelemetryPosture()` confirm the v0.1 zero-default-telemetry
  promise; `enableTelemetry()` returns a sentinel `disabled` payload;
  reserved env vars `GRAPHORIN_TELEMETRY` / `GRAPHORIN_NO_PHONE_HOME`
  are acknowledged at startup.
- **Configuration shapes** — typed `ValidationConfig` (with
  `DEFAULT_VALIDATION_CONFIG`) and `ReplayLogConfig` (with
  `DEFAULT_REPLAY_LOG_CONFIG`) cover the canonical
  `observability.validation.*` and `observability.replayLog.*`
  settings so consumer config files can use a single typed structure.

`@graphorin/pricing` ships:

- **`BUNDLED_SNAPSHOT`** — bundled pricing entries for Anthropic,
  OpenAI, Google, Mistral, Cohere, Ollama, and the local llama.cpp
  adapter. Entries carry per-token input / output / cached-read /
  reasoning prices; the snapshot embeds a deterministic SHA-256
  digest over the canonical JSON form of the entries.
- **`lookupPrice({ provider, model })`** — resolver with wildcard
  fallback (`model: '*'` for local providers) and one WARN per
  process-lifetime per unknown (provider, model) pair.
- **`calculateCost({ ..., inputTokens, outputTokens })`** — per-call
  cost helper for ad-hoc accounting outside the `CostTracker`.
- **`diffPricing(before, after)`** — row-by-row delta surfaces
  `added` / `removed` / `changed` entries with the changed field
  names, sorted deterministically.
- **`refreshPricing({ url, fetchImpl?, snapshotDate? })`** — opt-in
  network call. Never invoked automatically; the framework pairs the
  hook with the upcoming `graphorin pricing refresh` CLI binary
  (Phase 15).
- **`listMissingModels(spans)`** — scans trace spans for unknown
  models, reading `gen_ai.system` + `gen_ai.request.model` with a
  fallback to the Graphorin-prefixed `graphorin.provider.{id,model}`
  attributes.
- **`PricingAutoRefreshConfig`** + `DEFAULT_PRICING_AUTO_REFRESH` —
  typed shape covering `pricing.autoRefresh.{enabled, intervalHours}`.
  The `enabled` flag is hardcoded `false` in v0.1 per the
  zero-default-telemetry policy; the type is reserved for v0.2+.

Both packages publish narrow sub-path exports (`@graphorin/observability/tracer`,
`@graphorin/observability/redaction/patterns`, `@graphorin/pricing/snapshot`,
…) so downstream packages can pull only the surface they need.

Repository hygiene:

- The Phase 01 stub `scripts/check-no-network.mjs` is now a real
  static guard. The script walks `packages/*/src/**/*.ts`, strips
  comments and string literals, and fails the run if a forbidden
  network primitive (`fetch`, `http.request`, `https.request`,
  `net.connect`, `tls.connect`, `dgram.createSocket`, `WebSocket`,
  `node-fetch` / `undici` / `got` / `axios` / `ky` imports) appears
  outside the documented allow-list. Every allow-list entry pairs
  with a code path that fires only on an explicit user action
  (provider adapter, MCP transport, OAuth flow, opt-in pricing
  refresh, embedder model download, storage backend, OTLP exporter,
  skill installer / signature verifier).
