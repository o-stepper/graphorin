[**Graphorin API reference v0.13.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [telemetry](/api/@graphorin/observability/telemetry/index.md) / getTelemetryStatus

# Function: getTelemetryStatus()

```ts
function getTelemetryStatus(env?): TelemetryStatus;
```

Defined in: packages/observability/src/telemetry/index.ts:40

**`Stable`**

Snapshot of the telemetry posture. Reads from `process.env` once
unless `env` is provided.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `env` | `ProcessEnv` | `process.env` |

## Returns

[`TelemetryStatus`](/api/@graphorin/observability/telemetry/interfaces/TelemetryStatus.md)
