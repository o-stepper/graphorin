[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolDefinitionExample

# Interface: ToolDefinitionExample

Defined in: packages/core/src/contracts/provider.ts:229

A single worked example as projected onto the provider wire contract —
a serializable, schema-agnostic view of a `ToolExample`. `input` /
`output` carry the example's already-parsed values; `comment` is the
optional rationale shown to the model.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-comment"></a> `comment?` | `readonly` | `string` | packages/core/src/contracts/provider.ts:232 |
| <a id="property-input"></a> `input` | `readonly` | `unknown` | packages/core/src/contracts/provider.ts:230 |
| <a id="property-output"></a> `output` | `readonly` | `unknown` | packages/core/src/contracts/provider.ts:231 |
