[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/embedder-ollama](/api/@graphorin/embedder-ollama/index.md) / [](/api/@graphorin/embedder-ollama/README.md) / OllamaEmbedder

# Class: OllamaEmbedder

Defined in: packages/embedder-ollama/src/index.ts:134

**`Stable`**

`EmbedderProvider` implementation that talks to the Ollama HTTP API.

## Implements

- [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md)

## Constructors

### Constructor

```ts
new OllamaEmbedder(options): OllamaEmbedder;
```

Defined in: packages/embedder-ollama/src/index.ts:148

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

Defined in: packages/embedder-ollama/src/index.ts:209

Deterministic hash over the embedder's full configuration -
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

Defined in: packages/embedder-ollama/src/index.ts:191

Output dimension - the explicit `dim` option, the resolved width from the
first `embed()`, or a known-family default. Throws for an unknown
model with no `dim` hint instead of returning `0` (which the store would
persist and use to create a `float[0]` vec0 table, silently breaking
vector search). Pass `dim` for any model not in [KNOWN\_OLLAMA\_MODEL\_DIMS](/api/@graphorin/embedder-ollama/variables/KNOWN_OLLAMA_MODEL_DIMS.md), or call `embed()` once first to resolve it.

#### Returns

`number`

#### Implementation of

[`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md).[`dim`](/api/@graphorin/core/interfaces/EmbedderProvider.md#dim)

***

### embed()

```ts
embed(texts, opts?): Promise<readonly Float32Array<ArrayBufferLike>[]>;
```

Defined in: packages/embedder-ollama/src/index.ts:219

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

Defined in: packages/embedder-ollama/src/index.ts:177

The canonical embedder id - `'ollama:<model>@<dim-or-digest>'`.

#### Returns

`string`

#### Implementation of

[`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md).[`id`](/api/@graphorin/core/interfaces/EmbedderProvider.md#id)
