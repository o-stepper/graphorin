[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteStoreMode

# Type Alias: SqliteStoreMode

```ts
type SqliteStoreMode = "lib" | "server";
```

Defined in: packages/store-sqlite/src/index.ts:116

Library mode — single in-process connection. Server mode — opt-in
`WorkerPool` (1 writer + N readers); WAL hardening and the periodic
`wal_checkpoint(RESTART)` are mandatory in this mode.

## Stable
