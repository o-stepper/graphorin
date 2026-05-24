[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / renderMessageText

# Function: renderMessageText()

```ts
function renderMessageText(message): string;
```

Defined in: packages/memory/src/context-engine/token-counter.ts:94

Render a `Message` into a single textual approximation suitable
for token counting. Multimodal parts other than `'text'` /
`'reasoning'` contribute a constant approximation so the counter
does not silently under-count.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) |

## Returns

`string`

## Stable
