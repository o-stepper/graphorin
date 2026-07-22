[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / TransformersJsReRanker

# Class: TransformersJsReRanker\&lt;TRecord\&gt;

Defined in: packages/reranker-transformersjs/src/reranker.ts:103

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
new TransformersJsReRanker<TRecord>(options): TransformersJsReRanker<TRecord>;
```

Defined in: packages/reranker-transformersjs/src/reranker.ts:125

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CrossEncoderRerankerOptions`](/api/@graphorin/reranker-transformersjs/interfaces/CrossEncoderRerankerOptions.md)\&lt;`TRecord`\&gt; |

#### Returns

`TransformersJsReRanker`\&lt;`TRecord`\&gt;

## Properties

| Property | Modifier | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-batchsize"></a> `batchSize` | `readonly` | `number` | `undefined` | - | packages/reranker-transformersjs/src/reranker.ts:110 |
| <a id="property-dtype"></a> `dtype` | `readonly` | [`RerankerDtype`](/api/@graphorin/reranker-transformersjs/type-aliases/RerankerDtype.md) | `undefined` | - | packages/reranker-transformersjs/src/reranker.ts:109 |
| <a id="property-id"></a> `id` | `readonly` | `"transformersjs-cross-encoder"` | `RERANKER_ID` | Stable lowercase identifier surfaced on every span. | packages/reranker-transformersjs/src/reranker.ts:106 |
| <a id="property-idleevictionms"></a> `idleEvictionMs` | `readonly` | `number` \| `undefined` | `undefined` | - | packages/reranker-transformersjs/src/reranker.ts:111 |
| <a id="property-locale"></a> `locale` | `readonly` | `string` | `undefined` | - | packages/reranker-transformersjs/src/reranker.ts:108 |
| <a id="property-model"></a> `model` | `readonly` | `string` | `undefined` | - | packages/reranker-transformersjs/src/reranker.ts:107 |

## Accessors

### invocationCount

#### Get Signature

```ts
get invocationCount(): number;
```

Defined in: packages/reranker-transformersjs/src/reranker.ts:153

**`Stable`**

Number of `rerank(...)` invocations since construction. Surfaced
for observability + the test suite.

##### Returns

`number`

***

### pipelineLoaded

#### Get Signature

```ts
get pipelineLoaded(): boolean;
```

Defined in: packages/reranker-transformersjs/src/reranker.ts:163

**`Stable`**

Whether the underlying ONNX model is currently loaded in
memory. Surfaced for the idle-eviction integration test.

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

Defined in: packages/reranker-transformersjs/src/reranker.ts:182

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

Defined in: packages/reranker-transformersjs/src/reranker.ts:173

**`Stable`**

Drop the loaded model. Equivalent to letting the idle-eviction
timer fire. Idempotent.

#### Returns

`void`
