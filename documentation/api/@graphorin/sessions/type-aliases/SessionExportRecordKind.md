[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportRecordKind

# Type Alias: SessionExportRecordKind

```ts
type SessionExportRecordKind = "meta" | "session" | "agent" | "message" | "handoff" | "audit" | "footer";
```

Defined in: packages/sessions/src/export/types.ts:50

**`Stable`**

Discriminator on every stream record. `'meta'` is always line 1;
`'footer'` is always the last line.
