[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / ToolCassetteRecordKind

# Type Alias: ToolCassetteRecordKind

```ts
type ToolCassetteRecordKind = 
  | "meta"
  | "tool-call"
  | "tool-search-resolved"
  | "model-fallback"
  | "compaction"
  | "progress-artifact-ref"
  | "audit"
  | "footer";
```

Defined in: packages/sessions/src/cassette/types.ts:41

**`Stable`**

Discriminator on every cassette record.
