[**Graphorin API reference v0.13.7**](../../../index.md)

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

Defined in: packages/core/src/types/message.ts:13

**`Stable`**

A single multimodal content part attached to a chat-style message.

The discriminated union is exhaustive: every variant carries a literal
`type` field used by both the runtime and the type system to pick the
branch. New variants must be added to all three of: this union, every
`assertNever` switch in the codebase, and the wire-stable adapters.
