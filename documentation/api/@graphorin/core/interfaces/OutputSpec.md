[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / OutputSpec

# Interface: OutputSpec

Defined in: packages/core/src/contracts/provider.ts:241

Output type specification for structured / typed responses. Concrete
Zod-based variants live in the runtime packages.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | packages/core/src/contracts/provider.ts:243 |
| <a id="property-jsonschema"></a> `jsonSchema?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/core/src/contracts/provider.ts:244 |
| <a id="property-kind"></a> `kind` | `readonly` | `"text"` \| `"structured"` | packages/core/src/contracts/provider.ts:242 |
