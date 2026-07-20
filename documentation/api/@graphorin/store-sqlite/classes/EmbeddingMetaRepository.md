[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / EmbeddingMetaRepository

# Class: EmbeddingMetaRepository

Defined in: packages/store-sqlite/src/embedding-meta-repo.ts:84

**`Stable`**

Registry repository: one instance per `SqliteConnection`.

## Constructors

### Constructor

```ts
new EmbeddingMetaRepository(conn, policy?): EmbeddingMetaRepository;
```

Defined in: packages/store-sqlite/src/embedding-meta-repo.ts:89

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) | `undefined` |
| `policy` | [`EmbedderPolicy`](/api/@graphorin/store-sqlite/type-aliases/EmbedderPolicy.md) | `'lock-on-first'` |

#### Returns

`EmbeddingMetaRepository`

## Methods

### assertKnown()

```ts
assertKnown(id): void;
```

Defined in: packages/store-sqlite/src/embedding-meta-repo.ts:242

Verify that the given `embedder_id` is registered. Used at every
write boundary so unknown ids fail fast.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`void`

***

### get()

```ts
get(id): 
  | EmbeddingMetaRow
  | null;
```

Defined in: packages/store-sqlite/src/embedding-meta-repo.ts:95

Read-through cache lookup.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

  \| [`EmbeddingMetaRow`](/api/@graphorin/store-sqlite/interfaces/EmbeddingMetaRow.md)
  \| `null`

***

### listActive()

```ts
listActive(): readonly EmbeddingMetaRow[];
```

Defined in: packages/store-sqlite/src/embedding-meta-repo.ts:117

Snapshot of every active (non-retired) embedder.

#### Returns

readonly [`EmbeddingMetaRow`](/api/@graphorin/store-sqlite/interfaces/EmbeddingMetaRow.md)[]

***

### listAll()

```ts
listAll(): readonly EmbeddingMetaRow[];
```

Defined in: packages/store-sqlite/src/embedding-meta-repo.ts:109

Snapshot of every registered embedder.

#### Returns

readonly [`EmbeddingMetaRow`](/api/@graphorin/store-sqlite/interfaces/EmbeddingMetaRow.md)[]

***

### registerOrReturn()

```ts
registerOrReturn(input): EmbeddingMetaRow;
```

Defined in: packages/store-sqlite/src/embedding-meta-repo.ts:126

Idempotent registration. Returns the existing row if one already
matches `(id, configHash)`; rejects the call if `lock-on-first` is
in effect and a different active embedder is already registered.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`RegisterEmbedderInput`](/api/@graphorin/store-sqlite/interfaces/RegisterEmbedderInput.md) |

#### Returns

[`EmbeddingMetaRow`](/api/@graphorin/store-sqlite/interfaces/EmbeddingMetaRow.md)

***

### retire()

```ts
retire(id, retiredAt?): void;
```

Defined in: packages/store-sqlite/src/embedding-meta-repo.ts:233

Mark an embedder retired. Read-only after retirement.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `retiredAt` | `number` |

#### Returns

`void`
