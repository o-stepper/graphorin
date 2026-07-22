[**Graphorin API reference v0.15.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [run-state](/api/@graphorin/agent/run-state/index.md) / runStateFromJSON

# Function: runStateFromJSON()

```ts
function runStateFromJSON(serialized, options?): RunState;
```

Defined in: packages/agent/src/run-state/index.ts:498

Convenience JSON-string parser pairing with [runStateToJSON](/api/@graphorin/agent/run-state/functions/runStateToJSON.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `serialized` | `string` |
| `options?` | [`DeserializeOptions`](/api/@graphorin/agent/run-state/interfaces/DeserializeOptions.md) |

## Returns

[`RunState`](/api/@graphorin/core/interfaces/RunState.md)
