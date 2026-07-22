[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / ToolCassetteRecord

# Type Alias: ToolCassetteRecord

```ts
type ToolCassetteRecord = 
  | ToolCassetteMetaRecord
  | ToolCallRecord
  | ToolSearchResolvedRecord
  | ModelFallbackRecord
  | CompactionRecord
  | ProgressArtifactRefRecord
  | CassetteAuditRecord
  | ToolCassetteFooterRecord;
```

Defined in: packages/sessions/src/cassette/types.ts:194

**`Stable`**

Union of every record kind. Consumed by the writer + parser.
