[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EntityResolverDeps

# Interface: EntityResolverDeps

Defined in: [packages/memory/src/graph/entity-resolver.ts:184](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/graph/entity-resolver.ts#L184)

Construction deps for [EntityResolver](/api/@graphorin/memory/classes/EntityResolver.md).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | [`EntityResolutionConfig`](/api/@graphorin/memory/interfaces/EntityResolutionConfig.md) | [packages/memory/src/graph/entity-resolver.ts:189](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/graph/entity-resolver.ts#L189) |
| <a id="property-embedder"></a> `embedder?` | `readonly` | \| [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md) \| `null` | [packages/memory/src/graph/entity-resolver.ts:186](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/graph/entity-resolver.ts#L186) |
| <a id="property-embedderid"></a> `embedderId?` | `readonly` | () => `string` \| `null` | [packages/memory/src/graph/entity-resolver.ts:187](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/graph/entity-resolver.ts#L187) |
| <a id="property-provider"></a> `provider?` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) \| `null` | [packages/memory/src/graph/entity-resolver.ts:188](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/graph/entity-resolver.ts#L188) |
| <a id="property-store"></a> `store` | `readonly` | [`GraphMemoryStoreExt`](/api/@graphorin/memory/interfaces/GraphMemoryStoreExt.md) | [packages/memory/src/graph/entity-resolver.ts:185](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/graph/entity-resolver.ts#L185) |
