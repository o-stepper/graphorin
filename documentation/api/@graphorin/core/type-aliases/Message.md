[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Message

# Type Alias: Message

```ts
type Message = 
  | SystemMessage
  | UserMessage
  | AssistantMessage
  | ToolMessage;
```

Defined in: packages/core/src/types/message.ts:141

**`Stable`**

Chat message. The shape is provider-agnostic: adapters convert it to /
from the wire format.

- System messages must be plain strings (multimodal system messages are
  not in the v0.1 surface).
- Assistant messages may carry `toolCalls` alongside their content.
- Tool messages carry the originating `toolCallId` so the model can
  correlate the response to its previous request.
