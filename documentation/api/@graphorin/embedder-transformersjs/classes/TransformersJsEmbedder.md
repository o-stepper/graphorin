[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/embedder-transformersjs](/api/@graphorin/embedder-transformersjs/index.md) / [](/api/@graphorin/embedder-transformersjs/README.md) / TransformersJsEmbedder

# Class: TransformersJsEmbedder

Defined in: packages/embedder-transformersjs/src/index.ts:137

**`Stable`**

`EmbedderProvider` implementation backed by `@huggingface/transformers`.

## Implements

- [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md)

## Constructors

### Constructor

```ts
new TransformersJsEmbedder(options): TransformersJsEmbedder;
```

Defined in: packages/embedder-transformersjs/src/index.ts:152

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TransformersJsEmbedderOptions`](/api/@graphorin/embedder-transformersjs/interfaces/TransformersJsEmbedderOptions.md) |

#### Returns

`TransformersJsEmbedder`

## Methods

### configHash()

```ts
configHash(): string;
```

Defined in: packages/embedder-transformersjs/src/index.ts:188

Stable hash of the embedder's configuration (model + revision + opts).

#### Returns

`string`

#### Implementation of

[`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md).[`configHash`](/api/@graphorin/core/interfaces/EmbedderProvider.md#confighash)

***

### dim()

```ts
dim(): number;
```

Defined in: packages/embedder-transformersjs/src/index.ts:179

Output dimension - the explicit `dim` option, a known-model
default, or the width resolved from the first `embed()`.
periphery-05 (the PS-11 fix ported from the Ollama embedder):
throws for an unknown model with no `dim` hint instead of silently
assuming 768 - a wrong assumed width bakes a wrong-width id AND a
wrong-width vec0 table, and the id then CHANGES after the first
`embed()` resolves the truth, which `lock-on-first` reads as an
embedder swap.

#### Returns

`number`

#### Implementation of

[`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md).[`dim`](/api/@graphorin/core/interfaces/EmbedderProvider.md#dim)

***

### embed()

```ts
embed(texts, opts?): Promise<readonly Float32Array<ArrayBufferLike>[]>;
```

Defined in: packages/embedder-transformersjs/src/index.ts:204

Compute embeddings for a batch of texts. Returns one vector per text.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `texts` | readonly `string`[] |
| `opts` | [`EmbedOptions`](/api/@graphorin/core/interfaces/EmbedOptions.md) |

#### Returns

`Promise`\<readonly `Float32Array`\&lt;`ArrayBufferLike`\&gt;[]\>

#### Implementation of

[`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md).[`embed`](/api/@graphorin/core/interfaces/EmbedderProvider.md#embed)

***

### id()

```ts
id(): string;
```

Defined in: packages/embedder-transformersjs/src/index.ts:165

Stable identifier (e.g. `'transformersjs:Xenova/multilingual-e5-base'`).

#### Returns

`string`

#### Implementation of

[`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md).[`id`](/api/@graphorin/core/interfaces/EmbedderProvider.md#id)
