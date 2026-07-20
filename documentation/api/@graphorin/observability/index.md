[**Graphorin API reference v0.13.8**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/observability

# @graphorin/observability

> Observability primitives for the [Graphorin](https://github.com/o-stepper/graphorin) framework.

`@graphorin/observability` ships every cross-cutting tracing,
redaction, replay, cost, and structured-logging primitive every other
`@graphorin/*` package builds on. The package is intentionally
opinionated: every exporter must be wrapped through
`withValidation(...)` before it can ship a single span, the validator
defaults to **default-deny non-public**, and the framework makes zero
outbound network calls without an explicit user action.

## Highlights

- **Typed `AISpan<T>` tracer.** `createTracer({...})` returns a
  `GraphorinTracer` that emits `AISpan<SpanType>` records compatible
  with OpenTelemetry. Sampling rules + per-event sampling cover noisy
  span kinds (`memory.embed`, `tool.execute.partial`, …).
- **Mandatory `withValidation(...)` wrapper.** Every exporter passed to
  `createTracer({ exporters })` is wrapped through the configured
  `RedactionValidator`. Registering a raw exporter while
  `validation: 'off'` triggers `UnvalidatedExporterError` at startup -
  there is no silent path.
- **`RedactionValidator` with 14 built-in patterns.** API key / JWT /
  PEM private key / GitHub PAT / AWS access key / Graphorin token /
  bearer header / basic-auth header / email / credit card / US SSN /
  E.164 phone / IBAN - all on by default. Three additional patterns
  (IPv4, IPv6, GCP service account) are opt-in.
- **OpenTelemetry GenAI semantic-conventions conformance.**
  `emitGenAIAttributes(span, {...})`, `emitGenAIMessageEvents(span, [...])`,
  and `deriveGenAISystem(...)` ship the canonical
  `gen_ai.*` attribute family alongside the existing
  `graphorin.*` attributes - additive, never replacing. Span names
  follow the semconv `{operation} {target}` shape (`chat <model>`,
  `execute_tool <tool>`, `invoke_agent <agent>`) via the exported
  `spanNameFor(type, attrs)` helper, applied by the tracer
  automatically.
- **OpenInference span-kind layer.** `emitOpenInferenceKind(span)` emits
  the `openinference.span.kind` attribute via the canonical
  per-`SpanType` mapping (`agent.*` → `AGENT`,
  `provider.*` → `LLM`, `tool.execute` → `TOOL`,
  `memory.*` → `RETRIEVER` / `EMBEDDING`, `workflow.*` → `CHAIN`,
  `agent.evaluator.iteration` → `EVALUATOR`).
- **`ConsoleExporter`, `JSONLExporter`, `OTLPHttpExporter`.** The
  built-in exporters cover dev (console), replay (append-only JSONL
  with `0700` directories + `0600` files), and remote OTLP collectors
  (`fetch`-based reference implementation, swappable `fetchImpl`).
- **Sanitized-by-default `Replay`.** `createReplay({...})` exposes a
  `run(...)` async iterator that yields `replay.start` /
  `replay.event` / `replay.skipped` / `replay.end` markers. Raw mode
  requires the `canReadRaw` callback to return `true` and emits an
  audit-bridge entry on every invocation.
- **Hierarchical `CostTracker`.** `createCostTracker({...})` rolls up
  tokens + cost (including the prompt-cache read/write legs) across
  parent-child spans and supports per-run / per-session / per-agent /
  per-user budgets with an `onExceed` callback. Internal maps are
  bounded by default (`retention: { maxSpanEntries, maxScopeEntries }`,
  10k each; oldest-first eviction with an `onEviction` observer -
  `usage()` for an evicted id reports zero; pass `retention: false`
  for the old unbounded behaviour). Feed it from the provider
  middleware with the shipped bridge:

  ```ts no-check
  import { costTrackerUsageDelegate, createCostTracker } from '@graphorin/observability';
  import { withCostTracking } from '@graphorin/provider';

  const tracker = createCostTracker({ budgets: { perSession: 5 } });
  const provider = withCostTracking(base, {
    priceLookup: () => ({ inputPerMtok: 3, outputPerMtok: 15 }),
    onUsage: costTrackerUsageDelegate(tracker, () => ({
      spanId: currentSpanId(),
      sessionId: currentSessionId(),
    })),
  });
  // Later: tracker.usage('session', sessionId).cost
  ```
- **Structured logger.** `createLogger({...})` writes JSON or pretty
  records, automatically correlates with the current span via
  `withCurrentSpan(...)`, and pipes every field through the validator.
- **Zero-default telemetry.** `getTelemetryStatus()` and
  `announceTelemetryPosture()` expose the v0.1 promise: the framework
  performs zero outbound network calls, no version pings, no crash
  reports, no auto-updates. The `GRAPHORIN_TELEMETRY` and
  `GRAPHORIN_NO_PHONE_HOME` environment variables are reserved for
  forward compatibility and are acknowledged at startup.

## Installation

```bash
pnpm add @graphorin/observability
# Optional peer deps for OTLP export - install only when you need them:
pnpm add @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http
```

## Quick start

```ts
import {
  createTracer,
  createConsoleExporter,
  createJSONLExporter,
  withValidation,
} from '@graphorin/observability';

const tracer = createTracer({
  serviceName: 'my-assistant',
  exporters: [
    // Auto-wrapped via the tracer-managed validator.
    createConsoleExporter({ pretty: true }),
    // Manually wrapped - useful when each exporter needs its own policy.
    withValidation(createJSONLExporter({ path: './traces' }), {
      minTier: 'internal',
    }),
  ],
  validation: { minTier: 'public', failOnUnredactedSensitive: false },
  sampling: {
    rate: 1.0,
    rules: [{ type: 'memory.embed', rate: 0.1 }],
  },
});

await tracer.span(
  { type: 'agent.run', attrs: { 'graphorin.agent.id': 'support-bot' } },
  async (span) => {
    span.setAttributes({ 'graphorin.session.id': 'session-123' });
    return runAgent();
  },
);

await tracer.shutdown();
```

## License

MIT © 2026 [Oleksiy Stepurenko](https://github.com/o-stepper).

---

**Project Graphorin** · v0.13.8 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/observability/README.md) | @graphorin/observability - observability primitives for the Graphorin framework. Ships: |
| [cost](/api/@graphorin/observability/cost/index.md) | Cost / token tracker surface. |
| [eval](/api/@graphorin/observability/eval/index.md) | Minimal inline eval runner. |
| [exporters](/api/@graphorin/observability/exporters/index.md) | Exporter surface for `@graphorin/observability`. |
| [gen-ai](/api/@graphorin/observability/gen-ai/index.md) | OpenTelemetry GenAI semantic-conventions conformance helpers. |
| [logger](/api/@graphorin/observability/logger/index.md) | Structured logger surface. |
| [openinference](/api/@graphorin/observability/openinference/index.md) | OpenInference span-kind emission. Adds the `openinference.span.kind` attribute (one of `AGENT`, `EVALUATOR`, `LLM`, `TOOL`, `RETRIEVER`, `EMBEDDING`, `CHAIN`) to applicable Graphorin spans. |
| [package.json](/api/@graphorin/observability/package.json/index.md) | - |
| [redaction](/api/@graphorin/observability/redaction/index.md) | Sensitivity-aware redaction surface for `@graphorin/observability`. |
| [redaction/imperative-patterns](/api/@graphorin/observability/redaction/imperative-patterns/index.md) | Imperative-pattern catalogue for inbound prompt-injection defence. |
| [redaction/patterns](/api/@graphorin/observability/redaction/patterns/index.md) | Built-in PII / secret detection patterns. The catalogue is intentionally conservative - every pattern has both positive and negative test fixtures and is documented so operators understand exactly what is matched. |
| [replay](/api/@graphorin/observability/replay/index.md) | Sanitized-by-default replay surface. |
| [telemetry](/api/@graphorin/observability/telemetry/index.md) | Zero-default telemetry stub. |
| [tracer](/api/@graphorin/observability/tracer/index.md) | Tracer surface for `@graphorin/observability`. |
