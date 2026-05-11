[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SemanticMemory

# Class: SemanticMemory

Defined in: packages/memory/src/tiers/semantic-memory.ts:108

`SemanticMemory` — long-term factual store. Hybrid (vector + FTS5)
search merges the two ranked lists through the configured
[ReRanker](/api/@graphorin/memory/interfaces/ReRanker.md) (default [RRFReranker](/api/@graphorin/memory/classes/RRFReranker.md) with `k = 60`).

Phase 10a wrote facts straight through with MD5 deduplication;
Phase 10b routes every `remember(...)` call through the multi-stage
conflict resolution pipeline (DEC-117 / ADR-018 ext / RB-02). The
pipeline can be disabled per-call (`pipeline: 'off'`) or per-`Memory`
instance (`createMemory({ conflictPipeline: { mode: 'off' } })`).

## Stable

## Constructors

### Constructor

```ts
new SemanticMemory(args): SemanticMemory;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:116

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `conflictPipeline?`: [`ConflictPipeline`](/api/@graphorin/memory/interfaces/ConflictPipeline.md); `embedder`: \| [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md) \| `null`; `embedderIdProvider`: () => `string` \| `null`; `reranker`: [`ReRanker`](/api/@graphorin/memory/interfaces/ReRanker.md); `store`: [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md); `tracer`: [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md); \} |
| `args.conflictPipeline?` | [`ConflictPipeline`](/api/@graphorin/memory/interfaces/ConflictPipeline.md) |
| `args.embedder` | \| [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md) \| `null` |
| `args.embedderIdProvider` | () => `string` \| `null` |
| `args.reranker` | [`ReRanker`](/api/@graphorin/memory/interfaces/ReRanker.md) |
| `args.store` | [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md) |
| `args.tracer` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) |

#### Returns

`SemanticMemory`

## Methods

### forget()

```ts
forget(
   scope, 
   factId, 
reason?): Promise<void>;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:351

Soft-delete a fact (kept for replay; never hard-deleted).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `factId` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### fuse()

```ts
fuse(
   query, 
   lists, 
options?): Promise<readonly MemoryHit<Fact>[]>;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:389

Fuse multiple ranked lists outside of a `search()` call.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `lists` | readonly readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Fact`](/api/@graphorin/core/interfaces/Fact.md)\&gt;[][] |
| `options` | \{ `signal?`: `AbortSignal`; `topK?`: `number`; \} |
| `options.signal?` | `AbortSignal` |
| `options.topK?` | `number` |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Fact`](/api/@graphorin/core/interfaces/Fact.md)\&gt;[]\>

***

### get()

```ts
get(scope, factId): Promise<Fact | null>;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:301

Lookup a single fact by id. Returns `null` for soft-deleted / missing.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `factId` | `string` |

#### Returns

`Promise`\&lt;[`Fact`](/api/@graphorin/core/interfaces/Fact.md) \| `null`\&gt;

***

### purge()

```ts
purge(
   scope, 
   factId, 
reason?): Promise<void>;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:370

Hard-delete a fact (GDPR path). Distinct from [forget](/api/@graphorin/memory/classes/SemanticMemory.md#forget): the
record is removed from storage entirely instead of soft-archived.
Requires a storage adapter that implements
`SemanticMemoryStoreExt.purge(...)` — the default
`@graphorin/store-sqlite` adapter wires this through.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `factId` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### remember()

```ts
remember(
   scope, 
   input, 
options?): Promise<Fact>;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:151

Persist a fact. Returns the stored record. Phase 10b routes every
call through the multi-stage conflict resolution pipeline; the
legacy straight-through path is reachable per-call via
`{ pipeline: 'off' }` (operators may disable the pipeline globally
via `createMemory({ conflictPipeline: { mode: 'off' } })`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `input` | [`FactInput`](/api/@graphorin/memory/interfaces/FactInput.md) |
| `options` | [`FactRememberOptions`](/api/@graphorin/memory/interfaces/FactRememberOptions.md) |

#### Returns

`Promise`\&lt;[`Fact`](/api/@graphorin/core/interfaces/Fact.md)\&gt;

***

### rememberWithDecision()

```ts
rememberWithDecision(
   scope, 
   input, 
options?): Promise<RememberOutcome>;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:167

Like [remember](/api/@graphorin/memory/classes/SemanticMemory.md#remember) but returns the pipeline `decision` alongside
the stored fact. Useful for callers that need to distinguish
silent dedups (`decision.kind === 'dedup'`) from fresh inserts.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `input` | [`FactInput`](/api/@graphorin/memory/interfaces/FactInput.md) |
| `options` | [`FactRememberOptions`](/api/@graphorin/memory/interfaces/FactRememberOptions.md) |

#### Returns

`Promise`\&lt;[`RememberOutcome`](/api/@graphorin/memory/interfaces/RememberOutcome.md)\&gt;

#### Stable

***

### reranker()

```ts
reranker(): ReRanker;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:140

Currently active reranker.

#### Returns

[`ReRanker`](/api/@graphorin/memory/interfaces/ReRanker.md)

***

### search()

```ts
search(
   scope, 
   query, 
opts?): Promise<readonly MemoryHit<Fact>[]>;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:262

Hybrid (vector + FTS5) search merged through the configured reranker.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `query` | `string` |
| `opts` | [`FactSearchOptions`](/api/@graphorin/memory/interfaces/FactSearchOptions.md) |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Fact`](/api/@graphorin/core/interfaces/Fact.md)\&gt;[]\>

***

### setReranker()

```ts
setReranker(reranker): ReRanker;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:133

Replace the active reranker. Returns the previous instance.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `reranker` | [`ReRanker`](/api/@graphorin/memory/interfaces/ReRanker.md) |

#### Returns

[`ReRanker`](/api/@graphorin/memory/interfaces/ReRanker.md)

***

### supersede()

```ts
supersede(
   scope, 
   oldId, 
   newInput, 
   reason?): Promise<{
  new: Fact;
  old: string;
}>;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:322

Mark `oldId` superseded by a new fact. Returns the new record.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `oldId` | `string` |
| `newInput` | [`FactInput`](/api/@graphorin/memory/interfaces/FactInput.md) |
| `reason?` | `string` |

#### Returns

`Promise`\<\{
  `new`: [`Fact`](/api/@graphorin/core/interfaces/Fact.md);
  `old`: `string`;
\}\>

***

### fuseRrf()

```ts
static fuseRrf<TRecord>(lists, k?): readonly MemoryHit<TRecord>[];
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:398

Pure-fusion helper — exposed for callers that already collected results.

#### Type Parameters

| Type Parameter |
| ------ |
| `TRecord` *extends* [`Fact`](/api/@graphorin/core/interfaces/Fact.md) |

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `lists` | readonly readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt;[][] | `undefined` |
| `k` | `number` | `60` |

#### Returns

readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt;[]
