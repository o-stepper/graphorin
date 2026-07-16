[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportRecordKind

# Type Alias: SessionExportRecordKind

```ts
type SessionExportRecordKind = "meta" | "session" | "agent" | "message" | "handoff" | "audit" | "footer";
```

Defined in: [packages/sessions/src/export/types.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L50)

Discriminator on every stream record. `'meta'` is always line 1;
`'footer'` is always the last line.

## Stable
