[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / isAwakeablePayloadError

# Function: isAwakeablePayloadError()

```ts
function isAwakeablePayloadError(err): err is AwakeablePayloadError;
```

Defined in: packages/core/src/channels/durable.ts:196

**`Stable`**

Structural guard for [AwakeablePayloadError](/api/@graphorin/core/classes/AwakeablePayloadError.md) - matches by
`name` so the check survives duplicated module instances.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `err` | `unknown` |

## Returns

`err is AwakeablePayloadError`
