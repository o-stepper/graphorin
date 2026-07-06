---
'@graphorin/observability': patch
---

W-091: the observability guide's wiring examples now compile and run - they use the package's own `createOTLPHttpExporter` (which implements the `TraceExporter` contract) instead of passing an `@opentelemetry/exporter-trace-otlp-http` class that does not (no `id`/`flush()`, different `export` signature). The GenAI attribute table now lists what `withTracing` actually emits (`gen_ai.operation.name`, `gen_ai.provider.name`, `gen_ai.request.model`, `gen_ai.usage.input_tokens/output_tokens`); `gen_ai.request.temperature` and `gen_ai.completion.0.*` (emitted nowhere) are gone and the helper-only family (`emitGenAIAttributes`/`emitGenAIMessageEvents`, incl. `gen_ai.system`) is marked as such. The phantom `@opentelemetry/*` peer dependencies are removed - the package has zero `@opentelemetry` imports, so a consumer install no longer demands `@opentelemetry/api` it never uses (upstream OTel SDK pipelines adapt via the exported `toOtlpEnvelope`).
