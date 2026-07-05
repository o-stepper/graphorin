[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SESSION\_TABLE\_EXEMPTIONS

# Variable: SESSION\_TABLE\_EXEMPTIONS

```ts
const SESSION_TABLE_EXEMPTIONS: Readonly<Record<string, string>>;
```

Defined in: packages/store-sqlite/src/session-store.ts:503

Session-column-bearing tables intentionally NOT in
[SESSION\_SCOPED\_PURGES](/api/@graphorin/store-sqlite/variables/SESSION_SCOPED_PURGES.md), each with the reason erasure is still
complete. Consumed by the completeness gate test.

## Stable
