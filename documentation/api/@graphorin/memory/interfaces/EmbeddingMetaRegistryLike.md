[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EmbeddingMetaRegistryLike

# Interface: EmbeddingMetaRegistryLike

Defined in: packages/memory/src/internal/storage-adapter.ts:226

Optional extension surface for storage adapters' embedder registry.
The interface is structural so any adapter that matches the shape
works.

## Stable

## Methods

### assertKnown()

```ts
assertKnown(id): void;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:237

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`void`

***

### get()

```ts
get(id): unknown;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:236

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`unknown`

***

### listActive()

```ts
listActive(): readonly {
  id: string;
  retiredAt: number | null;
}[];
```

Defined in: packages/memory/src/internal/storage-adapter.ts:240

#### Returns

readonly \{
  `id`: `string`;
  `retiredAt`: `number` \| `null`;
\}[]

***

### listAll()

```ts
listAll(): readonly {
  id: string;
  retiredAt: number | null;
}[];
```

Defined in: packages/memory/src/internal/storage-adapter.ts:239

#### Returns

readonly \{
  `id`: `string`;
  `retiredAt`: `number` \| `null`;
\}[]

***

### registerOrReturn()

```ts
registerOrReturn(input): {
  id: string;
};
```

Defined in: packages/memory/src/internal/storage-adapter.ts:227

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `configHash`: `string`; `dim`: `number`; `distanceMetric?`: `"cosine"` \| `"dot"` \| `"euclidean"`; `embedderKind`: `string`; `id`: `string`; `model`: `string`; `notes?`: `string` \| `null`; \} |
| `input.configHash` | `string` |
| `input.dim` | `number` |
| `input.distanceMetric?` | `"cosine"` \| `"dot"` \| `"euclidean"` |
| `input.embedderKind` | `string` |
| `input.id` | `string` |
| `input.model` | `string` |
| `input.notes?` | `string` \| `null` |

#### Returns

```ts
{
  id: string;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `id` | `string` | packages/memory/src/internal/storage-adapter.ts:235 |

***

### retire()

```ts
retire(id, retiredAt?): void;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:238

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `retiredAt?` | `number` |

#### Returns

`void`
