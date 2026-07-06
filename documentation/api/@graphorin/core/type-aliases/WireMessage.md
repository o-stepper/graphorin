[**Graphorin API reference v0.6.1**](../../../index.md)

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

Defined in: [packages/core/src/utils/binary-json.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L110)

JSON-safe twin of [Message](/api/@graphorin/core/type-aliases/Message.md). System messages are plain strings
and pass through unchanged.

## Stable
