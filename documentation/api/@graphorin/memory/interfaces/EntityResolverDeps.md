[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EntityResolverDeps

# Interface: EntityResolverDeps

Defined in: packages/memory/src/graph/entity-resolver.ts:184

Construction deps for [EntityResolver](/api/@graphorin/memory/classes/EntityResolver.md).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | [`EntityResolutionConfig`](/api/@graphorin/memory/interfaces/EntityResolutionConfig.md) | packages/memory/src/graph/entity-resolver.ts:189 |
| <a id="property-embedder"></a> `embedder?` | `readonly` | \| [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md) \| `null` | packages/memory/src/graph/entity-resolver.ts:186 |
| <a id="property-embedderid"></a> `embedderId?` | `readonly` | () => `string` \| `null` | packages/memory/src/graph/entity-resolver.ts:187 |
| <a id="property-provider"></a> `provider?` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) \| `null` | packages/memory/src/graph/entity-resolver.ts:188 |
| <a id="property-store"></a> `store` | `readonly` | [`GraphMemoryStoreExt`](/api/@graphorin/memory/interfaces/GraphMemoryStoreExt.md) | packages/memory/src/graph/entity-resolver.ts:185 |
