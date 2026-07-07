[**Graphorin API reference v0.7.0**](../../../index.md)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:260](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L260)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:259](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L259)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:263](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L263)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:262](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L262)

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
| `id` | `string` | [packages/memory/src/internal/storage-adapter.ts:258](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L258) |

***

### retire()

```ts
retire(id, retiredAt?): void;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:261](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L261)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `retiredAt?` | `number` |

#### Returns

`void`
