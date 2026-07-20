[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / OutputSpec

# Interface: OutputSpec\&lt;TOutput\&gt;

Defined in: packages/agent/src/types.ts:70

**`Stable`**

Output type specification.

## Type Parameters

| Type Parameter |
| ------ |
| `TOutput` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Optional description shown to the model alongside the schema. | packages/agent/src/types.ts:79 |
| <a id="property-jsonschema"></a> `jsonSchema?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | Wire-format JSON Schema advertised to the model: forwarded on `ProviderRequest.outputType` for adapters with native structured output, and embedded in the fallback JSON instruction appended as a trailing system message (the documented contract until adapters consume `outputType` natively). | packages/agent/src/types.ts:87 |
| <a id="property-kind"></a> `kind` | `readonly` | `"text"` \| `"structured"` | - | packages/agent/src/types.ts:71 |
| <a id="property-schema"></a> `schema?` | `readonly` | \{ `parse`: `TOutput`; \} | Local validator (Zod-compatible `{ parse }`) applied to the final model output on the completed path. A parse failure fails the run with `output-validation-failed` - never a silent cast. | packages/agent/src/types.ts:77 |
| `schema.parse` | `public` | `TOutput` | - | packages/agent/src/types.ts:77 |
