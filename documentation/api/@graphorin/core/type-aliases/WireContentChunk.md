[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireContentChunk

# Type Alias: WireContentChunk

```ts
type WireContentChunk = 
  | Exclude<ContentChunk, {
  kind: "image";
}>
  | {
  data: EncodedBytes;
  kind: "image";
  mediaType: string;
};
```

Defined in: packages/core/src/types/agent-event-wire.ts:38

**`Stable`**

Wire twin of the binary [ContentChunk](/api/@graphorin/core/type-aliases/ContentChunk.md) variant.
