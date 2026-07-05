[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / MemoryMetadataDeps

# Interface: MemoryMetadataDeps

Defined in: packages/memory/src/context-engine/metadata.ts:22

Per-call dependency surface. Mirrors the `Memory` facade fields
the metadata gatherer needs without taking a hard dependency on
the facade type itself (the facade and the gatherer are
mutually-referenced through the engine).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-consolidator"></a> `consolidator` | `readonly` | [`Consolidator`](/api/@graphorin/memory/interfaces/Consolidator.md) | - | packages/memory/src/context-engine/metadata.ts:24 |
| <a id="property-embedderid"></a> `embedderId` | `readonly` | () => `string` \| `null` | - | packages/memory/src/context-engine/metadata.ts:25 |
| <a id="property-localeid"></a> `localeId` | `readonly` | `string` | - | packages/memory/src/context-engine/metadata.ts:26 |
| <a id="property-store"></a> `store` | `readonly` | [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md) | - | packages/memory/src/context-engine/metadata.ts:23 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | Optional free-form metadata tags surfaced through `MemoryMetadata.tags`. | packages/memory/src/context-engine/metadata.ts:28 |
