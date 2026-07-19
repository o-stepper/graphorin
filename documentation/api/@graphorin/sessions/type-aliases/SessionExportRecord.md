[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportRecord

# Type Alias: SessionExportRecord

```ts
type SessionExportRecord = 
  | SessionExportMetaRecord
  | SessionExportSessionRecord
  | SessionExportAgentRecord
  | SessionExportMessageRecord
  | SessionExportHandoffRecord
  | SessionExportAuditRecord
  | SessionExportFooterRecord;
```

Defined in: packages/sessions/src/export/types.ts:204

**`Stable`**

Union of every record kind. Used by the writer + parser.
