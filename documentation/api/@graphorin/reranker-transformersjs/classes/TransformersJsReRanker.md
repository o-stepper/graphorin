[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / TransformersJsReRanker

# Class: TransformersJsReRanker\&lt;TRecord\&gt;

Defined in: packages/reranker-transformersjs/src/reranker.ts:102

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
new TransformersJsReRanker<TRecord>(options): TransformersJsReRanker<TRecord>;
```

Defined in: packages/reranker-transformersjs/src/reranker.ts:124

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CrossEncoderRerankerOptions`](/api/@graphorin/reranker-transformersjs/interfaces/CrossEncoderRerankerOptions.md)\&lt;`TRecord`\&gt; |

#### Returns

`TransformersJsReRanker`\&lt;`TRecord`\&gt;

## Properties

| Property | Modifier | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-batchsize"></a> `batchSize` | `readonly` | `number` | `undefined` | - | packages/reranker-transformersjs/src/reranker.ts:109 |
| <a id="property-dtype"></a> `dtype` | `readonly` | [`RerankerDtype`](/api/@graphorin/reranker-transformersjs/type-aliases/RerankerDtype.md) | `undefined` | - | packages/reranker-transformersjs/src/reranker.ts:108 |
| <a id="property-id"></a> `id` | `readonly` | `"transformersjs-cross-encoder"` | `RERANKER_ID` | Stable lowercase identifier surfaced on every span. | packages/reranker-transformersjs/src/reranker.ts:105 |
| <a id="property-idleevictionms"></a> `idleEvictionMs` | `readonly` | `number` \| `undefined` | `undefined` | - | packages/reranker-transformersjs/src/reranker.ts:110 |
| <a id="property-locale"></a> `locale` | `readonly` | `string` | `undefined` | - | packages/reranker-transformersjs/src/reranker.ts:107 |
| <a id="property-model"></a> `model` | `readonly` | `string` | `undefined` | - | packages/reranker-transformersjs/src/reranker.ts:106 |

## Accessors

### invocationCount

#### Get Signature

```ts
get invocationCount(): number;
```

Defined in: packages/reranker-transformersjs/src/reranker.ts:152

Number of `rerank(...)` invocations since construction. Surfaced
for observability + the test suite.

##### Stable

##### Returns

`number`

***

### pipelineLoaded

#### Get Signature

```ts
get pipelineLoaded(): boolean;
```

Defined in: packages/reranker-transformersjs/src/reranker.ts:162

Whether the underlying ONNX pipeline is currently loaded in
memory. Surfaced for the idle-eviction integration test.

##### Stable

##### Returns

`boolean`

## Methods

### rerank()

```ts
rerank<TInputRecord>(
   query, 
   lists, 
options?): Promise<readonly MemoryHit<TInputRecord>[]>;
```

Defined in: packages/reranker-transformersjs/src/reranker.ts:181

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

***

### unload()

```ts
unload(): void;
```

Defined in: packages/reranker-transformersjs/src/reranker.ts:172

Drop the loaded pipeline. Equivalent to letting the idle-eviction
timer fire. Idempotent.

#### Returns

`void`

#### Stable
