[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / ToolCassetteSource

# Type Alias: ToolCassetteSource

```ts
type ToolCassetteSource = 
  | {
  kind: "file";
  path: string;
}
  | {
  kind: "inline";
  records: ReadonlyArray<ToolCassetteRecord>;
}
  | {
  kind: "stream";
  stream: AsyncIterable<ToolCassetteRecord>;
};
```

Defined in: packages/sessions/src/cassette/types.ts:227

**`Stable`**

Discriminated union accepted by `Session.replay({ cassette })`.
