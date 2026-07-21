[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createServerMetricRegistry

# Function: createServerMetricRegistry()

```ts
function createServerMetricRegistry(): MetricRegistry;
```

Defined in: packages/server/src/metrics/catalog.ts:56

**`Stable`**

Build a fully-registered [MetricRegistry](/api/@graphorin/server/classes/MetricRegistry.md) ready for the
`/v1/metrics` exposition. The returned registry has every metric
declared but no samples; the server runtime updates samples
incrementally.

## Returns

[`MetricRegistry`](/api/@graphorin/server/classes/MetricRegistry.md)
