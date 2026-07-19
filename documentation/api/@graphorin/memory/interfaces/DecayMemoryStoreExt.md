[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / DecayMemoryStoreExt

# Interface: DecayMemoryStoreExt

Defined in: packages/memory/src/internal/storage-adapter.ts:626

**`Stable`**

Decay-aware extension of the typed `SemanticMemoryStore`. Phase
10c's light phase reads the strength + last-accessed columns and
archives facts whose retention curve falls below the configured
threshold. Adapters that do not maintain decay columns may omit
the surface entirely - the light phase skips the archive step
with an INFO log.

## Methods

### archiveFact()

```ts
archiveFact(
   id, 
   reason?, 
scope?): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:671

Soft-archive a fact (sets `archived = 1`). The audit row in
`memory_history` records the archive event.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `reason?` | `string` |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### listDecaySignals()?

```ts
optional listDecaySignals(ids): Promise<readonly {
  createdAt: number;
  id: string;
  lastAccessedAt: number | null;
  strength: number;
}[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:693

Narrow decay-column read for exactly the given fact ids -
powers per-search decay re-ranking without the old O(scope)
1000-row window read. Optional; absent ⇒ the tier falls back to
`listForDecay`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ids` | readonly `string`[] |

#### Returns

`Promise`\<readonly \{
  `createdAt`: `number`;
  `id`: `string`;
  `lastAccessedAt`: `number` \| `null`;
  `strength`: `number`;
\}[]\>

***

### listForDecay()

```ts
listForDecay(
   scope, 
   limit?, 
   opts?): Promise<readonly {
  accessCount?: number;
  archived: boolean;
  createdAt: number;
  id: string;
  importance: number | null;
  lastAccessedAt: number | null;
  provenance: string | null;
  status: string;
  strength: number;
  text: string;
}[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:641

List facts for the scope ordered by `lastAccessedAt` ASC so the
caller can apply Ebbinghaus retention without scanning the
whole table. `limit` defaults to `1000`.

Archived rows are EXCLUDED by default - they never receive
access bumps, so they would pin the LRU head and saturate the decay
window, structurally stopping threshold-archiving and capacity
eviction for live facts. Inspection paths pass
`{ includeArchived: true }`.

`importance` / `status` / `provenance` feed the multi-signal
salience score that orders capacity-bounded eviction.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `limit?` | `number` |
| `opts?` | \{ `includeArchived?`: `boolean`; \} |
| `opts.includeArchived?` | `boolean` |

#### Returns

`Promise`\<readonly \{
  `accessCount?`: `number`;
  `archived`: `boolean`;
  `createdAt`: `number`;
  `id`: `string`;
  `importance`: `number` \| `null`;
  `lastAccessedAt`: `number` \| `null`;
  `provenance`: `string` \| `null`;
  `status`: `string`;
  `strength`: `number`;
  `text`: `string`;
\}[]\>

***

### markAccessed()?

```ts
optional markAccessed(
   ids, 
   accessedAt?, 
   scope?, 
queryHash?): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:681

Record a retrieval access for the given facts: stamp
`lastAccessedAt` and reinforce `strength` (implementation-capped).
Optional - adapters without decay columns may omit it; callers
MUST treat failures as non-fatal (the read path never breaks on a
bookkeeping write). With `queryHash` the adapter also
feeds the persistent recall ledger - the DISTINCT-query counter
behind the PromotionPolicy `minUniqueQueries` threshold.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ids` | readonly `string`[] |
| `accessedAt?` | `number` |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `queryHash?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
