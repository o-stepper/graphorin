[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EmbeddingMetaRegistryLike

# Interface: EmbeddingMetaRegistryLike

Defined in: [packages/memory/src/internal/storage-adapter.ts:292](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L292)

Optional extension surface for storage adapters' embedder registry.
The interface is structural so any adapter that matches the shape
works.

## Stable

## Methods

### assertKnown()

```ts
assertKnown(id): void;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:310](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L310)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:309](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L309)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:313](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L313)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:312](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L312)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:293](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L293)

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | \{ `configHash`: `string`; `dim`: `number`; `distanceMetric?`: `"cosine"` \| `"dot"` \| `"euclidean"`; `embedderKind`: `string`; `id`: `string`; `indexMode?`: `string` \| `null`; `model`: `string`; `notes?`: `string` \| `null`; \} | - |
| `input.configHash` | `string` | - |
| `input.dim` | `number` | - |
| `input.distanceMetric?` | `"cosine"` \| `"dot"` \| `"euclidean"` | - |
| `input.embedderKind` | `string` | - |
| `input.id` | `string` | - |
| `input.indexMode?` | `string` \| `null` | Write-path contextualization recipe (item 10 step 1) - joins the index version key so a `contextualRetrieval` switch invalidates the index like a model change. Optional-additive: registries predating the field ignore it. |
| `input.model` | `string` | - |
| `input.notes?` | `string` \| `null` | - |

#### Returns

```ts
{
  id: string;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `id` | `string` | [packages/memory/src/internal/storage-adapter.ts:308](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L308) |

***

### retire()

```ts
retire(id, retiredAt?): void;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:311](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L311)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `retiredAt?` | `number` |

#### Returns

`void`
