[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolDefinition

# Interface: ToolDefinition

Defined in: packages/core/src/contracts/provider.ts:252

**`Stable`**

Tool description shipped with a provider request. Implementations
convert the user's Zod schema to a JSON Schema 7 fragment.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | - | packages/core/src/contracts/provider.ts:254 |
| <a id="property-examples"></a> `examples?` | `readonly` | readonly [`ToolDefinitionExample`](/api/@graphorin/core/interfaces/ToolDefinitionExample.md)[] | Worked examples surfaced to the provider alongside the schema. The agent runtime populates this from the tool's `examples` when they are eagerly rendered (see `Tool.examplesEagerlyRendered`); it is bounded to ≤5 and absent when the tool declares none or defers them. Implementations MAY fold these into the model-facing tool description. | packages/core/src/contracts/provider.ts:270 |
| <a id="property-inputschema"></a> `inputSchema` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | packages/core/src/contracts/provider.ts:255 |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | packages/core/src/contracts/provider.ts:253 |
| <a id="property-outputschema"></a> `outputSchema?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | The tool's output schema (JSON Schema), when declared. The agent runtime populates it from `Tool.outputSchema`; structured-output providers and typed code-mode use it to validate / type the tool's result. Absent when the tool declares no output schema. | packages/core/src/contracts/provider.ts:262 |
