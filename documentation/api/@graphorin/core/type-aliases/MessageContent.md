[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MessageContent

# Type Alias: MessageContent

```ts
type MessageContent = 
  | TextContent
  | ImageContent
  | AudioContent
  | FileContent
  | ReasoningContent;
```

Defined in: [packages/core/src/types/message.ts:13](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L13)

A single multimodal content part attached to a chat-style message.

The discriminated union is exhaustive: every variant carries a literal
`type` field used by both the runtime and the type system to pick the
branch. New variants must be added to all three of: this union, every
`assertNever` switch in the codebase, and the wire-stable adapters.

## Stable
