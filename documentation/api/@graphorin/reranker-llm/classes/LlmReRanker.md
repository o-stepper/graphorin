[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / LlmReRanker

# Class: LlmReRanker\&lt;TRecord\&gt;

Defined in: [packages/reranker-llm/src/reranker.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/reranker.ts#L97)

`ReRanker` implementation. Matches the contract from
`@graphorin/memory/search`.

## Stable

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

Defined in: [packages/reranker-llm/src/reranker.ts:113](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/reranker.ts#L113)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LlmRerankerOptions`](/api/@graphorin/reranker-llm/interfaces/LlmRerankerOptions.md)\&lt;`TRecord`\&gt; |

#### Returns

`LlmReRanker`\&lt;`TRecord`\&gt;

## Properties

| Property | Modifier | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-batchsize"></a> `batchSize` | `readonly` | `number` | `undefined` | - | [packages/reranker-llm/src/reranker.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/reranker.ts#L101) |
| <a id="property-fallbackscore"></a> `fallbackScore` | `readonly` | `number` | `undefined` | - | [packages/reranker-llm/src/reranker.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/reranker.ts#L104) |
| <a id="property-id"></a> `id` | `readonly` | `"llm-judge"` | `RERANKER_ID` | Stable lowercase identifier surfaced on every span. | [packages/reranker-llm/src/reranker.ts:98](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/reranker.ts#L98) |
| <a id="property-maxoutputtokens"></a> `maxOutputTokens` | `readonly` | `number` | `undefined` | - | [packages/reranker-llm/src/reranker.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/reranker.ts#L103) |
| <a id="property-maxscore"></a> `maxScore` | `readonly` | `number` | `undefined` | - | [packages/reranker-llm/src/reranker.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/reranker.ts#L100) |
| <a id="property-provider"></a> `provider` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | `undefined` | - | [packages/reranker-llm/src/reranker.ts:99](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/reranker.ts#L99) |
| <a id="property-temperature"></a> `temperature` | `readonly` | `number` | `undefined` | - | [packages/reranker-llm/src/reranker.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/reranker.ts#L102) |

## Accessors

### invocationCount

#### Get Signature

```ts
get invocationCount(): number;
```

Defined in: [packages/reranker-llm/src/reranker.ts:142](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/reranker.ts#L142)

Number of `rerank(...)` invocations since construction. Surfaced
for observability + the test suite.

##### Stable

##### Returns

`number`

***

### lastErrorCount

#### Get Signature

```ts
get lastErrorCount(): number;
```

Defined in: [packages/reranker-llm/src/reranker.ts:162](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/reranker.ts#L162)

Number of per-passage provider failures swallowed (→ `fallbackScore`) on
the most recent `rerank(...)` (PS-15). A non-zero value means the ranking
is partially degraded - surface it for observability.

##### Returns

`number`

***

### lastPromptTokens

#### Get Signature

```ts
get lastPromptTokens(): number;
```

Defined in: [packages/reranker-llm/src/reranker.ts:153](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/reranker.ts#L153)

Rough total prompt-tokens spent on the most-recent rerank call.
Returned by the provider on each `generate(...)`; we expose the
sum so tests can assert the batching shape.

##### Stable

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

Defined in: [packages/reranker-llm/src/reranker.ts:166](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/reranker.ts#L166)

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
