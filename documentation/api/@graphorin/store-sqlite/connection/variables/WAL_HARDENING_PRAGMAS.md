[**Graphorin API reference v0.13.4**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [connection](/api/@graphorin/store-sqlite/connection/index.md) / WAL\_HARDENING\_PRAGMAS

# Variable: WAL\_HARDENING\_PRAGMAS

```ts
const WAL_HARDENING_PRAGMAS: readonly ["journal_mode = WAL", "synchronous = NORMAL", "busy_timeout = 5000", "mmap_size = 134217728", "temp_store = MEMORY", "cache_size = -64000", "foreign_keys = ON"];
```

Defined in: packages/store-sqlite/src/connection.ts:64

**`Stable`**

Mandatory WAL hardening pragmas applied at connection open. Any
deviation must be documented in the calling site's TSDoc per the
Phase 05 acceptance criteria.
