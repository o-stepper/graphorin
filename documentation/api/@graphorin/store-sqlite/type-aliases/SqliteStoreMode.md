[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteStoreMode

# Type Alias: SqliteStoreMode

```ts
type SqliteStoreMode = "lib" | "server";
```

Defined in: [packages/store-sqlite/src/index.ts:138](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L138)

Both modes run on a single in-process connection with the mandatory
WAL-hardening pragmas (WAL journal mode, busy-timeout, etc.).
`'server'` additionally starts the periodic `wal_checkpoint(RESTART)`
manager automatically to bound WAL growth on long-running daemons;
`'lib'` starts it only when `walCheckpointIntervalMs` is set.

## Stable
