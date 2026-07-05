[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / VectorTableManager

# Class: VectorTableManager

Defined in: packages/store-sqlite/src/vector-table-mgr.ts:11

Lazy-creator for per-embedder `vec0` virtual tables. The first write
for `(entity, embedder_id)` creates the corresponding `*_vec_<slug>`
virtual table; subsequent writes hit the cached existence check.

## Stable

## Constructors

### Constructor

```ts
new VectorTableManager(conn): VectorTableManager;
```

Defined in: packages/store-sqlite/src/vector-table-mgr.ts:15

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

#### Returns

`VectorTableManager`

## Methods

### ensureTable()

```ts
ensureTable(kind, meta): string;
```

Defined in: packages/store-sqlite/src/vector-table-mgr.ts:35

Ensures the per-embedder vec0 table for `kind` exists. Returns the
concrete table name (which the caller uses in their `INSERT INTO`
+ `SELECT` statements).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | `"facts"` \| `"episodes"` \| `"messages"` |
| `meta` | [`EmbeddingMetaRow`](/api/@graphorin/store-sqlite/interfaces/EmbeddingMetaRow.md) |

#### Returns

`string`

#### Stable

***

### knownTables()

```ts
knownTables(): readonly string[];
```

Defined in: packages/store-sqlite/src/vector-table-mgr.ts:51

**`Internal`**

#### Returns

readonly `string`[]
