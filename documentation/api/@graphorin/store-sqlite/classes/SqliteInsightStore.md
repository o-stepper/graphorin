[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteInsightStore

# Class: SqliteInsightStore

Defined in: packages/store-sqlite/src/memory-store.ts:1968

**`Stable`**

`SqliteInsightStore` - owns the `insights` + `insights_fts` tables
shipped in migration 014. Implements the structural
`InsightMemoryStoreExt` surface defined in
`@graphorin/memory/internal/storage-adapter.ts`.

Search is FTS5-only - insights are a soft, rank-capped inspector
surface, not primary recall, so no per-embedder vec0 table is
created. Pruning (the ExpeL forgetting step) is a soft-delete
(`deleted_at`), never a hard purge, so pruned insights remain
auditable.

## Constructors

### Constructor

```ts
new SqliteInsightStore(conn): SqliteInsightStore;
```

Defined in: packages/store-sqlite/src/memory-store.ts:1970

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

#### Returns

`SqliteInsightStore`

## Methods

### bumpSalience()

```ts
bumpSalience(
   id, 
   delta, 
reason?): Promise<void>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2108

Adjust an insight's ExpeL salience by `delta`, clamped at 0 (the
floor at which `prune` removes it). Never touches content / cites -
salience is the only mutable field.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `delta` | `number` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### get()

```ts
get(id): Promise<Insight | null>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2054

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;[`Insight`](/api/@graphorin/core/interfaces/Insight.md) \| `null`\&gt;

***

### insert()

```ts
insert(insight): Promise<void>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:1974

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `insight` | [`Insight`](/api/@graphorin/core/interfaces/Insight.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### list()

```ts
list(scope, opts?): Promise<readonly Insight[]>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2015

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts` | \{ `includeQuarantined?`: `boolean`; `limit?`: `number`; \} |
| `opts.includeQuarantined?` | `boolean` |
| `opts.limit?` | `number` |

#### Returns

`Promise`\&lt;readonly [`Insight`](/api/@graphorin/core/interfaces/Insight.md)[]\&gt;

***

### prune()

```ts
prune(scope): Promise<number>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2121

Soft-delete every salience-0 insight for the scope (the ExpeL
forgetting step). Returns the number pruned. Tombstone only - the
row stays for audit.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;`number`\&gt;

***

### search()

```ts
search(
   scope, 
   query, 
opts?): Promise<readonly MemoryHit<Insight>[]>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2031

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `query` | `string` |
| `opts` | \{ `includeQuarantined?`: `boolean`; `topK?`: `number`; \} |
| `opts.includeQuarantined?` | `boolean` |
| `opts.topK?` | `number` |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Insight`](/api/@graphorin/core/interfaces/Insight.md)\&gt;[]\>

***

### setStatus()

```ts
setStatus(
   id, 
   status, 
   reason?, 
scope?): Promise<void>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2068

Promote / demote an insight's retrieval-trust `status` and write a
`memory_history` audit row. Mirrors `setStatus` on facts - a retrieval gate
only. Powers `InsightMemory.validate` so a quarantined (reflection)
insight can be promoted out of quarantine.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `status` | [`MemoryStatus`](/api/@graphorin/core/type-aliases/MemoryStatus.md) |
| `reason?` | `string` |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;`void`\&gt;
