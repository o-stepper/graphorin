[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / toJsonSafeContentParts

# Function: toJsonSafeContentParts()

```ts
function toJsonSafeContentParts(parts): readonly WireMessageContent[];
```

Defined in: packages/core/src/utils/binary-json.ts:298

**`Stable`**

Project multimodal content parts into their JSON-safe wire form.
Text and reasoning parts pass through untouched.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `parts` | readonly [`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)[] |

## Returns

readonly [`WireMessageContent`](/api/@graphorin/core/type-aliases/WireMessageContent.md)[]
