[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / SamplingRule

# Interface: SamplingRule

Defined in: packages/observability/src/tracer/sampling.ts:28

**`Stable`**

Per-span-type rate override. Applies on the probabilistic root path
AND to children of a sampled parent under `'parent-based'` -
`{ type: 'tool.execute', rate: 0.01 }` thins the per-call spans
inside every sampled `agent.run` trace. A child dropped by its rule
breaks the tree below it: its own descendants inherit
`parentSampled=false`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-rate"></a> `rate` | `readonly` | `number` | packages/observability/src/tracer/sampling.ts:30 |
| <a id="property-type"></a> `type` | `readonly` | `string` | packages/observability/src/tracer/sampling.ts:29 |
