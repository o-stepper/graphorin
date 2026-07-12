[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / GraphMemoryStoreExt

# Interface: GraphMemoryStoreExt

Defined in: [packages/memory/src/internal/storage-adapter.ts:835](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L835)

Optional storage extension for the lightweight in-SQLite relation
graph (P2-1). Owns the canonical `entities` table, the `fact_entities`
mapping, and the append-only `entity_merges` ledger. The entity
*resolution policy* (lexical + embedding dedup, optional LLM
adjudication) lives in `@graphorin/memory`; this surface is the pure
persistence + the recursive-CTE traversal.

Adapters that opt out leave the property undefined; entity resolution
on write degrades to a no-op and `search({ expandHops })` skips
expansion. The default `@graphorin/store-sqlite` adapter implements it.

## Stable

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:886](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L886)

PPR-lite graded expansion (D5): like [expandOneHop](/api/@graphorin/memory/interfaces/GraphMemoryStoreExt.md#expandonehop) but returns
each neighbour with its minimum hop `depth` from the seeds, so the
tier can weight it by damped spreading activation. Optional - stores
without it fall back to flat one-hop expansion.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `seedFactIds` | readonly `string`[] |
| `opts?` | `ExpandHopsStoreOptions` |

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:875](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L875)

Expand seed facts to neighbours sharing a canonical entity (one-hop CTE).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `seedFactIds` | readonly `string`[] |
| `opts?` | `ExpandHopsStoreOptions` |

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:896](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L896)

Exact entity-match retriever (D5): facts linked to the canonical
entity for `normalizedName`. Optional. Powers a precise
"facts about &lt;entity&gt;" candidate leg.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `normalizedName` | `string` |
| `opts?` | `ExpandHopsStoreOptions` |

#### Returns

`Promise`\&lt;readonly [`Fact`](/api/@graphorin/core/interfaces/Fact.md)[]\&gt;

***

### findEntityByNormalizedName()?

```ts
optional findEntityByNormalizedName(scope, normalizedName): Promise<EntityWithEmbedding | null>;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:852](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L852)

Uncapped indexed lookup of the canonical root for an exact normalized
name. Lets the resolver dedup an exact alias of an arbitrarily-old
entity without scanning (and deserializing) the bounded
[listEntities](/api/@graphorin/memory/interfaces/GraphMemoryStoreExt.md#listentities) candidate window (CS-11). Optional: stores without
it fall back to the capped lexical scan inside `resolveEntityDecision`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `normalizedName` | `string` |

#### Returns

`Promise`\&lt;`EntityWithEmbedding` \| `null`\&gt;

***

### getEntity()

```ts
getEntity(scope, id): Promise<GraphEntity | null>;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:857](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L857)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:839](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L839)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:841](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L841)

Candidate entities for the resolver (roots only unless `includeMerged`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts?` | \{ `includeMerged?`: `boolean`; `limit?`: `number`; \} |
| `opts.includeMerged?` | `boolean` |
| `opts.limit?` | `number` |

#### Returns

`Promise`\&lt;readonly `EntityWithEmbedding`[]\&gt;

***

### listMerges()

```ts
listMerges(scope, opts?): Promise<readonly EntityMergeRecord[]>;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:870](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L870)

The append-only merge / unmerge ledger, newest first.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts?` | \{ `limit?`: `number`; \} |
| `opts.limit?` | `number` |

#### Returns

`Promise`\&lt;readonly `EntityMergeRecord`[]\&gt;

***

### mergeEntities()

```ts
mergeEntities(
   scope, 
   fromId, 
   intoId, 
reason?): Promise<void>;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:861](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L861)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:859](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L859)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:868](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L868)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:837](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L837)

Find-or-create the canonical (root) entity for the normalized name.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `input` | `EntityUpsertInput` |

#### Returns

`Promise`\&lt;`string`\&gt;
