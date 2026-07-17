[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / fromJsonSafeContentParts

# Function: fromJsonSafeContentParts()

```ts
function fromJsonSafeContentParts(parts): readonly MessageContent[];
```

Defined in: [packages/core/src/utils/binary-json.ts:310](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L310)

Inverse of [toJsonSafeContentParts](/api/@graphorin/core/functions/toJsonSafeContentParts.md). Accepts legacy corrupted
payloads (numeric-key byte objects) and repairs them best-effort.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `parts` | readonly [`WireMessageContent`](/api/@graphorin/core/type-aliases/WireMessageContent.md)[] |

## Returns

readonly [`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)[]

## Stable
