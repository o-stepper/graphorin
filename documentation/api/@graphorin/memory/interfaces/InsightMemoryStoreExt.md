[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / InsightMemoryStoreExt

# Interface: InsightMemoryStoreExt

Defined in: [packages/memory/src/internal/storage-adapter.ts:679](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L679)

Optional storage extension for the reflection `insights` table
(P1-1). The consolidator's reflection pass inserts quarantined,
cited insights here; the thin `InsightMemory` read surface lists /
searches them; the ExpeL salience loop bumps + prunes them. Search is
FTS-only by design - insights are a soft, rank-capped inspector
surface, not primary recall.

Adapters that opt out leave the property undefined; reflection then
degrades to a no-op (it never writes) and `InsightMemory`
search/list return empty. The default `@graphorin/store-sqlite`
adapter implements it.

## Stable

## Methods

### bumpSalience()

```ts
bumpSalience(
   id, 
   delta, 
reason?): Promise<void>;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:707](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L707)

Adjust an insight's ExpeL salience by `delta`, clamped at 0. The
floor is the value at which [prune](/api/@graphorin/memory/interfaces/InsightMemoryStoreExt.md#prune) removes it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `delta` | `number` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### get()?

```ts
optional get(id): Promise<Insight | null>;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:691](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L691)

Lookup a single insight by id (`null` when absent / pruned).

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:681](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L681)

Persist a synthesized insight (idempotent on `id`).

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:683](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L683)

Most-recent insights for the scope (newest first).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts?` | [`InsightStoreListOptions`](/api/@graphorin/memory/interfaces/InsightStoreListOptions.md) |

#### Returns

`Promise`\&lt;readonly [`Insight`](/api/@graphorin/core/interfaces/Insight.md)[]\&gt;

***

### prune()

```ts
prune(scope): Promise<number>;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:713](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L713)

Soft-delete every salience-0 insight for the scope (the ExpeL
forgetting step). Returns the number pruned. Tombstone only -
pruned insights stay auditable.

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:685](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L685)

FTS keyword search over insight text.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `query` | `string` |
| `opts?` | [`InsightSearchStoreOptions`](/api/@graphorin/memory/interfaces/InsightSearchStoreOptions.md) |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Insight`](/api/@graphorin/core/interfaces/Insight.md)\&gt;[]\>

***

### setStatus()?

```ts
optional setStatus(
   id, 
   status, 
   reason?, 
scope?): Promise<void>;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:697](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L697)

Set an insight's retrieval-trust `status` (MCON-2) - promote a quarantined
(reflection) insight or re-quarantine an active one, with a
`memory_history` audit row. Powers [InsightMemory.validate](/api/@graphorin/memory/classes/InsightMemory.md#validate).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `status` | [`MemoryStatus`](/api/@graphorin/core/type-aliases/MemoryStatus.md) |
| `reason?` | `string` |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;`void`\&gt;
