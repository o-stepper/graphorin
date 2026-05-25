[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / createReplay

# Function: createReplay()

```ts
function createReplay(opts?): Replay;
```

Defined in: packages/observability/src/replay/replay.ts:48

Build a replay primitive. The returned object exposes a single
`run(...)` async iterator that yields [ReplayEvent](/api/@graphorin/observability/type-aliases/ReplayEvent.md) records.

Sanitized mode is the default and applies the configured
[RedactionValidatorInstance](/api/@graphorin/observability/interfaces/RedactionValidatorInstance.md) to every record. Raw mode
requires the `canReadRaw` callback to return `true` AND emits an
audit log entry on every invocation.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`ReplayOptions`](/api/@graphorin/observability/interfaces/ReplayOptions.md) |

## Returns

[`Replay`](/api/@graphorin/observability/interfaces/Replay.md)

## Stable
