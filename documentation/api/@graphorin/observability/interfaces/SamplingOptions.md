[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / SamplingOptions

# Interface: SamplingOptions

Defined in: packages/observability/src/tracer/sampling.ts:30

Configuration shape consumed by [createSampler](/api/@graphorin/observability/functions/createSampler.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-decisionmaker"></a> `decisionMaker?` | `readonly` | [`SamplingDecisionMaker`](/api/@graphorin/observability/type-aliases/SamplingDecisionMaker.md) | Decision maker. Defaults to `'parent-based'`. | packages/observability/src/tracer/sampling.ts:36 |
| <a id="property-random"></a> `random?` | `readonly` | () => `number` | **`Internal`** Override for the random source. Useful for deterministic tests. | packages/observability/src/tracer/sampling.ts:50 |
| <a id="property-rate"></a> `rate?` | `readonly` | `number` | Default head-sampling rate. Must be in `[0, 1]`. Defaults to `1.0`. | packages/observability/src/tracer/sampling.ts:32 |
| <a id="property-rules"></a> `rules?` | `readonly` | readonly [`SamplingRule`](/api/@graphorin/observability/interfaces/SamplingRule.md)[] | Per-type overrides. Last write wins on duplicate `type`. | packages/observability/src/tracer/sampling.ts:34 |
| <a id="property-streaming"></a> `streaming?` | `readonly` | \{ `eventSamplingRate?`: `number`; `includeChunkContent?`: `"none"` \| `"text-only"` \| `"all"`; \} | Optional override for streaming-event sampling. **See** RB-52 — streaming event family `tool.execute.{progress,partial}`. | packages/observability/src/tracer/sampling.ts:41 |
| `streaming.eventSamplingRate?` | `readonly` | `number` | - | packages/observability/src/tracer/sampling.ts:42 |
| `streaming.includeChunkContent?` | `readonly` | `"none"` \| `"text-only"` \| `"all"` | - | packages/observability/src/tracer/sampling.ts:43 |
