[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / toJsonSafeRunState

# Function: toJsonSafeRunState()

```ts
function toJsonSafeRunState(state): WireRunState;
```

Defined in: packages/core/src/utils/binary-json.ts:389

**`Stable`**

Project a full [RunState](/api/@graphorin/core/interfaces/RunState.md) into its JSON-safe [WireRunState](/api/@graphorin/core/type-aliases/WireRunState.md)
twin: `messages` and `steps[].toolCalls[].outcome.contentParts` go
through the binary codec, everything else is copied structurally.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | \| [`RunState`](/api/@graphorin/core/interfaces/RunState.md) \| [`WireRunState`](/api/@graphorin/core/type-aliases/WireRunState.md) |

## Returns

[`WireRunState`](/api/@graphorin/core/type-aliases/WireRunState.md)
