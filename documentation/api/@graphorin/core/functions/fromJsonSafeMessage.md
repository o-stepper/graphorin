[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / fromJsonSafeMessage

# Function: fromJsonSafeMessage()

```ts
function fromJsonSafeMessage(message): Message;
```

Defined in: [packages/core/src/utils/binary-json.ts:334](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L334)

Inverse of [toJsonSafeMessage](/api/@graphorin/core/functions/toJsonSafeMessage.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | \| [`SystemMessage`](/api/@graphorin/core/interfaces/SystemMessage.md) \| [`UserMessage`](/api/@graphorin/core/interfaces/UserMessage.md) \| [`AssistantMessage`](/api/@graphorin/core/interfaces/AssistantMessage.md) \| [`ToolMessage`](/api/@graphorin/core/interfaces/ToolMessage.md) \| [`WireUserMessage`](/api/@graphorin/core/interfaces/WireUserMessage.md) \| [`WireAssistantMessage`](/api/@graphorin/core/interfaces/WireAssistantMessage.md) \| [`WireToolMessage`](/api/@graphorin/core/interfaces/WireToolMessage.md) |

## Returns

[`Message`](/api/@graphorin/core/type-aliases/Message.md)

## Stable
