[**Graphorin API reference v0.8.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [code-mode](/api/@graphorin/tools/code-mode/index.md) / CodeSearchMatch

# Interface: CodeSearchMatch

Defined in: [packages/tools/src/code-mode/meta-tools.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/meta-tools.ts#L44)

A tool-search match `code_search` can fold in (deferred pool).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description` | `readonly` | `string` | - | [packages/tools/src/code-mode/meta-tools.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/meta-tools.ts#L46) |
| <a id="property-inputschema"></a> `inputSchema` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | [packages/tools/src/code-mode/meta-tools.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/meta-tools.ts#L47) |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | [packages/tools/src/code-mode/meta-tools.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/meta-tools.ts#L45) |
| <a id="property-outputschema"></a> `outputSchema?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | A5: the matched tool's output schema, when declared (renders a return type). | [packages/tools/src/code-mode/meta-tools.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/meta-tools.ts#L49) |
