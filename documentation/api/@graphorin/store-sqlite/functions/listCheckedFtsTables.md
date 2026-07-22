[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / listCheckedFtsTables

# Function: listCheckedFtsTables()

```ts
function listCheckedFtsTables(): readonly string[];
```

Defined in: packages/store-sqlite/src/fts-integrity.ts:46

**`Internal`**

The FTS tables the integrity guard covers. Exported so the
coverage self-check test can diff this list against the `%_fts`
tables of a fully-migrated database - a new FTS index that is not
registered here fails the test instead of silently escaping the
integrity check.

## Returns

readonly `string`[]
