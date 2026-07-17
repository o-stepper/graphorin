[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / SamplingOptions

# Interface: SamplingOptions

Defined in: [packages/observability/src/tracer/sampling.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/tracer/sampling.ts#L38)

Configuration shape consumed by [createSampler](/api/@graphorin/observability/functions/createSampler.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-decisionmaker"></a> `decisionMaker?` | `readonly` | [`SamplingDecisionMaker`](/api/@graphorin/observability/type-aliases/SamplingDecisionMaker.md) | Decision maker. Defaults to `'parent-based'`. | [packages/observability/src/tracer/sampling.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/tracer/sampling.ts#L44) |
| <a id="property-maxpersecond"></a> `maxPerSecond?` | `readonly` | `number` | Cap for the `'rate-limit'` decision maker: at most this many root spans are sampled per rolling 1-second window (RP-19). `undefined` ⇒ no cap (samples everything); `0` ⇒ sample nothing. Ignored by the other decision makers. | [packages/observability/src/tracer/sampling.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/tracer/sampling.ts#L51) |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | **`Internal`** Clock for the `'rate-limit'` window. Defaults to `Date.now`. | [packages/observability/src/tracer/sampling.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/tracer/sampling.ts#L57) |
| <a id="property-random"></a> `random?` | `readonly` | () => `number` | **`Internal`** Override for the random source. Useful for deterministic tests. | [packages/observability/src/tracer/sampling.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/tracer/sampling.ts#L71) |
| <a id="property-rate"></a> `rate?` | `readonly` | `number` | Default head-sampling rate. Must be in `[0, 1]`. Defaults to `1.0`. | [packages/observability/src/tracer/sampling.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/tracer/sampling.ts#L40) |
| <a id="property-rules"></a> `rules?` | `readonly` | readonly [`SamplingRule`](/api/@graphorin/observability/interfaces/SamplingRule.md)[] | Per-type overrides. Last write wins on duplicate `type`. | [packages/observability/src/tracer/sampling.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/tracer/sampling.ts#L42) |
| <a id="property-streaming"></a> `streaming?` | `readonly` | \{ `eventSamplingRate?`: `number`; `includeChunkContent?`: `"none"` \| `"text-only"` \| `"all"`; \} | Optional override for streaming-event sampling. **See** RB-52 - streaming event family `tool.execute.{progress,partial}`. | [packages/observability/src/tracer/sampling.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/tracer/sampling.ts#L62) |
| `streaming.eventSamplingRate?` | `readonly` | `number` | - | [packages/observability/src/tracer/sampling.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/tracer/sampling.ts#L63) |
| `streaming.includeChunkContent?` | `readonly` | `"none"` \| `"text-only"` \| `"all"` | - | [packages/observability/src/tracer/sampling.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/tracer/sampling.ts#L64) |
