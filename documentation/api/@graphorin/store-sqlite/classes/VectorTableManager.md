[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / VectorTableManager

# Class: VectorTableManager

Defined in: [packages/store-sqlite/src/vector-table-mgr.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/vector-table-mgr.ts#L20)

Lazy-creator for per-embedder `vec0` virtual tables. The first write
for `(entity, embedder_id)` creates the corresponding `*_vec_<slug>`
virtual table; subsequent writes hit the cached existence check.

Wave-D D5: in `'linear-fallback'` mode (sqlite-vec unavailable +
`onMissingSqliteVec: 'linear-fallback'`) the same table names are
created as PLAIN tables (`<id> TEXT PRIMARY KEY, embedding BLOB`)
and KNN is served by [VectorTableManager.linearKnn](/api/@graphorin/store-sqlite/classes/VectorTableManager.md#linearknn) - a
batched in-process cosine scan with `setImmediate` yields. A
database must stay in one mode: opening vec0 tables in fallback mode
(or plain fallback tables in vec0 mode) throws an actionable error
at construction.

## Stable

## Constructors

### Constructor

```ts
new VectorTableManager(conn): VectorTableManager;
```

Defined in: [packages/store-sqlite/src/vector-table-mgr.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/vector-table-mgr.ts#L25)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

#### Returns

`VectorTableManager`

## Accessors

### mode

#### Get Signature

```ts
get mode(): "vec0" | "linear-fallback" | "disabled";
```

Defined in: [packages/store-sqlite/src/vector-table-mgr.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/vector-table-mgr.ts#L96)

Active vector-serving mode (wave-D D5).

##### Returns

`"vec0"` \| `"linear-fallback"` \| `"disabled"`

## Methods

### dropTable()

```ts
dropTable(tableName): void;
```

Defined in: [packages/store-sqlite/src/vector-table-mgr.ts:155](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/vector-table-mgr.ts#L155)

**`Internal`**

- drop a table this manager tracks (space reclaim).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tableName` | `string` |

#### Returns

`void`

***

### ensureTable()

```ts
ensureTable(kind, meta): string;
```

Defined in: [packages/store-sqlite/src/vector-table-mgr.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/vector-table-mgr.ts#L73)

Ensures the per-embedder vector table for `kind` exists (vec0
virtual table, or a plain sidecar in linear-fallback mode).
Returns the concrete table name (which the caller uses in their
`INSERT INTO` + `SELECT` statements).

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

Defined in: [packages/store-sqlite/src/vector-table-mgr.ts:150](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/vector-table-mgr.ts#L150)

**`Internal`**

#### Returns

readonly `string`[]

***

### linearKnn()

```ts
linearKnn(
   tableName, 
   idColumn, 
   query, 
   k, 
   batchSize?): Promise<readonly {
  distance: number;
  id: string;
}[]>;
```

Defined in: [packages/store-sqlite/src/vector-table-mgr.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/vector-table-mgr.ts#L109)

In-process cosine KNN over a plain fallback sidecar (wave-D D5):
scans the table in batches of `batchSize` rows, yielding to the
event loop between batches (`setImmediate`) so a large scan cannot
monopolise it, and keeps the `k` nearest by cosine distance
(`1 - cos`, the same scale vec0 reports for its cosine metric).

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `tableName` | `string` | `undefined` |
| `idColumn` | `string` | `undefined` |
| `query` | `Float32Array` | `undefined` |
| `k` | `number` | `undefined` |
| `batchSize` | `number` | `500` |

#### Returns

`Promise`\<readonly \{
  `distance`: `number`;
  `id`: `string`;
\}[]\>

#### Stable
