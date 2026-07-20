[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / GraphMemoryStoreExt

# Interface: GraphMemoryStoreExt

Defined in: packages/memory/src/internal/storage-adapter.ts:873

**`Stable`**

Optional storage extension for the lightweight in-SQLite relation
graph. Owns the canonical `entities` table, the `fact_entities`
mapping, and the append-only `entity_merges` ledger. The entity
*resolution policy* (lexical + embedding dedup, optional LLM
adjudication) lives in `@graphorin/memory`; this surface is the pure
persistence + the recursive-CTE traversal.

Adapters that opt out leave the property undefined; entity resolution
on write degrades to a no-op and `search({ expandHops })` skips
expansion. The default `@graphorin/store-sqlite` adapter implements it.

## Methods

### expandActivation()?

```ts
optional expandActivation(
   scope, 
   seedFactIds, 
   opts?): Promise<readonly {
  depth: number;
  fact: Fact;
}[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:924

PPR-lite graded expansion: like [expandOneHop](/api/@graphorin/memory/interfaces/GraphMemoryStoreExt.md#expandonehop) but returns
each neighbour with its minimum hop `depth` from the seeds, so the
tier can weight it by damped spreading activation. Optional - stores
without it fall back to flat one-hop expansion.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `seedFactIds` | readonly `string`[] |
| `opts?` | [`ExpandHopsStoreOptions`](/api/@graphorin/memory/interfaces/ExpandHopsStoreOptions.md) |

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

Defined in: packages/memory/src/internal/storage-adapter.ts:913

Expand seed facts to neighbours sharing a canonical entity (one-hop CTE).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `seedFactIds` | readonly `string`[] |
| `opts?` | [`ExpandHopsStoreOptions`](/api/@graphorin/memory/interfaces/ExpandHopsStoreOptions.md) |

#### Returns

`Promise`\&lt;readonly [`Fact`](/api/@graphorin/core/interfaces/Fact.md)[]\&gt;

***

### factsForEntityName()?

```ts
optional factsForEntityName(
   scope, 
   normalizedName, 
opts?): Promise<readonly Fact[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:934

Exact entity-match retriever: facts linked to the canonical
entity for `normalizedName`. Optional. Powers a precise
"facts about &lt;entity&gt;" candidate leg.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `normalizedName` | `string` |
| `opts?` | [`ExpandHopsStoreOptions`](/api/@graphorin/memory/interfaces/ExpandHopsStoreOptions.md) |

#### Returns

`Promise`\&lt;readonly [`Fact`](/api/@graphorin/core/interfaces/Fact.md)[]\&gt;

***

### findEntityByNormalizedName()?

```ts
optional findEntityByNormalizedName(scope, normalizedName): Promise<
  | EntityWithEmbedding
| null>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:890

Uncapped indexed lookup of the canonical root for an exact normalized
name. Lets the resolver dedup an exact alias of an arbitrarily-old
entity without scanning (and deserializing) the bounded
[listEntities](/api/@graphorin/memory/interfaces/GraphMemoryStoreExt.md#listentities) candidate window. Optional: stores without
it fall back to the capped lexical scan inside `resolveEntityDecision`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `normalizedName` | `string` |

#### Returns

`Promise`\<
  \| [`EntityWithEmbedding`](/api/@graphorin/memory/interfaces/EntityWithEmbedding.md)
  \| `null`\>

***

### getEntity()

```ts
getEntity(scope, id): Promise<GraphEntity | null>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:895

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

Defined in: packages/memory/src/internal/storage-adapter.ts:877

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
listEntities(scope, opts?): Promise<readonly EntityWithEmbedding[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:879

Candidate entities for the resolver (roots only unless `includeMerged`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts?` | \{ `includeMerged?`: `boolean`; `limit?`: `number`; \} |
| `opts.includeMerged?` | `boolean` |
| `opts.limit?` | `number` |

#### Returns

`Promise`\&lt;readonly [`EntityWithEmbedding`](/api/@graphorin/memory/interfaces/EntityWithEmbedding.md)[]\&gt;

***

### listMerges()

```ts
listMerges(scope, opts?): Promise<readonly EntityMergeRecord[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:908

The append-only merge / unmerge ledger, newest first.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts?` | \{ `limit?`: `number`; \} |
| `opts.limit?` | `number` |

#### Returns

`Promise`\&lt;readonly [`EntityMergeRecord`](/api/@graphorin/memory/interfaces/EntityMergeRecord.md)[]\&gt;

***

### mergeEntities()

```ts
mergeEntities(
   scope, 
   fromId, 
   intoId, 
reason?): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:899

Merge `fromId` into `intoId`'s root; auditable + reversible.

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

Defined in: packages/memory/src/internal/storage-adapter.ts:897

Follow `mergedInto` to the canonical root id.

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

Defined in: packages/memory/src/internal/storage-adapter.ts:906

Reverse a merge: make `id` a root again + record an audit row.

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

Defined in: packages/memory/src/internal/storage-adapter.ts:875

Find-or-create the canonical (root) entity for the normalized name.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `input` | [`EntityUpsertInput`](/api/@graphorin/memory/interfaces/EntityUpsertInput.md) |

#### Returns

`Promise`\&lt;`string`\&gt;
