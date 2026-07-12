[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EmbeddingMetaRegistryLike

# Interface: EmbeddingMetaRegistryLike

Defined in: [packages/memory/src/internal/storage-adapter.ts:249](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L249)

Optional extension surface for storage adapters' embedder registry.
The interface is structural so any adapter that matches the shape
works.

## Stable

## Methods

### assertKnown()

```ts
assertKnown(id): void;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:267](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L267)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:266](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L266)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:270](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L270)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:269](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L269)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:250](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L250)

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
| `id` | `string` | [packages/memory/src/internal/storage-adapter.ts:265](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L265) |

***

### retire()

```ts
retire(id, retiredAt?): void;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:268](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L268)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `retiredAt?` | `number` |

#### Returns

`void`
