[**Graphorin API reference v0.3.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [code-mode](/api/@graphorin/tools/code-mode/index.md) / CodeSearchToolOptions

# Interface: CodeSearchToolOptions

Defined in: packages/tools/src/code-mode/meta-tools.ts:47

Configuration for [createCodeSearchTool](/api/@graphorin/tools/code-mode/functions/createCodeSearchTool.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-defaultk"></a> `defaultK?` | `readonly` | `number` | Default match cap when the model passes none. Default 8. | packages/tools/src/code-mode/meta-tools.ts:56 |
| <a id="property-maxk"></a> `maxK?` | `readonly` | `number` | Hard cap on matches. Default 25. | packages/tools/src/code-mode/meta-tools.ts:58 |
| <a id="property-projection"></a> `projection` | `readonly` | [`CodeApiProjection`](/api/@graphorin/tools/code-mode/interfaces/CodeApiProjection.md) | Projection over the eager (advertised) tool set. | packages/tools/src/code-mode/meta-tools.ts:49 |
| <a id="property-searchdeferred"></a> `searchDeferred?` | `readonly` | (`query`, `k`) => `Promise`\&lt;readonly [`CodeSearchMatch`](/api/@graphorin/tools/code-mode/interfaces/CodeSearchMatch.md)[]\&gt; | Search the deferred pool for `query`, returning up to `k` matches. Typically `registry.searchDeferred`. Omitted ⇒ eager-only search. | packages/tools/src/code-mode/meta-tools.ts:54 |
