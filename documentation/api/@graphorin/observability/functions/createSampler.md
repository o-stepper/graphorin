[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / createSampler

# Function: createSampler()

```ts
function createSampler(opts?): Sampler;
```

Defined in: packages/observability/src/tracer/sampling.ts:72

Build a [Sampler](/api/@graphorin/observability/interfaces/Sampler.md) from the supplied options. The sampler is
intentionally inexpensive — every decision boils down to a single
`random < threshold` comparison.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`SamplingOptions`](/api/@graphorin/observability/interfaces/SamplingOptions.md) |

## Returns

[`Sampler`](/api/@graphorin/observability/interfaces/Sampler.md)

## Stable
