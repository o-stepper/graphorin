[**Graphorin API reference v0.14.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [telemetry](/api/@graphorin/observability/telemetry/index.md) / announceTelemetryPosture

# Function: announceTelemetryPosture()

```ts
function announceTelemetryPosture(opts?): readonly string[];
```

Defined in: packages/observability/src/telemetry/index.ts:74

**`Stable`**

Detect the reserved env vars and emit one informational line per
process. Returns the lines as an array so callers can route them to
any sink they like (defaults to `console.info`).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `env?`: `ProcessEnv`; `sink?`: (`line`) => `void`; \} |
| `opts.env?` | `ProcessEnv` |
| `opts.sink?` | (`line`) => `void` |

## Returns

readonly `string`[]
