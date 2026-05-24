[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/embedder-ollama](/api/@graphorin/embedder-ollama/index.md) / OllamaEmbedder

# Class: OllamaEmbedder

Defined in: packages/embedder-ollama/src/index.ts:120

`EmbedderProvider` implementation that talks to the Ollama HTTP API.

## Stable

## Implements

- [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md)

## Constructors

### Constructor

```ts
new OllamaEmbedder(options): OllamaEmbedder;
```

Defined in: packages/embedder-ollama/src/index.ts:134

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`OllamaEmbedderOptions`](/api/@graphorin/embedder-ollama/interfaces/OllamaEmbedderOptions.md) |

#### Returns

`OllamaEmbedder`

## Methods

### configHash()

```ts
configHash(): string;
```

Defined in: packages/embedder-ollama/src/index.ts:182

Deterministic hash over the embedder's full configuration —
including the discovered digest. A model upgrade in the same
Ollama instance changes the digest (and therefore the hash), so
`lock-on-first` correctly fires a migration path instead of
silently reusing the same `embedder_id`.

#### Returns

`string`

#### Implementation of

[`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md).[`configHash`](/api/@graphorin/core/interfaces/EmbedderProvider.md#confighash)

***

### dim()

```ts
dim(): number;
```

Defined in: packages/embedder-ollama/src/index.ts:170

Dim resolved at first embed (or known-default fallback).

#### Returns

`number`

#### Implementation of

[`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md).[`dim`](/api/@graphorin/core/interfaces/EmbedderProvider.md#dim)

***

### embed()

```ts
embed(texts, opts?): Promise<readonly Float32Array<ArrayBufferLike>[]>;
```

Defined in: packages/embedder-ollama/src/index.ts:192

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

Defined in: packages/embedder-ollama/src/index.ts:163

The canonical embedder id — `'ollama:<model>@<dim-or-digest>'`.

#### Returns

`string`

#### Implementation of

[`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md).[`id`](/api/@graphorin/core/interfaces/EmbedderProvider.md#id)
