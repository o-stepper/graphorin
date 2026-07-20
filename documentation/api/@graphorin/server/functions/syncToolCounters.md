[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / syncToolCounters

# Function: syncToolCounters()

```ts
function syncToolCounters(registry, snapshot?): void;
```

Defined in: packages/server/src/metrics/tools-bridge.ts:38

**`Stable`**

Sync the tools-package counter snapshot into `registry`. Idempotent
per value: scraping twice without new increments changes nothing.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `registry` | [`MetricRegistry`](/api/@graphorin/server/classes/MetricRegistry.md) |
| `snapshot` | [`CounterSnapshot`](/api/@graphorin/tools/interfaces/CounterSnapshot.md) |

## Returns

`void`
