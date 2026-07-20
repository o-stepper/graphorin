[**Graphorin API reference v0.13.7**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [run-state](/api/@graphorin/agent/run-state/index.md) / deserializeRunState

# Function: deserializeRunState()

```ts
function deserializeRunState(payload, options?): RunState;
```

Defined in: packages/agent/src/run-state/index.ts:278

**`Stable`**

Rehydrate a [RunState](/api/@graphorin/core/interfaces/RunState.md) from the on-disk payload. Throws
[RunStateVersionUnsupportedError](/api/@graphorin/agent/errors/classes/RunStateVersionUnsupportedError.md) when the payload version
is from a future major; throws
[RunStateMalformedError](/api/@graphorin/agent/errors/classes/RunStateMalformedError.md) when the payload is structurally
invalid.

Backwards-compat: a payload that omits `usageByModel` is accepted
and the field is synthesized from the aggregate `usage` with
`attemptCount: 1` for the primary model.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `payload` | `unknown` |
| `options` | [`DeserializeOptions`](/api/@graphorin/agent/run-state/interfaces/DeserializeOptions.md) |

## Returns

[`RunState`](/api/@graphorin/core/interfaces/RunState.md)
