[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / OutputSpec

# Interface: OutputSpec\&lt;TOutput\&gt;

Defined in: packages/agent/src/types.ts:58

Output type specification.

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `TOutput` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Optional description shown to the model alongside the schema. | packages/agent/src/types.ts:63 |
| <a id="property-kind"></a> `kind` | `readonly` | `"text"` \| `"structured"` | - | packages/agent/src/types.ts:59 |
| <a id="property-schema"></a> `schema?` | `readonly` | \{ `parse`: `TOutput`; \} | Optional Zod schema for structured output validation. | packages/agent/src/types.ts:61 |
| `schema.parse` | `public` | `TOutput` | - | packages/agent/src/types.ts:61 |
