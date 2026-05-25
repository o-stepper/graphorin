[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ToolSearchToolOptions

# Interface: ToolSearchToolOptions

Defined in: packages/tools/src/built-in/tool-search.ts:24

Configuration for [createToolSearchTool](/api/@graphorin/tools/functions/createToolSearchTool.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-defaultk"></a> `defaultK?` | `readonly` | `number` | Default `k` when the model does not pass one. Default `5`. | packages/tools/src/built-in/tool-search.ts:27 |
| <a id="property-maxk"></a> `maxK?` | `readonly` | `number` | Hard cap on `k` (model-supplied). Default `15`. | packages/tools/src/built-in/tool-search.ts:29 |
| <a id="property-registry"></a> `registry` | `readonly` | [`ToolRegistry`](/api/@graphorin/tools/interfaces/ToolRegistry.md) | - | packages/tools/src/built-in/tool-search.ts:25 |
