[**Graphorin API reference v0.7.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [run-state](/api/@graphorin/agent/run-state/index.md) / serializeRunState

# Function: serializeRunState()

```ts
function serializeRunState(state, options?): SerializedRunState;
```

Defined in: [packages/agent/src/run-state/index.ts:127](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/run-state/index.ts#L127)

Render a JSON-stable snapshot of the supplied [RunState](/api/@graphorin/core/interfaces/RunState.md).
The returned value is plain JSON (no `Map`, `Set`, `Date`, ...).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`RunState`](/api/@graphorin/core/interfaces/RunState.md) |
| `options` | [`SerializeRunStateOptions`](/api/@graphorin/agent/run-state/interfaces/SerializeRunStateOptions.md) |

## Returns

[`SerializedRunState`](/api/@graphorin/agent/run-state/interfaces/SerializedRunState.md)

## Stable
