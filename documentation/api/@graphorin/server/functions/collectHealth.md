[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / collectHealth

# Function: collectHealth()

```ts
function collectHealth(options): Promise<HealthSummary>;
```

Defined in: packages/server/src/health/checks.ts:187

**`Stable`**

Build the aggregate health summary from runtime probes.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`HealthCheckOptions`](/api/@graphorin/server/interfaces/HealthCheckOptions.md) |

## Returns

`Promise`\&lt;[`HealthSummary`](/api/@graphorin/server/interfaces/HealthSummary.md)\&gt;
