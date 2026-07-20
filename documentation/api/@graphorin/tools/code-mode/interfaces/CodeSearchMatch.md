[**Graphorin API reference v0.13.6**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [code-mode](/api/@graphorin/tools/code-mode/index.md) / CodeSearchMatch

# Interface: CodeSearchMatch

Defined in: packages/tools/src/code-mode/meta-tools.ts:40

A tool-search match `code_search` can fold in (deferred pool).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description` | `readonly` | `string` | - | packages/tools/src/code-mode/meta-tools.ts:42 |
| <a id="property-inputschema"></a> `inputSchema` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | packages/tools/src/code-mode/meta-tools.ts:43 |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | packages/tools/src/code-mode/meta-tools.ts:41 |
| <a id="property-outputschema"></a> `outputSchema?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | The matched tool's output schema, when declared (renders a return type). | packages/tools/src/code-mode/meta-tools.ts:45 |
