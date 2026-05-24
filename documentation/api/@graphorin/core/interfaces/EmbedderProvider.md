[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / EmbedderProvider

# Interface: EmbedderProvider

Defined in: packages/core/src/contracts/embedder.ts:14

Pluggable embedding provider. Implementations live in the embedder
adapter packages (`@graphorin/embedder-transformersjs` (default),
`@graphorin/embedder-ollama`, …).

Each embedder advertises its model `id`, output `dim`, and a stable
`configHash` used by the multi-table per-embedder vec0 layout in the
default SQLite store: facts indexed under embedder A and facts indexed
under embedder B live in separate vec0 tables; the `configHash` is the
lookup key.

## Stable

## Methods

### configHash()

```ts
configHash(): string;
```

Defined in: packages/core/src/contracts/embedder.ts:20

Stable hash of the embedder's configuration (model + revision + opts).

#### Returns

`string`

***

### dim()

```ts
dim(): number;
```

Defined in: packages/core/src/contracts/embedder.ts:18

Output dimensionality of the embedding vectors.

#### Returns

`number`

***

### embed()

```ts
embed(texts, opts?): Promise<readonly Float32Array<ArrayBufferLike>[]>;
```

Defined in: packages/core/src/contracts/embedder.ts:22

Compute embeddings for a batch of texts. Returns one vector per text.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `texts` | readonly `string`[] |
| `opts?` | [`EmbedOptions`](/api/@graphorin/core/interfaces/EmbedOptions.md) |

#### Returns

`Promise`\<readonly `Float32Array`\&lt;`ArrayBufferLike`\&gt;[]\>

***

### id()

```ts
id(): string;
```

Defined in: packages/core/src/contracts/embedder.ts:16

Stable identifier (e.g. `'transformersjs:Xenova/multilingual-e5-base'`).

#### Returns

`string`
