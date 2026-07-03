[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SemanticMemory

# Class: SemanticMemory

Defined in: packages/memory/src/tiers/semantic-memory.ts:318

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

Defined in: packages/memory/src/tiers/semantic-memory.ts:331

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | \{ `conflictPipeline?`: [`ConflictPipeline`](/api/@graphorin/memory/interfaces/ConflictPipeline.md); `contextualRetrieval?`: `"off"` \| `"late-chunk"`; `embedder`: \| [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md) \| `null`; `embedderIdProvider`: () => `string` \| `null`; `entityResolver?`: [`EntityResolver`](/api/@graphorin/memory/classes/EntityResolver.md); `grader?`: [`RetrievalGrader`](/api/@graphorin/memory/interfaces/RetrievalGrader.md); `iterativeMaxIterations?`: `number`; `queryTransformer?`: [`QueryTransformer`](/api/@graphorin/memory/interfaces/QueryTransformer.md); `reranker`: [`ReRanker`](/api/@graphorin/memory/interfaces/ReRanker.md); `store`: [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md); `tracer`: [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md); \} | - |
| `args.conflictPipeline?` | [`ConflictPipeline`](/api/@graphorin/memory/interfaces/ConflictPipeline.md) | - |
| `args.contextualRetrieval?` | `"off"` \| `"late-chunk"` | Contextual-retrieval mode for the write path (P1-3). `'late-chunk'` (default) prepends a deterministic situating context to the text that is embedded + FTS-indexed, leaving the canonical `text` untouched; `'off'` indexes the bare text. The hot write path never makes an LLM call — the `'llm'` enrichment is confined to the background consolidator, which supplies a precomputed `indexText`. |
| `args.embedder` | \| [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md) \| `null` | - |
| `args.embedderIdProvider` | () => `string` \| `null` | - |
| `args.entityResolver?` | [`EntityResolver`](/api/@graphorin/memory/classes/EntityResolver.md) | Entity resolver for the relation graph (P2-1). When supplied, `remember(...)` resolves a fact's subject / object to canonical entities and links them, enabling `search(..., { expandHops: 1 })`. Omitted (the default) ⇒ writes carry s/p/o but form no entity links, and the write path stays offline + unchanged. |
| `args.grader?` | [`RetrievalGrader`](/api/@graphorin/memory/interfaces/RetrievalGrader.md) | Retrieval grader for the gated iterative loop (P2-4). When supplied, `searchIterative(...)` can grade a retrieved set and reformulate on hard queries; omitted (the default) ⇒ `searchIterative` runs a single, difficulty-gated pass and makes no provider call. |
| `args.iterativeMaxIterations?` | `number` | Default total-pass cap for `searchIterative`. Default 3. |
| `args.queryTransformer?` | [`QueryTransformer`](/api/@graphorin/memory/interfaces/QueryTransformer.md) | Query transformer for multi-query / HyDE retrieval (P2-3). When supplied, `search(..., { multiQuery })` / `{ hyde }` opt into one cheap LLM call to rewrite / hypothesize the query; omitted (the default) ⇒ those options are silent no-ops and search stays offline + single-shot. |
| `args.reranker` | [`ReRanker`](/api/@graphorin/memory/interfaces/ReRanker.md) | - |
| `args.store` | [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md) | - |
| `args.tracer` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) | - |

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

Defined in: packages/memory/src/tiers/semantic-memory.ts:1033

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

Defined in: packages/memory/src/tiers/semantic-memory.ts:1071

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

Defined in: packages/memory/src/tiers/semantic-memory.ts:894

Lookup a single fact by id. Returns `null` for soft-deleted / missing.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `factId` | `string` |

#### Returns

`Promise`\&lt;[`Fact`](/api/@graphorin/core/interfaces/Fact.md) \| `null`\&gt;

***

### history()

```ts
history(scope, factId): Promise<readonly Fact[]>;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:924

Return the full bi-temporal supersede chain that `factId` belongs
to, oldest → newest, including superseded / soft-deleted rows so
callers can answer "how did this fact change over time". Requires
a storage adapter that implements
`SemanticMemoryStoreExt.historyOf(...)` — the default
`@graphorin/store-sqlite` adapter wires this through. P0-2.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `factId` | `string` |

#### Returns

`Promise`\&lt;readonly [`Fact`](/api/@graphorin/core/interfaces/Fact.md)[]\&gt;

#### Stable

***

### neighbors()

```ts
neighbors(
   scope, 
   text, 
opts?): Promise<readonly MemoryHit<Fact>[]>;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:885

Raw vector KNN neighbours for the consolidator's reconcile
pre-filter (P0-3). Unlike [search](/api/@graphorin/memory/classes/SemanticMemory.md#search) this skips FTS, reranking,
and decay so the cosine scores survive intact (the conflict-pipeline
zone thresholds are calibrated against them), and it **includes
quarantined facts** so prior synthesized memories are visible to
reconciliation. Returns `[]` when no embedder / vector adapter is
configured — the consolidator then treats every candidate as a
fresh `add`, degrading gracefully to the pre-reconcile behaviour.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `text` | `string` |
| `opts` | \{ `topK?`: `number`; \} |
| `opts.topK?` | `number` |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Fact`](/api/@graphorin/core/interfaces/Fact.md)\&gt;[]\>

#### Stable

***

### purge()

```ts
purge(
   scope, 
   factId, 
reason?): Promise<void>;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:1052

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

Defined in: packages/memory/src/tiers/semantic-memory.ts:406

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

Defined in: packages/memory/src/tiers/semantic-memory.ts:422

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

Defined in: packages/memory/src/tiers/semantic-memory.ts:395

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

Defined in: packages/memory/src/tiers/semantic-memory.ts:633

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

### searchIterative()

```ts
searchIterative(
   scope, 
   query, 
opts?): Promise<IterativeRecallResult>;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:817

Gated, iterative ("deep") recall for hard queries (P2-4). A cheap
local heuristic ([assessQueryDifficulty](/api/@graphorin/memory/functions/assessQueryDifficulty.md)) decides whether the
query is even a loop candidate; simple lookups take exactly one
[search](/api/@graphorin/memory/classes/SemanticMemory.md#search) pass and make no provider call. For a query judged
hard *and* with a grader configured
(`createMemory({ iterativeRetrieval })`), the retrieved set is graded
for sufficiency and, when weak, the query is reformulated and
retrieved again — **widening to one-hop graph expansion**
(`expandHops: 1`) on each reformulation pass — up to `maxIterations`
(hard-capped at 5). When still insufficient it returns
`abstained: true` so the caller can decline to answer instead of
confabulating.

Without a grader (the offline default) this degrades to a single,
difficulty-gated `search` and never calls a provider.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `query` | `string` |
| `opts` | [`IterativeSearchOptions`](/api/@graphorin/memory/interfaces/IterativeSearchOptions.md) |

#### Returns

`Promise`\&lt;[`IterativeRecallResult`](/api/@graphorin/memory/type-aliases/IterativeRecallResult.md)\&gt;

#### Stable

***

### setReranker()

```ts
setReranker(reranker): ReRanker;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:388

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

Defined in: packages/memory/src/tiers/semantic-memory.ts:1004

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

### validate()

```ts
validate(
   scope, 
   factId, 
   reason?, 
options?): Promise<void>;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:964

Promote a quarantined fact to `active` (P1-4). The validation path
that admits a synthesized memory into action-driving recall once a
human (or trusted non-agent caller) has reviewed it. Writes a
`memory_history` audit row. Requires a storage adapter that
implements `SemanticMemoryStoreExt.setStatus(...)` — the default
`@graphorin/store-sqlite` adapter wires this through.

MRET-3 / MST-1: promotion of a fact whose text still trips the
offline injection heuristics is **refused** with
[QuarantinePromotionRefusedError](/api/@graphorin/memory/errors/classes/QuarantinePromotionRefusedError.md) — the model-facing
`fact_validate` tool calls this with no `force`, so a poisoned
memory can never be promoted by the agent itself (the one-turn
`fact_remember(poison)` → `fact_validate(id)` chain is closed). An
operator can override after review by passing `{ force: true }`
from a trusted (non-agent) context. Synthesized-but-clean writes
(consolidator / reflection) promote normally.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `factId` | `string` |
| `reason?` | `string` |
| `options?` | \{ `force?`: `boolean`; \} |
| `options.force?` | `boolean` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Stable

***

### fuseRrf()

```ts
static fuseRrf<TRecord>(lists, k?): readonly MemoryHit<TRecord>[];
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:1080

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

***

### fuseWeighted()

```ts
static fuseWeighted<TRecord>(
   lists, 
   weights, 
   k?): readonly MemoryHit<TRecord>[];
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:1093

Pure weighted-fusion helper (X-2) — like [SemanticMemory.fuseRrf](/api/@graphorin/memory/classes/SemanticMemory.md#fuserrf)
but scales each list `i`'s reciprocal-rank contribution by
`weights[i]`. A missing / invalid entry defaults to `1`, so equal or
absent weights reproduce RRF.

#### Type Parameters

| Type Parameter |
| ------ |
| `TRecord` *extends* [`Fact`](/api/@graphorin/core/interfaces/Fact.md) |

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `lists` | readonly readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt;[][] | `undefined` |
| `weights` | readonly `number`[] \| `undefined` | `undefined` |
| `k` | `number` | `60` |

#### Returns

readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt;[]
