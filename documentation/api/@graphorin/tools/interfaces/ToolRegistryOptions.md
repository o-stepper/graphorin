[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ToolRegistryOptions

# Interface: ToolRegistryOptions

Defined in: [packages/tools/src/registry/registry.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/registry.ts#L61)

Configuration for [createToolRegistry](/api/@graphorin/tools/functions/createToolRegistry.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-embedder"></a> `embedder?` | `readonly` | [`ToolSearchEmbedder`](/api/@graphorin/tools/interfaces/ToolSearchEmbedder.md) | - | [packages/tools/src/registry/registry.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/registry.ts#L62) |
| <a id="property-emitaudit"></a> `emitAudit?` | `readonly` | (`event`) => `void` | - | [packages/tools/src/registry/registry.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/registry.ts#L63) |
| <a id="property-semanticscorethreshold"></a> `semanticScoreThreshold?` | `readonly` | `number` | Cosine threshold above which a semantic match counts. Default `0.5`. | [packages/tools/src/registry/registry.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/registry.ts#L65) |
