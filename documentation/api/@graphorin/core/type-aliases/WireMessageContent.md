[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireMessageContent

# Type Alias: WireMessageContent

```ts
type WireMessageContent = 
  | Exclude<MessageContent, 
  | ImageContent
  | AudioContent
  | FileContent>
  | WireImageContent
  | WireAudioContent
  | WireFileContent;
```

Defined in: packages/core/src/utils/binary-json.ts:86

**`Stable`**

JSON-safe twin of [MessageContent](/api/@graphorin/core/type-aliases/MessageContent.md): binary-bearing variants
carry [EncodedBinary](/api/@graphorin/core/type-aliases/EncodedBinary.md) envelopes, text/reasoning variants pass
through untouched.
