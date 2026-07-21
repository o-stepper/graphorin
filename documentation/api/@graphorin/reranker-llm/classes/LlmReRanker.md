[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / LlmReRanker

# Class: LlmReRanker\&lt;TRecord\&gt;

Defined in: src/reranker.ts:97

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

Defined in: src/reranker.ts:113

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LlmRerankerOptions`](/api/@graphorin/reranker-llm/interfaces/LlmRerankerOptions.md)\&lt;`TRecord`\&gt; |

#### Returns

`LlmReRanker`\&lt;`TRecord`\&gt;

## Properties

| Property | Modifier | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-batchsize"></a> `batchSize` | `readonly` | `number` | `undefined` | - | src/reranker.ts:101 |
| <a id="property-fallbackscore"></a> `fallbackScore` | `readonly` | `number` | `undefined` | - | src/reranker.ts:104 |
| <a id="property-id"></a> `id` | `readonly` | `"llm-judge"` | `RERANKER_ID` | Stable lowercase identifier surfaced on every span. | src/reranker.ts:98 |
| <a id="property-maxoutputtokens"></a> `maxOutputTokens` | `readonly` | `number` | `undefined` | - | src/reranker.ts:103 |
| <a id="property-maxscore"></a> `maxScore` | `readonly` | `number` | `undefined` | - | src/reranker.ts:100 |
| <a id="property-provider"></a> `provider` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | `undefined` | - | src/reranker.ts:99 |
| <a id="property-temperature"></a> `temperature` | `readonly` | `number` | `undefined` | - | src/reranker.ts:102 |

## Accessors

### invocationCount

#### Get Signature

```ts
get invocationCount(): number;
```

Defined in: src/reranker.ts:142

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

Defined in: src/reranker.ts:162

Number of per-passage provider failures swallowed (→ `fallbackScore`) on
the most recent `rerank(...)`. A non-zero value means the ranking
is partially degraded - surface it for observability.

##### Returns

`number`

***

### lastPromptTokens

#### Get Signature

```ts
get lastPromptTokens(): number;
```

Defined in: src/reranker.ts:153

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

Defined in: src/reranker.ts:166

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
