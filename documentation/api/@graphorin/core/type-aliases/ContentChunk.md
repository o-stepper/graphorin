[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ContentChunk

# Type Alias: ContentChunk

```ts
type ContentChunk = 
  | {
  kind: "text";
  text: string;
}
  | {
  kind: "json-delta";
  path: string;
  value: unknown;
}
  | {
  data: Uint8Array;
  kind: "image";
  mediaType: string;
};
```

Defined in: packages/core/src/types/tool.ts:146

**`Stable`**

Single chunk of streamed tool content. Streaming-hint tools emit one
chunk per `ctx.streamContent(...)` call; the executor concatenates
the chunks into the assembled `output` per the buffer-becomes-output
discipline.
