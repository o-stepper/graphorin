[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EntityWithEmbedding

# Interface: EntityWithEmbedding

Defined in: packages/memory/src/internal/storage-adapter.ts:826

A canonical [GraphEntity](/api/@graphorin/core/interfaces/GraphEntity.md) returned with its name embedding so the
resolver can run cosine dedup in-process (entity counts are small).

## Extends

- [`GraphEntity`](/api/@graphorin/core/interfaces/GraphEntity.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | [`GraphEntity`](/api/@graphorin/core/interfaces/GraphEntity.md).[`createdAt`](/api/@graphorin/core/interfaces/GraphEntity.md#property-createdat) | [packages/core/dist/types/memory.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/memory.d.ts) |
| <a id="property-embedderid"></a> `embedderId` | `readonly` | `string` \| `null` | - | - | packages/memory/src/internal/storage-adapter.ts:828 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [`GraphEntity`](/api/@graphorin/core/interfaces/GraphEntity.md).[`id`](/api/@graphorin/core/interfaces/GraphEntity.md#property-id) | [packages/core/dist/types/memory.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/memory.d.ts) |
| <a id="property-mergedinto"></a> `mergedInto?` | `readonly` | `string` | Canonical pointer. `undefined` ⇒ this entity is itself a root. Otherwise it is the id of the surviving entity this one was merged into; single-level by construction, so `mergedInto ?? id` resolves the canonical id without a recursive walk. | [`GraphEntity`](/api/@graphorin/core/interfaces/GraphEntity.md).[`mergedInto`](/api/@graphorin/core/interfaces/GraphEntity.md#property-mergedinto) | [packages/core/dist/types/memory.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/memory.d.ts) |
| <a id="property-name"></a> `name` | `readonly` | `string` | Display name as first observed (the surface form that minted it). | [`GraphEntity`](/api/@graphorin/core/interfaces/GraphEntity.md).[`name`](/api/@graphorin/core/interfaces/GraphEntity.md#property-name) | [packages/core/dist/types/memory.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/memory.d.ts) |
| <a id="property-normalizedname"></a> `normalizedName` | `readonly` | `string` | Case/space-folded key used for lexical dedup + the canonical unique index. | [`GraphEntity`](/api/@graphorin/core/interfaces/GraphEntity.md).[`normalizedName`](/api/@graphorin/core/interfaces/GraphEntity.md#property-normalizedname) | [packages/core/dist/types/memory.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/memory.d.ts) |
| <a id="property-updatedat"></a> `updatedAt?` | `readonly` | `string` | - | [`GraphEntity`](/api/@graphorin/core/interfaces/GraphEntity.md).[`updatedAt`](/api/@graphorin/core/interfaces/GraphEntity.md#property-updatedat) | [packages/core/dist/types/memory.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/memory.d.ts) |
| <a id="property-userid"></a> `userId` | `readonly` | `string` | - | [`GraphEntity`](/api/@graphorin/core/interfaces/GraphEntity.md).[`userId`](/api/@graphorin/core/interfaces/GraphEntity.md#property-userid) | [packages/core/dist/types/memory.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/memory.d.ts) |
| <a id="property-vector"></a> `vector` | `readonly` | `Float32Array`\&lt;`ArrayBufferLike`\&gt; \| `null` | - | - | packages/memory/src/internal/storage-adapter.ts:827 |
