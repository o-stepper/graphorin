[**Graphorin API reference v0.9.0**](../../../index.md)

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

Defined in: [packages/sessions/src/cassette/types.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/types.ts#L41)

Discriminator on every cassette record.

## Stable
