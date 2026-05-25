[**Graphorin API reference v0.4.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [run-state](/api/@graphorin/agent/run-state/index.md) / runStateToJSON

# Function: runStateToJSON()

```ts
function runStateToJSON(state, options?): string;
```

Defined in: packages/agent/src/run-state/index.ts:120

Render the canonical JSON string representation of the supplied
[RunState](/api/@graphorin/core/interfaces/RunState.md). `JSON.stringify(serializeRunState(state))` —
provided as a convenience.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`RunState`](/api/@graphorin/core/interfaces/RunState.md) |
| `options?` | [`SerializeRunStateOptions`](/api/@graphorin/agent/run-state/interfaces/SerializeRunStateOptions.md) |

## Returns

`string`

## Stable
