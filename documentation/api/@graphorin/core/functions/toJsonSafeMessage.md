[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / toJsonSafeMessage

# Function: toJsonSafeMessage()

```ts
function toJsonSafeMessage(message): WireMessage;
```

Defined in: packages/core/src/utils/binary-json.ts:322

**`Stable`**

Project a [Message](/api/@graphorin/core/type-aliases/Message.md) into its JSON-safe wire form. Idempotent:
projecting an already-wire message returns an equivalent value.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | \| [`SystemMessage`](/api/@graphorin/core/interfaces/SystemMessage.md) \| [`UserMessage`](/api/@graphorin/core/interfaces/UserMessage.md) \| [`AssistantMessage`](/api/@graphorin/core/interfaces/AssistantMessage.md) \| [`ToolMessage`](/api/@graphorin/core/interfaces/ToolMessage.md) \| [`WireUserMessage`](/api/@graphorin/core/interfaces/WireUserMessage.md) \| [`WireAssistantMessage`](/api/@graphorin/core/interfaces/WireAssistantMessage.md) \| [`WireToolMessage`](/api/@graphorin/core/interfaces/WireToolMessage.md) |

## Returns

[`WireMessage`](/api/@graphorin/core/type-aliases/WireMessage.md)
