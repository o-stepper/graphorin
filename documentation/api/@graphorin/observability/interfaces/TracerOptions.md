[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / TracerOptions

# Interface: TracerOptions

Defined in: packages/observability/src/tracer/tracer.ts:35

**`Stable`**

Configuration shape consumed by [createTracer](/api/@graphorin/observability/functions/createTracer.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-defaultattributesensitivity"></a> `defaultAttributeSensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Default sensitivity for attributes that omit `setAttribute(_, _, { sensitivity })`. Defaults to `'internal'` per the default-deny non-public posture. | packages/observability/src/tracer/tracer.ts:65 |
| <a id="property-exporters"></a> `exporters` | `readonly` | readonly [`TraceExporter`](/api/@graphorin/observability/interfaces/TraceExporter.md)[] | Configured exporters. Each exporter MUST be wrapped via `withValidation(...)` before reaching the tracer - pass them through unwrapped to use the tracer-managed validator (set by `validation`) or pass already-wrapped exporters when you want per-exporter policies. | packages/observability/src/tracer/tracer.ts:45 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | **`Internal`** Override the wall clock used for span timestamps. Returns milliseconds-since-epoch as a `number`. Default: `Date.now`. | packages/observability/src/tracer/tracer.ts:78 |
| <a id="property-sampling"></a> `sampling?` | `readonly` | [`SamplingOptions`](/api/@graphorin/observability/interfaces/SamplingOptions.md) | Sampler configuration. | packages/observability/src/tracer/tracer.ts:60 |
| <a id="property-servicename"></a> `serviceName?` | `readonly` | `string` | Logical service name. Embedded in the OTLP `Resource`. | packages/observability/src/tracer/tracer.ts:37 |
| <a id="property-validation"></a> `validation?` | `readonly` | \| [`RedactionValidatorOptions`](/api/@graphorin/observability/interfaces/RedactionValidatorOptions.md) \| `"off"` | Tracer-managed validator policy. - `RedactionValidatorOptions` (default): the tracer auto-wraps any un-wrapped exporter with `withValidation(...)` using these options. - `'off'`: NOT recommended. Skips auto-wrap, and the tracer logs a startup WARN to the supplied [warnSink](/api/@graphorin/observability/interfaces/TracerOptions.md#property-warnsink). Pre-wrapped exporters still flow through their validators. **Default** `{ minTier: 'public', failOnUnredactedSensitive: false }` | packages/observability/src/tracer/tracer.ts:58 |
| <a id="property-warnsink"></a> `warnSink?` | `readonly` | (`line`) => `void` | **`Internal`** Sink used for startup WARNings. Defaults to `console.warn`. | packages/observability/src/tracer/tracer.ts:71 |
