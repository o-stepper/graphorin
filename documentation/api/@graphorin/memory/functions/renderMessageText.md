[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / renderMessageText

# Function: renderMessageText()

```ts
function renderMessageText(message): string;
```

Defined in: [packages/memory/src/context-engine/token-counter.ts:124](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/token-counter.ts#L124)

Render a `Message` into a single textual approximation suitable
for token counting. Multimodal parts other than `'text'` /
`'reasoning'` contribute a constant approximation so the counter
does not silently under-count. Assistant tool calls render their
name + serialized args (context-engine-03) - file writes and
`code_execute` scripts are frequently the dominant tokens of an
agentic step, and the provider serializes + counts them, so the
engine's arithmetic must too (mirrors the provider-side
`serialiseMessageForCount`).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) |

## Returns

`string`

## Stable
