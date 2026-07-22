[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SemanticMemoryStoreExt

# Interface: SemanticMemoryStoreExt

Defined in: packages/memory/src/internal/storage-adapter.ts:110

**`Stable`**

Extension of the typed `SemanticMemoryStore` with optional
embedding-aware helpers + lifecycle helpers that storage adapters
may expose.

## Extends

- [`SemanticMemoryStore`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md)

## Methods

### count()?

```ts
optional count(scope): Promise<number>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:159

Count the recall-eligible facts for the scope - a `COUNT(*)` with
the default recall filters (live, non-archived, non-quarantined), never
materialising rows. Powers honest `metadata()` counts.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;`number`\&gt;

***

### forget()

```ts
forget(
   id, 
   reason?, 
scope?): Promise<void>;
```

Defined in: [packages/core/dist/contracts/memory-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/memory-store.d.ts)

Soft-delete a fact. When `scope` is supplied, adapters that
support tenant isolation MUST treat a fact outside the scope as a
deterministic no-op (0 rows changed) - defense in depth so a
leaked / cross-user id reaching a mutator cannot touch another
user's memory. Omitting `scope` preserves the historical unscoped
behaviour (trusted internal callers: consolidator, erasure
cascades). The parameter is additive - existing adapter
implementations with the narrower arity remain structurally
compatible.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `reason?` | `string` |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Inherited from

[`SemanticMemoryStore`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md).[`forget`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md#forget)

***

### get()?

```ts
optional get(id): Promise<Fact | null>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:139

Lookup a single fact by id (returns `null` when absent or soft-deleted).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;[`Fact`](/api/@graphorin/core/interfaces/Fact.md) \| `null`\&gt;

***

### historyOf()?

```ts
optional historyOf(scope, factId): Promise<readonly Fact[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:185

Walk the bi-temporal supersede chain that `factId` belongs to and
return every fact in it, oldest → newest (by `validFrom`),
including superseded / soft-deleted rows so callers can answer
"how did this fact change over time". Scope-guarded and
cycle-safe; returns `[]` for an unknown id. Powers
[SemanticMemory.history](/api/@graphorin/memory/classes/SemanticMemory.md#history). The default
`@graphorin/store-sqlite` adapter implements it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `factId` | `string` |

#### Returns

`Promise`\&lt;readonly [`Fact`](/api/@graphorin/core/interfaces/Fact.md)[]\&gt;

***

### linkPendingSupersede()?

```ts
optional linkPendingSupersede(newId, oldId): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:175

Record a PENDING supersede link - set `newId.supersedes =
oldId` WITHOUT closing the old fact's validity interval. Used when
a supersede's successor lands quarantined: the old fact must stay
in default recall until the successor is validated, at which point
[SemanticMemory.validate](/api/@graphorin/memory/classes/SemanticMemory.md#validate) completes the closure via
[SemanticMemoryStore.supersede](/api/@graphorin/memory/interfaces/SemanticMemoryStoreExt.md#supersede). No schema change - the
`supersedes` column already exists.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `newId` | `string` |
| `oldId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### listActive()?

```ts
optional listActive(scope, options?): Promise<readonly Fact[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:197

Enumerate the recall-eligible facts for the scope: live,
non-archived, `status = 'active'`, validity interval containing
now - the same view default recall sees, but as a deterministic
list (`created_at` order) instead of a ranked search. Powers the
profile-projection pass and the operation-level benchmark
observation. `excludePendingSupersede` additionally drops
facts whose supersede is still pending validation (a
quarantined successor links to them) - a projection must not
present a value that is already known to be contested.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `options?` | \{ `excludePendingSupersede?`: `boolean`; `limit?`: `number`; \} |
| `options.excludePendingSupersede?` | `boolean` |
| `options.limit?` | `number` |

#### Returns

`Promise`\&lt;readonly [`Fact`](/api/@graphorin/core/interfaces/Fact.md)[]\&gt;

***

### listPromotionCandidates()?

```ts
optional listPromotionCandidates(scope, options?): Promise<readonly {
  accessCount: number;
  fact: Fact;
  uniqueQueryCount: number;
}[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:211

Enumerate quarantined, live, non-archived facts together with
their recall statistics - the candidate feed for the
deterministic PromotionPolicy: `accessCount` is the monotonic
migration-027 counter, `uniqueQueryCount` the migration-036
distinct-query ledger count. Deterministic `created_at` order.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `options?` | \{ `limit?`: `number`; \} |
| `options.limit?` | `number` |

#### Returns

`Promise`\<readonly \{
  `accessCount`: `number`;
  `fact`: [`Fact`](/api/@graphorin/core/interfaces/Fact.md);
  `uniqueQueryCount`: `number`;
\}[]\>

***

### purge()?

```ts
optional purge(
   id, 
   reason?, 
scope?): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:165

Hard-delete a fact (GDPR path). The audit log row is preserved
but the row itself + every per-embedder vec0 entry is removed.
Distinct from [SemanticMemoryStore.forget](/api/@graphorin/memory/interfaces/SemanticMemoryStoreExt.md#forget) (soft-delete).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `reason?` | `string` |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### remember()

```ts
remember(fact): Promise<void>;
```

Defined in: [packages/core/dist/contracts/memory-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/memory-store.d.ts)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fact` | [`Fact`](/api/@graphorin/core/interfaces/Fact.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Inherited from

[`SemanticMemoryStore`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md).[`remember`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md#remember)

***

### rememberWithEmbedding()?

```ts
optional rememberWithEmbedding(fact, options): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:111

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fact` | [`Fact`](/api/@graphorin/core/interfaces/Fact.md) |
| `options` | [`EmbeddedWriteOptions`](/api/@graphorin/memory/interfaces/EmbeddedWriteOptions.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### search()

```ts
search(scope, opts): Promise<readonly MemoryHit<Fact>[]>;
```

Defined in: [packages/core/dist/contracts/memory-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/memory-store.d.ts)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts` | [`MemorySearchOptions`](/api/@graphorin/core/interfaces/MemorySearchOptions.md) |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Fact`](/api/@graphorin/core/interfaces/Fact.md)\&gt;[]\>

#### Inherited from

[`SemanticMemoryStore`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md).[`search`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md#search)

***

### searchVector()?

```ts
optional searchVector(
   scope, 
   embedding, 
   embedderId, 
   topK, 
   asOf?, 
   includeQuarantined?, 
   includeSuperseded?, 
owner?): Promise<readonly MemoryHit<Fact>[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:112

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - |
| `embedding` | `Float32Array` | - |
| `embedderId` | `string` | - |
| `topK` | `number` | - |
| `asOf?` | `string` | Point-in-time filter applied after KNN: only facts whose validity interval contains `asOf` (ISO-8601) survive. |
| `includeQuarantined?` | `boolean` | Include quarantined facts in the KNN result (validation / inspector path). Default reads exclude them. |
| `includeSuperseded?` | `boolean` | Include superseded / validity-expired facts. Default reads evaluate validity at NOW. |
| `owner?` | \| [`MemoryOwner`](/api/@graphorin/core/type-aliases/MemoryOwner.md) \| readonly [`MemoryOwner`](/api/@graphorin/core/type-aliases/MemoryOwner.md)[] | Retrieval-time principal filter. Rows with no stored owner are treated as `'user'`. Absent ⇒ no owner filter. |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Fact`](/api/@graphorin/core/interfaces/Fact.md)\&gt;[]\>

***

### setStatus()?

```ts
optional setStatus(
   factId, 
   status, 
   reason?, 
scope?): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:148

Set a fact's retrieval-trust `status` and write a `memory_history`
audit row. Promotes a quarantined fact to `active` (the
validation path) or re-quarantines an active one. Never touches
content / embedding / tombstone - quarantine is a retrieval gate.
Powers [SemanticMemory.validate](/api/@graphorin/memory/classes/SemanticMemory.md#validate); the default
`@graphorin/store-sqlite` adapter implements it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `factId` | `string` |
| `status` | [`MemoryStatus`](/api/@graphorin/core/type-aliases/MemoryStatus.md) |
| `reason?` | `string` |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### supersede()

```ts
supersede(
   oldId, 
   newFact, 
reason?): Promise<void>;
```

Defined in: [packages/core/dist/contracts/memory-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/memory-store.d.ts)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `oldId` | `string` |
| `newFact` | [`Fact`](/api/@graphorin/core/interfaces/Fact.md) |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Inherited from

[`SemanticMemoryStore`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md).[`supersede`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md#supersede)
