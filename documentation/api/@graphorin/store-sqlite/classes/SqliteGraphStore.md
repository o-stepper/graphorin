[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteGraphStore

# Class: SqliteGraphStore

Defined in: packages/store-sqlite/src/memory-store.ts:2204

**`Stable`**

Lightweight in-SQLite relation-graph store. Owns the canonical
`entities` table, the `fact_entities` mapping, and the append-only
`entity_merges` ledger. Entity *resolution* (lexical + embedding dedup,
optional LLM adjudication) lives in `@graphorin/memory`; this class is
the pure persistence + the one-hop recursive-CTE traversal. Exposed on
[SqliteMemoryStore.graph](/api/@graphorin/store-sqlite/classes/SqliteMemoryStore.md#property-graph) and picked up structurally as the
memory adapter's optional `graph` capability.

## Constructors

### Constructor

```ts
new SqliteGraphStore(conn): SqliteGraphStore;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2206

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

#### Returns

`SqliteGraphStore`

## Methods

### expandActivation()

```ts
expandActivation(
   scope, 
   seedFactIds, 
   opts?): Promise<readonly {
  depth: number;
  fact: Fact;
}[]>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2508

PPR-lite graded expansion: the same recursive entity-graph walk
as [expandOneHop](/api/@graphorin/store-sqlite/classes/SqliteGraphStore.md#expandonehop), but returns each reachable fact with its
MINIMUM hop distance from the seed set, so callers can weight
neighbours by damped spreading activation instead of a flat score.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `seedFactIds` | readonly `string`[] |
| `opts` | \{ `asOf?`: `string`; `includeQuarantined?`: `boolean`; `includeSuperseded?`: `boolean`; `limit?`: `number`; `maxHops?`: `number`; \} |
| `opts.asOf?` | `string` |
| `opts.includeQuarantined?` | `boolean` |
| `opts.includeSuperseded?` | `boolean` |
| `opts.limit?` | `number` |
| `opts.maxHops?` | `number` |

#### Returns

`Promise`\<readonly \{
  `depth`: `number`;
  `fact`: [`Fact`](/api/@graphorin/core/interfaces/Fact.md);
\}[]\>

***

### expandOneHop()

```ts
expandOneHop(
   scope, 
   seedFactIds, 
opts?): Promise<readonly Fact[]>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2410

Expand `seedFactIds` to neighbouring facts that share a canonical
entity, up to `maxHops` (default 1), via a recursive CTE over
`fact_entities`. Entities are canonicalised through `merged_into` in
the join, so a merge transparently connects both sides. Excludes the
seeds themselves and honours soft-delete / archive / quarantine /
`asOf` exactly like [SemanticMemoryStore.search](/api/@graphorin/core/interfaces/SemanticMemoryStore.md#search).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `seedFactIds` | readonly `string`[] |
| `opts` | \{ `asOf?`: `string`; `includeQuarantined?`: `boolean`; `includeSuperseded?`: `boolean`; `limit?`: `number`; `maxHops?`: `number`; \} |
| `opts.asOf?` | `string` |
| `opts.includeQuarantined?` | `boolean` |
| `opts.includeSuperseded?` | `boolean` |
| `opts.limit?` | `number` |
| `opts.maxHops?` | `number` |

#### Returns

`Promise`\&lt;readonly [`Fact`](/api/@graphorin/core/interfaces/Fact.md)[]\&gt;

***

### factsForEntityName()

```ts
factsForEntityName(
   scope, 
   normalizedName, 
opts?): Promise<readonly Fact[]>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2593

Exact entity-match retriever: facts linked to the entity whose
normalized name equals `normalizedName` (canonicalising merges).
Powers a precise "facts about &lt;entity&gt;" candidate leg distinct from
the fuzzy vector/FTS legs.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `normalizedName` | `string` |
| `opts` | \{ `asOf?`: `string`; `includeQuarantined?`: `boolean`; `includeSuperseded?`: `boolean`; `limit?`: `number`; \} |
| `opts.asOf?` | `string` |
| `opts.includeQuarantined?` | `boolean` |
| `opts.includeSuperseded?` | `boolean` |
| `opts.limit?` | `number` |

#### Returns

`Promise`\&lt;readonly [`Fact`](/api/@graphorin/core/interfaces/Fact.md)[]\&gt;

***

### findEntityByNormalizedName()

```ts
findEntityByNormalizedName(scope, normalizedName): Promise<
  | SqliteEntityWithEmbedding
| null>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2288

Uncapped indexed lookup of the canonical root for an exact normalized
name. Backed by the partial-unique index on `(scope_user_id,
normalized_name) WHERE merged_into IS NULL`, so the resolver dedups an
exact alias of an arbitrarily-old entity without paging the bounded
[listEntities](/api/@graphorin/store-sqlite/classes/SqliteGraphStore.md#listentities) candidate window or deserializing its BLOBs.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `normalizedName` | `string` |

#### Returns

`Promise`\<
  \| [`SqliteEntityWithEmbedding`](/api/@graphorin/store-sqlite/interfaces/SqliteEntityWithEmbedding.md)
  \| `null`\>

***

### getEntity()

```ts
getEntity(scope, id): Promise<GraphEntity | null>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2302

Lookup one entity by id (any merge state).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `id` | `string` |

#### Returns

`Promise`\&lt;[`GraphEntity`](/api/@graphorin/core/interfaces/GraphEntity.md) \| `null`\&gt;

***

### linkFactEntity()

```ts
linkFactEntity(
   factId, 
   entityId, 
role): Promise<void>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2254

Link a fact's subject / object to a canonical entity (idempotent).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `factId` | `string` |
| `entityId` | `string` |
| `role` | [`EntityRole`](/api/@graphorin/core/type-aliases/EntityRole.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### listEntities()

```ts
listEntities(scope, opts?): Promise<readonly SqliteEntityWithEmbedding[]>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2262

Candidate entities for the resolver (roots only unless `includeMerged`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts` | \{ `includeMerged?`: `boolean`; `limit?`: `number`; \} |
| `opts.includeMerged?` | `boolean` |
| `opts.limit?` | `number` |

#### Returns

`Promise`\&lt;readonly [`SqliteEntityWithEmbedding`](/api/@graphorin/store-sqlite/interfaces/SqliteEntityWithEmbedding.md)[]\&gt;

***

### listMerges()

```ts
listMerges(scope, opts?): Promise<readonly SqliteEntityMergeRecord[]>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2382

The append-only merge / unmerge audit ledger, newest first.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts` | \{ `limit?`: `number`; \} |
| `opts.limit?` | `number` |

#### Returns

`Promise`\&lt;readonly [`SqliteEntityMergeRecord`](/api/@graphorin/store-sqlite/interfaces/SqliteEntityMergeRecord.md)[]\&gt;

***

### mergeEntities()

```ts
mergeEntities(
   scope, 
   fromId, 
   intoId, 
reason?): Promise<void>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2331

Merge `fromId` into `intoId` (resolved to its root). Sets
`from.merged_into` and re-points `from`'s children to keep the
pointer single-level, then records a `'merge'` audit row.
`fact_entities` are never rewritten - reads canonicalise via
`merged_into`. A self-merge is a no-op.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `fromId` | `string` |
| `intoId` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### resolveCanonical()

```ts
resolveCanonical(scope, id): Promise<string>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2311

Follow `merged_into` to the canonical root id (cycle-guarded).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `id` | `string` |

#### Returns

`Promise`\&lt;`string`\&gt;

***

### unmergeEntity()

```ts
unmergeEntity(
   scope, 
   id, 
reason?): Promise<void>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2366

Reverse a merge: clear `id.merged_into` (making it a root again) and
record an `'unmerge'` audit row. Restores the entity as a root; the
pre-merge child topology is not reconstructed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `id` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### upsertEntity()

```ts
upsertEntity(scope, input): Promise<string>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:2215

Find-or-create the canonical (root) entity for `normalizedName` in
the scope. Returns the existing root's id when one exists (back-filling
its embedding if it had none), else inserts and returns a new root.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `input` | [`SqliteEntityUpsertInput`](/api/@graphorin/store-sqlite/interfaces/SqliteEntityUpsertInput.md) |

#### Returns

`Promise`\&lt;`string`\&gt;
