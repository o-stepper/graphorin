[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / OutputSpec

# Interface: OutputSpec

Defined in: [packages/core/src/contracts/provider.ts:300](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L300)

Output type specification for structured / typed responses. Concrete
Zod-based variants live in the runtime packages.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | [packages/core/src/contracts/provider.ts:302](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L302) |
| <a id="property-jsonschema"></a> `jsonSchema?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | [packages/core/src/contracts/provider.ts:303](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L303) |
| <a id="property-kind"></a> `kind` | `readonly` | `"text"` \| `"structured"` | [packages/core/src/contracts/provider.ts:301](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L301) |
