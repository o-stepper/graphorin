[**Graphorin API reference v0.12.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [code-mode](/api/@graphorin/tools/code-mode/index.md) / ProjectableTool

# Interface: ProjectableTool

Defined in: [packages/tools/src/code-mode/project.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/project.ts#L34)

Structural view of a tool this module can project.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-__source"></a> `__source?` | `readonly` | [`ToolSource`](/api/@graphorin/core/type-aliases/ToolSource.md) | Present on `ResolvedTool`; absent tools group under "tools". | [packages/tools/src/code-mode/project.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/project.ts#L41) |
| <a id="property-description"></a> `description?` | `readonly` | `string` | - | [packages/tools/src/code-mode/project.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/project.ts#L36) |
| <a id="property-inputschema"></a> `inputSchema?` | `readonly` | `unknown` | - | [packages/tools/src/code-mode/project.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/project.ts#L37) |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | [packages/tools/src/code-mode/project.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/project.ts#L35) |
| <a id="property-outputschema"></a> `outputSchema?` | `readonly` | `unknown` | A5: the tool's output schema; renders the signature's return type. | [packages/tools/src/code-mode/project.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/project.ts#L39) |
