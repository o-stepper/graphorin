[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolDefinition

# Interface: ToolDefinition

Defined in: packages/core/src/contracts/provider.ts:200

Tool description shipped with a provider request. Implementations
convert the user's Zod schema to a JSON Schema 7 fragment.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | packages/core/src/contracts/provider.ts:202 |
| <a id="property-inputschema"></a> `inputSchema` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/core/src/contracts/provider.ts:203 |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/core/src/contracts/provider.ts:201 |
