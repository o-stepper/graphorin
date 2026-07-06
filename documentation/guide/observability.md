---
title: Observability
description: OpenTelemetry-native traces with the GenAI Semantic Conventions, sensitivity-aware redaction with 14 built-in PII patterns, and replay primitives.
---

# Observability

`@graphorin/observability` ships an OpenTelemetry-native tracing surface implementing the **OpenTelemetry GenAI Semantic Conventions** and a sensitivity-aware redaction layer that is **mandatory** on every exporter - there is no way to accidentally ship un-redacted spans to a remote collector.

## What gets traced

```mermaid
flowchart LR
    R[agent.run] --> S[agent.step]
    S --> B[provider.stream / provider.generate]
    S --> C[tool.execute]
    W[workflow.run] --> H[workflow.step]
    H --> I[workflow.task]
    H --> J[workflow.checkpoint]
```

The agent loop opens one `agent.run` span per run and one `agent.step` span per step (C7); `tool.execute` parents under the current step via `RunContext.span`, and a `withTracing`-wrapped provider parents its `provider.stream`/`provider.generate` span under the step via `ProviderRequest.parentSpan` - so a run is ONE trace tree and parent-based sampling has a real parent to follow. Memory-tier spans (`memory.search.semantic`, consolidator phases) still start their own traces today: the tiers hold their own tracer handle and are called outside the step context - a known limitation, not a wiring bug.

Per-type sampling rules act INSIDE a sampled trace too (W-090): under the default parent-based decision maker, `sampling.rules: [{ type: 'tool.execute', rate: 0.01 }]` thins the per-call spans of every sampled `agent.run` - which is where the volume actually lives - instead of only ever applying to root spans. A rule can only downsample: children of an unsampled parent are never resurrected (they would be orphans), and a child dropped by its rule breaks the tree below it - its own descendants inherit `parentSampled=false`. Configurations without rules are byte-identical to before.

Run/step/tool spans carry OTel GenAI attributes (`gen_ai.operation.name` = `invoke_agent` / `execute_tool` / `chat`, `gen_ai.agent.id`, `gen_ai.tool.name`, `gen_ai.request.model`, `gen_ai.usage.input_tokens` / `output_tokens` on close) plus Graphorin-specific ones (`graphorin.run.id`, `graphorin.step.number`, `graphorin.tool.name`, `graphorin.tool.sensitivity`, `graphorin.tool.sandbox.kind`, …).

## Wiring a tracer

```ts
import { createTracer, withValidation } from '@graphorin/observability';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const tracer = createTracer({
  serviceName: 'my-assistant',
  exporters: [new OTLPTraceExporter({ url: 'https://otel.example.com/v1/traces' })],
  // Default validation config is conservative; pass an object to tune.
});
```

The tracer **auto-wraps every exporter** with `withValidation(...)` by default - you do not have to opt in. To bypass auto-wrapping, set `validation: 'off'` on the tracer config; in that mode every exporter you pass MUST already be wrapped via `withValidation(...)` or the tracer throws `UnvalidatedExporterError` at startup.

The validation layer enforces:

- **Sensitivity-aware filtering.** Spans with sensitivity `'secret'` never leave the process. `'internal'` spans are passed through only if the operator opted in.
- **PII redaction.** 14 built-in default-on patterns cover credit-card numbers, US SSNs, emails, E.164 phone numbers, JWTs, bearer and basic-auth headers, private-key PEM blocks, AWS access keys, GitHub tokens, OpenAI / Anthropic / Graphorin tokens, and IBANs. IPv4 / IPv6 address patterns ship opt-in (enable them via `validation.enabledPatterns`).
- **Per-attribute allowlists.** Configurable per exporter for advanced setups.

## Sensitivity-aware redaction

```mermaid
flowchart LR
    Span[Span emitted] --> SR[Per-attribute router]
    SR -->|public| Pass[Pass through]
    SR -->|internal + opted in| RPI[PII redactor]
    SR -->|internal + not opted in| Strip[Strip attribute]
    SR -->|secret| Strip
    RPI --> Out[Exporter]
    Pass --> Out
    Strip --> Out
```

Redaction is **attribute-granular**: an attribute that exceeds the configured floor (or matches a secret / PII pattern) is stripped and counted, and the rest of the span still reaches the exporter. A single untagged or over-tier attribute never makes the whole span vanish - before this fix (RP-18) framework spans, which carry untagged attributes by default, disappeared from every exporter and operators saw empty traces.

You **cannot** disable the validation wrapper. You can:

- extend the pattern catalogue with your own regexes via `createTracer({ validation: { patterns: [...] } })`;
- raise or lower the export floor with `validation.minTier`, and toggle individual built-ins via `validation.enabledPatterns` / `validation.disabledPatterns`;
- add allowlists for specific high-cardinality attributes that are safe.

## Local console export

The repository's example apps read:

```bash
GRAPHORIN_TRACE=console
```

…via their shared trace helper (`examples/example-trace-helper`) and pretty-print every finished span to the terminal. The framework itself never reads this variable - it is the example harness's convention, not a `@graphorin/observability` feature; wire an exporter explicitly through `createTracer(...)` to get the same behavior in your app. See the [Examples](/guide/examples) page.

## OTLP export

`@graphorin/observability` exposes the OTLP-HTTP exporter from `@opentelemetry/exporter-trace-otlp-http`. The exporter only fires when the operator wires a collector URL - Graphorin never opens an OTLP connection on its own.

```ts
import { createTracer, withValidation } from '@graphorin/observability';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const tracer = createTracer({
  exporters: [
    withValidation(
      new OTLPTraceExporter({
        url: process.env.OTLP_URL,
        headers: { authorization: `Bearer ${process.env.OTLP_TOKEN}` },
      }),
    ),
  ],
});
```

## Replay

Spans persist so a run can be reconstructed later. `@graphorin/store-sqlite` ships a durable span sink (migration 024 + the `spans` table):

```ts
import { createTracer, withValidation } from '@graphorin/observability';
import { createSqliteSpanExporter, traceSourceForSession } from '@graphorin/store-sqlite';

// Persist every span, keyed by the `graphorin.session.id` attribute.
const tracer = createTracer({ exporters: [withValidation(createSqliteSpanExporter(store.connection))] });

// Read a session's spans back as the `traceSource` Session.replay() consumes.
const manager = createSessionManager({
  store: store.sessions,
  memory,
  replayTraceSource: (id) => traceSourceForSession(store.connection, id),
});
```

With that wiring, `session.replay()` (no arguments) reproduces the real run instead of emitting only `replay.start` / `replay.end`. Without it, replay falls back to the empty source. Replays are sanitised by default. The `spans` table grows until you prune it: `graphorin traces prune --before <date>` (or the `pruneSpans` primitive from `@graphorin/store-sqlite`) deletes spans that finished before the cutoff, and a session hard-delete removes that session's spans as part of the erasure cascade; the same `spans` table backs the `graphorin memory why` introspection. See [Standalone server](/guide/standalone-server) for the REST surface.

## GenAI Semantic Convention attributes

The framework targets the published OpenTelemetry GenAI conventions. Common attributes you'll see:

| Attribute | Where |
|---|---|
| `gen_ai.system` | Every provider span. Derived from the adapter (`'openai'`, `'anthropic'`, `'ollama'`, …). |
| `gen_ai.request.model` | Every provider span. |
| `gen_ai.request.temperature` | Set when the call configures it. |
| `gen_ai.usage.input_tokens` | On stream completion. |
| `gen_ai.usage.output_tokens` | On stream completion. |
| `gen_ai.completion.0.role` / `gen_ai.completion.0.content` | The assistant message; redaction-respecting. |

## Counters

The framework exposes in-process counters for high-frequency events in two families: `tool.*` (emitted by `@graphorin/tools` - executor invocations/errors/retries, truncation and spill, collision handling, sanitization hits, dataflow decisions, code-mode and streaming activity) and `mcp.*` (emitted by `@graphorin/mcp` - call outcomes, resource-link and structured-content handling, pin mismatches, injection flags, transport lifecycle). A few representative series:

| Counter | Where |
|---|---|
| `tool.executor.memory_guard.mismatch.total{toolName,tier}` | A tool's memory-guard verify step disagreed with the snapshot. |
| `tool.executor.retry.total` | Transparent bounded retry of a rate-limited tool fired. |
| `tool.inbound.sanitization.hit.total` | An inbound sanitization filter matched tool output. |
| `mcp.call.tool-error.total` | An MCP tool call returned `isError`. |
| `mcp.tools.pin-mismatch.total` | A pinned MCP tool's fingerprint drifted (rug-pull defense). |

Counter names are unprefixed in-process (`snapshotCounters()`); add your own namespace prefix at the export boundary if your metrics backend needs one.

## Next steps

- [Security](/guide/security) - sensitivity flow + sandbox + audit log.
- [Privacy](/guide/privacy) - the no-phone-home contract.
- [Standalone server](/guide/standalone-server) - replay + Prometheus metrics endpoints.

