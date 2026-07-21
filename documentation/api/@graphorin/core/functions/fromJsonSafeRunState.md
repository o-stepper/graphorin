[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / fromJsonSafeRunState

# Function: fromJsonSafeRunState()

```ts
function fromJsonSafeRunState(state): RunState;
```

Defined in: packages/core/src/utils/binary-json.ts:415

**`Stable`**

Inverse of [toJsonSafeRunState](/api/@graphorin/core/functions/toJsonSafeRunState.md). Best-effort: legacy corrupted
binary fields (numeric-key byte objects from schema <= 1.1 payloads)
are repaired to `Uint8Array`; unrecoverable shapes are left as-is.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`WireRunState`](/api/@graphorin/core/type-aliases/WireRunState.md) |

## Returns

[`RunState`](/api/@graphorin/core/interfaces/RunState.md)
