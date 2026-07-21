[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireMessage

# Type Alias: WireMessage

```ts
type WireMessage = 
  | SystemMessage
  | WireUserMessage
  | WireAssistantMessage
  | WireToolMessage;
```

Defined in: packages/core/src/utils/binary-json.ts:113

**`Stable`**

JSON-safe twin of [Message](/api/@graphorin/core/type-aliases/Message.md). System messages are plain strings
and pass through unchanged.
