[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / checkFtsIntegrity

# Function: checkFtsIntegrity()

```ts
function checkFtsIntegrity(conn): FtsIntegrityReport[];
```

Defined in: packages/store-sqlite/src/fts-integrity.ts:76

**`Stable`**

Count orphaned FTS rows (rowids with no matching base row) for every FTS
table that exists. An empty array means every FTS index is consistent with
its base table. A non-empty result is a sign of rowid drift - most likely a
hand-run `VACUUM` - and means search may return the wrong records.

Tables absent from the schema (e.g. before their migration has run) are
skipped rather than reported.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

## Returns

[`FtsIntegrityReport`](/api/@graphorin/store-sqlite/interfaces/FtsIntegrityReport.md)[]
