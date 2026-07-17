[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / serialiseMessageForCount

# Function: serialiseMessageForCount()

```ts
function serialiseMessageForCount(msg): SerializedMessage;
```

Defined in: [packages/provider/src/counters/serialize.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/serialize.ts#L31)

**`Internal`**

Project a `Message` into a flat string suitable for tokenizers that
do not understand multimodal content. Image / audio / file parts
are replaced with the canonical placeholder `[image]` / `[audio]` /
`[file:<mimeType>]` so byte counts stay deterministic.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `msg` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) |

## Returns

[`SerializedMessage`](/api/@graphorin/provider/interfaces/SerializedMessage.md)
