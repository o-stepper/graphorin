[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / LlmReRanker

# Class: LlmReRanker\&lt;TRecord\&gt;

Defined in: src/reranker.ts:130

**`Stable`**

`ReRanker` implementation. Matches the contract from
`@graphorin/memory/search`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Implements

- [`ReRanker`](/api/@graphorin/memory/interfaces/ReRanker.md)

## Constructors

### Constructor

```ts
new LlmReRanker<TRecord>(options): LlmReRanker<TRecord>;
```

Defined in: src/reranker.ts:148

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LlmRerankerOptions`](/api/@graphorin/reranker-llm/interfaces/LlmRerankerOptions.md)\&lt;`TRecord`\&gt; |

#### Returns

`LlmReRanker`\&lt;`TRecord`\&gt;

## Properties

| Property | Modifier | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-batchsize"></a> `batchSize` | `readonly` | `number` | `undefined` | - | src/reranker.ts:134 |
| <a id="property-fallbackscore"></a> `fallbackScore` | `readonly` | `number` | `undefined` | - | src/reranker.ts:137 |
| <a id="property-id"></a> `id` | `readonly` | `"llm-judge"` | `RERANKER_ID` | Stable lowercase identifier surfaced on every span. | src/reranker.ts:131 |
| <a id="property-maxoutputtokens"></a> `maxOutputTokens` | `readonly` | `number` | `undefined` | - | src/reranker.ts:136 |
| <a id="property-maxscore"></a> `maxScore` | `readonly` | `number` | `undefined` | - | src/reranker.ts:133 |
| <a id="property-provider"></a> `provider` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | `undefined` | - | src/reranker.ts:132 |
| <a id="property-temperature"></a> `temperature` | `readonly` | `number` | `undefined` | - | src/reranker.ts:135 |

## Accessors

### invocationCount

#### Get Signature

```ts
get invocationCount(): number;
```

Defined in: src/reranker.ts:177

**`Stable`**

Number of `rerank(...)` invocations since construction. Surfaced
for observability + the test suite.

##### Returns

`number`

***

### lastErrorCount

#### Get Signature

```ts
get lastErrorCount(): number;
```

Defined in: src/reranker.ts:197

Number of per-passage provider failures swallowed (→ `fallbackScore`) on
the most recent `rerank(...)`. A non-zero value means the ranking
is partially degraded - surface it for observability.

##### Returns

`number`

***

### lastFailures

#### Get Signature

```ts
get lastFailures(): readonly LlmRerankFailure[];
```

Defined in: src/reranker.ts:222

**`Stable`**

Per-passage failure details (both kinds) from the most recent
`rerank(...)`, capped at 25 entries - enough to diagnose a live
incident (status codes, error classes, off-format reply snippets)
without re-running billed calls. The counters above keep full
totals.

##### Returns

readonly [`LlmRerankFailure`](/api/@graphorin/reranker-llm/interfaces/LlmRerankFailure.md)[]

***

### lastOffFormatCount

#### Get Signature

```ts
get lastOffFormatCount(): number;
```

Defined in: src/reranker.ts:209

**`Stable`**

Number of off-format replies (no parseable integer → `fallbackScore`)
on the most recent `rerank(...)`. Distinct from `lastErrorCount`:
the provider call SUCCEEDED but the model drifted off the
integer-only contract.

##### Returns

`number`

***

### lastPromptTokens

#### Get Signature

```ts
get lastPromptTokens(): number;
```

Defined in: src/reranker.ts:188

**`Stable`**

Rough total prompt-tokens spent on the most-recent rerank call.
Returned by the provider on each `generate(...)`; we expose the
sum so tests can assert the batching shape.

##### Returns

`number`

## Methods

### rerank()

```ts
rerank<TInputRecord>(
   query, 
   lists, 
options?): Promise<readonly MemoryHit<TInputRecord>[]>;
```

Defined in: src/reranker.ts:226

Rerank one or more parallel ranked lists and return the fused
top-K (default `topK = 10`). Each input list must already be
sorted by `score` descending.

#### Type Parameters

| Type Parameter |
| ------ |
| `TInputRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `lists` | readonly readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TInputRecord`\&gt;[][] |
| `options` | [`ReRankOptions`](/api/@graphorin/memory/interfaces/ReRankOptions.md) |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TInputRecord`\&gt;[]\>

#### Implementation of

[`ReRanker`](/api/@graphorin/memory/interfaces/ReRanker.md).[`rerank`](/api/@graphorin/memory/interfaces/ReRanker.md#rerank)
