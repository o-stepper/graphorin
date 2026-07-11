[**Graphorin API reference v0.8.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [facade](/api/@graphorin/sessions/facade/index.md) / MessageContent

# Type Alias: MessageContent

```ts
type MessageContent = 
  | TextContent
  | ImageContent
  | AudioContent
  | FileContent
  | ReasoningContent;
```

Defined in: [packages/core/dist/types/message.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/message.d.ts)

A single multimodal content part attached to a chat-style message.

The discriminated union is exhaustive: every variant carries a literal
`type` field used by both the runtime and the type system to pick the
branch. New variants must be added to all three of: this union, every
`assertNever` switch in the codebase, and the wire-stable adapters.

## Stable
