[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / OutputSpec

# Interface: OutputSpec

Defined in: [packages/core/src/contracts/provider.ts:286](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L286)

Output type specification for structured / typed responses. Concrete
Zod-based variants live in the runtime packages.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | [packages/core/src/contracts/provider.ts:288](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L288) |
| <a id="property-jsonschema"></a> `jsonSchema?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | [packages/core/src/contracts/provider.ts:289](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L289) |
| <a id="property-kind"></a> `kind` | `readonly` | `"text"` \| `"structured"` | [packages/core/src/contracts/provider.ts:287](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L287) |
